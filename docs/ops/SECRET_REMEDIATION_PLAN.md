# Secret Remediation And Recovery Plan

**Purpose**
This document explains why credentials were historically committed in this codebase, how we will remediate them during migration, and how we will safely recover local secret files for testing before committing back to the original repo. It also defines the product requirements for a script that restores hidden secrets to their original file locations for local use without reintroducing them into git.

**Background And Policy Context**
The legacy Python App Engine codebase was developed under an older operational policy where certain credentials were committed directly to the repository to simplify deployment. That practice was common at the time but conflicts with current security standards. As part of the migration, we will remove committed secrets, rotate affected credentials, and introduce a secure local rehydration workflow so developers can still run the system without committing secrets.

**Current State**
The repository contains committed credentials in multiple locations. These are being treated as legacy artifacts from the original policy and will be removed or replaced with placeholders. The key files involved are listed in the scope table below.

**Scope**

| Secret Location | Secret Type | Intended Replacement |
| --- | --- | --- |
| `constants.py` | SendGrid API key and Harmony search API key | Environment variables with runtime validation |
| `ttc_portal_sendgrid_key.txt` | SendGrid API key | File removed from git, restored locally from secure source |
| `artofliving-ttcdesk-dev-b3dbc09298ee.json` | GCP service account private key | File removed from git, restored locally from secure source |

**Remediation Plan**
1. Contain exposure.
2. Rotate all affected credentials immediately and invalidate previous values.
3. Remove committed secrets from the working tree and replace with placeholders or environment lookups.
4. Add `.gitignore` rules for local-only secret files.
5. Introduce a local rehydration script to restore secrets to their original file paths on developer machines and CI where needed.
6. Add pre-commit and CI checks to block any reintroduction of secrets.
7. For upstream history, decide whether to rewrite history or accept history risk and document it.
8. Communicate the change and migration timeline to all users of the repo.

**Recovery Plan Before Upstream Commit**
We are currently working from a fresh zip snapshot rather than a fork. Before committing back to the original repository, we will enforce the following:
1. Ensure the working tree contains no real secrets and only placeholders or environment-based configuration.
2. Use the rehydration script to create local secrets only when running tests or dev workflows.
3. Use the script in scrub mode before any commit, ensuring the original committed locations are reset to placeholders and files are removed.
4. Verify with a secrets scan and a `git status` check before commit.
5. Only then rebase or apply changes onto the original repo.

**Rehydration Script PRD**

**Goal**
Provide a safe, repeatable mechanism to restore secret values to their original file locations for local use, while keeping secrets out of git.

**Primary Users**
Developers and CI jobs that need to run tests or migration tooling in a local environment.

**Non-Goals**
The script does not manage secret rotation, does not store secrets, and does not upload secrets to any external service.

**Functional Requirements**
1. Restore secrets into original file locations based on a mapping file.
2. Support multiple secret sources, including environment variables and local secret vault files.
3. Support a dry-run mode that reports what would change.
4. Support a scrub mode that removes secrets and restores placeholders.
5. Validate that required secrets exist and fail with a clear error if missing.
6. Record a local audit log of restored paths and timestamps without recording secret values.
7. Never write secrets to stdout or logs.

**Security Requirements**
1. The mapping file must not contain secret values, only references to sources.
2. The script must refuse to run if the working tree is staged for commit or if a pre-commit hook is running in enforce mode, unless `--force` is provided.
3. The script must set restrictive file permissions on restored secret files.

**Interface And Usage**
Command name: `scripts/secrets/rehydrate.ts` or equivalent.

Example usage:
```bash
bun scripts/secrets/rehydrate.ts --mode=restore --config=.secrets/secret-map.json
bun scripts/secrets/rehydrate.ts --mode=scrub --config=.secrets/secret-map.json
bun scripts/secrets/rehydrate.ts --mode=verify --config=.secrets/secret-map.json
```

**Configuration Format**
Example mapping file:
```json
{
  "secrets": [
    {
      "name": "sendgrid_api_key",
      "source": "ENV:SENDGRID_API_KEY",
      "target": "ttc_portal_sendgrid_key.txt",
      "template": null
    },
    {
      "name": "gcp_service_account",
      "source": "FILE:.secrets/gcp-service-account.json",
      "target": "artofliving-ttcdesk-dev-b3dbc09298ee.json",
      "template": null
    },
    {
      "name": "sendgrid_api_key_inline",
      "source": "ENV:SENDGRID_API_KEY",
      "target": "constants.py",
      "template": "SENDGRID_API_KEY = '{{SECRET}}'"
    }
  ]
}
```

**Behavior Details**
1. Restore mode writes secrets to each target path.
2. Scrub mode removes file targets and replaces inline placeholders where templates are defined.
3. Verify mode checks for placeholders or missing files and returns non-zero if secrets are missing.

**Acceptance Criteria**
1. Running restore populates all target paths with valid secrets without git staging any changes.
2. Running scrub removes secrets and returns files to placeholder state.
3. Running verify fails if any required secret is missing.
4. A developer can run the repo tests end-to-end after restore and then commit cleanly after scrub.

**Evidence And Policy Note**
The committed secrets listed in the scope table are legacy artifacts from the original code policy and are being remediated as part of the migration. This remediation should be completed before upstreaming changes to the original repository.

