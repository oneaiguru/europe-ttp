# TASK-027: User Get Form Instances

## Task ID
TASK-027

## Feature File
`specs/features/user/get_form_instances.feature`

## Scenario
"List form instances"

## Steps Requiring Implementation
1. `Given I have multiple form instances for a form type`
2. `When I request the list of form instances`
3. `Then I should receive the available form instances`

## Current Status
- Python: Steps undefined (raise NotImplementedError)
- TypeScript: Steps undefined (pending)

## Acceptance Criteria
- Scenario passes in Python BDD tests
- Scenario passes in TypeScript BDD tests
- Step registry updated with proper mappings
- No orphan steps or dead steps in alignment check

## Related Documentation
- `IMPLEMENTATION_PLAN.md` - Phase 1, TASK-027
- `specs/extracted/routes.json` - API route: `/user/form-instances`
- Legacy code: Search for `form_instances` or similar in legacy Python
