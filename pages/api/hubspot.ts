import type { NextApiRequest, NextApiResponse } from 'next'

// Dummy HubSpot client placeholder
async function sendToHubSpot(payload: any) {
  // TODO: Replace with real HubSpot API call
  console.log('Sending to HubSpot:', payload)
  return { status: 'ok' }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { env, ...data } = req.body

  // 1. Require env
  if (!env || (env !== 'dev' && env !== 'prod')) {
    console.error('Missing or invalid env:', env)
    return res.status(400).json({ error: 'Missing or invalid env' })
  }

  // 2. Log env on every event
  console.log('Received event with env:', env)

  // 3. Tag HubSpot payload with environment
  const hubspotPayload = {
    ...data,
    environment: env,
  }

  // 4. Send to HubSpot (dummy)
  const hubspotResult = await sendToHubSpot(hubspotPayload)

  return res.status(200).json({ status: 'ok', hubspotResult })
}
