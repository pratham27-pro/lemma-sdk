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


def handle(ctx, payload: ProcessTicketInput) -> ProcessTicketOutput:
    from lemma import Pod

    pod = Pod.from_env()
    ticket_id = payload.ticket_id

    ticket = pod.records.get("tickets", ticket_id)
    pod.records.update("tickets", ticket_id, {"status": "processing"})

    try:
        message = (
            "Extract all product signals from this support ticket. "
            "Return a JSON array only — no prose.\n\n"
            f"Ticket:\n{ticket['raw_text']}"
        )
        result = pod.agents.run("extraction-agent", message)
        raw_output = result.get("output", "") if isinstance(result, dict) else str(result)
        if not raw_output:
            raw_output = "[]"

        clean = raw_output.strip()
        if clean.startswith("```"):
            clean = clean.split("```")[1]
            if clean.startswith("json"):
                clean = clean[4:]
            clean = clean.strip()

        signals = json.loads(clean)
        if not isinstance(signals, list):
            signals = []

    except Exception as e:
        err_msg = f"failed:{type(e).__name__}:{str(e)[:200]}"
        pod.records.update("tickets", ticket_id, {"status": err_msg})
        raise RuntimeError(f"Extraction failed: {e}") from e

    for sig in signals:
        pod.records.create(
            "signals",
            {
                "ticket_id": ticket_id,
                "type": sig.get("type", "bug"),
                "severity": sig.get("severity", "P3"),
                "feature_area": sig.get("feature_area", "General"),
                "quote": sig.get("quote", "")[:500],
                "summary": sig.get("summary", ""),
            },
        )

    pod.records.update(
        "tickets",
        ticket_id,
        {"status": "done", "signal_count": len(signals)},
    )

    return ProcessTicketOutput(ticket_id=ticket_id, signal_count=len(signals))
