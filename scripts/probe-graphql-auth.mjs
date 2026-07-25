/**
 * Authorization probe for the AppSync API.
 *
 * Runs the operations an anonymous visitor should NOT be able to perform,
 * using exactly the credentials the website ships to the browser, and reports
 * which ones succeeded. A successful call is a failure of the probe.
 *
 *   node scripts/probe-graphql-auth.mjs dev
 *   node scripts/probe-graphql-auth.mjs main
 *
 * Run this after `amplify push` whenever schema.graphql's @auth rules change.
 * Reviewing an authorization rule by reading it is not the same as confirming
 * the deployed API enforces it -- a typo in `operations` fails open, silently.
 *
 * Requires network access to the deployed environment. It reads the same
 * amplifyconfiguration JSON the app reads, so it cannot accidentally test a
 * different API than the one visitors talk to.
 */

import { readFile } from 'node:fs/promises'
import { Amplify } from 'aws-amplify'
import { generateClient } from 'aws-amplify/api'

const environment = process.argv[2] === 'main' ? 'main' : 'dev'

const config = JSON.parse(await readFile(new URL(`../src/amplifyconfiguration.${environment}.json`, import.meta.url)))

Amplify.configure(config)
const client = generateClient()

/**
 * Each probe is an operation that MUST be rejected. `shouldFail: false` marks
 * the operations the product genuinely needs, so the probe also catches the
 * opposite mistake: locking things down so hard the estimator stops working.
 */
const probes = [
  {
    name: 'listLeads (every visitor’s personal data)',
    shouldFail: true,
    query: `query { listLeads(limit: 1) { items { id email firstName lastName phoneNumber } } }`,
  },
  {
    name: 'listProjects (every visitor’s scope and budget)',
    shouldFail: true,
    query: `query { listProjects(limit: 1) { items { id scope AI_estimatedCost } } }`,
  },
  {
    name: 'deleteProject',
    shouldFail: true,
    query: `mutation { deleteProject(input: { id: "probe-nonexistent-id" }) { id } }`,
  },
  {
    name: 'updateProject (only the enrichment worker may write AI_* fields)',
    shouldFail: true,
    query: `mutation { updateProject(input: { id: "probe-nonexistent-id", AI_summary: "probe" }) { id } }`,
  },
  {
    name: 'deleteLead',
    shouldFail: true,
    query: `mutation { deleteLead(input: { id: "probe-nonexistent-id" }) { id } }`,
  },
  {
    name: 'createProject (the estimator needs this)',
    shouldFail: false,
    query: `mutation { createProject(input: { scope: "authorization probe -- safe to delete" }) { id } }`,
  },
]

let failures = 0

for (const probe of probes) {
  let succeeded = false
  let detail = ''

  try {
    await client.graphql({ query: probe.query })
    succeeded = true
  } catch (error) {
    // AppSync reports authorization failures as GraphQL errors rather than
    // transport errors, so inspect the message rather than trusting the throw.
    const messages = (error?.errors || []).map((e) => e.message).join('; ') || error?.message || String(error)
    detail = messages
    succeeded = !/unauthorized|not authorized|access denied/i.test(messages)
  }

  const passed = probe.shouldFail ? !succeeded : succeeded

  if (!passed) failures++

  const verdict = passed ? 'PASS' : 'FAIL'
  const expectation = probe.shouldFail ? 'must be denied' : 'must be allowed'
  console.log(`${verdict}  ${probe.name} (${expectation})`)
  if (!passed && detail) console.log(`      ${detail}`)
}

console.log(`\n${failures === 0 ? 'All probes passed.' : `${failures} probe(s) failed.`}`)
process.exit(failures === 0 ? 0 : 1)
