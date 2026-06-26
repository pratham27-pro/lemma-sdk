# function_name: generate_digest
# input_type_name: GenerateDigestInput
# output_type_name: GenerateDigestOutput

from datetime import date, timedelta
from pydantic import BaseModel


class GenerateDigestInput(BaseModel):
    pass


class GenerateDigestOutput(BaseModel):
    report_id: str
    title: str


def handle(ctx, payload: GenerateDigestInput) -> GenerateDigestOutput:
    from lemma import Pod

    pod = Pod.from_env()

    clusters_res = pod.records.list("clusters", limit=50)
    clusters = clusters_res.get("items", [])
    clusters.sort(
        key=lambda c: c.get("p0_count", 0) * 4 + c.get("p1_count", 0) * 3
        + c.get("p2_count", 0) * 2 + c.get("p3_count", 0),
        reverse=True,
    )

    signals_res = pod.records.list("signals", limit=500)
    signals = signals_res.get("items", [])

    total_signals = len(signals)
    total_clusters = len(clusters)
    p0_count = sum(1 for s in signals if s.get("severity") == "P0")

    features = [s for s in signals if s.get("type") == "feature"]
    positives = [s for s in signals if s.get("type") == "positive"]
    churn = [s for s in signals if s.get("type") == "churn"]

    today = date.today()
    week_start = today - timedelta(days=today.weekday())
    week_str = week_start.strftime("%B %-d, %Y")

    lines = [
        "# Product Intelligence Report",
        f"**Week of {week_str}** · {total_signals} signals · {total_clusters} themes · {p0_count} critical",
        "",
    ]

    p0_signals = [s for s in signals if s.get("severity") == "P0"]
    if p0_signals:
        lines += ["## 🔴 Critical Issues (P0)", ""]
        for s in p0_signals[:5]:
            lines += [
                f"**[{s.get('feature_area', 'General')}]** {s.get('summary', '')}",
                f"> \"{s.get('quote', '')}\"",
                "",
            ]

    if clusters:
        lines += ["## 🟡 Top Themes", ""]
        for c in clusters[:5]:
            sev_parts = []
            for sev, key in [("P0", "p0_count"), ("P1", "p1_count"), ("P2", "p2_count")]:
                if c.get(key, 0) > 0:
                    sev_parts.append(f"{sev} ×{c[key]}")
            sev_str = " · ".join(sev_parts) if sev_parts else ""
            lines += [
                f"### {c.get('theme', 'Unnamed')} — {c.get('signal_count', 0)} signals{' · ' + sev_str if sev_str else ''}",
                c.get("description", ""),
                f"> \"{c.get('top_quote', '')}\"" if c.get("top_quote") else "",
                "",
            ]

    if features:
        lines += ["## 🔵 Feature Requests", ""]
        for f in features[:5]:
            lines.append(f"- **[{f.get('feature_area', 'General')}]** {f.get('summary', '')}")
        lines.append("")

    if churn:
        lines += ["## ⚠️ Churn Risks", ""]
        for c in churn[:3]:
            lines.append(f"- {c.get('summary', '')}")
        lines.append("")

    if positives:
        lines += ["## 💚 Positive Signals", ""]
        for p in positives[:3]:
            lines.append(f"- {p.get('summary', '')}")
        lines.append("")

    content = "\n".join(lines)
    title = f"Product Intelligence Digest — Week of {week_str}"

    report = pod.records.create(
        "reports",
        {
            "title": title,
            "content": content,
            "signal_count": total_signals,
            "cluster_count": total_clusters,
            "week_start": week_start.isoformat(),
        },
    )

    return GenerateDigestOutput(report_id=report["id"], title=title)
