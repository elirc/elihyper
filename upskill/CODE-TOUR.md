# Code tour: one promise, end to end

This tour follows a single promise through every layer of the estimator:

> **The summary screen never passes off fallback arithmetic as an AI
> analysis — and it can only be reached with a complete set of answers.**

Read it with the files open. Line numbers refer to the current source; if they
drift, search for the quoted code instead. The architecture background is
[fabledocs/01-app-architecture-guide.md](../fabledocs/01-app-architecture-guide.md)
§6 (the estimator) — this tour assumes you have read it once.

Why this promise matters: the baseline estimate is rate card × headcount ×
duration (`lib/estimatorMath.ts`). It renders in the same layout, with the
same currency formatting, as a real AI analysis. Before story HN-06 the two
were indistinguishable — and the summary screen is exactly where the visitor
is asked for their contact details. The banner's own source comment
(`components/EstimateStatusBanner.tsx:20-22`) calls presenting a fallback as
an analysis "the kind of thing that is discovered in the first sales call."

## 0. Set the scene

Open `/tools/ai-project-estimator` (`npm run dev`). Answer the four questions
and submit. You land on a loading screen; within a few seconds (if the dev
enrichment worker is running) or after ~45 seconds (if it is not) you land on
the summary. In the second case an amber banner says **"Showing a preliminary
estimate."** Everything below explains who decides that, and where.

## 1. You cannot reach the summary with a hole in the answers

- `components/ProjectEstimator.tsx:112` — the step machine is a union type:
  `'start' | 'scope' | 'timeline' | 'team' | 'infrastructure' | 'loading' | 'summary'`,
  held in React state at `:115`.
- `:541` — `handleNext()` is the only forward edge. Each case validates before
  advancing: an empty scope stops at `:548`, a missing timeline at `:555`
  (unless the "Recommend for me" checkbox in `autoSelections` stands in for
  it), team at `:562`, infrastructure at `:569`. Failure calls
  `failStep` (`:227`), which writes a per-step message into `stepErrors`
  (`:142`) and pushes an `estimator_validation_error` event — no `alert()`
  (that was HN-05).
- `:532` — `handleJumpToStep()` lets the progress bar move you **backward**
  only: a target beyond `maxStepReached` (`:159`) is refused, so clicking a
  future step label cannot skip a question.
- `:311` — `handleProjectSubmit()` re-checks completeness anyway (`:327`):
  scope, timeline, team, infrastructure must each be present or explicitly
  delegated to the AI. The comment at `:158` states the design rule: "the
  validation in handleNext is still the only way forward."

Before moving on, predict: once the project is created, three different
mechanisms can deliver the AI result. What single piece of code should decide
whether what arrived counts as "a real analysis"?

## 2. One gate decides what counts as an AI result

- `:182` — `applyProjectToState()` copies a Project record onto component
  state. Its doc comment is a small history lesson: this logic used to exist
  in four places and had already drifted (the summary refresher dropped
  late-arriving `AI_infrastructureRecommendations`). Every delivery path now
  funnels through it.
- `:224` — its return value **is the promise's definition**:
  `Boolean(project.AI_costAnalysis || project.AI_summary || project.AI_estimatedCost)`.
  A record without any of those fields is not an analysis, no matter which
  channel delivered it.
- The three delivery paths, each gated on that return value:
  1. the AppSync subscription (`:390`) — note `variables: { filter: { id: { eq: projectId } } }`;
     before HN-10 the subscription was unfiltered and every visitor's browser
     received every other visitor's estimate over the websocket, with a
     client-side `if` hiding the leak. The id check at `:398` survives as
     defence in depth.
  2. the immediate `getProject` fetch (`:415`) that closes the race where the
     update lands before the subscription is ready.
  3. fallback polling (`:434`), armed only after 15 silent seconds (`:496`),
     6 attempts × 5 s.
- Each path, on a true return, does the same two writes: `setAiStatus('ready')`
  and `setStep('summary')` (`:405`, `:425`, `:469`).

## 3. The status is state the whole component can see

- `:151` — `aiStatus: 'pending' | 'ready' | 'degraded' | 'error'`. The comment
  explains what it replaced: a `let aiDataReceived = false` captured inside one
  invocation of `handleProjectSubmit`. That local still exists (`:318`) to stop
  the pollers, but the *render* now has its own source of truth — the one
  thing the UI most needed to know used to be invisible to it.
- `:441` — the poller gives up after 6 attempts: `setAiStatus('degraded')`,
  an `estimator_ai_timeout` analytics event, and only *then*
  `setStep('summary')`. The summary is shown, but labeled.
- `:508` — a failed `createProject` sets `'error'`, returns the visitor to the
  infrastructure step with their answers intact, and never reaches the summary
  at all.

## 4. The banner the designer cannot delete

- `:1203` — the status banner is injected by **wrapping the root node** of the
  generated Plasmic component, and the comment says why: wrapping keeps it
  "independent of the internal node names in the generated component, so a
  design change cannot silently remove the one thing telling a visitor these
  numbers are provisional." A designer republish regenerates
  `components/plasmic/hypernova_inc/PlasmicProjectEstimator.tsx` wholesale;
  the wrapper survives because it is hand-owned (CONTRIBUTING.md rule 1).
- `components/EstimateStatusBanner.tsx:26` — `'ready'` and `'pending'` render
  nothing; `'degraded'` and `'error'` render `role='status'` text that says,
  in words, "a rough calculation, not a reviewed estimate," plus a retry
  button and a path to a human.
- The label follows the figures out of the browser: the PDF export passes
  `isPreliminary: aiStatus !== 'ready'` (`ProjectEstimator.tsx:1165`) into
  `lib/estimatePdf.ts`, so a downloaded fallback estimate is marked as one.

## 5. The tests that pin it — and exactly what they pin

The fallback figures the banner qualifies are pure functions in
`lib/estimatorMath.ts`, extracted by HN-19 precisely so a test could import
them without rendering the Plasmic tree:

- `__tests__/estimatorMath.test.ts:80` — `computeDefaultEstimate` produces the
  cost range from the published rate card (`ROLE_RATES`,
  `lib/estimatorMath.ts:28`) and the 160-hour person-month (`:40`).
- `:37` — unparseable timelines default to 12 months, with the commercial
  reasoning in the test comment: a shorter assumed timeline produces a cheaper
  quote, and an under-quote is discovered during the sales call.
- `:48` — a **deliberately pinned rough edge**: `"2 years, maybe 6"` is read
  as 48 months, not 24. The test documents the wrong-but-current behavior
  instead of silently changing it, because fixing it is a product decision.
  This is what "evidence stated at its actual strength" looks like in a test
  file.
- `__tests__/aiTextParsing.test.ts` — the extractors that mine the worker's
  prose return null rather than guess; the file header of
  `lib/aiTextParsing.ts` explains that a null is recoverable (fall back to
  baseline) while a confidently wrong number is not.

**And the honest gap:** no jest test renders `ProjectEstimator` itself. The
step machine, `applyProjectToState`'s gating, and the banner's visibility are
enforced by code review and manual testing, not by the suite — the jsdom
environment and Testing Library are installed (HN-19 made that possible), but
the component test does not exist yet. Exercise 2.1 in
[EXERCISES.md](EXERCISES.md) is to write it.

## 6. Where the promise stops

Three boundaries, each a place the promise can be changed by something that
never appears in your diff:

1. **The AI worker is not in this repo.** `AI_*` fields are written by an
   enrichment worker deployed elsewhere (architecture guide §6.3). If its
   prompt changes shape, `lib/aiTextParsing.ts` returns nulls, the summary
   quietly shows more baseline and less analysis — and `aiStatus` still says
   `'ready'`, because `AI_costAnalysis` was present. The promise is "labeled
   fallback," not "labeled partial degradation."
2. **Plasmic codegen owns the pixels.** The wrapper's `wrap` trick protects
   the banner's existence, but a designer can still restyle the summary so the
   banner is visually buried. Nothing in CI renders the page.
3. **Amplify owns delivery.** The subscription filter (`:393`) is a GraphQL
   argument the AppSync service enforces; the dev and prod backends are
   separate environments (`amplify/team-provider-info.json`). A
   mis-promoted environment or a schema push that regenerates
   `src/graphql/subscriptions.ts` differently changes the behavior without
   touching this component.

When you can explain why each layer cannot be replaced by another — why
client-side filtering could not substitute for the server-side subscription
filter, why the banner must live in the wrapper and not the design, why the
`aiStatus` state could not stay a local variable — you understand this
system.
