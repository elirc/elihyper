# Contributing

This repository is a working codebase **and** a teaching artifact. The commit history and pull
requests are meant to be read. If you are early in your career, the habits below are the ones that
separate "code that works" from "code a team can live with."

---

## 1. The loop

```
pick a story  →  branch  →  small commits  →  push  →  open PR  →  review  →  merge  →  delete branch
```

Never commit directly to `main`. `main` should always be deployable.

### Branch naming

`<type>/<HN-id>-<short-slug>` — the story id makes the branch, commits and PR searchable together.

```
feat/HN-01-resume-estimate-link
fix/HN-10-filtered-subscription
chore/HN-12-secret-hygiene
docs/HN-00-architecture-guide
```

Types: `feat` (new capability), `fix` (broken behaviour), `refactor` (same behaviour, better shape),
`chore` (tooling/config), `docs`, `test`, `perf`.

---

## 2. Commits

We use [Conventional Commits](https://www.conventionalcommits.org/): `type(scope): summary`.

```
feat(estimator): restore a finished estimate from ?estimate=<id>
fix(api): stop leaking HubSpot error details to the browser
refactor(estimator): extract applyProjectToState from four duplicated blocks
test(estimator): cover timeline parsing edge cases
```

### What makes a good commit

**One commit = one idea.** If you can't describe it in a single sentence without "and", split it.
A reviewer reading commit-by-commit should never have to hold two unrelated changes in their head.

**The subject line** is imperative mood, lower case, no trailing period, ≤ 72 characters.
Write it as the completion of the sentence *"If applied, this commit will…"*:

```
✅ fix(estimator): stop polling after the subscription delivers
❌ fixed the polling bug
❌ updates
❌ WIP
```

**The body explains WHY, not WHAT.** The diff already shows what changed. The body is where you
record the reasoning that a future developer (often you, in six months) cannot recover from the code:

```
refactor(estimator): extract applyProjectToState

The same 40-line block that copies a Project onto component state appeared in
four places: the subscription handler, the immediate fetch, the fallback poller
and the summary refresher. They had already drifted -- the refresher did not
handle AI_infrastructureRecommendations, so a late-arriving recommendation was
silently dropped on that path only.

Extracting one function makes that class of bug impossible and is a
prerequisite for HN-01, which needs a fifth caller.

No behaviour change intended beyond fixing the dropped field.
```

Note what that body does: it names the bug the duplication *caused*, explains why the refactor is
happening *now*, and flags the one intentional behaviour change so a reviewer knows it isn't an
accident.

**Reference the story** in the body (`Implements HN-01.`, `Part of HN-06.`), not the subject.

### Commit hygiene

- Commit early and often locally; tidy the history before you push
  (`git rebase -i`, `git commit --amend`) so reviewers see deliberate steps, not your keystrokes.
- Never commit commented-out code, debug logging, or `.only` in tests.
- Never commit secrets. If you do, the fix is to **rotate the credential**, not to delete the file —
  it is still in the history. See `HN-12`.

---

## 3. Pull requests

Open one PR per story. If a story turns out to be two independent things, that is two PRs.

**Keep them small.** A 200-line PR gets a real review; a 2,000-line PR gets "LGTM". If you are past
~400 lines of non-generated diff, ask yourself what could ship separately — usually the refactor can
land first on its own.

Use the template in `.github/pull_request_template.md`. A good PR description answers:

1. **What** changed, in one paragraph a non-author can follow.
2. **Why** now — link the story and the user-visible problem.
3. **How to verify** — the exact steps a reviewer takes to see it work, including how to reach the
   failure path, not just the happy path.
4. **Risk** — what could break, what you deliberately did not do, and how it can be rolled back.

**Self-review before you request one.** Open your own diff on GitHub and read every line as if
someone else wrote it. You will find the leftover `console.log` roughly half the time.

### Review etiquette

As an **author**: assume the reviewer is trying to protect the codebase, not you. Answer every
comment — with a change, or with a reason. "Good catch, fixed in abc1234" and "I'd rather keep this,
because X" are both complete answers. Silence is not.

As a **reviewer**: distinguish blocking from non-blocking. Prefix accordingly, so the author knows
what actually holds up the merge:

- **blocking:** correctness, security, data loss, missing tests for new logic.
- **nit:** style and taste. Say `nit:` explicitly and let the author decide.
- **question:** you don't understand something yet — ask before demanding a change.
- **praise:** say when something is done well. Reviews that only ever criticise train people to
  fear reviews.

### Merging

Use **merge commits** in this repo (`--no-ff`) so each story stays a legible unit in the history and
`git log --first-parent` reads as a list of shipped stories. Delete the branch after merging.

---

## 4. Definition of done

A story is done when *all* of these are true — not when the code runs on your machine:

- [ ] Every acceptance criterion in the story is demonstrably met.
- [ ] New logic has tests. Bug fixes have a test that fails without the fix.
- [ ] `npm run lint`, `npm test` and `npm run build` all pass locally.
- [ ] No secrets, no debug logging, no dead code.
- [ ] Docs updated if the change alters how someone runs or reasons about the app.
- [ ] The PR description explains how to verify it.
- [ ] Anything you *couldn't* finish is written down — in the PR, or as a follow-up issue. Silent
      scope reduction is the most expensive habit on this list.

---

## 5. Repository-specific rules

These are not general advice; they are how *this* codebase works. Violating them breaks things in
ways that are hard to debug.

1. **Never edit `components/plasmic/**`.** Those 170 files are generated from the Plasmic design
   project and are overwritten on every design sync. Behaviour goes in the hand-written wrapper —
   `components/ContactForm.tsx`, not `components/plasmic/hypernova_inc/PlasmicContactForm.tsx`.
2. **Never hand-edit `src/API.ts` or `src/graphql/*`.** They are generated from
   `amplify/backend/api/hypernovainc/schema.graphql`. Change the schema, run `amplify push` against
   the **dev** environment, and commit the regenerated files.
3. **Server-only code lives in `lib/` and is imported only from `pages/api/`.** Anything imported by
   a component ships to the browser. Environment variables prefixed `NEXT_PUBLIC_` are public —
   treat them as if printed on the homepage, because they are.
4. **`next.config.mjs` sets `trailingSlash: true`.** Internal `fetch` calls to API routes must
   include the trailing slash (`/api/create-hubspot-lead/`) or the POST body is lost to a redirect.
5. **Analytics events include `env` and `app_env`** (`import { env } from '@/src/utils/env'`) and use
   optional chaining (`window.dataLayer?.push(...)`) because GTM may not be configured.
6. **Read `fabledocs/01-app-architecture-guide.md` before your first change.** It explains why the
   estimator has four different ways of fetching the same result, among other things you would
   otherwise discover the hard way.

---

## 6. Getting set up

```bash
npm install
cp .env.example .env.local     # then fill in the values (ask the team for secrets)
npm run dev                    # http://localhost:3000
```

Useful routes while developing: `/` (3D hero + experiment), `/tools/ai-project-estimator`
(the estimator), `/plasmic-host` (Plasmic Studio canvas — not a user-facing page).
