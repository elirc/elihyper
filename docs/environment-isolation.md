

# Environment Isolation Implementation Guide

This document outlines where environment isolation has been implemented and what remains to be done.

## ✅ Frontend Implementation (COMPLETE)

### 1. Environment Detection Utility
**Location:** `src/utils/env.ts`

Detects environment based on hostname:
- `dev` if hostname contains `dev.`
- `prod` otherwise

**Usage:**
```typescript
import { env } from '@/utils/env'
// env will be 'dev' or 'prod'
```

### 2. Google Tag Manager (GTM)
**Location:** `pages/_app.tsx`

- Environment is pushed to `dataLayer` immediately on page load
- All `page_info` events include `env` field
- GTM can now route events to different GA4 streams based on `env` variable

**GTM Configuration Required:**
- Create a GTM variable named `env` that reads from `dataLayer`
- Configure GA4 triggers:
  - If `env = "dev"` → route to GA4 Dev Stream
  - If `env = "prod"` → route to GA4 Prod Stream

### 3. LinkedIn Insight Tag
**Location:** `pages/_app.tsx`

- LinkedIn tracking wrapper automatically includes `env` in all events
- Usage: `window.lintrk('track', { conversion_id: 123 })` automatically includes `env`

### 4. DataLayer Events
**Locations:**
- `pages/_app.tsx` - `page_info` events
- `components/ProjectEstimator.tsx` - All estimator tracking events

All events now include `env` field.

## ⚠️ Backend Implementation (REQUIRES ACTION)

### 5. GraphQL Schema
**Location:** `amplify/backend/api/hypernovainc/schema.graphql`

✅ **COMPLETE:** Added `environment: String` field to `Lead` model.

**Next Steps:**
After updating the schema, run:
```bash
amplify push
```

This will regenerate the GraphQL types and update DynamoDB tables.

### 6. HubSpot Sync Layer
**Location:** ⚠️ **NOT FOUND** - Must be implemented

**Where it should go:**
- If using AppSync Pipeline Resolvers: Add resolver for `createLead` mutation
- If using Lambda functions: Create/update Lambda that syncs to HubSpot
- If using DynamoDB Streams: Lambda triggered by DynamoDB stream on Lead creation

**Implementation Required:**

Every HubSpot contact creation/update must include:

```javascript
payload["environment"] = ENV  // "dev" or "prod"
```

**Critical:** This is the most important place - HubSpot gets polluted if you forget this.

**HubSpot Property Setup:**
1. Create a custom property in HubSpot: `environment` (Single line text)
2. Ensure all sync code includes this field

**Example Lambda Function (Node.js):**
```javascript
// Lambda triggered by DynamoDB stream or AppSync resolver
exports.handler = async (event) => {
  const lead = event.arguments.input || event.Records[0].dynamodb.NewImage;
  const ENV = process.env.ENV || 'prod'; // From Lambda environment variable
  
  const hubspotPayload = {
    email: lead.email.S,
    firstname: lead.firstName.S,
    lastname: lead.lastName.S,
    phone: lead.phoneNumber.S,
    environment: lead.environment?.S || ENV, // CRITICAL: Always include
    // ... other fields
  };
  
  // Sync to HubSpot
  await hubspotClient.contacts.create(hubspotPayload);
};
```

### 7. DynamoDB Table Isolation
**Location:** ⚠️ **CONFIGURATION REQUIRED**

**Current State:**
- Amplify generates tables automatically from GraphQL schema
- Table names follow pattern: `Lead-{env}-{hash}`

**Required Configuration:**

Ensure each Amplify environment uses separate DynamoDB tables:

```bash
# Dev environment
amplify env checkout dev
amplify push  # Creates tables with dev suffix

# Prod environment  
amplify env checkout prod
amplify push  # Creates tables with prod suffix
```

**Verification:**
1. Check AWS Console → DynamoDB
2. Verify separate tables exist:
   - `Lead-{dev-hash}` (dev environment)
   - `Lead-{prod-hash}` (prod environment)
3. **NEVER** share tables between environments

### 8. Backend Environment Variables
**Location:** ⚠️ **CONFIGURATION REQUIRED**

**AppSync/Lambda Configuration:**

Set environment variables in AWS Console or via Amplify:

**Dev Environment:**
- `ENV=dev`
- `DYNAMODB_TABLE=Lead-{dev-hash}` (auto-set by Amplify)
- `HUBSPOT_API_KEY={dev-key}` (if using separate HubSpot portal)

**Prod Environment:**
- `ENV=prod`
- `DYNAMODB_TABLE=Lead-{prod-hash}` (auto-set by Amplify)
- `HUBSPOT_API_KEY={prod-key}` (if using separate HubSpot portal)

**Setting via Amplify CLI:**
```bash
# For Lambda functions (if you create custom resolvers)
amplify function update {functionName}
# Add environment variable: ENV
```

**Setting via AWS Console:**
1. Lambda → Functions → {FunctionName} → Configuration → Environment variables
2. Add: `ENV` = `dev` or `prod`

## ✅ AWS Amplify Environments
**Status:** Already configured

Multiple environments exist:
- `dev`
- `prod`
- `contactfor`
- `noahdev`

**Important:** Each environment should have:
- Separate API config
- Separate DynamoDB tables
- Separate storage buckets
- **NEVER** share resources between environments

## Testing Checklist

- [ ] Verify `env` utility returns correct value on dev/prod domains
- [ ] Verify GTM dataLayer includes `env` on all events
- [ ] Verify LinkedIn tracking includes `env` (check network requests)
- [ ] Verify Lead creation includes `environment` field in GraphQL mutation
- [ ] Verify DynamoDB tables are separate for dev/prod
- [ ] Verify HubSpot sync includes `environment` field (check HubSpot contact properties)
- [ ] Test form submission on dev.hypernova.inc → verify environment="dev"
- [ ] Test form submission on hypernova.inc → verify environment="prod"

## Notes

- **Frontend isolation is complete** - all tracking now includes environment
- **Backend isolation requires implementation** - HubSpot sync and environment variable configuration
- After schema changes, run `amplify push` to update backend resources
- Regenerate GraphQL types: `amplify codegen` (if using codegen)

