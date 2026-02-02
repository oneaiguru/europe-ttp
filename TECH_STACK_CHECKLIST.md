# Europe TTP Migration - Tech Stack Checklist

## Legacy Python 2.7 → Target Stack Mapping

| Category | Python 2.7 (Legacy) | Target (TypeScript/Next.js) | Status |
|----------|-------------------|----------------------------|--------|
| **Runtime** | Python 2.7 | Bun (JavaScript runtime) | ✅ Planned |
| **Framework** | webapp2 (WSGI) | Next.js 14 (App Router) | ✅ Planned |
| **Database** | NDB (App Engine Datastore) | PostgreSQL + Prisma ORM | ✅ Planned |
| **Templating** | Jinja2 (.html templates) | React Server Components | ✅ Planned |
| **Sessions** | webapp2_extras.sessions | Next.js sessions / JWT | ✅ Planned |
| **File Storage** | GCS (cloudstorage) | GCS via @google-cloud/storage | ⚠️ Verify |
| **Email** | SendGrid (python lib) | SendGrid (Node.js SDK) | ⚠️ Verify |
| **Images** | App Engine images API | sharp / @napi/sharp | ⚠️ Verify |
| **Forms** | webapp2.RequestHandler | React Hook Form + Zod | ✅ Planned |
| **Auth** | Google App Engine users API | NextAuth.js | ✅ Planned |
| **Blobstore** | App Engine blobstore | GCS / direct upload | ⚠️ Verify |

---

## Detailed Component Breakdown

### 1. Web Framework

| Legacy | Target | Migration Notes |
|--------|--------|-----------------|
| `webapp2.WSGIApplication` | Next.js App Router | Routes become `/app/.../route.ts` |
| `webapp2.RequestHandler` | Route handlers | GET/POST/PUT/DELETE methods |
| `webapp2_extras.routes` | Next.js file-based routing | Automatic route resolution |

**Extract to:** `specs/extracted/routes.json`

### 2. Database (NDB → Prisma/PostgreSQL)

| Legacy | Target | Migration Notes |
|--------|--------|-----------------|
| `ndb.Model` | Prisma `model` | One-to-one mapping |
| `ndb.StringProperty` | `String` @db.VarChar | Type mapping |
| `ndb.IntegerProperty` | `Int` @db.Int8 | Type mapping |
| `ndb.BooleanProperty` | `Boolean` | Type mapping |
| `ndb.DateTimeProperty` | `DateTime` | Type mapping |
| `ndb.TextProperty` | `String` @db.Text | Type mapping |
| `ndb.Key` | **UUID or Serialized key** | ⚠️ DECISION REQUIRED - See `docs/decisions/MIGRATION_DECISIONS.md` |
| Entity groups | `parentId` self-relation | ⚠️ Use Prisma self-relations |
| Ancestor queries | Recursive CTEs | ⚠️ Requires PostgreSQL hierarchy queries |

**Extract to:** `specs/extracted/models.json`
**Create:** `specs/database/schema.prisma`

### 3. Forms

| Legacy | Target | Migration Notes |
|--------|--------|-----------------|
| `form.py` (custom form lib) | React Hook Form | Form state management |
| Jinja2 form rendering | React components | Client-side rendering |
| Server-side validation | Zod schemas | Shared validation |

**Extract to:** `specs/extracted/forms.json`

### 4. Email (SendGrid)

| Legacy | Target | Package |
|--------|--------|---------|
| `sendgrid` Python lib | `@sendgrid/mail` | Node.js SDK |

**Verify:** Template IDs match
**Extract to:** `specs/extracted/emails.json`

### 5. File Storage

| Legacy | Target | Package |
|--------|--------|---------|
| `google.appengine.ext.blobstore` | GCS direct upload | @google-cloud/storage |
| `cloudstorage` (pyutils) | GCS signed URLs | @google-cloud/storage |

**Verify:** Bucket names, ACL rules

### 6. Images

| Legacy | Target | Package |
|--------|--------|---------|
| `google.appengine.api.images` | sharp | @napi/sharp |

**Verify:** Resize/crop operations match

### 7. Sessions

| Legacy | Target | Implementation |
|--------|--------|----------------|
| `webapp2_extras.sessions` | NextAuth.js / JWT | Cookie-based |

**Verify:** Session data structure

### 8. Templates (Jinja2 → React)

| Legacy | Target | Notes |
|--------|--------|-------|
| `jinja2.Template` | React Server Component | JSX syntax |
| `{% if %}` | `{condition && <Component />}` | Conditional rendering |
| `{% for %}` | `{array.map() => <Component />}` | List rendering |
| `{{ variable }}` | `{variable}` | Variable interpolation |

**Action:** Review each `.html` file in `tabs/`, `admin/`, `reporting/`

---

## Dependencies to Verify

### Python (Legacy) - Already in use
```text
google-appengine  # App Engine SDK
google-cloud-storage  # GCS client
jinja2  # Templating
requests  # HTTP client
requests-toolbelt  # HTTP utilities
webapp2  # WSGI framework
webapp2_extras.sessions  # Session handling
```

### TypeScript (Target) - Need to verify compatibility
```text
next@14  # Framework
@prisma/client  # ORM
@google-cloud/storage  # GCS client
@sendgrid/mail  # Email
sharp  # Image processing
next-auth  # Auth
react-hook-form  # Forms
zod  # Validation
@cucumber/cucumber  # BDD testing
@playwright/test  # E2E testing (optional)
```

---

## Missing from Current Setup

### Critical Decisions (BLOCKING Build Phase)

See `docs/decisions/MIGRATION_DECISIONS.md` for full details.

```text
[ ] DB Key Strategy        (docs/decisions/MIGRATION_DECISIONS.md #1)
[ ] Upload Strategy        (docs/decisions/MIGRATION_DECISIONS.md #3)
[ ] Session Strategy       (docs/decisions/MIGRATION_DECISIONS.md #5)
[ ] Jobs Extraction        (specs/extracted/jobs.json)
[ ] Images Extraction      (specs/extracted/images.json)
```

### Need to Add

1. ✅ **Critical Decisions Doc** - DONE (`docs/decisions/MIGRATION_DECISIONS.md`)
   - 10 critical decisions based on web research
   - Must be reviewed before build phase

2. ⚠️ **Prisma Schema** (`specs/database/schema.prisma`)
   - Map NDB models to PostgreSQL
   - Define self-referencing relations for entity groups
   - **BLOCKED**: Waiting for DB key strategy decision

3. ⏳ **Next.js App Structure** (`app/` directory)
   - Not created yet (waiting for build phase)
   - Will be created by PROMPT_build.md

4. ⏳ **TypeScript Step Definitions** (`test/typescript/steps/`)
   - Skeleton files needed
   - Mirror Python steps

5. ⏳ **Environment Configuration**
   - `.env.local` template
   - GCS credentials
   - SendGrid API key
   - Database connection string

---

## Verification Commands

### Check Python Dependencies
```bash
# List all imports
grep -rh "^import\|^from" --include="*.py" . | sort -u

# Check specific modules
grep -r "ndb.Model" db/
grep -r "webapp2.Route" .
grep -r "jinja2" .
grep -r "sendgrid" .
```

### Verify Node.js 20 Compatibility
```bash
# Check target packages support Node.js 20
bun pm ls | grep -E "next|prisma|sendgrid|sharp"
```

---

## Next Actions

1. ✅ Create `requirements-bdd.txt` - DONE
2. ✅ Create `test/python/features/environment.py` - DONE
3. ⏳ Create `specs/database/schema.prisma` - TODO
4. ⏳ Create `.env.local.example` - TODO
5. ⏳ Set up Next.js app directory - TODO (Build phase)
6. ⏳ Create TypeScript step skeletons - TODO
7. ⏳ Verify SendGrid template IDs - TODO
8. ⏳ Map all Jinja2 templates to React components - TODO
