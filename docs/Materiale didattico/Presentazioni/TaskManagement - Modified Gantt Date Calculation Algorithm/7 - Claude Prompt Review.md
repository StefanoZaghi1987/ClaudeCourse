# EV-003: Prompt & Spec Review — Honest Assessment

**Date**: 2026-04-08
**Subject**: Review of starting prompts and design spec for EV-003 (Modified Gantt Date Calculation Algorithm)
**Method**: Comparison of what was specified vs. what the implementation actually required

---

## Overall Grade: Strong — With Specific Gaps That Caused Implementation Drift

The prompts and spec are significantly above average. The problem statement is crystal clear, the 3-tier resolution is precisely defined, the edge cases are thorough, and the constraint about manual-only recalculation prevented scope creep. That said, there are concrete weaknesses worth examining.

---

## What Was Genuinely Good

### 1. Problem Framing Is Excellent

The 16h/4h example immediately communicates the bug to any reader — human or AI. No ambiguity about what "wrong" means. This is the kind of concrete illustration that eliminates misinterpretation.

### 2. The 3-Tier Resolution Spec Is Precise and Complete

Tier priority, absence subtraction order, NULL-wins semantics, SUM rationale — all there. This is the core algorithm, and it's the part that survived implementation virtually unchanged.

### 3. Edge Cases Table Is Thorough

Most specs skip this. Yours caught the override-on-weekend case, the fractional-hours-on-last-day case, and the clamp-to-zero rule. These all matter and were implemented exactly as specified.

### 4. Constraints Were Well-Chosen

"Manual Update Gantt only" prevented the most dangerous scope creep. "No schema changes" kept the database stable. Both held through implementation.

### 5. The Brainstorming Prompt Correctly Separates From the Execution Prompt

Different tools for different phases — this is disciplined. Having a brainstorming pass before execution allows the AI to surface unknowns before committing to a plan.

---

## Weak Points

### 1. The Spec Missed the MVC-to-WebApi HTTP Boundary

**This is the single biggest gap.**

The spec shows `TaskManagementServices` directly using `_resourceCapacityUtilities` as an injected dependency. But `TaskManagementServices` lives in the MVC layer and communicates with WebApi exclusively via HTTP. It cannot hold a reference to a WebApi utility class.

This forced the implementation to:

- Create a `ResourceCapacityController` (not in the spec)
- Create `GanttCalculationRequest` / `GanttCalculationResponse` models (not in the spec)
- Write an HTTP POST wrapper `CalculateGanttDatesApi` (not in the spec)
- Add API route constants (not in the spec)
- Add a SQL migration with date-range-filtered stored procedures (the spec says "No SQL migrations")

The spec's architecture diagram is wrong — it shows a direct dependency arrow from `TaskManagementServices` to `ResourceCapacityUtilities` that cannot exist in the codebase's architecture.

**Why it matters**: The AI had to discover this constraint during implementation, then redesign the integration layer on the fly. This is exactly the kind of architectural knowledge that should be in the spec, because getting it wrong wastes significant iteration time.

### 2. The Spec Prescribed Per-Activity HTTP Calls; the Implementation Needed Batch Processing

Even after the HTTP boundary was discovered, the spec's `CalculateActivityEndDate` design implies one API call per activity. The actual implementation bundles all activities per resource into a single `GanttCalculationRequest` — a critical optimization for resources with many activities.

This isn't just a performance detail. It changed the response model structure, the chaining logic, and how `UpdateAssignedActivitiesGanttTimeline` works. The spec should have addressed: "How many HTTP round-trips does this produce, and is that acceptable?"

### 3. The Safety Guard Was Undersized

Spec says `MAX_CALENDAR_DAYS = 365`. Implementation uses 730. A resource working 2h/day, 3 days/week, with a 6-month task can easily exceed 365 calendar days. The spec didn't run the math for extreme part-time scenarios.

### 4. Unassigned Activities Didn't Account for Festivities

The spec says "8h/day Mon-Fri, no absences" for unassigned activities — but doesn't mention skipping public holidays. The implementation correctly skips festivities. An unassigned 5-day task starting the week before Christmas should not include Christmas Day.

### 5. The Exclusive EndDate Convention Is Missing From the Spec

This is arguably the most important behavioral detail for Gantt correctness. The actual implementation returns `lastWorkingDay + 1` as EndDate, which is required by Kendo Gantt 2018.1.221 and for activity chaining (`next.StartDate = prev.EndDate`). The spec never mentions this convention. If the AI had implemented inclusive EndDate, every Gantt visualization would have been off by one day.

### 6. The Spec Mixes Abstraction Levels

Sections 1-5 read like a clean functional/architectural spec. Then Section 6 drops into before/after code diffs with line numbers. Section 10 lists specific private methods to delete by line number.

This creates a contradictory document: is it a design spec for reasoning about behavior, or a step-by-step implementation script? The implementation plan (`EV-003_Implementation_Plan.md`) is where that code-level detail belongs — and a separate implementation plan was indeed created. But the design spec duplicates some of that work at a lower fidelity, which can confuse priorities.

### 7. The Brainstorming Prompt Lacks a Specific Question

It describes the problem and context, but doesn't tell the AI what output is expected from brainstorming. Compare:

- **As written**: "Here's the problem and requirements" (implicit: figure out what I need)
- **Better**: "Identify the callers that need to change, the architectural constraints on how MVC can access the new logic, and the edge cases the algorithm must handle. Propose the component structure before any code."

---

## Structure and Format Assessment

### Format: Good

Tables, clear headers, decision matrices with rationale columns — all effective. The decision table in Section 2 is particularly strong because it includes the "why" column. This is a pattern worth keeping.

### Structure: One Issue

The spec tries to be both a design document (Sections 1-5: what and why) and an implementation guide (Sections 6, 10: which lines to change, which methods to delete). These are different roles with different audiences and lifespans. Pick one role per document. The implementation plan already covers the second role, so the design spec should stay at the behavioral/architectural level.

---

## The Three Things That Would Have Changed the Outcome

If the spec had included these three items, the implementation would have matched the spec with minimal drift:

1. **"TaskManagementServices communicates with WebApi via HTTP only — ResourceCapacityUtilities needs a WebApi endpoint and a batch request/response model."** This single sentence would have prevented the largest architectural redesign during implementation.

2. **"EndDate is exclusive (last working day + 1) to match Kendo Gantt chaining semantics."** This convention affects every date calculation and every downstream consumer. It should be stated explicitly.

3. **"Unassigned activities skip festivities, not just weekends."** A small omission with real-world impact — nobody wants Gantt bars that include Christmas as a working day.

Everything else — the 3-tier algorithm, the absence logic, the edge cases, the dead code cleanup — the spec nailed.

---

## Recommendations for Future Specs

1. **Always document the layer boundaries.** Before designing component interactions, state which layer each component lives in and how layers communicate. This prevents impossible dependency arrows.

2. **Ask "how many round-trips?" for any cross-boundary operation.** If the answer is "N per resource" or "N per activity," consider batch alternatives upfront.

3. **Run the math on safety limits.** Take the most extreme realistic scenario (minimum capacity resource, maximum task size) and verify the safety guard accommodates it.

4. **Keep the design spec at one abstraction level.** Business rules, algorithm behavior, edge cases, backward compatibility — yes. Line numbers, method deletions, before/after code diffs — save for the implementation plan.

5. **Give brainstorming prompts a specific deliverable.** "Identify X, propose Y, flag Z" produces better output than an open-ended context dump.
