"""Generate the fake incident dataset used to test the Advisor. Deterministic (seeded), stdlib only.

Run from backend/:  python3 scripts/fake_incidents.py
Reads data/ui_mock_incidents.json (copy of INCIDENTS in src/lib/mock-data.ts) and writes
data/fake_incidents.json: those 15 incidents plus generated ones, sized so the totals match
the Insights page charts (monthly counts, root-cause shares, average hours).
All data is fake.
"""

import json
import random
from collections import Counter, defaultdict
from datetime import date
from pathlib import Path

DATA = Path(__file__).resolve().parents[1] / "data"
RNG = random.Random(42)

MONTHS = {4: 14, 5: 18, 6: 12, 7: 21, 8: 17, 9: 23}
AVG_HOURS = {4: 6.8, 5: 7.4, 6: 5.9, 7: 8.1, 8: 6.2, 9: 7.9}
CLASSIFIED = {"Connection leaks": 31, "Config drift": 22, "Cert expiry": 19, "Capacity": 16, "Other": 12}
UNCLASSIFIED = 11
CAPACITY_BY_MONTH = {4: 1, 5: 2, 6: 2, 7: 3, 8: 3, 9: 4}

EXISTING_META = {
    "INC0041822": ("Connection leaks", "Database"), "INC0041530": ("Connection leaks", "Database"),
    "BOX-RCA-118": ("Connection leaks", "Database"), "INC0039877": ("Connection leaks", "Database"),
    "INC0036210": ("Connection leaks", "Database"), "INC0031044": ("Connection leaks", "Database"),
    "INC0040987": ("Cert expiry", "Auth / PKI"), "INC0041701": ("Cert expiry", "Monitoring"),
    "BOX-RCA-097": ("Cert expiry", "Monitoring"), "INC0034002": ("Cert expiry", "Auth / PKI"),
    "BOX-RCA-121": ("Capacity", "Storage"), "INC0041904": ("Config drift", "Storage"),
    "INC0038115": ("Config drift", "Storage"), "INC0033310": ("Config drift", "Storage"),
    "INC0029551": ("Config drift", "Monitoring"),
}

PROJECTS = {
    "Payments Platform": ["payments-api", "ledger-service", "settlement-batch", "fraud-scoring"],
    "Grid Telemetry": ["telemetry-collector", "ingest-gateway", "timeseries-writer", "alert-router"],
    "Customer Portal": ["portal-web", "session-service", "notification-service", "search-api"],
    "Data Warehouse": ["etl-runner", "warehouse-loader", "reporting-db", "bi-gateway"],
}
PEOPLE = {
    "Connection leaks": ["A. Khoury", "L. Mendes", "R. Singh", "S. Patel"],
    "Config drift": ["R. Singh", "M. Okafor", "T. Nowak", "L. Mendes"],
    "Cert expiry": ["M. Okafor", "A. Khoury", "D. Chen"],
    "Capacity": ["R. Singh", "J. Alvarez", "D. Chen", "S. Patel"],
    "Other": ["J. Alvarez", "T. Nowak", "A. Khoury", "D. Chen", "S. Patel"],
}
LIBS = ["JDBC driver 42.7", "HikariCP 5.1", "SQLAlchemy 2.0", "pgbouncer 1.22", "Hibernate 6.4"]
NODES = ["app-node-03", "app-node-07", "worker-02", "gw-node-01"]
DBS = ["ledger-db", "reporting-db", "telemetry-db", "warehouse-db"]

# (title, root cause, resolution, subsystem, (min hours, max hours))
SCENARIOS = {
    "Connection leaks": [
        ("Database connection pool exhausted on {env}", "Connection leak after {lib} upgrade", "Rolled back {lib}, set pool max-lifetime and leak detection", "Database", (4, 9)),
        ("{svc} timing out, pool at maximum", "Connection leak in retry handler", "Patched retry handler to close connections in a finally block", "Database", (5, 11)),
        ("Batch job hangs waiting for a free connection", "DB pool saturation under batch load", "Gave the batch its own pool and capped concurrency", "Database", (3, 7)),
        ("Thread pool starvation on {svc}", "Leaked HTTP client connections never released", "Added connection timeouts and reused one shared client", "Network", (4, 8)),
        ("Idle-in-transaction sessions pile up on {db}", "Unclosed transactions on an error path", "Fixed rollback on the error path, set idle_in_transaction_session_timeout", "Database", (3, 6)),
        ("Redis connections exhausted on {svc}", "Client created per request and never closed", "Switched to one pooled client per process", "Database", (3, 6)),
    ],
    "Config drift": [
        ("Log rotation disabled on {node}", "Log rotation disabled after config drift", "Restored logrotate config and enforced it through config management", "Storage", (2, 5)),
        ("{svc} behaving differently between nodes", "Config drift between nodes", "Re-synced config from source control and added a nightly drift check", "Monitoring", (2, 6)),
        ("TLS cipher mismatch after patching {node}", "Manual hotfix never recorded in the config repo", "Committed the hotfix to the repo and rebuilt the node", "Network", (2, 5)),
        ("Wrong JVM heap flags on {svc} in {env}", "Environment variable overridden by hand", "Removed the manual override and pinned the value in config", "Monitoring", (1.5, 4)),
        ("Snapshot retention not enforced on {db}", "Retention policy missing on rebuilt volume", "Applied the retention policy and added it to the build template", "Storage", (2, 4)),
        ("Feature flag differs between {env} and PROD", "Flag changed in one environment only", "Aligned the flag and made flag changes go through review", "Monitoring", (1.5, 4)),
        ("Firewall rule missing after rebuild of {node}", "Rule applied by hand and absent from infrastructure as code", "Added the rule to infrastructure as code and reapplied", "Network", (2, 5)),
    ],
    "Cert expiry": [
        ("Expired intermediate certificate on {svc}", "Expired intermediate certificate", "Replaced the intermediate chain and added it to the cert inventory", "Auth / PKI", (2, 4)),
        ("Collector certificate expired on {svc}", "Collector certificate expired unnoticed", "Renewed the certificate and enabled a 30-day expiry alert", "Monitoring", (2, 9)),
        ("mTLS failures between {svc} and {svc2}", "Client certificate expired", "Reissued the client certificate and automated renewal", "Auth / PKI", (2, 5)),
        ("LDAPS bind failing for {svc}", "Directory server certificate expired", "Installed the renewed certificate on the directory servers", "Auth / PKI", (3, 6)),
        ("Gateway returning TLS handshake errors in {env}", "Wildcard certificate renewal missed", "Renewed the wildcard certificate and added a renewal calendar entry", "Network", (2, 4)),
        ("Deploys blocked, code-signing certificate expired", "Code-signing certificate expired", "Obtained a new signing certificate and tracked it in the inventory", "Auth / PKI", (3, 7)),
    ],
    "Capacity": [
        ("Disk full on {db} data volume", "Data volume reached 100 percent from table growth", "Expanded the volume, archived old partitions and added an 80 percent usage alert", "Storage", (4, 10)),
        ("Month-end batch overran its window on {svc}", "Batch volume grew past processing capacity at month end", "Added worker nodes and moved the batch start earlier", "Database", (6, 14)),
        ("CPU saturation on {db} at quarter close", "Reporting queries competing with OLTP on the same instance", "Moved reporting to a read replica and resized the instance", "Database", (5, 12)),
        ("Load balancer connection limit reached during peak in {env}", "Load balancer sized for lower concurrent connections", "Raised the limits and added a second load balancer node", "Network", (3, 8)),
        ("Kafka broker disk saturation for {svc}", "Retention set too long for the current ingest rate", "Reduced retention and added a broker", "Storage", (5, 11)),
        ("Backup storage quota reached for {db}", "Backup growth exceeded the allocated quota", "Increased the quota and added a lifecycle policy", "Storage", (3, 7)),
        ("Monitoring time-series disk out of space", "Metric cardinality growth", "Expanded the disk and dropped high-cardinality labels", "Monitoring", (4, 9)),
        ("WAN link saturated between sites during replication", "Replication traffic exceeded provisioned bandwidth", "Upgraded the link and throttled replication outside business hours", "Network", (5, 10)),
    ],
    "Other": [
        ("Vendor API outage affecting {svc}", "Third-party service outage", "Served cached data until the vendor restored service", "Network", (1.5, 5)),
        ("Failed manual deploy left {svc} in a bad state", "Human error in a manual deployment step", "Rolled back and automated the deployment step", "Monitoring", (2, 6)),
        ("DNS record pointed at a decommissioned host for {svc}", "Stale DNS record after migration", "Updated the record and added a DNS check to the migration checklist", "Network", (1.5, 4)),
        ("Nightly export on {svc} produced duplicate rows", "Software defect: race condition in the export job", "Released a hotfix that serialises the export", "Database", (4, 9)),
        ("Packet loss between sites after switch change", "Network switch firmware bug", "Upgraded the switch firmware", "Network", (3, 8)),
        ("Kerberos logins failing on {node}", "Time sync drift because the NTP source was unreachable", "Restored the NTP source and added a time-drift alert", "Auth / PKI", (2, 5)),
    ],
}

UNCLASSIFIED_TITLES = [
    ("Intermittent slow dashboard loads on {svc}", "restarted {svc} to relieve it"),
    ("Sporadic 502 errors from {svc} in {env}", "raised the retry limit"),
    ("Users report delayed notifications from {svc}", "cleared the queue by hand"),
    ("Occasional login failures on {svc}", "restarted the session cache"),
    ("{svc} memory usage climbing slowly in {env}", "scheduled a nightly restart"),
    ("Report generation on {svc} slower than usual", "added an index as a stopgap"),
    ("Unexplained spikes in latency on {svc}", "scaled up one instance"),
]


def fill(text: str, project: str) -> str:
    svcs = PROJECTS[project]
    svc, svc2 = RNG.sample(svcs, 2)
    return text.format(
        env=RNG.choice(["PD1", "PD2", "UAT", "PROD"]), svc=svc, svc2=svc2, lib=RNG.choice(LIBS),
        node=RNG.choice(NODES), db=RNG.choice(DBS),
    )


def half(x: float) -> float:
    return round(x * 2) / 2


def summary(i: dict) -> str:
    if i["category"]:
        return f"{i['title']}. Root cause: {i['rootCause']}. Resolution: {i['resolution']}."
    return f"{i['title']}. Root cause not yet identified. {i['resolution']}".strip()


def build() -> list[dict]:
    existing = json.loads((DATA / "ui_mock_incidents.json").read_text())
    for i in existing:
        i["category"], i["subsystem"] = EXISTING_META[i["id"]]

    in_range = Counter(int(i["date"][5:7]) for i in existing if i["date"].startswith("2026-0") and 4 <= int(i["date"][5:7]) <= 9)
    slots = {m: MONTHS[m] - in_range[m] for m in MONTHS}

    existing_cat = Counter(i["category"] for i in existing)
    tokens = {c: n - existing_cat[c] for c, n in CLASSIFIED.items()}
    tokens["Unclassified"] = UNCLASSIFIED
    assert sum(tokens.values()) == sum(slots.values()), (tokens, slots)

    month_of: list[tuple[int, str]] = []
    left = dict(slots)
    for m, n in CAPACITY_BY_MONTH.items():
        month_of += [(m, "Capacity")] * n
        left[m] -= n
    tokens["Capacity"] -= sum(CAPACITY_BY_MONTH.values())
    rest = [c for c, n in tokens.items() for _ in range(n)]
    RNG.shuffle(rest)
    for m, n in left.items():
        month_of += [(m, rest.pop()) for _ in range(n)]

    used = {i["id"] for i in existing}
    counters: dict[str, int] = defaultdict(int)
    generated: list[dict] = []
    for m, cat in month_of:
        project = RNG.choice(list(PROJECTS))
        day = RNG.randint(24, 30 if m != 6 else 30) if cat == "Capacity" and RNG.random() < 0.6 else RNG.randint(1, 28)
        when = date(2026, m, min(day, 30))
        if cat == "Unclassified":
            t, w = RNG.choice(UNCLASSIFIED_TITLES)
            open_ = RNG.random() < 0.6
            fields = dict(
                title=fill(t, project), category=None, subsystem=RNG.choice(["Database", "Network", "Storage", "Monitoring"]),
                rootCause="Under investigation", status="open" if open_ else "workaround",
                resolution="" if open_ else f"Workaround: {fill(w, project)}",
                hours=half(RNG.uniform(1, 5)), resolvedBy="" if open_ else RNG.choice(PEOPLE["Other"]),
            )
        else:
            title, cause, fix, sub, (lo, hi) = SCENARIOS[cat][RNG.choices(range(len(SCENARIOS[cat])), weights=[4, 3, 2, 1, 1, 1, 1, 1][: len(SCENARIOS[cat])])[0]]
            fields = dict(
                title=fill(title, project), category=cat, subsystem=sub, rootCause=fill(cause, project),
                status="workaround" if RNG.random() < 0.05 else "resolved", resolution=fill(fix, project),
                hours=half(RNG.uniform(lo, hi)), resolvedBy=RNG.choice(PEOPLE[cat]),
            )
        source = RNG.choices(["ServiceNow", "Box", "Upload"], weights=[78, 14, 8])[0]
        prefix = {"ServiceNow": "INC00", "Box": "BOX-RCA-", "Upload": "UPL-"}[source]
        while True:
            if source == "ServiceNow":
                num = 38100 + int((when - date(2026, 4, 1)).days / 183 * 3900) + RNG.randint(0, 60)
            else:
                counters[source] += 1
                num = (200 if source == "Box" else 0) + counters[source]
            iid = f"{prefix}{num:05d}" if source == "ServiceNow" else f"{prefix}{num:03d}"
            if iid not in used:
                used.add(iid)
                break
        generated.append(dict(
            id=iid, source=source, project=project, severity=RNG.choices(["critical", "high", "medium"], weights=[2, 5, 3])[0],
            date=when.isoformat(), cluster=None, **fields,
        ))

    for cat, cl, n in [("Connection leaks", "pool", 3), ("Cert expiry", "cert", 2)]:
        for i in [g for g in generated if g["category"] == cat and g["status"] == "resolved"][:n]:
            i["cluster"] = cl

    for m, target in AVG_HOURS.items():
        mine = [g for g in generated if int(g["date"][5:7]) == m]
        fixed = [i for i in existing if i["date"].startswith("2026-") and int(i["date"][5:7]) == m]
        diff = target * (len(mine) + len(fixed)) - sum(i["hours"] for i in mine + fixed)
        while abs(diff) > 0.25:
            g = RNG.choice(mine)
            step = 0.5 if diff > 0 else -0.5
            if 1 <= g["hours"] + step <= 24:
                g["hours"] += step
                diff -= step

    allx = existing + generated
    for i in allx:
        i["summary"] = summary(i)
    allx.sort(key=lambda i: i["date"], reverse=True)
    return allx


def check(rows: list[dict]) -> None:
    ids = [r["id"] for r in rows]
    assert len(ids) == len(set(ids))
    by_cat = Counter(r["category"] for r in rows if r["category"])
    assert dict(by_cat) == CLASSIFIED, by_cat
    for m, n in MONTHS.items():
        got = [r["hours"] for r in rows if r["date"].startswith(f"2026-{m:02d}")]
        assert len(got) == n, (m, len(got))
        assert abs(sum(got) / n - AVG_HOURS[m]) < 0.15, (m, sum(got) / n)


if __name__ == "__main__":
    rows = build()
    check(rows)
    (DATA / "fake_incidents.json").write_text(json.dumps(rows, indent=1) + "\n")
    print(len(rows), "incidents;", dict(Counter(r["category"] for r in rows)))
