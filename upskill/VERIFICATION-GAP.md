# Verification gap: the jest suite was not run for these docs

The honesty rule for this course is that every quoted result comes from a
command actually executed. The jest suite could not be executed on the machine
that authored these docs, so **no test counts or test output are quoted
anywhere in `upskill/`**, and the planned worked example (exercise 1.1
performed for real, in the style of the sibling course's `break-the-cas.md`)
does not exist yet. This file records exactly what was tried, verbatim, and
what remains to be done.

## What was attempted, in order (2026-10-01)

Environment: Windows 11, Node v22.16.0, blobless clone
(`gh repo clone elirc/elihyper -- --filter=blob:none`).

1. `npm ci --no-audit --no-fund` — ran for 20 minutes without finishing
   (~650 of the packages extracted) and was stopped by the session's
   background-command time limit. No npm error; the machine's disk was simply
   too slow under load.
2. Resumed with `npm install --no-audit --no-fund --prefer-offline`:

   ```
   npm error code ENOTEMPTY
   npm error syscall rmdir
   npm error path ...\elihyper\node_modules\next\dist
   npm error errno -4051
   npm error ENOTEMPTY: directory not empty, rmdir '...\node_modules\next\dist'
   ```

   A classic Windows symptom of a half-written tree from the interrupted
   first install.
3. `rm -rf node_modules/next` from Git Bash failed too:

   ```
   rm: cannot remove 'node_modules/next/dist/compiled': Directory not empty
   ```

   PowerShell `Remove-Item -Recurse -Force` then succeeded. At this point
   `Get-Process node` showed about twenty unrelated `node.exe` processes
   running on the machine.
4. A third `npm install` was stopped by the host because **system memory was
   critically low**. Measured immediately afterward:

   ```
   0.2 GB free of 15.8 GB
   ```

   Restarting the install under those conditions would have made the machine's
   problem worse without producing a trustworthy run, so verification stops
   here rather than pretending.

What *was* verified: every file/line anchor in [CODE-TOUR.md](CODE-TOUR.md)
and [EXERCISES.md](EXERCISES.md) was checked against the working tree by
reading the files, and every quoted merge-commit body comes from
`git log --format=%B` run against this clone. The claims about what the tests
*assert* come from reading the test files, not from running them — treat them
at that strength.

## The environment-fix lab (do this first, it is the real exercise 0)

Getting a repeatable green baseline on a constrained machine is itself a
production skill. On a machine (or moment) with memory to spare:

1. **Make room.** Close what you can; check with
   `Get-Process node | Measure-Object` that you are not already running a
   fleet of node processes. `npm ci` needs headroom for extraction, and jest
   runs suites in worker processes.
2. **Install clean.** `rm -rf node_modules` (use PowerShell
   `Remove-Item -Recurse -Force` if Git Bash hits `ENOTEMPTY` — see above),
   then `npm ci --no-audit --no-fund`. On a slow disk expect this repo to take
   well over 20 minutes: the dependency tree includes Plasmic, Amplify, AWS
   SDKs, three.js and jest.
3. **Baseline.** `./test.sh` twice. Record the exact `Tests:` and `Suites:`
   summary lines. If anything is flaky across the two runs, that is a finding,
   not an inconvenience — write it down.
4. **Constrained-run option.** If memory stays tight, `npx jest --runInBand`
   runs suites in a single process at the cost of speed; note in your report
   which mode produced your numbers.

*Done when:* two consecutive green runs with identical counts, and the counts
are written in your journal with the command that produced them.

## Then produce the missing worked example

Perform exercise 1.1 from [EXERCISES.md](EXERCISES.md) for real and write it
up as `upskill/worked-examples/break-the-timeline-default.md`, in the format
of the sibling course's `break-the-cas.md`:

1. **Predict first** — write down which tests in
   `__tests__/estimatorMath.test.ts` should fail, and whether
   `computeDefaultEstimate`'s own `timeline || '12 months'` fallback
   (`lib/estimatorMath.ts:108`) masks the break on its path.
2. **The smallest break** — change both `return 12` defaults in
   `parseTimelineToMonths` (`lib/estimatorMath.ts:53,56`) to `return 1`. Show
   the diff.
3. **What actually happened** — paste the real failing jest output, trimmed to
   the failing assertion(s) and the summary line. Run it twice; say whether it
   is deterministic.
4. **Why no other layer saved us** — which UI surface would have shown a
   visitor the under-quote, and who would have discovered it (hint: the test
   comment at `__tests__/estimatorMath.test.ts:35-36` answers this).
5. **Restore and confirm** — `git checkout -- lib/estimatorMath.ts`, rerun,
   paste the green summary, show `git status --short lib/` printing nothing.

The rule carried over from the sibling course: never leave the break in
place, and never write the "What actually happened" section from imagination.
If your output differs from your prediction, that difference is the most
valuable sentence in the report.
