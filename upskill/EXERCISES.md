# Exercises: from reading this system to owning its boundaries

Reading finished code teaches less than changing it and watching what breaks.
These exercises are ordered by tier; each has a **done when** so you can check
yourself. Work on a branch, write your prediction down before every exercise,
and never leave a break in place — every exercise ends with a green `./test.sh`
and a clean `git status`, or you have not finished it.

Baseline before anything:

```bash
npm ci
./test.sh          # jest; all suites must pass before you start
```

Labels: "exercise" means the repo does not contain it yet. Everything you are
asked to build is proposed work, not a description of existing code.

---

## Tier 1 — Trace and break (an hour or two each)

The jest suite under `__tests__/` is a teaching instrument: break one
guarantee on purpose and watch which test catches it. Revert with
`git checkout -- <file>` afterward.

**1.1 Break the conservative timeline default.** In `lib/estimatorMath.ts`,
change both `return 12` defaults in `parseTimelineToMonths` to `return 1`.
*Predict first:* which tests in `__tests__/estimatorMath.test.ts` fail? In
particular, does the `computeDefaultEstimate` test "uses the 12 month default
when no timeline is given" (`__tests__/estimatorMath.test.ts:104`) fail — or
does `computeDefaultEstimate`'s own `timeline || '12 months'` fallback
(`lib/estimatorMath.ts:108`) mask your break on that path? What does a default
that exists twice, at two layers, tell you?
*Done when:* you can name the failing assertions without re-running jest, and
explain in one sentence the commercial reason the default is 12 and not 1 (the
test's own comment at `:35-36` states it).

There is no completed model run of this exercise yet:
[VERIFICATION-GAP.md](VERIFICATION-GAP.md) records why (the suite could not be
run on the authoring machine) and carries the template for writing one up as
`worked-examples/break-the-timeline-default.md` when you do yours — predict,
smallest diff, real output pasted, restore, green again.

**1.2 Break "null rather than guess".** In `lib/aiTextParsing.ts`, make
`extractPhasesJsonFromText` return the brace-matched `candidate` without the
`JSON.parse` + `phases`-key check.
*Predict first:* which tests in `__tests__/aiTextParsing.test.ts` fail? Then follow the un-caught consequence
by reading code: `applyProjectToState` (`components/ProjectEstimator.tsx:211`)
would store the malformed string, and `handleDownloadPdf` wraps its
`JSON.parse` in a try/catch — so where would a visitor actually *see* the bug?
*Done when:* you can name the failing tests and point to the first UI surface
that would silently degrade rather than crash.

**1.3 Break fail-open.** In `lib/rateLimiter.ts`, make `checkRateLimit`
return `{ allowed: false }` when the store throws (fail-closed instead of
fail-open).
*Predict first:* which test in `__tests__/rateLimiter.test.ts` fails (there is
exactly one about this, at `:83`), and what would the production symptom of
fail-closed be — who gets locked out, and triggered by whose failure?
*Done when:* you can argue both sides — when fail-open is right (a marketing
lead form) and when it would be the bug (an auth endpoint) — and say which
test would need to change to encode the opposite policy.

**1.4 Story archaeology.** The PR record lives in the merge commits. Pick
three stories from `git log --first-parent main --oneline` (suggested: HN-10,
HN-06, HN-19 — PRs #3, #14, #4). For each, read the full description
(`git log --format=%B -1 <sha>`) and the diff (`git diff <sha>^1 <sha>`), and
write one sentence naming **the invariant the story added** — not what it
changed, but what is now always true that was not before.
*Done when:* each sentence names a property ("no visitor's browser receives
another visitor's estimate"), not an artifact ("added a filter"), and you can
point at the line in the diff that enforces it.

**1.5 Trace a second promise.** Repeat the [CODE-TOUR.md](CODE-TOUR.md) walk
for consent: the pre-paint script in `pages/_app.tsx` → `lib/consent.ts`
(cookie, not localStorage — the header comment says the one reason that
decides the design) → `__tests__/consent.test.ts` (version rejection at `:36`,
Consent Mode payload at `:63`).
*Done when:* you have written a half-page tour in the CODE-TOUR format,
including a "where the promise stops" section (hint: GTM's container
configuration is outside this repo, exactly like the AI worker).

## Tier 2 — Extend inside the existing boundaries (half a day to 2 days each)

Write the failing test *first*, in the style of the existing `__tests__/`
files: tests import from `lib/` or render with Testing Library; they never
reach into Plasmic-generated internals.

**2.1 The missing component test.** CODE-TOUR.md §5 names the honest gap: no
test renders `ProjectEstimator`, so the step machine is pinned by nothing.
`jest.config.js` already uses jsdom and Testing Library is installed. Write
`__tests__/ProjectEstimator.test.tsx` that mocks the GraphQL client
(`src/utils/api-client.ts`) and proves: (a) Next on an empty scope stays on
the scope step and renders the validation message; (b) a progress-bar click
beyond `maxStepReached` does not change the step. Rendering the full Plasmic
tree may be heavy — mocking `PlasmicProjectEstimator` down to a pass-through
is a legitimate move, but then be precise about what your test still proves.
*Done when:* both tests fail if you comment out the corresponding guard in
`handleNext` / `handleJumpToStep`, and `./test.sh` is green with the guards in
place.

**2.2 A new estimator question, end to end.** Add a "Where are your users?"
step (e.g. `northAmerica | europe | global`) between team and infrastructure:
union member in `StepType`, a `WIZARD_STEPS` entry, validation in
`handleNext`, a formatter in `lib/estimatorMath.ts` (`formatRegion`, styled
after `formatInfrastructure`), the field on the `createProject` input, and the
summary display. The schema change means touching
`amplify/backend/api/hypernovainc/schema.graphql` — read CONTRIBUTING.md rule
2 first: the generated `src/API.ts` must come from codegen, not your editor.
Without an Amplify environment you cannot run `amplify push`; stub the field
locally and record that limit honestly in your PR description.
*Done when:* new tests for the formatter and (building on 2.1) the step's
validation pass; the wizard still cannot reach the summary with the new
question unanswered; your notes say exactly which part you could not verify
and why.

**2.3 A tracked event with an honest test.** The estimator pushes events like
`estimator_validation_error` (`components/ProjectEstimator.tsx:229`) into
`window.dataLayer`. Add a `estimate_shared` event when the share-link button
is used, and test it the honest way: assert on what was pushed into a stubbed
`dataLayer` array — `env` and `app_env` included (CONTRIBUTING.md rule 5) —
and state plainly in a comment that the test proves the push, not that GTM
forwards it anywhere. That second half belongs to Tier 3.4.
*Done when:* the test fails if the event name, `env`, or `app_env` is wrong,
and the comment draws the verification boundary in one sentence.

**2.4 Story HN-21, in this repo's own discipline.** Pick a real gap — the
architecture guide §12 rough edges that no story covered (e.g. #15: `isMobile`
first paint, or the `formatMonthsRange` output `"1 years"` that
`__tests__/estimatorMath.test.ts:146` currently pins). Write the story first,
in the format of
[fabledocs/02-feature-backlog-user-stories.md](../fabledocs/02-feature-backlog-user-stories.md):
user story, acceptance criteria, implementation notes, definition of done.
Then deliver it exactly as CONTRIBUTING.md prescribes: branch
`feat/HN-21-<slug>`, conventional commits whose bodies explain why, a PR
description with what/why/how-to-verify/risk, merged `--no-ff` so
`git log --first-parent` gains one line.
*Done when:* every box in CONTRIBUTING.md §4 is checked or explicitly waived
in writing, and a stranger could verify your story from the PR description
alone.

## Tier 3 — Move a boundary (several days each; design note first)

Each of these is about a promise that lives partly outside this repo. For
each: write a one-page design note first (two alternatives, chosen tradeoffs,
what evidence would change your mind), then build, then update the docs as if
the next learner inherits your version.

**3.1 Plasmic codegen upgrade as a diff-review discipline.** A designer
publish regenerates all ~170 files under `components/plasmic/hypernova_inc/`.
Simulate the review you would owe a real sync: run the Plasmic CLI sync (or,
without Plasmic credentials, study the last sync commit that touched
`components/plasmic/` in `git log -- components/plasmic`), and write the
checklist a reviewer should apply to a thousand-line generated diff —
which changes are mechanical noise, which alter a named node a wrapper
depends on (grep the wrappers for the node props they pass), and what single
smoke check proves the estimator still mounts.
*Done when:* your checklist names the specific wrapper/node couplings of
`ProjectEstimator.tsx` and `ContactForm.tsx`, and you can say which breakage
jest would catch (after 2.1: the step machine) and which nothing currently
catches (visual burial of the status banner).

**3.2 The Amplify promotion story.** `main` deploys against the prod backend,
`dev` against dev (`amplify/team-provider-info.json`). Write the runbook for
promoting a schema change (your 2.2 field) from dev to prod and for rolling it
back: what `amplify push` regenerates, which direction is forward-compatible
(old clients against new schema vs. new clients against old), what the
estimator's four fetch paths do during the window when schema and client
disagree, and what you would watch (the `estimator_ai_timeout` event rate is
already an honest canary). You cannot execute this without AWS credentials —
the deliverable is the runbook plus the list of assertions you would script.
*Done when:* another developer could follow it, and every step is labeled
either "verified locally," "verified by reading generated config," or
"requires the live environment."

**3.3 Replace third-party tracking with a first-party collector.** Design
(and, as far as local verification allows, build) a `pages/api/track/`
endpoint that accepts the same event payloads the app pushes into `dataLayer`,
validated with the `lib/inputValidation.ts` patterns, rate-limited with
`lib/rateLimiter.ts`, consent-gated with `lib/consent.ts`, and buffered to a
store. The interesting questions are the boundary ones: what does the consent
banner mean when the collector is first-party? Which of the four pixels'
functions (attribution, audiences, conversion APIs) can a first-party
collector actually replace, and which are you deleting?
*Done when:* events flow to your endpoint in `npm run dev` with tests in the
style of `__tests__/rateLimiter.test.ts`, consent 'denied' provably drops the
event server-side, and your design note honestly lists the capabilities lost.

**3.4 Close the GTM gap from 2.3.** Decide what verifying "the event reaches
GA4" would even mean, and get as close as the environment allows: a dev-mode
assertion that `dataLayer` pushes conform to a schema (names, required keys),
plus a documented manual pass with GTM preview mode. The point of this
exercise is writing down, precisely, where automated verification ends.
*Done when:* the schema check runs in jest, and your note separates "proved by
test," "proved by one manual session," and "trusted to Google."

---

## Calibration: what "production-ready" means against this repo

You are operating at the level this repo teaches toward when you can:

1. Name five promises the app makes and, for each, which system enforces it —
   your code, Plasmic, Amplify, HubSpot, or GTM — and how a breach would
   surface.
2. State evidence at its real strength: "the fallback arithmetic is pinned by
   unit tests; the wizard's step machine is pinned by review only; delivery
   through AppSync is trusted configuration."
3. Read a thousand-line generated diff and say which thirty lines needed a
   human.
4. Ship a story whose PR description lets a stranger verify it — including
   the failure path and the part you could not verify.
