# TASK-020: TTC Portal Settings - Research

## Research Findings

### Legacy Python Implementation
**Status**: NOT FOUND in legacy codebase

The TTC Portal Settings form is not present in the legacy Python 2.7 App Engine codebase. This is likely a future feature that was planned but never implemented, or it's part of the admin functionality that should be migrated as part of the new system.

**Search Results**:
- No `ttc_portal_settings` file found in legacy codebase
- No `portal_settings` route found in legacy routing
- Admin settings exist in `admin.py` but are for general admin, not TTC-specific portal settings

### Legacy Code Locations (Similar Features)
1. **Admin Settings**: `admin.py` (lines 1-500+)
   - Contains general admin settings functionality
   - May contain relevant patterns for settings management

2. **TTC Portal User**: `ttc_portal_user.py` (lines 1-500+)
   - Contains TTC portal user management
   - May contain relevant patterns for portal configuration

### TypeScript Context
**Status**: STUB IMPLEMENTATION EXISTS

The TypeScript step definitions exist in `test/typescript/steps/forms_steps.ts` but point to line 1 (placeholder), not actual implementations:

```typescript
// Line 1 is just the file header
Given('I am authenticated as a TTC admin', function () {
  // NOT IMPLEMENTED - placeholder at line 1
});

When('I open the TTC portal settings form', async function () {
  // NOT IMPLEMENTED - placeholder at line 1
});

Then('I should see the TTC portal settings questions', function () {
  // NOT IMPLEMENTED - placeholder at line 1
});
```

**Existing TypeScript Implementation Pattern**:
Looking at similar forms like `ttc_application_us`, the pattern is:
1. Import the render function from `app/forms/[form_name]/render`
2. Call the render function to get HTML
3. Store HTML in `world.responseHtml`
4. Assert on expected content

### Step Registry Status
- ✅ Registry entries exist for all 3 steps
- ❌ Python path points to line 1 (NOT IMPLEMENTED)
- ❌ TypeScript path points to line 1 (NOT IMPLEMENTED)
- ✅ Feature mapping exists

### Implementation Notes

**Feature Purpose**:
This feature allows TTC administrators to configure portal-wide settings. Since this doesn't exist in the legacy system, this is a NEW feature for the migrated system, not a migration of existing functionality.

**Required Implementation**:
1. **Python Step Definitions**: Create new step definitions in `test/python/steps/forms_steps.py`
2. **TypeScript Step Definitions**: Create new step definitions in `test/typescript/steps/forms_steps.ts`
3. **TypeScript Implementation**: Create form renderer in `app/forms/ttc_portal_settings/render.tsx`

**Authentication Context**:
The step requires TTC admin authentication. This differs from regular admin authentication and may need specific role checking.

**Form Content**:
Since this is a new feature, the form content should include:
- Portal-wide configuration options
- TTC-specific settings (deadlines, whitelist options)
- Form availability settings

## Code Locations

### Files to Create
1. `app/forms/ttc_portal_settings/render.tsx` - Form renderer (NEW)
2. `app/forms/ttc_portal_settings/page.tsx` - Next.js page (NEW)

### Files to Modify
1. `test/python/steps/forms_steps.py` - Add step definitions (NEW FUNCTIONS)
2. `test/typescript/steps/forms_steps.ts` - Add step definitions (NEW FUNCTIONS)
3. `test/bdd/step-registry.ts` - Update paths (LINE NUMBERS)

### Similar Implementations to Reference
1. `test/python/steps/forms_steps.py:29-42` - TTC applicant pattern
2. `test/typescript/steps/forms_steps.ts:17-43` - DSN application pattern
3. `app/forms/dsn_application/` - Directory structure pattern

## Next Steps
Proceed to Planning phase to outline the implementation strategy.
