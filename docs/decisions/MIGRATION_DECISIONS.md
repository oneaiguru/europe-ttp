# Europe TTP Migration - Critical Decisions & Fixes

## Purpose
This document captures all critical migration decisions based on web research and ChatGPT analysis.
**All items here MUST be decided before build phase begins.**

---

## 1. Database: NDB → PostgreSQL Key Strategy ⚠️ CRITICAL

### The Problem (from ChatGPT analysis)
> NDB keys are **hierarchical**, not flat IDs. Ancestor queries imply **transactional boundaries**. Auto-increment IDs **cannot represent entity groups**.

### Decision Required: Choose ONE

**Option A: UUID with parentId (Recommended)**
```prisma
model User {
  id        String   @id @default(uuid())
  // ... other fields
  children  Child[]  // Reverse relation if needed
}

model ChildEntity {
  id        String   @id @default(uuid())
  parentId  String?
  parent    User?    @relation(fields: [parentId], references: [id])
}
```

**Option B: Serialized NDB Key (Legacy-faithful)**
```prisma
model Entity {
  id        String   @id  // Serialized NDB key
  keyKind   String
  keyName   String?
  keyParent String?
}
```

### Decision: [ ] Option A  [ ] Option B

### Source: [Prisma Self-Relations](https://www.prisma.io/docs/orm/prisma-schema/data-model/relations/self-relations) | [Entity Groups in Datastore](https://medium.com/google-cloud/entity-groups-ancestors-and-indexes-in-datastore-a-working-example-3ee40cc185ee)

---

## 2. Cron / TaskQueue / Background Jobs

### The Problem
> Legacy app may use `cron.yaml`, `taskqueue`, or deferred tasks. These will silently disappear if not explicitly extracted.

### Extraction Required
Create `specs/extracted/jobs.json`:
```json
{
  "cron": [
    {"url": "/cron/daily-report", "schedule": "every 24 hours", "file": "cron.yaml"}
  ],
  "taskqueue": [
    {"name": "email-queue", "handler": "/tasks/send-email", "file": "queue.yaml"}
  ],
  "deferred": [
    {"module": "reporting", "function": "generate_report", "file": "reporting.py:123"}
  ]
}
```

### Target Implementation
| Legacy | Target |
|--------|--------|
| `cron.yaml` | Next.js Route Handlers (`app/api/cron/...`) |
| `taskqueue` | BullMQ / Upstash QStash |
| `deferred` | Cloud Scheduler HTTP target |

### Source: [App Engine Cron Scheduling](https://docs.cloud.google.com/appengine/docs/flexible/scheduling-jobs-with-cron-yaml) | [Next.js Cron Jobs](https://yagyaraj234.medium.com/running-cron-jobs-in-next-js-guide-for-serverful-and-server-stateless-542dd0db0c4c)

---

## 3. File Upload: Blobstore → GCS Strategy

### The Problem
> Blobstore uses upload handlers coupled to form POST flow. Modern GCS uses signed URLs with different flow.

### Decision Required: Choose ONE

**Option A: Server-Mediated Upload (Simpler)**
- Client uploads to Next.js API route
- Server streams to GCS
- Slower but simpler

**Option B: Signed URL Upload (Recommended)**
- Server generates signed URL
- Client uploads directly to GCS
- Faster, more scalable

### Decision: [ ] Option A  [ ] Option B

### Implementation (Option B)
```typescript
// app/api/upload/sign/route.ts
import { Storage } from '@google-cloud/storage';

const storage = new Storage();
const bucket = storage.bucket('your-bucket');

export async function POST(req: Request) {
  const [url] = await bucket.file(`uploads/${uuid()}`).getSignedUrl({
    action: 'write',
    expires: Date.now() + 15 * 60 * 1000, // 15 minutes
    contentType: req.headers.get('content-type'),
  });
  return Response.json({ url });
}
```

### CORS Configuration Required
```json
// cors-config.json
[
  {
    "origin": ["https://yourdomain.com"],
    "method": ["PUT"],
    "responseHeader": ["Content-Type"],
    "maxAgeSeconds": 3600
  }
]
```

### Source: [Blobstore Migration Guide](https://docs.cloud.google.com/appengine/migration-center/standard/python/migrate-to-cloud-storage) | [Blobstore Migrator Tool](https://github.com/GoogleCloudPlatform/appengine-blobstoremigrator-python)

---

## 4. Images API → Sharp Migration

### The Problem
> App Engine Images API had implicit EXIF handling, auto-orientation, silent format coercion. `sharp` does not replicate this by default.

### Extraction Required
Create `specs/extracted/images.json`:
```json
{
  "operations": [
    {
      "file": "reporting/reporting_utils.py",
      "line": 234,
      "operation": "resize",
      "params": {"width": 200, "height": 200},
      "behavior": "crop_to_fit, auto_orient"
    }
  ]
}
```

### Sharp Equivalents
| App Engine Images API | Sharp |
|----------------------|-------|
| `images.resize()` | `sharp().resize()` |
| `images.crop()` | `sharp().extract()` |
| `images.rotate()` | `sharp().rotate()` |
| `images.im_feeling_lucky()` | `sharp().rotate().resize()` |

### Auto-Orientation Required
```typescript
import sharp from 'sharp';

// App Engine auto-oriented by default
const processed = await sharp(input)
  .rotate() // Auto-orient based on EXIF
  .resize(width, height, { fit: 'cover' })
  .toBuffer();
```

### Source: [Sharp GitHub](https://github.com/lovell/sharp) | [Sharp Node.js Guide](https://javascript.plainenglish.io/using-sharp-in-nodejs-to-output-resize-and-crop-images-on-the-fly-f8b150989760)

---

## 5. Sessions & Auth Strategy

### The Problem
> Sessions, auth, JWT, NextAuth are **not interchangeable**. Must decide on session data migration.

### Decision Required

**Question:** Is legacy session data required across migration?

- [ ] YES - Need session compatibility layer
- [ ] NO - Invalidate all sessions at cutover

### If YES: Migration Strategy
```typescript
// lib/session-compat.ts
// Read webapp2 session, write to NextAuth session
export async function migrateSession(legacyCookie: string) {
  // Decrypt webapp2 session cookie
  const session = decryptWebapp2Session(legacyCookie);
  // Create NextAuth session
  await createNextAuthSession(session);
}
```

### If NO: Invalidation Strategy
```bash
# Clear all sessions at deployment
DELETE FROM sessions WHERE created_at < cutover_time
```

### Source: [Next.js Authentication Guide 2025](https://embarkingonvoyage.com/blog/next-js-authentication-and-authorization-2025-best-practices-for-secure-web-development/) | [Webapp2 Auth Migration](https://github.com/GoogleCloudPlatform/webapp2/issues/137)

---

## 6. Forms: Validation Parity

### The Problem
> Legacy has server-side normalization, implicit defaults, conditional validation. Zod alone is not enough unless we enforce parity.

### Required Rule
> **All Zod schemas must be generated from `specs/extracted/forms.json`**

### Extraction Format
```json
{
  "forms": [
    {
      "name": "TTCApplication",
      "fields": [
        {
          "name": "email",
          "type": "email",
          "required": true,
          "validation": "regex:^[^@]+@[^@]+\\.[^@]+$",
          "normalization": "lowercase, trim"
        }
      ]
    }
  ]
}
```

### Generated Zod Schema
```typescript
import { z } from 'zod';

// Generated from forms.json - DO NOT EDIT MANUALLY
export const TTCApplicationSchema = z.object({
  email: z.string()
    .email()
    .transform(val => val.toLowerCase().trim())
    .regex(/^[^@]+@[^@]+\.[^@]+$/),
});
```

### BDD Scenario Required
```gherkin
Scenario: Form validation parity
  Given the legacy Python form validates an email
  When I submit "  TEST@EXAMPLE.COM  "
  Then the TypeScript form should accept "test@example.com"
```

---

## 7. Email: SendGrid Template Data

### The Problem
> Must extract template_id, substitutions, conditional logic. Otherwise "email sent but wrong content" bugs.

### Extraction Format
```json
{
  "emails": [
    {
      "name": "TTCApplicationConfirmation",
      "template_id": "d-1234567890abcdef",
      "trigger": "on_ttc_application_submit",
      "variables": {
        "first_name": "{{first_name}}",
        "course_date": "{{course_date}}",
        "location": "{{location}}"
      },
      "conditions": "only_send_if_course_is_upcoming"
    }
  ]
}
```

### Node.js SendGrid Usage
```typescript
import mail from '@sendgrid/mail';

mail.setApiKey(process.env.SENDGRID_API_KEY);

await mail.send({
  to: email,
  from: 'noreply@example.com',
  templateId: 'd-1234567890abcdef', // From extraction
  dynamicTemplateData: {
    first_name,
    course_date,
    location,
  },
});
```

---

## 8. Node/Bun Dependency Pinning

### The Problem
> Sharp, @google-cloud/storage, Prisma have native builds. Need pinning.

### Required Versions
```json
{
  "engines": {
    "node": ">=20.0.0 <21.0.0",
    "bun": ">=1.0.0"
  },
  "dependencies": {
    "next": "14.2.0",
    "@prisma/client": "5.20.0",
    "@google-cloud/storage": "^7.0.0",
    "@sendgrid/mail": "^8.0.0",
    "sharp": "^0.33.0"
  }
}
```

### Commit `bun.lockb`
```bash
bun install
git add bun.lockb
git commit -m "Lock dependency versions"
```

---

## 9. Jinja2 → React Component Mapping

### The Problem
> Jinja templates include macros, includes, filters, global context variables. JSX will look right but behave wrong if not mapped carefully.

### Required Extraction
For each `.html` file, produce:
1. React component
2. Props interface
3. BDD scenario proving output parity

### Example Mapping
```jinja2
{# Jinja2 template #}
{% macro user_card(user) %}
  <div class="card">
    <h2>{{ user.name|title }}</h2>
  </div>
{% endmacro %}
```

```tsx
// React component
interface UserCardProps {
  user: {
    name: string;
  };
}

export function UserCard({ user }: UserCardProps) {
  return (
    <div className="card">
      <h2>{user.name.charAt(0).toUpperCase() + user.name.slice(1)}</h2>
    </div>
  );
}
```

### BDD Parity Test
```gherkin
Scenario: Template output parity
  Given user "john doe" exists
  When I render the Jinja2 template
  And I render the React component
  Then both outputs should contain "<h2>John Doe</h2>"
```

---

## 10. Step Registry: Hash-Level Parity

### The Problem
> Need step pattern checksum comparison. Otherwise someone will "almost match" a step.

### Required Enforcement
```typescript
// test/bdd/step-registry.ts with checksums
export const STEPS = {
  'I am on the TTC application page': {
    pattern: /^I am on the TTC application page$/,
    checksum: 'a1b2c3d4', // SHA-256 of step text
    python: 'test/python/steps/forms_steps.py:15',
    typescript: 'test/typescript/steps/forms_steps.ts:23',
    features: ['specs/features/forms/ttc_application_us.feature:12'],
  },
} as const;
```

### Verification Script Update
```typescript
// scripts/bdd/verify-alignment.ts
import { createHash } from 'crypto';

function checksum(step: string): string {
  return createHash('sha256').update(step).digest('hex');
}

// Fail if regex differs between implementations
function verifyStepPattern(step: string, pythonPattern: RegExp, tsPattern: RegExp) {
  if (pythonPattern.toString() !== tsPattern.toString()) {
    throw new Error(`Step pattern mismatch for: ${step}`);
  }
}
```

---

## Summary: Decision Checklist

Before starting BUILD phase, ensure:

- [ ] **DB Key Strategy**: Option A (UUID) or Option B (Serialized key) decided
- [ ] **Jobs Extraction**: `specs/extracted/jobs.json` created
- [ ] **Upload Strategy**: Server-mediated or Signed URLs decided
- [ ] **Images Extraction**: `specs/extracted/images.json` created
- [ ] **Session Strategy**: Migrate or invalidate decided
- [ ] **Forms Parity**: Zod schemas generated from extraction
- [ ] **Email Templates**: All template IDs extracted
- [ ] **Dependencies Pinned**: Node 20, Bun, specific versions committed
- [ ] **Template Mapping**: Each HTML has React equivalent
- [ ] **Step Checksums**: Registry includes SHA-256 verification

---

## Sources

1. [Prisma Self-Relations](https://www.prisma.io/docs/orm/prisma-schema/data-model/relations/self-relations)
2. [Entity Groups in Datastore](https://medium.com/google-cloud/entity-groups-ancestors-and-indexes-in-datastore-a-working-example-3ee40cc185ee)
3. [Blobstore to GCS Migration](https://docs.cloud.google.com/appengine/migration-center/standard/python/migrate-to-cloud-storage)
4. [Blobstore Migrator Tool](https://github.com/GoogleCloudPlatform/appengine-blobstoremigrator-python)
5. [Sharp GitHub](https://github.com/lovell/sharp)
6. [Sharp Resize Guide](https://javascript.plainenglish.io/using-sharp-in-nodejs-to-output-resize-and-crop-images-on-the-fly-f8b150989760)
7. [Next.js Auth 2025](https://embarkingonvoyage.com/blog/next-js-authentication-and-authorization-2025-best-practices-for-secure-web-development/)
8. [Webapp2 Auth Issue](https://github.com/GoogleCloudPlatform/webapp2/issues/137)
9. [Next.js Cron Jobs](https://yagyaraj234.medium.com/running-cron-jobs-in-next-js-guide-for-serverful-and-server-stateless-542dd0db0c4c)
10. [PostgreSQL Hierarchical Queries](https://www.cybrosys.com/research-and-development/postgres/how-to-write-hierarchical-queries-in-postgresql)
