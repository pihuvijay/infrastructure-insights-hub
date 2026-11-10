import re
from dataclasses import dataclass, replace

from app.schemas.chat import ChatMessage, Focus

CATEGORIES = ["Connection leaks", "Config drift", "Cert expiry", "Capacity", "Other"]
SUBSYSTEMS = ["Database", "Network", "Storage", "Auth / PKI", "Monitoring"]
SEVERITIES = ["critical", "high", "medium"]
MONTHS = {"Apr": "2026-04", "May": "2026-05", "Jun": "2026-06", "Jul": "2026-07", "Aug": "2026-08", "Sep": "2026-09"}

KEYWORDS = {
    "Connection leaks": re.compile(r"\b(connection leaks?|leaks?|connection pools?|pool)\b", re.I),
    "Config drift": re.compile(r"\b(config(uration)? drift|drift)\b", re.I),
    "Cert expiry": re.compile(r"\b(certs?|certificates?|tls)\b", re.I),
    "Capacity": re.compile(r"\b(capacity|disk full|out of space|quota)\b", re.I),
}


@dataclass(frozen=True)
class Scope:
    category: str | None = None
    subsystem: str | None = None
    month: str | None = None
    severity: str | None = None
    cluster_id: str | None = None
    incident_ids: tuple[str, ...] = ()

    def is_empty(self) -> bool:
        return self == Scope()

    def describe(self) -> str:
        parts = [
            f"root cause category {self.category}" if self.category else "",
            f"subsystem {self.subsystem}" if self.subsystem else "",
            f"month {self.month}" if self.month else "",
            f"severity {self.severity}" if self.severity else "",
            f"cluster {self.cluster_id}" if self.cluster_id else "",
            f"{len(self.incident_ids)} selected incidents" if self.incident_ids else "",
        ]
        return ", ".join(p for p in parts if p) or "all incidents"


def detect_category(text: str) -> str | None:
    return next((c for c, rx in KEYWORDS.items() if rx.search(text)), None)


def parse_focus(label: str) -> Scope:
    root = re.match(r"\s*Root cause:\s*(.+)", label, re.I)
    if root:
        name = root.group(1).strip()
        return Scope(category=next((c for c in CATEGORIES if c.lower() == name.lower()), None))
    low = label.lower()
    return Scope(
        subsystem=next((s for s in SUBSYSTEMS if s.lower() in low), None),
        severity=next((s for s in SEVERITIES if re.search(rf"\b{s}\b", low)), None),
        month=next((v for k, v in MONTHS.items() if re.search(rf"\b{k}\b", label)), None),
    )


def resolve_scope(
    messages: list[ChatMessage], cluster_id: str | None, incident_ids: list[str], focus: Focus | None
) -> Scope:
    scope = replace(parse_focus(focus.label), cluster_id=cluster_id, incident_ids=tuple(incident_ids)) if focus else Scope(
        cluster_id=cluster_id, incident_ids=tuple(incident_ids)
    )
    users = [m.content for m in messages if m.role == "user"]
    latest = detect_category(users[-1]) if users else None
    if latest:
        return replace(scope, category=latest, cluster_id=None, incident_ids=())
    if scope.category is None and scope.cluster_id is None and not scope.incident_ids:
        earlier = next((c for c in map(detect_category, reversed(users[:-1])) if c), None)
        return replace(scope, category=earlier)
    return scope
