# function_name: recluster_all
# input_type_name: ReclusterInput
# output_type_name: ReclusterOutput

import json
from pydantic import BaseModel


class ReclusterInput(BaseModel):
    pass


class ReclusterOutput(BaseModel):
    cluster_count: int


def handle(ctx, payload: ReclusterInput) -> ReclusterOutput:
    from lemma import Pod

    pod = Pod.from_env()

    signals_res = pod.records.list("signals", limit=500)
    signals = signals_res.get("items", [])

    if not signals:
        return ReclusterOutput(cluster_count=0)

    signal_list = [
        {
            "id": s["id"],
            "type": s["type"],
            "severity": s["severity"],
            "feature_area": s["feature_area"],
            "summary": s["summary"],
        }
        for s in signals
    ]

    message = (
        "Group these signals into recurring product themes. "
        "Return a JSON array only — no prose.\n\n"
        f"Signals:\n{json.dumps(signal_list, indent=2)}"
    )
    result = pod.agents.run("clustering-agent", message)
    raw_output = result.get("output", "") if isinstance(result, dict) else str(result)
    if not raw_output:
        raw_output = "[]"
    clean = raw_output.strip()
    if clean.startswith("```"):
        clean = clean.split("```")[1]
        if clean.startswith("json"):
            clean = clean[4:]
        clean = clean.strip()

    clusters = json.loads(clean)
    if not isinstance(clusters, list):
        clusters = []

    existing_res = pod.records.list("clusters", limit=200)
    existing = existing_res.get("items", [])
    if existing:
        pod.records.bulk_delete("clusters", [c["id"] for c in existing])

    signal_by_id = {s["id"]: s for s in signals}

    for cluster in clusters:
        signal_ids = cluster.pop("signal_ids", [])

        counts = {"p0_count": 0, "p1_count": 0, "p2_count": 0, "p3_count": 0}
        top_quote = ""
        for sid in signal_ids:
            sig = signal_by_id.get(sid)
            if not sig:
                continue
            sev = sig.get("severity", "P3")
            key = f"p{sev[1]}_count" if sev.startswith("P") and sev[1].isdigit() else "p3_count"
            if key in counts:
                counts[key] += 1
            if not top_quote and sig.get("quote"):
                top_quote = sig["quote"][:300]

        cluster_record = pod.records.create(
            "clusters",
            {
                "theme": cluster.get("theme", "Unnamed theme"),
                "description": cluster.get("description", ""),
                "signal_count": len(signal_ids),
                "top_quote": top_quote,
                **counts,
            },
        )

        if signal_ids:
            pod.records.bulk_update(
                "signals",
                [{"id": sid, "cluster_id": cluster_record["id"]} for sid in signal_ids],
            )

    return ReclusterOutput(cluster_count=len(clusters))
