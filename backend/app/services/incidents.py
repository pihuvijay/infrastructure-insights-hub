from collections import Counter, defaultdict
from dataclasses import dataclass
from datetime import date
from typing import Any

from sqlalchemy import Select, func, select
from sqlalchemy.orm import Session

from app.models import Incident
from app.services.scope import Scope


@dataclass(frozen=True)
class Row:
    id: str
    title: str
    project: str
    severity: str
    status: str
    category: str | None
    subsystem: str
    root_cause: str
    resolution: str
    hours: float
    occurred_on: date
    cluster: str | None
    resolved_by: str


def to_row(i: Incident) -> Row:
    return Row(
        i.id, i.title, i.project, i.severity, i.status, i.category, i.subsystem, i.root_cause,
        i.resolution, float(i.hours), i.occurred_on, i.cluster, i.resolved_by,
    )


def apply_scope(stmt: Select[Any], scope: Scope) -> Select[Any]:
    if scope.category:
        stmt = stmt.where(Incident.category == scope.category)
    if scope.subsystem:
        stmt = stmt.where(Incident.subsystem == scope.subsystem)
    if scope.severity:
        stmt = stmt.where(Incident.severity == scope.severity)
    if scope.cluster_id:
        stmt = stmt.where(Incident.cluster == scope.cluster_id)
    if scope.incident_ids:
        stmt = stmt.where(Incident.id.in_(scope.incident_ids))
    if scope.month:
        start = date.fromisoformat(f"{scope.month}-01")
        end = date(start.year + (start.month == 12), start.month % 12 + 1, 1)
        stmt = stmt.where(Incident.occurred_on >= start, Incident.occurred_on < end)
    return stmt


def fetch_rows(session: Session, scope: Scope) -> list[Row]:
    stmt = apply_scope(select(Incident), scope).order_by(Incident.occurred_on.desc())
    return [to_row(i) for i in session.scalars(stmt)]


def count_classified(session: Session) -> int:
    return session.scalar(select(func.count()).select_from(Incident).where(Incident.category.is_not(None))) or 0


def compute_stats(rows: list[Row], total_classified: int) -> dict[str, Any]:
    if not rows:
        return {"count": 0}
    hours = [r.hours for r in rows]
    by_month: dict[str, list[float]] = defaultdict(list)
    for r in rows:
        by_month[r.occurred_on.strftime("%Y-%m")].append(r.hours)
    people: dict[str, list[float]] = defaultdict(list)
    for r in rows:
        if r.resolved_by:
            people[r.resolved_by].append(r.hours)
    causes = Counter(r.root_cause for r in rows if r.category)
    fixes = Counter(r.resolution for r in rows if r.resolution and r.status == "resolved")
    repeat = {c for c, n in causes.items() if n > 1}
    classified = sum(1 for r in rows if r.category)
    return {
        "count": len(rows),
        "classified": classified,
        "share_of_classified": round(100 * classified / total_classified, 1) if total_classified else 0.0,
        "hours_total": round(sum(hours), 1),
        "hours_avg": round(sum(hours) / len(hours), 1),
        "hours_max": max(hours),
        "repeat_hours": round(sum(r.hours for r in rows if r.root_cause in repeat), 1),
        "by_month": {m: (len(h), round(sum(h), 1)) for m, h in sorted(by_month.items())},
        "resolvers": sorted(((p, len(h), round(sum(h), 1)) for p, h in people.items()), key=lambda x: -x[1])[:5],
        "causes": causes.most_common(5),
        "fixes": fixes.most_common(4),
        "severity": dict(Counter(r.severity for r in rows)),
        "status": dict(Counter(r.status for r in rows)),
        "latest": rows[0],
    }


def render_stats(stats: dict[str, Any]) -> str:
    if not stats["count"]:
        return "No incidents match this scope."
    latest: Row = stats["latest"]
    lines = [
        f"Incidents: {stats['count']} ({stats['share_of_classified']}% of all classified incidents)",
        f"Hours: total {stats['hours_total']}, average {stats['hours_avg']}, longest {stats['hours_max']}",
        f"Hours spent on repeat root causes (same cause more than once): {stats['repeat_hours']}",
        "By month (incidents, hours): " + ", ".join(f"{m} {n}/{h}" for m, (n, h) in stats["by_month"].items()),
        "Resolvers (incidents, hours): " + ", ".join(f"{p} {n}/{h}" for p, n, h in stats["resolvers"]),
        "Most common root causes: " + "; ".join(f"{c} x{n}" for c, n in stats["causes"]),
        "Fixes that worked: " + "; ".join(f"{f} x{n}" for f, n in stats["fixes"]),
        f"Severity: {stats['severity']}; status: {stats['status']}",
        f"Most recent: {latest.id} on {latest.occurred_on} by {latest.resolved_by or 'n/a'}, {latest.hours}h",
    ]
    return "\n".join(lines)


def portfolio(session: Session) -> str:
    rows = fetch_rows(session, Scope())
    total = count_classified(session)
    lines = []
    for cat in ["Connection leaks", "Config drift", "Cert expiry", "Capacity", "Other"]:
        cat_rows = [r for r in rows if r.category == cat]
        n = len(cat_rows)
        h = sum(r.hours for r in cat_rows)
        lines.append(f"{cat}: {n} incidents ({round(100 * n / total) if total else 0}% of classified), {h:g}h total, {h / n if n else 0:.1f}h average")
    unclassified = [r for r in rows if not r.category]
    lines.append(f"Unclassified: {len(unclassified)} incidents, {sum(r.hours for r in unclassified):g}h total")
    return "\n".join(lines)
