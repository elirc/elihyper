# Security

## Reporting

Found something? Do not open a public issue. Email the maintainers directly with
the details and give us a reasonable window to fix it before disclosing.

## Secrets

**No credential belongs in a tracked file.** Server-side secrets are read through
`lib/serverEnv.ts` and supplied by:

- **Locally** — `.env.local`, which is gitignored. Start from `.env.example`.
- **Deployed** — AWS Amplify console → App settings → Environment variables, set
  per branch so `dev` and `main` can hold different values.

Variables prefixed `NEXT_PUBLIC_` are inlined into the JavaScript bundle at build
time and are readable by anyone with devtools. They are configuration, not
secrets. Never add a credential behind that prefix.

### If a secret is committed

Deleting the file in a later commit **does not** remove the secret — it is still
in the history, in every clone, and in any fork. The order of operations is:

1. **Rotate the credential first.** Until the old value is revoked, nothing else
   you do matters.
2. Remove the file from tracking (`git rm --cached`) and add it to `.gitignore`.
3. Decide whether to rewrite history (`git filter-repo`) — worth it for a public
   repository, usually not worth the disruption for a private one where rotation
   has already neutralised the value. Write down which you chose and why.
4. Check the credential's audit log for use you did not authorise.

### Outstanding action for this repository

The upstream project committed a live HubSpot private-app token
(`HUBSPOT_API_KEY`) to `.env.development` and `.env.production`. It was replaced
with a placeholder before this repository's first commit, so **it does not
appear anywhere in this history**.

It does still exist in the upstream repository's history, which means:

> **The token must be rotated in HubSpot.** Anyone who has ever had read access
> to the original repository has a token with write access to the CRM. Rotation
> is the only fix.

After rotating, set the new value in the Amplify console for both branches and
in each developer's `.env.local`.

## Automated scanning

CI runs [gitleaks](https://github.com/gitleaks/gitleaks) on every pull request.
It fails the build when a value matching a known credential pattern is added.
It is a safety net, not a substitute for care: it will not catch a
custom-format key, and it cannot un-leak something already pushed.

Also enable, in repository settings:

- **Secret scanning** and **push protection** (Settings → Code security), which
  block a push containing a recognised provider token before it reaches GitHub.
- **Branch protection** on `main` requiring the CI check to pass.
