# EV-002 Prompt Review - Assessment

## What Was Good

- **Clear objective statement** - the high-level goal was immediately understandable.
- **The 3 core requirements** were well articulated (daily working hours, day-by-day variations, granular absences).
- **Useful constraints** like "database changes must be managed with SQL migration scripts" and "no unit tests".
- **Pointing to context files** (development-plan.md, functional analysis) was smart for bootstrapping.
- **Requiring a planning phase** at the end was a good practice.

## Weak Points

### 1. Too vague on the weekly schedule concept

The prompt said "allow to configure and to manage daily working hours day-by-day variations, like managing a real time-resource scheduling calendar." This is ambiguous - it could mean a weekly template pattern, individual date overrides, or both. The actual solution needed both (weekly pattern + date-specific overrides), and this distinction is critical because they are different entities with different UIs and different CRUD behaviors.

### 2. The 3-tier resolution model was missing entirely

The core design decision - Override > Weekly Pattern > Resource Default - was never stated. This is the architectural backbone of the feature. Without it, Claude would have had to invent the priority scheme.

### 3. Absence migration was understated

"Manage permissions and absences down to 30 minutes granularity" doesn't communicate that the existing schema uses date ranges and needs to be migrated to per-day records. That's a significant data migration with a recursive CTE, deduplication, and careful handling of the exclusive end date. Omitting this risks Claude choosing to extend the existing schema rather than replacing it.

### 4. Festivity integration was completely absent

The cascading behaviors (upgrading partial absences to full-day on festivity creation, selective deletion on festivity removal) are non-trivial business rules that can't be guessed from context alone.

### 5. The DailyWorkingHours cascade + warning was unmentioned

Changing a resource's default hours syncing Mon-Fri and the confirmation dialog - this is a UX decision that needs to be specified.

### 6. Key design decisions were missing

No mention of: allowing duplicate absences per day (no unique constraint), AbsenceHours minimum being 0.5 (not 0), Saturday/Sunday defaulting to 0h, new-tab navigation pattern, or the SCHEMABINDING view chain problem.

### 7. Weekly schedule defaulting was buried

"Full week (Mon-Sun) configurable with Sat/Sun defaulting to 0h" was buried in the requirements list rather than explained as part of a weekly schedule entity. It reads as a constraint, not as a feature description.

## Structure & Format

The structure was decent but could be improved:

- **Mixing levels of abstraction.** "3-tier schedule resolution: Override > Weekly Pattern > Resource Default" sits next to "don't implement any unit test" in the same requirements list. Architectural decisions and process constraints should be separated.
- **The "Context" section did too much delegation.** "Read development-plan.md" and "find more details in functional analysis" pushes the burden of understanding onto Claude. The prompt should contain the essential requirements directly, using external docs only as supplementary reference.
- **No explicit data schema description.** Even without code, stating "new entity ResourceWeeklySchedule with fields X, Y, Z" would have removed ambiguity.
- **No UI specification.** The Working Calendar page layout (summary table + two grids), the editor behavior (spinners with 0.5 step), the Italian labels - none of this was described.

## Bottom Line

The prompt would have gotten Claude maybe 60-70% of the way there. It would have built something for configurable hours, but likely with a different (possibly inferior) data model, missing the absence migration, missing festivity integration, and requiring multiple correction rounds to converge on the actual solution. The generated functional spec produced alongside this review is roughly 3x more detailed, and that detail is what makes the difference between "build something in this direction" and "build exactly this."
