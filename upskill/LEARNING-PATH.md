# HyperNova Upskilling: Reading and Practice Path

Your central question: **what does "production" add?** A real marketing site
with a real estimator ships through Plasmic codegen, AWS Amplify hosting, and
third-party tracking. Which promises move *out of your code* — into a design
tool's regenerated files, a cloud service's configuration, a CRM's property
schema, a tag manager's container — and how do you still verify them when
`npm test` cannot see them?

This repo is unusual raw material for that question because it was built
story-by-story: 20 stories (HN-01…HN-20), each shipped as a reviewed PR, so
the history itself is a course. This path pairs with the three-rebuild course
(GitJira → Stockade → Relay) in the astrafinalorganize workspace; do that one
for invariants inside your own code, this one for promises that live partly
outside it.

Suggested sequence, at your own pace:

1. **Read the map.** [fabledocs/01-app-architecture-guide.md](../fabledocs/01-app-architecture-guide.md)
   end to end once — it describes the codebase *as it was imported*, including
   §12's list of sixteen gaps. Then skim
   [fabledocs/02-feature-backlog-user-stories.md](../fabledocs/02-feature-backlog-user-stories.md):
   each gap became a story. Keep both open; the rest of this path keeps
   pointing back. [CONTRIBUTING.md](../CONTRIBUTING.md) is the working
   discipline (branch → small commits → PR → merge commit) and the
   repo-specific rules that bite (never edit `components/plasmic/**`,
   trailing-slash fetches, server-only code in `lib/`).

2. **Read the history as a reading list.** Every story landed as a `--no-ff`
   merge whose commit body is the full PR description — what/why/how to
   verify/risk/follow-up. That makes the shipped-story list one command:

   ```bash
   git log --first-parent main --oneline     # the 20 stories plus fixes
   git log --format=%B -1 <merge-sha>        # the full PR description
   git log --oneline <merge-sha>^1..<merge-sha>   # the branch's commits
   git diff <merge-sha>^1 <merge-sha>        # the whole story's diff
   ```

   `--first-parent` follows only main's side of each merge, so the noise of
   branch-internal commits disappears and the log reads as "what shipped,
   in order." Pick one story that interests you (PR #14, HN-06, is a good
   first one), read its description, predict what the diff will touch, then
   read the diff and score your prediction. Note: the PRs are recorded in the
   merge commits, not as GitHub PR objects — plain git is the archive here.

3. **Trace one promise.** Take [CODE-TOUR.md](CODE-TOUR.md) end to end with
   the files open: the estimator's "fallback arithmetic is never passed off as
   an AI analysis" promise, from the step machine through `aiStatus` to the
   banner, the tests that pin the arithmetic — and the three boundaries
   (Plasmic, the external AI worker, Amplify) where the promise stops.

4. **Run the suite and read it as documentation.** Start with
   [VERIFICATION-GAP.md](VERIFICATION-GAP.md) — the environment-fix lab there
   is exercise 0, and it explains why these docs quote no test counts. Then
   `./test.sh` (or `npm test`); `./coverage.sh` for the honest coverage
   picture. Then read
   `__tests__/estimatorMath.test.ts` top to bottom — especially the test at
   `:48` that pins a *wrong* behavior on purpose, with a comment explaining
   why changing it is a product decision. Compare with
   `jest.config.js`'s coverage excludes: generated Plasmic and Amplify code is
   deliberately not measured, because "coverage of code we neither write nor
   review is noise that hides the real number."

5. **Break it on purpose.** [EXERCISES.md](EXERCISES.md) Tier 1. Write your
   prediction down before each run; your own first report in the
   predict/break/observe/revert format becomes this repo's first worked
   example (the template is at the end of VERIFICATION-GAP.md).

6. **Extend inside the boundaries.** Tier 2: a component test for the wizard,
   a new estimator question end to end, a tracked event with an honest test,
   or story HN-21 run through the repo's own PR discipline.

7. **Move a boundary.** Tier 3: the Plasmic-sync diff review, the Amplify
   promotion/rollback story, or replacing the tracking stack. Each is about a
   promise that no jest test currently guards, and what verification would
   even mean there.

Concrete outputs to keep in your learning journal:

- A one-page answer to the central question: a table of five promises this
  app makes, with a column for *which system enforces it* (your code / Plasmic
  / Amplify / HubSpot / GTM) and a column for *how you would detect a breach*.
- One break-the-guarantee report in the worked example's format: predict,
  one-line diff, real output, which layer spoke, restore.
- One story archaeology write-up (exercise 1.4): three merge commits, the
  invariant each added, and the evidence each PR description offered.

Honesty labels, same convention as the sibling course: "exercise" means the
repo does not contain it yet; every quoted output in these docs comes from a
command actually run against this working tree, and anything we could not run
is labeled as such.
