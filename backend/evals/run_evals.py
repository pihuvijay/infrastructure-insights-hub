"""Accuracy evals for the RAG pipeline. Run from backend/:

    CHAT_MODEL=llama3.2:3b uv run python -m evals.run_evals            # everything
    CHAT_MODEL=llama3.2:3b uv run python -m evals.run_evals --fast     # retrieval only, no LLM answers

Expected answers are computed from the seeded incidents, not hand-picked. Needs Postgres (seeded) and Ollama.
"""

import re
import sys
import threading
from collections import Counter
from collections.abc import Callable
from dataclasses import dataclass, field

from sqlalchemy import select

from app.agents import autonomous
from app.agents.advisor import stream_answer
from app.core.db import SessionLocal
from app.models import Incident
from app.schemas.chat import ChatMessage, ChatRequest
from app.services import retrieval
from app.services.scope import CATEGORIES, Scope

MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
OFF_TOPIC = [
    "How do I cook pasta?", "What is the weather in London tomorrow?", "Who won the football match last night?",
    "Write me a poem about the sea", "How do I reset my email password?", "What is the capital of Australia?",
    "Recommend a good book to read", "How do I configure a printer?", "What is the best programming language?",
    "Translate hello into French", "How many calories are in an apple?", "Tell me a joke",
    "How do I book annual leave?", "What time does the canteen open?", "Explain the theory of relativity",
    "How do I change my desktop wallpaper?", "What is the price of Bitcoin?", "Plan a trip to Japan",
    "How do I fix my bicycle chain?", "Who is the CEO of the company?",
]

MODE = "agent" if "--agent" in sys.argv else "pipeline"


@dataclass
class Bucket:
    name: str
    asks: str = ""
    passed: int = 0
    total: int = 0
    misses: list[str] = field(default_factory=list)

    def add(self, ok: bool, note: str) -> None:
        self.total += 1
        self.passed += ok
        if not ok:
            self.misses.append(note)


def typo(text: str) -> str:
    words = text.lower().split()
    for i in range(0, len(words), 2):
        w = words[i]
        if len(w) > 4:
            words[i] = w[0] + w[2] + w[1] + w[3:]
    return " ".join(words)


def load(session) -> list[Incident]:
    return list(session.scalars(select(Incident)))


def retrieval_buckets(session, rows: list[Incident]) -> list[Bucket]:
    kinds: dict[str, tuple[str, Callable[[Incident], str], Callable[[Incident, retrieval.Hit], bool]]] = {
        "Search with incident title": (
            "Type an incident's title; do we find an incident with the same root cause?",
            lambda r: r.title, lambda r, h: h.row.root_cause == r.root_cause),
        "Search with the fix only": (
            "Type only what fixed it; do we find an incident with the same fix?",
            lambda r: r.resolution, lambda r, h: h.row.resolution == r.resolution),
        "Search with typos": (
            "Type the root cause with letters swapped; do we still find it?",
            lambda r: typo(r.root_cause), lambda r, h: h.row.root_cause == r.root_cause),
        "Search with 3 keywords": (
            "Type just the first 3 words of the root cause; do we find it?",
            lambda r: " ".join(r.root_cause.lower().split()[:3]), lambda r, h: h.row.root_cause == r.root_cause),
    }
    out = []
    for name, (asks, make_query, is_match) in kinds.items():
        seen: set[str] = set()
        top1 = Bucket(f"{name}: right one is #1", asks + " Must be the first result.")
        top3 = Bucket(f"{name}: right one in top 3", asks + " Any of the first 3 results.")
        for r in rows:
            q = make_query(r)
            if not q or q in seen:
                continue
            seen.add(q)
            hits = retrieval.search(session, q, Scope(), 3)
            top1.add(bool(hits) and is_match(r, hits[0]), f"{q!r} -> {[h.row.id for h in hits]}")
            top3.add(any(is_match(r, h) for h in hits), f"{q!r} -> {[h.row.id for h in hits]}")
        out += [top1, top3]
    return out


def off_topic_bucket(session) -> Bucket:
    b = Bucket("Off-topic question returns no incidents", "Ask 20 unrelated questions (pasta, weather); correct = nothing is retrieved.")
    for q in OFF_TOPIC:
        hits = retrieval.search(session, q, Scope())
        b.add(not hits, f"{q!r} -> {[h.row.id for h in hits]}")
    return b


def ask(question: str) -> str:
    req = ChatRequest(messages=[ChatMessage(role="user", content=question)], mode=MODE)
    run = autonomous.stream_answer if MODE == "agent" else stream_answer
    return "".join(run(req, threading.Event()))


def numbers(answer: str) -> list[float]:
    return [float(x) for x in re.findall(r"(?<![\d.])\d+(?:\.\d+)?", answer)]


def has(answer: str, *needles: float, tol: float = 0.01) -> bool:
    return any(abs(x - float(n)) <= tol for x in numbers(answer) for n in needles)


def answer_buckets(rows: list[Incident]) -> list[Bucket]:
    classified = [r for r in rows if r.category]
    cats = [c for c in CATEGORIES if c != "Other"]
    counts = Counter(r.category for r in classified)
    hours = {c: sum(float(r.hours) for r in classified if r.category == c) for c in CATEGORIES}
    n = lambda x: f"{x:g}"  # noqa: E731
    counting, totals, averages, resolvers, months, ranking = (
        Bucket("Advisor: how many incidents", "Ask 'How many incidents are in <category>?'; answer must equal the real count."),
        Bucket("Advisor: total hours", "Ask total hours per category; answer must equal the real sum."),
        Bucket("Advisor: average hours per incident", "Ask average hours per incident per category; must be within 0.06 of the real value."),
        Bucket("Advisor: who fixed the most", "Ask who resolved the most incidents per category; must name the real top person."),
        Bucket("Advisor: busiest month", "Ask which month had the most incidents per category; must name the real month."),
        Bucket("Advisor: which category is biggest/smallest", "Most incidents, most hours, fewest incidents, number unclassified."),
    )
    for c in CATEGORIES:
        phrase = c if c != "Other" else "classified as Other"
        ans = ask(f"How many incidents are in {phrase}?")
        counting.add(has(ans, counts[c]), f"{c}: want {counts[c]} | {ans[:100]!r}")
        ans = ask(f"How many hours in total were spent on {phrase} incidents?")
        totals.add(has(ans, hours[c], round(hours[c]), tol=0.01), f"{c}: want {n(hours[c])} | {ans[:100]!r}")
        ans = ask(f"What is the average hours per incident for {phrase}?")
        avg = hours[c] / counts[c]
        averages.add(has(ans, avg, tol=0.06), f"{c}: want {avg:.1f} | {ans[:100]!r}")
    for c in cats:
        cr = [r for r in classified if r.category == c]
        by_person = Counter(r.resolved_by for r in cr if r.resolved_by)
        top = max(by_person.values())
        winners = [p for p, k in by_person.items() if k == top]
        ans = ask(f"Who resolved the most {c} incidents?")
        resolvers.add(any(w.split()[-1].lower() in ans.lower() for w in winners), f"{c}: want {winners} | {ans[:100]!r}")
        by_month = Counter(r.occurred_on.strftime("%Y-%m") for r in cr)
        best = max(by_month.values())
        peak = [m for m, k in by_month.items() if k == best]
        ans = ask(f"Which month had the most {c} incidents?")
        months.add(any(m in ans or MONTH_NAMES[int(m[5:]) - 1].lower() in ans.lower() for m in peak), f"{c}: want {peak} | {ans[:100]!r}")
    ans = ask("Which root cause category has the most incidents?")
    ranking.add(counts.most_common(1)[0][0].lower() in ans.lower(), f"want {counts.most_common(1)[0][0]} | {ans[:100]!r}")
    top_h = max(hours, key=hours.get)  # type: ignore[arg-type]
    ans = ask("Which root cause category has cost the most hours?")
    ranking.add(top_h.lower() in ans.lower(), f"want {top_h} | {ans[:100]!r}")
    ans = ask("Which category has the fewest incidents?")
    low = min(counts, key=counts.get)  # type: ignore[arg-type]
    ranking.add(low.lower() in ans.lower(), f"want {low} | {ans[:100]!r}")
    unclassified = sum(1 for r in rows if not r.category)
    ans = ask("How many incidents are unclassified?")
    ranking.add(has(ans, unclassified), f"want {unclassified} | {ans[:100]!r}")
    declined = Bucket("Advisor: refuses off-topic questions", "Ask 8 unrelated questions; the Advisor must say it cannot answer.")
    for q in OFF_TOPIC[:8]:
        ans = ask(q)
        declined.add(bool(re.search(r"don't|do not|does not|cannot|can't|no information|not (?:contain|include|cover|able|aware|capable|related)|unable|not about|nothing to report|no need to call", ans, re.I)), f"{q!r} | {ans[:100]!r}")
    return [counting, totals, averages, resolvers, months, ranking, declined]


def report(buckets: list[Bucket]) -> None:
    for b in buckets:
        for m in b.misses[:4]:
            print(f"  WRONG [{b.name}] {m}")
    print("\nScore = how often the system's answer matched what is actually in the database.")
    print("=" * 110)
    print(f"{'TEST':<48}{'CORRECT':>9}{'OF':>5}{'SCORE':>9}   WHAT IT DOES")
    print("-" * 110)
    for b in buckets:
        print(f"{b.name:<48}{b.passed:>9}{b.total:>5}{100 * b.passed / b.total:>8.1f}%   {b.asks}")
    passed, total = sum(b.passed for b in buckets), sum(b.total for b in buckets)
    macro = sum(b.passed / b.total for b in buckets) / len(buckets)
    print("=" * 110)
    print(f"{'OVERALL (every check counted once)':<48}{passed:>9}{total:>5}{100 * passed / total:>8.1f}%")
    print(f"{'OVERALL (each test row weighted equally)':<48}{'':>14}{100 * macro:>8.1f}%")


def main() -> None:
    fast = "--fast" in sys.argv
    with SessionLocal() as session:
        rows = load(session)
        buckets = retrieval_buckets(session, rows) + [off_topic_bucket(session)]
    if not fast:
        buckets += answer_buckets(rows)
    report(buckets)


if __name__ == "__main__":
    main()
