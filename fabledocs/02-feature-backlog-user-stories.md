# HyperNova Inc — Proposed Feature Backlog (20 user stories)

> Companion to [01-app-architecture-guide.md](./01-app-architecture-guide.md). Read that first —
> every story below assumes you know what Plasmic wrappers are and where the estimator's state
> machine lives.

## How to use this backlog

Each story is written to be **picked up and implemented without further discovery**. The format:

- **Story** — the classic "As a … I want … so that …".
- **Context** — why this is worth doing, grounded in the current code.
- **Acceptance criteria** — Given/When/Then. These are the tests. If you can't demonstrate one, the
  story isn't done.
- **Implementation notes** — the files you'll touch and the approach that fits this codebase.
- **Out of scope** — deliberately excluded so the ticket doesn't grow.
- **Done when** — the checklist to tick before opening a PR.

**Sizes:** S ≈ 1 day · M ≈ 2–4 days · L ≈ 1–2 weeks, for a developer new to this repo.

### Rules that apply to every story

1. **Never edit `components/plasmic/**`.** If a story needs a new visual element, either build it in
   a developer-owned component under `components/`, or raise a *designer dependency* (flagged per
   story) so a designer adds and names the node in Plasmic Studio first.
2. Changes to `amplify/backend/api/hypernovainc/schema.graphql` require `amplify push` against the
   **`dev`** environment first, and regenerated `src/API.ts` / `src/graphql/*` must be committed.
   Never hand-edit generated GraphQL files.
3. Any new analytics event includes `env` and `app_env` (`import { env } from '@/src/utils/env'`) and
   uses `window.dataLayer?.push(...)`.
4. No secrets in committed files. Server-only config has no `NEXT_PUBLIC_` prefix.
5. Run `npm run lint` and `npm run build` before pushing (the git hooks do both, but don't rely on
   them).

### Suggested delivery order

| Wave | Stories | Rationale |
| --- | --- | --- |
| **0 — stop the bleeding** | HN-12, HN-11, HN-10 | Credential exposure and public data access are live risks today |
| **1 — trustworthy funnel** | HN-07, HN-09, HN-08, HN-06, HN-05 | Every lead reaches the CRM, spam and abuse are contained, failures are visible |
| **2 — convert better** | HN-01, HN-02, HN-03, HN-04, HN-13 | Higher-value estimator experience and a real booking path |
| **3 — reach & compliance** | HN-15, HN-14, HN-16, HN-17 | SEO, consent, error pages, content depth |
| **4 — durability** | HN-19, HN-20, HN-18 | Tests, observability, accessibility/performance |

---

# Theme A — Estimator experience

## HN-01 — Resume and share an estimate from a link

**Size:** M · **Designer dependency:** No · **Depends on:** — (pairs well with HN-11)

**Story**
As a **visitor who built an estimate**, I want a **link that reopens my finished estimate**, so that I
can come back to it later or forward it to a colleague or budget-holder without re-answering four
questions.

**Context**
`handleProjectSubmit` already stores the created project id in `lastProjectId`
(`components/ProjectEstimator.tsx:504`), and `getProject` is already imported and used. Today that id
is thrown away on refresh, so any interruption costs the visitor the whole flow — and the estimate
can never be forwarded to the person who actually approves budgets.

**Acceptance criteria**
- Given I reach the summary screen, when the summary renders, then the browser URL becomes
  `/tools/ai-project-estimator/?estimate=<projectId>` **without** a full page reload
  (`router.replace(..., { shallow: true })`).
- Given a summary screen, when I click "Copy link", then the full absolute URL is copied to my
  clipboard and a success toast appears.
- Given a URL containing `?estimate=<id>`, when the page loads, then the estimator skips the wizard,
  shows a loading state, fetches the project, and renders the summary populated with the stored
  values (scope, timeline, team, infrastructure, all `AI_*` fields, Gantt chart).
- Given a URL with an unknown or malformed id, when the fetch returns no project, then I see a
  friendly "We couldn't find that estimate" message with a button that starts a fresh estimate — no
  crash, no infinite spinner.
- Given a restored estimate, when I click "Start over", then the query param is removed and the
  wizard resets to `start`.
- Given a restored estimate that is still missing `AI_*` fields, when it loads, then the existing
  subscription + refresher logic resumes so late-arriving AI data still lands.

**Implementation notes**
- Add a hydration `useEffect` in `components/ProjectEstimator.tsx` that reads
  `useRouter().query.estimate`, guards on `router.isReady`, sets `step` to `'loading'`, calls
  `client.graphql({ query: getProject, variables: { id } })`, and maps the response onto the existing
  `ai*` state setters. **Extract the response→state mapping into one `applyProjectToState(project)`
  helper first** — that mapping is currently duplicated four times (`:514`, `:582`, `:629`, `:1089`);
  doing it once here removes ~150 lines and is the main quality win of this story.
- Validate the id shape (`/^[a-zA-Z0-9-]{20,40}$/`) before querying.
- The "Copy link" control needs a designed button; if none exists, render your own inside an existing
  slot rather than asking for a design change (keeps this story unblocked).
- Emit `estimate_link_copied` and `estimate_resumed` dataLayer events.

**Out of scope**
Editing a restored estimate; expiring links; ownership/access control (any id holder can view — the
data is the visitor's own scope text, so treat the id as a capability token and never enumerate ids).

**Done when**
Both flows work in dev against a real project id; the mapping helper is used by all four fetch paths;
unit test covers `applyProjectToState`; README of the story's PR shows the shareable URL.

---

## HN-02 — Email me my estimate

**Size:** M · **Designer dependency:** Small (one checkbox + confirmation state) · **Depends on:** HN-01 (uses the share URL)

**Story**
As a **visitor who finished an estimate**, I want to **receive it by email**, so that I have a record
I can forward internally, and as **HyperNova sales** I want that email to exist so the lead has a
reason to reply.

**Context**
Right now the estimate lives only in the browser tab. The contact step already collects a validated
email and posts it to HubSpot (`components/ProjectEstimator.tsx:878`), so the send can piggyback on
an existing, rate-limited, server-side path.

**Acceptance criteria**
- Given the contact step, when I check "Email me a copy of this estimate" and submit, then I receive
  an email within 2 minutes containing: scope summary, timeline, team, infrastructure, cost range,
  risk assessment, and a link back to the estimate (HN-01 URL).
- Given the checkbox is unchecked, when I submit, then no email is sent and the CRM behaviour is
  unchanged.
- Given the email provider errors, when the send fails, then the **lead submission still succeeds**
  and the failure is logged server-side; the visitor sees the normal success toast.
- Given any submission, when the email is sent, then it renders correctly in Gmail, Outlook web and
  iOS Mail (table-based HTML, inline CSS, plain-text alternative included).
- Given an unsubscribe/compliance review, then the email includes HyperNova's postal address and a
  plain "you received this because you requested an estimate" line.

**Implementation notes**
- New route `pages/api/email-estimate.ts`. Reuse `checkRateLimit` and the validators in `lib/`.
- Sending: prefer **Amazon SES** (`@aws-sdk/client-sesv2`) since the account is already AWS — needs a
  verified sender identity and, in a new account, a production-access request. HubSpot transactional
  email is the fallback if SES access is slow to obtain; decide before starting and note it in the PR.
- Fetch the project **server-side by id** inside the route rather than trusting body content, so the
  email can't be used to send arbitrary text.
- Put the template in `lib/emailTemplates/estimateSummary.ts` as a pure function
  `(project) => { subject, html, text }` so it is unit-testable without sending anything.
- Config: `SES_FROM_ADDRESS`, `AWS_REGION` (server-side env vars, set in Amplify console).

**Out of scope**
Drip campaigns/sequences; PDF attachment (that's HN-03); marketing consent capture (HN-14).

**Done when**
Template unit test passes; a dev send lands in a real inbox; failure path proven by temporarily
breaking the credentials and confirming the lead still saves.

---

## HN-03 — Download the estimate as a PDF

**Size:** M · **Designer dependency:** No · **Depends on:** HN-01

**Story**
As a **visitor**, I want to **download my estimate as a PDF**, so that I can attach it to an internal
budget request.

**Context**
The summary already contains everything a one-page proposal needs, including a Gantt chart rendered
by `components/GanttChart.tsx`. A PDF is the artifact that gets forwarded inside the prospect's
company — it is the cheapest brand touchpoint available.

**Acceptance criteria**
- Given the summary screen, when I click "Download PDF", then a file named
  `hypernova-estimate-<shortId>.pdf` downloads within 5 seconds.
- Given the generated PDF, then page 1 contains the HyperNova logo, the cost range, timeline, team,
  infrastructure and the scope summary; the phase timeline is legible; long AI prose wraps and
  paginates rather than being clipped.
- Given a slow device, when generation is running, then the button shows a disabled/"Preparing…"
  state and cannot be double-triggered.
- Given generation throws, then an error toast appears and the summary remains usable.
- Given the PDF is opened, then no `console.log` debug text, no placeholder "TBD" values for fields
  the AI did populate.

**Implementation notes**
- Client-side generation keeps this a frontend-only ticket: `html2canvas` + `jspdf`, or `pdf-lib` for
  a hand-composed layout. Prefer a **purpose-built print layout** (`components/EstimatePdfDoc.tsx`,
  rendered off-screen) over screenshotting the live UI — the live UI has fixed-position overlays,
  gradients and a canvas that rasterize badly.
- Alternative worth costing: reuse the HN-02 HTML template and render it with a headless-Chrome
  Lambda. Only take this path if the team already wants server-rendered PDFs for sales.
- Lazy-load the PDF libraries with `next/dynamic` / dynamic `import()` so the ~400 KB doesn't hit the
  initial bundle.
- Emit `estimate_pdf_downloaded`.

**Out of scope**
Editable/branded proposal templates per client; e-signature; storing PDFs in S3.

**Done when**
PDF verified on Chrome + Safari, desktop and iOS; bundle analysis shows no increase to the
first-load JS for pages that don't use it.

---

## HN-04 — Progress indicator and edit-any-answer navigation

**Size:** S · **Designer dependency:** Yes (progress bar + clickable step labels) · **Depends on:** —

**Story**
As a **visitor filling in the estimator**, I want to **see how many steps remain and jump back to
change an earlier answer**, so that I don't abandon the flow out of uncertainty or because I mistyped
something on step 1.

**Context**
The wizard has four input steps but the UI communicates position only implicitly. `handleBack`
(`components/ProjectEstimator.tsx:803`) walks back exactly one step at a time, and from `summary` it
jumps straight to `infrastructure` — there is no way to fix the scope text without restarting. The
analytics already emit `estimator_progress` with `step` and `total_steps`, so drop-off per step is
measurable and this is the obvious lever on it.

**Acceptance criteria**
- Given any input step, then a progress element shows "Step N of 4" and a filled bar proportional to
  N/4.
- Given step 3, when I click the "Scope" label, then I return to the scope step with my previous
  answer still populated.
- Given I have not yet reached step 4, when I look at step 4's label, then it is visibly disabled and
  clicking it does nothing.
- Given the summary screen, when I click "Edit answers", then I return to the scope step with every
  answer preserved, and re-submitting creates a **new** project record (the previous one is not
  mutated).
- Given a screen reader, then the progress element exposes `role="progressbar"` with
  `aria-valuenow`/`aria-valuemin`/`aria-valuemax`, and step buttons announce their disabled state.
- Given navigation between steps, then no `estimator_progress` event fires twice for the same step in
  the same session.

**Implementation notes**
- Add `maxStepReached` state (a number) alongside `step` in `components/ProjectEstimator.tsx` and
  update it in `handleNext`. Gate the clickable labels on it.
- The progress fill is best done as a Plasmic node whose width you override; if the designer is not
  available, render a self-contained `components/EstimatorProgress.tsx` into an existing slot.
- Dedupe the analytics with a `useRef<Set<string>>` of already-fired step names — the existing effect
  (`:1022`) fires on every `step` change including backwards moves.

**Out of scope**
Persisting partial progress across page reloads (that's a natural follow-up: same `applyProjectToState`
helper from HN-01 plus `sessionStorage`).

**Done when**
Keyboard-only navigation works end to end; the a11y criteria are verified with a screen reader or
axe DevTools.

---

## HN-05 — Replace `alert()` with inline, accessible validation

**Size:** S · **Designer dependency:** Small (error text style on inputs) · **Depends on:** —

**Story**
As a **visitor who leaves a field blank**, I want the **error shown next to the field I need to fix**,
so that I'm not interrupted by a browser dialog that doesn't tell me where the problem is.

**Context**
Six blocking `window.alert()` calls remain in `components/ProjectEstimator.tsx` (`:466`, `:762`,
`:774`, `:781`, `:788`, `:795`). Native alerts are unstyled, untranslatable, invisible to analytics,
blocked by some browsers in automated contexts, and read out with no field association. The contact
form has a nicer pattern already (`components/ContactForm.tsx` renders `ContactFormErrorItem`s) but
even there the errors aren't linked to their inputs.

**Acceptance criteria**
- Given any estimator step, when I click Next with an invalid or empty field, then no browser dialog
  appears; an inline message appears adjacent to the offending control and focus moves to it.
- Given an inline error, then the control has `aria-invalid="true"` and `aria-describedby` pointing at
  the message element, and the message container is `role="alert"` (`aria-live="polite"`).
- Given an error is displayed, when I correct the field, then the message clears on change (matching
  the contact form's existing behaviour).
- Given the project-creation request fails, then the error surfaces as a `react-toastify` error toast
  (consistent with the rest of the app), not an alert.
- Given a validation failure, then a `estimator_validation_error` event fires with the step and field
  names so we can see where people get stuck.

**Implementation notes**
- Add `stepErrors` state (`Record<string, string>`) to the estimator and pass messages down through
  the existing per-node prop overrides — the same technique `ContactForm.tsx:375-404` uses with
  `hasError`.
- `react-toastify` is already a dependency and `<ToastContainer />` is already mounted at
  `components/ProjectEstimator.tsx:1469`.
- While you're here, fix the contact form's `aria-describedby` wiring too — same pattern, same PR.

**Out of scope**
Reworking the validators themselves; i18n of messages.

**Done when**
`grep -rn "alert(" components/` returns nothing; axe DevTools reports no new violations on the
estimator.

---

## HN-06 — Honest failure and timeout states for AI results

**Size:** M · **Designer dependency:** Small (a failure panel) · **Depends on:** —

**Story**
As a **visitor waiting for my estimate**, I want the app to **tell me when the AI analysis didn't
finish**, so that I know whether I'm looking at a real analysis or a rough placeholder, and I'm given
a way forward.

**Context**
Today, if the enrichment worker never writes back, the fallback poller gives up after 6 attempts and
calls `setStep('summary')` anyway (`components/ProjectEstimator.tsx:636`), showing the locally
computed baseline with no indication that the AI never ran. The visitor cannot distinguish a real
analysis from `computeDefaultEstimate`'s arithmetic — which damages trust exactly at the conversion
moment. Loading also has no visible time bound.

**Acceptance criteria**
- Given the loading screen, then a progress affordance and an expectation-setting message are shown
  ("This usually takes 30–60 seconds"), and after 20 seconds an additional reassurance line appears.
- Given no AI data after the fallback window expires, when the estimator gives up, then I see a
  clearly-labelled **degraded summary**: a banner stating the detailed analysis isn't available yet,
  the baseline figures marked as "preliminary estimate", plus "Try again" and "Talk to a human"
  actions.
- Given a degraded summary, when the AI data arrives later (the refresher is still running), then the
  banner disappears and the real values replace the baseline without a page reload.
- Given the `createProject` mutation itself fails, then I stay on the infrastructure step with an
  error toast and my answers intact — I am never dropped into an empty summary.
- Given any degraded or failed outcome, then `estimator_ai_timeout` / `estimator_ai_error` fires with
  `tracking_id` so the rate is visible in GA4.

**Implementation notes**
- Introduce an explicit `aiStatus: 'pending' | 'ready' | 'degraded' | 'error'` state instead of the
  current `aiDataReceived` closure variable (`:456`) — that variable is captured per submit call and
  is easy to reason about wrongly.
- Consolidate the four fetch mechanisms behind one small controller function while you're in here
  (see HN-01's `applyProjectToState`); the timeout logic is currently spread across `:629`, `:752`
  and `:1089` with two different attempt budgets.
- "Talk to a human" should link to `/book-a-meeting/` (see HN-13) with the estimate id attached.

**Out of scope**
Retrying the AI job itself (that lives in the external worker); changing the worker's prompts.

**Done when**
All three outcomes (success, late success, timeout) are demonstrable in dev by pointing at a project
id that the worker never enriches.

---

# Theme B — Lead capture, CRM and abuse resistance

## HN-07 — Route the main contact form through the server and into HubSpot

**Size:** M · **Designer dependency:** No · **Depends on:** —

**Story**
As **HyperNova sales**, I want **every** lead — not just estimator leads — to land in HubSpot with UTM
attribution, so that I stop losing enquiries that only exist in a DynamoDB table nobody watches.

**Context**
`components/ContactForm.tsx:310` writes a `Lead` straight to AppSync from the browser and never calls
HubSpot, while the estimator's contact step posts to `/api/create-hubspot-lead/` first and treats the
GraphQL write as best-effort. Two paths, two behaviours, one CRM blind spot. The server route already
does validation, sanitization, rate limiting, duplicate-contact merging and environment tagging — the
contact form gets all of that for free by switching to it.

**Acceptance criteria**
- Given the contact form, when I submit valid details, then a HubSpot contact is created or updated
  with `firstname`, `lastname`, `email`, `phone`, `message`, the `environment__dev` flag, and the
  `tracking_id_uuid` + `utm_*` values from `localStorage['hypernova_tracking']`.
- Given the same submission, then a `Lead` row is still written to DynamoDB, and a DynamoDB failure
  does not fail the user-visible submission.
- Given a HubSpot failure, when the API returns non-OK, then I see an error toast and the form keeps
  my input so I can retry.
- Given more than 5 submissions from one IP in 15 minutes, then I receive a 429 and a clear
  "please try again shortly" message.
- Given a name like `O'Brien`, `Anne Marie` or `Renée`, when I type it, then it is accepted.
- Given the submission succeeds, then `contact_form_submitted` fires with `env`, `app_env` and
  `tracking_id`, matching the estimator's event shape.

**Implementation notes**
- Extend `pages/api/create-hubspot-lead.ts` with an optional `source: 'contact_form' | 'estimator'`
  field (map it to a HubSpot property once one exists — coordinate with whoever owns the portal; see
  `HUBSPOT CONFIG.md`), and move the `createLead` GraphQL write **server-side** so both paths behave
  identically.
- In `components/ContactForm.tsx`, replace the `client.graphql` call with `fetch('/api/create-hubspot-lead/', …)`
  — **keep the trailing slash**, `next.config.mjs` sets `trailingSlash: true`.
- Fix the name regex at `components/ContactForm.tsx:132`: `/^[a-zA-Z-]+$/` rejects spaces,
  apostrophes and accents. Use something like `/^[\p{L}\p{M}'\-. ]{1,100}$/u` and mirror it in
  `lib/inputValidation.ts`.
- Delete the dead stub `pages/api/hubspot.ts` in the same PR.

**Out of scope**
HubSpot deal/company creation; lead routing rules; the `LeadReceiver` model.

**Done when**
A test submission appears in the HubSpot dev portal with UTM values populated; both forms produce
identical CRM records apart from `source`.

---

## HN-08 — Spam protection on both forms

**Size:** M · **Designer dependency:** No · **Depends on:** HN-07 (so one guard covers both forms)

**Story**
As **HyperNova sales**, I want **bot submissions filtered out**, so that the CRM and the sales team's
time aren't wasted on junk contacts, and as a **visitor** I want that to happen without solving a
puzzle.

**Context**
Both forms are unauthenticated, publicly reachable, and post to an endpoint that creates CRM records.
The only current defence is a per-instance IP rate limiter that resets whenever the serverless
container recycles (`lib/rateLimiter.ts`).

**Acceptance criteria**
- Given a bot that fills every field including a hidden one, when it submits, then the request is
  rejected with a generic 400 and **no** CRM record is created.
- Given a submission that arrives less than 3 seconds after the form was rendered, then it is
  rejected as automated.
- Given a real visitor, when they submit, then they complete no extra interaction and see no visible
  challenge in the happy path.
- Given a suspicious submission, then the rejection reason is logged server-side with the IP and a
  reason code, and a `form_spam_blocked` event is recorded.
- Given the invisible checks pass but volume is anomalous, then a **Cloudflare Turnstile** token is
  required and verified server-side before the CRM call.

**Implementation notes**
- Layer 1 (free, do this first): a honeypot input (visually hidden, `tabindex="-1"`,
  `autocomplete="off"`, non-obvious name like `company_website`) plus a `renderedAt` timestamp checked
  server-side.
- Layer 2: Cloudflare Turnstile — `NEXT_PUBLIC_TURNSTILE_SITE_KEY` client-side,
  `TURNSTILE_SECRET_KEY` server-side, verify via `https://challenges.cloudflare.com/turnstile/v0/siteverify`.
  Turnstile is chosen over reCAPTCHA for its no-interaction default and better privacy posture.
- Put the shared guard in `lib/spamGuard.ts` so both API paths call one function.
- Ensure hidden fields never reach HubSpot properties.

**Out of scope**
Disposable-email-domain blocking; IP reputation feeds; moderation UI.

**Done when**
A scripted `curl` that fills all fields is blocked; a real browser submission succeeds; blocked-rate
is visible in logs.

---

## HN-09 — Durable, shared rate limiting

**Size:** S · **Designer dependency:** No · **Depends on:** —

**Story**
As a **platform maintainer**, I want rate limits that **hold across serverless instances and
deploys**, so that the published limit of 5 requests per 15 minutes is real rather than
per-container theatre.

**Context**
`lib/rateLimiter.ts` keeps counters in a module-scoped `Map` and starts a `setInterval` at import
time (`:11`, `:14`). Under Amplify/Lambda each cold start gets a fresh, empty map, so an attacker
rotating requests across instances is effectively unlimited — while the response headers still
promise a limit. The timer also keeps running in every warm instance.

**Acceptance criteria**
- Given 6 requests from one IP within 15 minutes spread across multiple server instances, then the
  6th receives a 429 with `Retry-After` and `X-RateLimit-*` headers.
- Given the window expires, when I request again, then I am allowed and the counter has reset.
- Given the rate-limit store is unreachable, then the request is **allowed** (fail-open) and a
  warning is logged — a broken limiter must never take the contact form offline.
- Given local development with no AWS credentials, then the limiter transparently falls back to the
  in-memory implementation.
- Given the implementation, then no `setInterval` runs at module scope; expiry is handled by storage
  TTL.

**Implementation notes**
- Use a DynamoDB table with `pk = ratelimit#<ip>#<windowStart>`, an atomic
  `UpdateItem … ADD #count :one` with `ReturnValues: 'UPDATED_NEW'`, and a numeric `ttl` attribute
  with TTL enabled so rows self-delete. Add it via the Amplify CLI (`amplify add storage`) or a
  `CustomResources.json` entry so it is provisioned per environment.
- Keep the exported `checkRateLimit` signature so call sites don't change; make it `async`.
- Hash the IP (`sha256(ip + salt)`) before storing — it's personal data under GDPR.
- Consider distinct limits per route (`create-hubspot-lead`: 5/15min; `email-estimate`: 3/15min).

**Out of scope**
Global WAF rules; per-account quotas.

**Done when**
A load script proves the limit holds across at least two concurrent Lambda instances; fail-open path
verified by pointing at a non-existent table.

---

# Theme C — Security and platform hygiene

## HN-10 — Subscribe to one project, not all of them

**Size:** S · **Designer dependency:** No · **Depends on:** —

**Story**
As a **visitor**, I want my project details to be **delivered only to me**, so that my scope
description and budget aren't broadcast to every other person using the estimator at the same time.

**Context**
`components/ProjectEstimator.tsx:514` opens `client.graphql({ query: onUpdateProject })` with **no
variables**, then discards non-matching payloads in the browser (`if (updated.id !== projectId)
return`). Server-side, that means every connected client receives every project update — scope text,
cost analysis, risk assessment — for everyone. The generated subscription already accepts
`$filter: ModelSubscriptionProjectFilterInput` (`src/graphql/subscriptions.ts:43`), so the fix is
small and high-value.

**Acceptance criteria**
- Given an active estimate, when another visitor's project is updated, then my browser receives no
  message for it (verifiable in the WebSocket frames in DevTools).
- Given my own project is updated, then the summary still populates exactly as before.
- Given a reconnect after network loss, then the filter is reapplied — I don't silently fall back to
  the unfiltered stream.
- Given the subscription errors, then it is logged and the existing polling fallback still delivers
  the result.

**Implementation notes**
- Pass `variables: { filter: { id: { eq: projectId } } }` to the subscribe call and keep the
  client-side id check as a belt-and-braces guard.
- Verify in the AppSync console that the subscription's authorization allows filtered guest
  subscriptions; combine with HN-11 so `Project` subscriptions are constrained server-side too.
- Also unsubscribe on `summary` completion, not only on unmount (`:1076-1084`) — long-lived sockets on a
  marketing site are pure cost.

**Out of scope**
Per-visitor identity or ownership (see HN-11 for the authorization model).

**Done when**
DevTools shows only your own project's frames with two browsers running estimates simultaneously.

---

## HN-11 — Tighten AppSync authorization rules

**Size:** M · **Designer dependency:** No · **Depends on:** HN-07 (server-side writes must land first)

**Story**
As a **security-conscious engineer**, I want the GraphQL API to expose **only the operations the site
actually needs**, so that an anonymous visitor cannot list every lead's personal data or delete
records.

**Context**
All three models carry `@auth(rules: [{ allow: public, provider: identityPool }])`
(`amplify/backend/api/hypernovainc/schema.graphql:3,28,40`). Amplify generates full CRUD plus list
operations for `@model`, and public identity-pool access grants **all of them** to unauthenticated
guest credentials — which are embedded in the shipped JS. In practice: `listLeads` returns every
name, email and phone number ever submitted, and `deleteProject` works for anyone.

**Acceptance criteria**
- Given anonymous guest credentials, when I call `listLeads`, `getLead`, `updateLead` or `deleteLead`,
  then I receive an authorization error.
- Given anonymous guest credentials, when I call `listProjects`, `updateProject` or `deleteProject`,
  then I receive an authorization error.
- Given the estimator flow, then `createProject`, `getProject` (by id) and the filtered
  `onUpdateProject` subscription continue to work for anonymous visitors.
- Given the enrichment worker, then it retains the write access it needs (IAM role or a separate auth
  mode) — verified by an end-to-end estimate that still populates `AI_*`.
- Given the change, then `src/API.ts` and `src/graphql/*` are regenerated and committed, and the app
  builds with no references to now-removed operations.

**Implementation notes**
- Use per-operation rules, e.g.
  `@auth(rules: [{ allow: public, provider: identityPool, operations: [create] }])` on `Lead`, and
  `[create, read]` on `Project` with subscriptions constrained accordingly. Amplify's `@auth`
  `operations` list is the mechanism; check the Gen 1 docs for `subscriptions: { level: ... }`.
- Coordinate with the external worker's identity **before** pushing — if it uses the same guest role,
  it needs its own IAM principal or an API-key auth mode added as an additional auth provider.
- Push to the `dev` environment first and run the full estimator flow there. Have a rollback plan
  (`amplify push` of the previous schema) ready before touching `main`.
- The `Lead` write will already be server-side after HN-07, so it can move behind an IAM-authenticated
  path rather than a public one — that is the ideal end state.

**Out of scope**
Adding user accounts/login (the Cognito user pool stays unused); field-level authorization.

**Done when**
A scripted probe using the site's own guest credentials proves each forbidden operation returns an
authorization error, and the happy path still works in `dev`.

---

## HN-12 — Get secrets out of the repo and validate config at boot

**Size:** S · **Designer dependency:** No · **Depends on:** — (do this first)

**Story**
As a **maintainer**, I want **no live credentials in version control** and a **clear failure when
config is missing**, so that CRM access can't leak through repo access and a misconfigured deploy
fails loudly instead of silently dropping leads.

**Context**
`.env.development` and `.env.production` are committed and both contain
`HUBSPOT_API_KEY=pat-na2-…`, a HubSpot **private-app token with write access to contacts**.
`.gitignore` only excludes `.env*.local`, so these files are tracked. Separately,
`pages/api/create-hubspot-lead.ts:80` returns a 500 when the key is missing — correct, but the
failure only shows up when a visitor submits a form.

**Acceptance criteria**
- Given the repository, then no file contains a HubSpot token, AWS key, or any other credential; the
  committed env files retain only non-secret `NEXT_PUBLIC_*` values.
- Given the exposed token, then it has been **rotated in HubSpot** and the new value exists only in
  Amplify Console environment variables (per branch) and in developers' untracked `.env.local`.
- Given `.gitignore`, then `.env.development`, `.env.production` and `.env*.local` are all ignored,
  and `.env.example` documents every variable with a placeholder and a one-line description.
- Given a server start with a required variable missing, then a single clear error is logged naming
  the variable.
- Given a pull request, then a secret-scanning step runs in CI and fails the build on a detected
  credential.

**Implementation notes**
- Rotating the token is the first action and it is **not** optional — the old value is in git history,
  so removing the file alone changes nothing. Decide with the team whether to also rewrite history
  (`git filter-repo`) or accept the exposure as mitigated by rotation; document the decision.
- Add `lib/serverEnv.ts` exporting a checked config object (`HUBSPOT_API_KEY`, plus anything HN-02 and
  HN-08 introduce); import it from the API routes instead of reading `process.env` inline.
- CI: `gitleaks` or GitHub secret scanning + push protection.
- While here, review the CMS credentials hard-coded in
  `components/plasmic/hypernova_inc/PlasmicGlobalContextsProvider.tsx` — that token is a
  **public read token** by design and is expected to ship to the browser, but confirm it is
  read-scoped, and note that the file is generated so it cannot simply be edited.

**Out of scope**
A full secret-management platform (Secrets Manager/SSM) — Amplify env vars are sufficient at this
scale.

**Done when**
`git ls-files | grep '^\.env'` returns only `.env.example`; a fresh clone + `npm run build` succeeds
with documented setup steps; the new token works in dev and prod.

---

## HN-13 — Real meeting booking with prefilled context

**Size:** M · **Designer dependency:** Small (embed container + confirmation copy) · **Depends on:** HN-01 (optional, for estimate context)

**Story**
As a **prospect who is ready to talk**, I want to **book a call directly on the site with my details
already filled in**, so that I don't have to email back and forth to find a slot.

**Context**
`/book-a-meeting` exists as a designed page (`pages/book-a-meeting.tsx`) with no scheduling
integration — grep finds no HubSpot Meetings or Calendly embed anywhere in the repo. Estimator users
who hit the summary have already given us name, email and their whole project scope; making them
retype it to book a call is the largest avoidable drop-off in the funnel.

**Acceptance criteria**
- Given `/book-a-meeting/`, then a HubSpot Meetings scheduler is embedded and fully usable on mobile
  and desktop (no nested scrollbars, no clipped month view).
- Given I arrive from an estimate, when the page loads, then my first name, last name and email are
  prefilled via the embed's query parameters and the estimate link is attached to the booking.
- Given I complete a booking, then the confirmation is shown inline and a `meeting_booked` event with
  `env`, `app_env` and `tracking_id` is pushed to `dataLayer`.
- Given the scheduler script fails to load, then a fallback message with a mailto link and the
  contact form link is shown — never a blank frame.
- Given consent tooling (HN-14) is in place, then the embed loads only after functional consent where
  required.

**Implementation notes**
- HubSpot Meetings is the natural choice since the CRM is already HubSpot: embed
  `https://meetings.hubspot.com/<owner>?embed=true` with `firstName`/`lastName`/`email` query params,
  loaded through `next/script` with `strategy="afterInteractive"`.
- Listen for the `message` event HubSpot posts on `meetingBookingSucceeded` to fire the analytics
  event.
- Read prefill values from `localStorage['hypernova_tracking']` and, if present, the `?estimate=` id.
- Add a "Book a call" CTA on the estimator summary that carries those params through.

**Out of scope**
Round-robin routing rules and calendar ownership (HubSpot admin configuration, not code).

**Done when**
A real test booking appears on the target calendar and in HubSpot with the estimate link attached.

---

# Theme D — Reach, compliance and content

## HN-14 — Cookie consent and Google Consent Mode gating

**Size:** M · **Designer dependency:** Yes (banner + preferences panel) · **Depends on:** —

**Story**
As a **visitor in a jurisdiction with consent laws**, I want to **choose whether I'm tracked before
any tracker runs**, so that my privacy choice is respected; and as **HyperNova** we want to remain
compliant while keeping conversion measurement working.

**Context**
`pages/_app.tsx` injects GTM, LinkedIn Insight, Meta Pixel and X Pixel unconditionally in `<Head>`,
plus a `localStorage` tracking-id and a 90-day `astronaut_variant` cookie — all before the visitor has
any say. For a consultancy selling to EU/UK clients, that is both a legal exposure and a bad look.

**Acceptance criteria**
- Given a first visit, then no advertising or analytics script executes and no non-essential cookie or
  `localStorage` entry is written until I choose.
- Given the banner, when I click "Accept all", then GTM and the pixels load immediately and my choice
  persists for 6 months.
- Given the banner, when I click "Reject non-essential", then no pixel loads, and Google **Consent
  Mode v2** signals are set to `denied` for `ad_storage`, `analytics_storage`, `ad_user_data` and
  `ad_personalization`.
- Given a returning visitor with a stored choice, then the banner does not reappear and the stored
  consent is applied before any tag fires.
- Given any state, then the A/B experiment assignment still works — the astronaut variant must fall
  back to a non-persistent, per-session assignment when consent is denied, so the page never flickers
  or breaks.
- Given the footer, then a "Cookie preferences" link reopens the panel and lets me change my mind.

**Implementation notes**
- Set the Consent Mode default **before** the GTM snippet in `pages/_app.tsx`:
  `gtag('consent', 'default', { ... 'denied' })`, then `gtag('consent','update',…)` on acceptance.
  Order matters — the default command must be the first thing in `dataLayer`.
- Gate the pixel `<script>` blocks on a consent state read synchronously from a cookie during the
  first inline script, so nothing loads on a rejected reload.
- Keep the consent state in a first-party cookie (not `localStorage`) so it can be read pre-paint.
- Build `components/ConsentBanner.tsx` as developer-owned; ask the designer for styling tokens rather
  than blocking on a Plasmic component.
- Coordinate with whoever owns the GTM container — tags may also need consent settings there.

**Out of scope**
Geo-targeting the banner (showing it only in the EU); a full CMP vendor integration; DSAR tooling.

**Done when**
A clean profile shows zero third-party requests before consent (verified in the Network tab), and
GA4 DebugView shows consent signals arriving.

---

## HN-15 — SEO essentials: per-page metadata, sitemap and robots

**Size:** M · **Designer dependency:** No · **Depends on:** —

**Story**
As a **prospect searching Google for "convert vibe code to production"**, I want HyperNova's landing
pages to **appear with their own title and description**, so that I find the right page; and as
**marketing** I want each page to render a correct social card when shared.

**Context**
`pages/_app.tsx:197-213` sets one Open Graph title, description and image for the **entire site**, so
every page shares on LinkedIn as "Hypernova Inc - Build with Proven Teams". There is no
`sitemap.xml`, no `robots.txt` (`public/` contains only a favicon, images and 3D assets), no canonical
tags, and no per-page `<title>`. For a site whose whole purpose is inbound lead generation, this is
the highest-leverage non-feature work available.

**Acceptance criteria**
- Given any route, then the rendered HTML contains a unique `<title>`, `<meta name="description">`,
  `<link rel="canonical">`, and page-specific `og:*` / `twitter:*` tags.
- Given `/sitemap.xml`, then it lists every public route (including CMS-driven `/insights/[slug]` and
  `/technology/[slug]` entries) with `lastmod`, and excludes `/plasmic-host`.
- Given `/robots.txt`, then it allows crawling in production, points to the sitemap, and **disallows
  everything** on non-production hosts.
- Given Google's Rich Results test on the homepage, then `Organization` JSON-LD validates; on an
  insight page, `Article` JSON-LD validates.
- Given a shared link on LinkedIn, then the correct per-page image and description appear.

**Implementation notes**
- Create `components/SeoHead.tsx` taking `{ title, description, path, image, type }`, rendering into
  `next/head`, with sensible site-wide defaults. Add it to each page component in `pages/` — that's a
  one-line change per file and requires no design involvement.
- Remove the global OG tags from `_app.tsx` (keep them only as fallbacks) to avoid duplicates.
- Sitemap: because there is no `getStaticProps` anywhere, the simplest correct approach is a dynamic
  route `pages/sitemap.xml.tsx` with `getServerSideProps` that emits XML, fetching CMS slugs from the
  Plasmic CMS REST API at request time. Cache with `Cache-Control: s-maxage=3600`.
- `robots.txt` can be static in `public/` **only** if dev and prod hosts share it — they don't, so
  make it a `pages/robots.txt.tsx` route that reads `NEXT_PUBLIC_APP_ENV`.
- Watch `trailingSlash: true` — canonical URLs must include the trailing slash to match what Next
  actually serves.

**Out of scope**
Content rewriting; keyword research; hreflang/i18n.

**Done when**
Every route passes a Lighthouse SEO audit ≥ 95, and the sitemap validates in Google Search Console.

---

## HN-16 — Custom 404 and 500 pages

**Size:** S · **Designer dependency:** Yes (or reuse the existing shell) · **Depends on:** —

**Story**
As a **visitor who mistypes a URL or hits an error**, I want a **branded page that helps me get back
on track**, so that I don't bounce off a bare framework error screen.

**Context**
`pages/` has no `404.tsx`, `500.tsx` or `_document.tsx`. Every bad URL — including old campaign links
and any renamed Plasmic page — renders Next.js's default black-and-white error page with no
navigation, no branding and no tracking of how often it happens.

**Acceptance criteria**
- Given an unknown URL, then a branded 404 page renders with the site navigation and footer, a short
  helpful message, and links to Home, Services and the estimator.
- Given a server error, then a branded 500 page renders with a way to contact support.
- Given a 404, then a `page_not_found` dataLayer event fires including the attempted path and
  `document.referrer`, so broken inbound links become visible in GA4.
- Given either error page, then the correct HTTP status code is returned (verify with `curl -I`).
- Given either error page, then `<meta name="robots" content="noindex">` is present.

**Implementation notes**
- Reuse the Plasmic `GlobalShell` / `NavigationBar` / `Footer` wrappers so the pages look native
  without new design work; ask the designer for a hero illustration only if it's cheap.
- Keep these pages dependency-light — a 500 page that itself depends on AppSync or GTM can fail too.
- Pair with HN-15 so redirects for genuinely renamed URLs are handled properly (`next.config.mjs`
  `redirects()`) instead of 404ing.

**Out of scope**
A search feature on the 404 page; automated broken-link monitoring.

**Done when**
Status codes verified; the event appears in GA4 DebugView; both pages render correctly on mobile.

---

## HN-17 — Insights index: tag filtering, pagination and reading time

**Size:** M · **Designer dependency:** Yes (filter chips, pagination controls) · **Depends on:** —

**Story**
As a **visitor browsing the Insights blog**, I want to **filter articles by topic and page through
them**, so that I can find content relevant to my problem instead of scrolling one long list.

**Context**
`/insights` renders whatever the Plasmic CMS returns, and `/insights/[slug]` pulls a single row via
`CmsQueryRepeater`/`CmsRowField` inside the generated component. There is no filtering, no
pagination, and no reading-time hint. As the content library grows this page stops working as a
discovery surface — and it's the main organic-search entry point once HN-15 lands.

**Acceptance criteria**
- Given the insights index, then topic/tag chips derived from the CMS are shown, and selecting one
  filters the list without a full page reload.
- Given a selected tag, then the URL reflects it (`/insights/?tag=devops`) so the filtered view is
  shareable and back/forward works.
- Given more than N articles (N = 9, confirm with design), then pagination or a "Load more" control
  appears and works with the CMS query's offset/limit.
- Given any article card, then an estimated reading time ("6 min read") is shown, computed from the
  body content at ~220 words per minute.
- Given no articles match, then an empty state with a "clear filter" action is shown.
- Given a filter or page interaction, then an `insights_filter_applied` / `insights_page_changed`
  event is emitted.

**Implementation notes**
- The Plasmic CMS components accept query parameters (filter/limit/offset) configured in Studio; the
  cleanest split is: **designer** exposes the query fields and names the nodes, **you** drive them
  from a wrapper that reads `router.query`. Agree this contract before starting — it is the main
  unknown in this story.
- If the Studio route proves too restrictive, fall back to querying the Plasmic CMS REST API directly
  from a small `lib/cms.ts` client and rendering cards in a developer-owned component. Note the CMS
  token currently lives in a generated file (`PlasmicGlobalContextsProvider.tsx`); move a copy into
  `NEXT_PUBLIC_PLASMIC_CMS_*` env vars rather than importing from generated code.
- Reading time belongs in a pure helper (`lib/readingTime.ts`) with unit tests.

**Out of scope**
Full-text search; related-article recommendations; RSS (a good follow-up).

**Done when**
Filtering, paging and deep-linking all work against real CMS content, and the empty state is
demonstrable.

---

# Theme E — Durability

## HN-18 — Respect reduced motion and low-power devices in the 3D hero

**Size:** M · **Designer dependency:** No · **Depends on:** —

**Story**
As a **visitor with motion sensitivity, an old phone, or a low battery**, I want the homepage to
**not run a continuous 3D animation**, so that I'm not made uncomfortable and my device isn't drained
for a decorative effect.

**Context**
`pages/index.tsx:12` mounts `ThreeAstronaut` (a ~1,500-line WebGL scene loading a GLB model plus five
textures) for 50% of visitors, chosen by a coin flip in `pages/_app.tsx:170`. There is no
`prefers-reduced-motion` check, no WebGL capability check and no visibility-based pause, and the
static hero image already exists as the other experiment arm — so a graceful fallback is essentially
free.

**Acceptance criteria**
- Given `prefers-reduced-motion: reduce`, when I load the homepage, then the static hero renders and
  the 3D scene is never mounted or downloaded — regardless of experiment assignment.
- Given a browser without WebGL support, then the static hero renders and no error appears in the
  console.
- Given the 3D hero is running and I scroll it out of view or switch tabs, then the render loop pauses
  (`IntersectionObserver` + `document.visibilitychange`) and resumes when visible.
- Given the 3D hero, then it does not delay Largest Contentful Paint: LCP on a throttled "Slow 4G /
  4× CPU" Lighthouse run stays under 2.5 s.
- Given the fallback is used, then the experiment analytics record the **effective** variant, not the
  assigned one, so the A/B results aren't polluted.

**Implementation notes**
- Add the reduced-motion + WebGL checks to the pre-paint script in `pages/_app.tsx` so the
  `data-astronaut-variant` attribute is set to `static` before first paint — the CSS gating in
  `styles/globals.css` then does the rest with no flicker.
- The render loop lives inside the big `useEffect` in `components/ThreeAstronaut.tsx`; pause by
  skipping `requestAnimationFrame` scheduling rather than tearing down the scene.
- Also dispose geometries/materials/textures and call `renderer.dispose()` on unmount if that isn't
  already exhaustive — WebGL contexts are a limited resource.
- Push `astronaut_variant_effective` into `dataLayer` next to the existing assignment push.

**Out of scope**
Redesigning the hero; replacing three.js.

**Done when**
Verified with the OS-level reduce-motion setting on macOS/iOS and Windows; before/after Lighthouse
numbers included in the PR.

---

## HN-19 — Make the test suite able to test things

**Size:** M · **Designer dependency:** No · **Depends on:** —

**Story**
As a **developer changing the estimator**, I want **tests that actually render components and assert
behaviour**, so that I can refactor the 1,475-line wizard without breaking the company's main
conversion path.

**Context**
`jest.config.js` sets `testEnvironment: 'node'` even though `jest-environment-jsdom` and Testing
Library are installed, so no component can render. `jest.setup.js` hand-implements
`toBeInTheDocument`, `toHaveValue` and `toBeDisabled` with a comment explaining the real package
"won't install". `__tests__/ContactForm.test.ts` only asserts that modules export values.
`package.json` declares `test:e2e:comprehensive → node scripts/e2e-comprehensive.js`, and
`scripts/` does not exist. Several other stories in this backlog (HN-01, HN-05, HN-06) involve
refactoring the estimator — this story is what makes those safe.

**Acceptance criteria**
- Given `npm test`, then Jest runs in `jsdom`, uses the installed `@testing-library/jest-dom`
  matchers, and the hand-rolled matchers are deleted from `jest.setup.js`.
- Given the test suite, then `npm test` runs from the local `jest` devDependency rather than
  `npx --yes jest@29.7.0` (which re-downloads Jest on every run and can drift from the lockfile).
- Given a test for `ContactForm`, then it renders the component, types invalid input, and asserts the
  visible error message and the disabled submit button — with `client.graphql` mocked.
- Given tests for the estimator's pure logic, then `parseTimelineToMonths`, `computeDefaultEstimate`,
  `extractPhasesJsonFromText`, `removePhasesJsonFromText` and the cost/team/timeline extractors each
  have cases covering normal input, malformed input and empty input.
- Given the estimator state machine, then a test walks start → scope → timeline → team →
  infrastructure with mocked GraphQL and asserts `createProject` is called with the expected input
  shape, including the "Recommend for me" substitutions.
- Given `package.json`, then either `scripts/e2e-comprehensive.js` exists and runs (Puppeteer is
  already a devDependency), or the script entry is removed.
- Given CI, then tests run on every PR and a failure blocks the merge.

**Implementation notes**
- The pure helpers are currently defined **inside** the component as `useCallback`s. Extract them to
  `lib/estimatorMath.ts` / `lib/aiTextParsing.ts` and import them back — this is the enabling
  refactor and should be its own commit.
- Mock `src/utils/api-client` (a `jest.mock` factory already exists in `jest.setup.js` for
  `aws-amplify/api`) and `react-toastify`.
- Add a minimal GitHub Actions workflow (`.github/workflows/ci.yml`) running
  `npm ci && npm run lint && npm test && npm run build` — the repo currently has CI only for Plasmic
  sync.
- Don't chase a coverage percentage; cover the estimator's logic and the two form paths.

**Out of scope**
Visual regression testing; testing generated Plasmic components.

**Done when**
`npm test` is green with meaningful assertions, CI runs it on PRs, and deliberately breaking
`parseTimelineToMonths` makes the suite fail.

---

## HN-20 — Error monitoring and log hygiene

**Size:** S · **Designer dependency:** No · **Depends on:** —

**Story**
As a **maintainer**, I want **production errors reported to me automatically and personal data kept
out of logs**, so that I hear about broken conversions from a dashboard rather than from sales, and
so we aren't printing visitors' names and emails into browser consoles.

**Context**
There is no error reporting anywhere in the repo. Meanwhile `components/ContactForm.tsx` logs every
keystroke's sanitized value (`:53`, `:75`, `:102`) including email addresses, and
`components/ProjectEstimator.tsx` logs full form state and project payloads on nearly every state
change (`DEBUG:` prefixes throughout). If the estimator's AI round-trip silently fails in production
today, nobody finds out.

**Acceptance criteria**
- Given an unhandled client error or a failed API route, then an event appears in the error tracker
  within a minute with a stack trace, release version and the route.
- Given production, then no `console.log` containing form values, email addresses, phone numbers or
  full project payloads is emitted.
- Given development, then the same diagnostics remain available behind a debug flag (reuse the
  existing `NEXT_PUBLIC_ENABLE_GA4_LOCALHOST`-style pattern, or a new `NEXT_PUBLIC_DEBUG_LOGS`).
- Given the error tracker, then PII is scrubbed before send (`beforeSend` strips `email`, `phone`,
  `firstName`, `lastName`, `scope`).
- Given a HubSpot API failure in `pages/api/create-hubspot-lead.ts`, then it is reported as an error
  event with the HubSpot status code — this is a lost lead and should page someone.
- Given the estimator times out waiting for AI data (HN-06), then a warning-level event is recorded so
  the rate is trackable over time.

**Implementation notes**
- Sentry (`@sentry/nextjs`) is the path of least resistance for Pages Router: it wires client, server
  and API routes with one wizard run. Set `tracesSampleRate` low (0.1) — this is a marketing site with
  meaningful traffic.
- Add a tiny `lib/logger.ts` (`debug` / `info` / `warn` / `error`) that no-ops `debug` in production,
  and replace the `console.*` calls in the two form components and the API routes with it. This is a
  mechanical change — do it in a separate commit from the Sentry install so review is easy.
- Do **not** send the visitor's scope text to the error tracker; it is commercially sensitive.

**Out of scope**
Full APM/tracing; log aggregation infrastructure; alert routing policy (agree the destination channel
with the team, but configuring PagerDuty-style escalation is separate).

**Done when**
A deliberately thrown error appears in the tracker from both a page and an API route; a production
build's console is clean while the dev console still shows diagnostics.

---

## Appendix — story index

| ID | Title | Size | Theme |
| --- | --- | --- | --- |
| HN-01 | Resume and share an estimate from a link | M | Estimator |
| HN-02 | Email me my estimate | M | Estimator |
| HN-03 | Download the estimate as a PDF | M | Estimator |
| HN-04 | Progress indicator and edit-any-answer navigation | S | Estimator |
| HN-05 | Replace `alert()` with inline, accessible validation | S | Estimator |
| HN-06 | Honest failure and timeout states for AI results | M | Estimator |
| HN-07 | Route the main contact form through the server and into HubSpot | M | Leads |
| HN-08 | Spam protection on both forms | M | Leads |
| HN-09 | Durable, shared rate limiting | S | Leads |
| HN-10 | Subscribe to one project, not all of them | S | Security |
| HN-11 | Tighten AppSync authorization rules | M | Security |
| HN-12 | Get secrets out of the repo and validate config at boot | S | Security |
| HN-13 | Real meeting booking with prefilled context | M | Leads |
| HN-14 | Cookie consent and Google Consent Mode gating | M | Compliance |
| HN-15 | SEO essentials: per-page metadata, sitemap and robots | M | Reach |
| HN-16 | Custom 404 and 500 pages | S | Reach |
| HN-17 | Insights index: tag filtering, pagination and reading time | M | Content |
| HN-18 | Respect reduced motion and low-power devices in the 3D hero | M | Durability |
| HN-19 | Make the test suite able to test things | M | Durability |
| HN-20 | Error monitoring and log hygiene | S | Durability |
