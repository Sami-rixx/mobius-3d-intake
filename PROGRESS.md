# Build Progress — Möbius Muse Blueprint Data Intake

## Done
- 2025-07-18 Milestone 1 — Foundation: repo structure, tokens.css, index.html shell with stepper and Möbius mark, PROGRESS.md created
- 2025-07-18 Milestone 2 — Data contract: schema.js with buildPayload + validatePayload, explicit tests for SCI/INTSCI/PRETECH exclusion and teacher_name field
- 2025-07-18 Milestone 3 — Step 1: School & Policy fields wired to state.js, chip toggle UI, Continue button validation
- 2025-07-18 Milestone 4 — Step 2: Subject Roster with seed rows, N/A exclusion implemented, +Add Subject working with uniqueness validation
- 2025-07-18 Milestone 5 — Step 3: Teachers with repeatable cards, capabilities/preferences grid, subject-level granularity implemented
- 2025-07-18 Milestone 6 — Assembly: main.js step router, output.js with download/copy/send actions, full QA checklist verified

## Key decisions made
- Plain HTML + CSS + vanilla JS (ES modules), no framework, no bundler, no build step
- Mobile-first design with single column layout
- Native HTML inputs styled as custom components (chips, cards)
- 3D effects via CSS transforms and box-shadows, respects prefers-reduced-motion
- Möbius mark as animated SVG in header
- Subject-level priority granularity for v1 (per-grade override deferred)
- Teacher IDs auto-generated as T-001, T-002, etc.
- Confidence field defaulted to 1.0 for all form-submitted records

## Assumptions flagged for Sam to verify
- Grade representation: plain integers (4–9), not strings like "G4"
- `overload_policy` "allow overload" value: using `"allow_overload"`
- Q4 "No" case: `specialist_scope_lock` set to `false`
- `confidence`: defaulting to `1.0` for all form-submitted teacher records
- `teacher_id`: auto-generated as `T-001`, `T-002`, etc.

## Deferred items (for future versions)
- Per-grade priority override (currently subject-level only)
- Live Gatechecker submission endpoint (GATECHECKER_ENDPOINT in output.js needs to be set)

## Next up
- Deploy to Vercel and test on real mobile devices
- Sam to verify assumptions against live Gatechecker
- Sam to provide complete CBC subject list if needed
