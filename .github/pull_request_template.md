<!--
Keep this short but complete. A reviewer should be able to review the change
without asking you a single clarifying question.
-->

## What

<!-- One paragraph. What does this change do, in plain language? -->

## Why

<!-- Link the story (e.g. Implements HN-01) and describe the problem it solves for a real person. -->

Implements: HN-XX

## How to verify

<!--
Exact steps. Include the failure path, not just the happy path -- "and to see the
error state, disconnect from the network before clicking Submit".
-->

1.
2.
3.

## Risk and rollback

<!-- What could break? What did you deliberately leave out? How would we undo this? -->

## Checklist

- [ ] Every acceptance criterion in the story is met
- [ ] New logic has tests; bug fixes have a test that fails without the fix
- [ ] `npm run lint`, `npm test` and `npm run build` pass locally
- [ ] No secrets, no debug logging, no commented-out code
- [ ] No files under `components/plasmic/**` or `src/graphql/**` were hand-edited
- [ ] Docs updated if this changes how the app is run or reasoned about
- [ ] I have read my own diff line by line
