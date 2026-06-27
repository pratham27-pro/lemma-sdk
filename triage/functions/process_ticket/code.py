# function_name: process_ticket
# input_type_name: ProcessTicketInput
# output_type_name: ProcessTicketOutput

import json
from pydantic import BaseModel


class ProcessTicketInput(BaseModel):
    ticket_id: str


class ProcessTicketOutput(BaseModel):
    ticket_id: str
    signal_count: int


def _extract_ticket_id(payload) -> str:
    """Handle Pydantic model, plain dict, or nested {input: {...}} formats."""
    if hasattr(payload, 'ticket_id'):
        return str(payload.ticket_id)
    if isinstance(payload, dict):
        # Direct: {"ticket_id": "..."}
        if 'ticket_id' in payload:
            return str(payload['ticket_id'])
        # Nested: {"input": {"ticket_id": "..."}}
        if 'input' in payload and isinstance(payload['input'], dict):
            return str(payload['input'].get('ticket_id', ''))
    return ''


def _run_agent(ctx, pod, agent_name: str, message: str) -> str:
    for runner in [
        lambda: ctx.agents.run(agent_name, message),
        lambda: pod.agents.run(agent_name, message),
    ]:
        try:
            result = runner()
            if isinstance(result, dict):
                return result.get("output") or result.get("text") or result.get("content") or ""
            return str(result) if result is not None else ""
        except (AttributeError, TypeError):
            continue
        except Exception as e:
            raise RuntimeError(f"Agent {agent_name} failed: {type(e).__name__}: {e}") from e
    raise RuntimeError(
        f"No agent runner available. "
        f"ctx: {[a for a in dir(ctx) if not a.startswith('_')][:15]}, "
        f"pod: {[a for a in dir(pod) if not a.startswith('_')][:15]}"
    )


def _parse_signals(raw: str) -> list:
    clean = raw.strip()
    if clean.startswith("```"):
        parts = clean.split("```")
        clean = parts[1] if len(parts) > 1 else ""
        if clean.startswith("json"):
            clean = clean[4:]
        clean = clean.strip()
    try:
        parsed = json.loads(clean)
        return parsed if isinstance(parsed, list) else []
    except Exception:
        return []


def handle(ctx, payload):
    from lemma import Pod

    pod = Pod.from_env()
    ticket_id = _extract_ticket_id(payload)

    if not ticket_id:
        raise RuntimeError(f"Could not extract ticket_id from payload: {type(payload).__name__} = {repr(payload)[:200]}")

    try:
        ticket = pod.records.get("tickets", ticket_id)
        raw_text = ticket.get('raw_text', '') if isinstance(ticket, dict) else getattr(ticket, 'raw_text', '')

        pod.records.update("tickets", ticket_id, {"status": "processing"})

        message = (
            "Extract all product signals from this support ticket. "
            "Return a JSON array only — no prose.\n\n"
            f"Ticket:\n{raw_text}"
        )
        raw_output = _run_agent(ctx, pod, "extraction-agent", message)
        signals = _parse_signals(raw_output)

        for sig in signals:
            pod.records.create("signals", {
                "ticket_id": ticket_id,
                "type": sig.get("type", "bug"),
                "severity": sig.get("severity", "P3"),
                "feature_area": sig.get("feature_area", "General"),
                "quote": str(sig.get("quote", ""))[:500],
                "summary": str(sig.get("summary", "")),
            })

        pod.records.update("tickets", ticket_id, {"status": "done", "signal_count": len(signals)})
        return ProcessTicketOutput(ticket_id=ticket_id, signal_count=len(signals))

    except Exception as e:
        err = f"failed:{type(e).__name__}:{str(e)[:180]}"
        try:
            pod.records.update("tickets", ticket_id, {"status": err})
        except Exception:
            pass
        raise
