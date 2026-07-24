# fabledocs

Engineering documentation for the **HyperNova Inc** marketing site + AI Project Estimator.

These docs are written for a developer who has **never seen this codebase before** and needs to
become productive quickly, and for whoever picks up the feature backlog next.

| Doc | What it covers | Read it when |
| --- | --- | --- |
| [01-app-architecture-guide.md](./01-app-architecture-guide.md) | What the app does, how it is structured, how data flows, what the Plasmic/Amplify/HubSpot pieces are, local setup, conventions, and known rough edges. | Day 1, before touching any code. |
| [02-feature-backlog-user-stories.md](./02-feature-backlog-user-stories.md) | 20 proposed features written as implementation-ready user stories with acceptance criteria, file-level implementation notes, and definitions of done. | When picking up your next ticket. |

## Relationship to `/docs`

The pre-existing `/docs` folder holds historical working notes from the original build
(auth trade-off analysis, environment-isolation checklist, two Plasmic state-management plans that
were **not** ultimately implemented the way they describe). Treat `/docs` as background reading and
`fabledocs/` as the current source of truth for how the app actually works today.

## Conventions used in these docs

- File references look like `components/ProjectEstimator.tsx:428` — path relative to the repo root,
  optional line number.
- "Generated" means a file is written by a tool (Plasmic CLI or Amplify CLI) and **must not** be
  hand-edited; your changes will be destroyed on the next sync.
- Sizes on stories are rough: **S** ≈ 1 day, **M** ≈ 2–4 days, **L** ≈ 1–2 weeks for someone new to
  the codebase.
