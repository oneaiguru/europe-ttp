import subprocess
import json
from pathlib import Path
from collections import defaultdict

SOURCE_REPO = "/Users/m/git/clients/aol/europe-ttp"

def sh(cmd):
    try:
        return subprocess.check_output(cmd, shell=True, text=True, stderr=subprocess.STDOUT)
    except subprocess.CalledProcessError as e:
        return f"ERROR: {e.output}"

# Secret files to skip
SECRET_FILES = {
    'artofliving-ttcdesk-dev-b3dbc09298ee.json',
    'ttc_portal_sendgrid_key.txt',
    '.claude-trace/',
    'node_modules/',
    'bun.lock',
    'backup/',
}

def clean_content(path, content):
    """Clean secrets from content"""
    if path.endswith('constants.py'):
        lines = []
        for line in content.split('\n'):
            # Redact any line with SENDGRID, SG_, or API key patterns
            if any(x in line.upper() for x in ['SENDGRID', 'SG_', 'PASSWORD', 'SECRET']):
                if '=' in line and not line.strip().startswith('#'):
                    var = line.split('=')[0].strip()
                    lines.append(f"{var} = 'REDACTED'  # Secret redacted for GitHub")
                else:
                    lines.append(f"# {line}  # Redacted")
            else:
                lines.append(line)
        return '\n'.join(lines)
    return content

# Get all files from source
all_files = []
for f in Path(SOURCE_REPO).rglob('*'):
    if f.is_file():
        rel = str(f.relative_to(SOURCE_REPO))
        # Skip secret patterns
        if any(s in rel for s in SECRET_FILES):
            continue
        # Skip git
        if rel.startswith('.git'):
            continue
        all_files.append(rel)

print(f"Total files to process: {len(all_files)}")

# Already pushed groups
already_pushed = {
    'legacy-admin-reporting', 'legacy-api-db', 'legacy-portal', 
    'legacy-forms', 'legacy-uploads-storage'
}

# Create broader groups for remaining files
groups = {
    "test-bdd": [],
    "docs": [],
    "experimental": [],
    "styles": [],
    "templates": [],
    "misc-python": [],
}

# Group files
for f in all_files:
    if any(f.startswith(g.replace('legacy-', '')) or f.startswith(g) for g in [
        'admin', 'api/', 'db/', 'ttc_portal', 'tabs', 'form', 'storage/', 'uploads/'
    ]):
        continue  # Already pushed
    
    if f.startswith('test/'):
        groups['test-bdd'].append(f)
    elif f.startswith('docs/'):
        groups['docs'].append(f)
    elif f.startswith('experimental/'):
        groups['experimental'].append(f)
    elif f.startswith('styles/'):
        groups['styles'].append(f)
    elif f.endswith('.py') and 'test' not in f:
        groups['misc-python'].append(f)
    elif f.endswith('.html') or f.endswith('.htm'):
        groups['templates'].append(f)

# Push remaining groups
for group_name, files in groups.items():
    if not files:
        continue
    
    print(f"\n--- {group_name}: {len(files)} files ---")
    
    sh("git checkout master")
    branch = f"pr-{group_name}"
    sh(f"git checkout -b {branch}")
    
    copied = 0
    for f in files:
        src_path = Path(SOURCE_REPO) / f
        if not src_path.exists():
            continue
        
        try:
            content = src_path.read_text()
            content = clean_content(f, content)
            
            p = Path(f)
            p.parent.mkdir(parents=True, exist_ok=True)
            p.write_text(content)
            copied += 1
        except:
            pass
    
    if copied == 0:
        continue
    
    sh("git add -A")
    sh(f'git commit -m "feat({group_name}): add {group_name} files ({copied} files)"')
    
    result = sh(f"git push github {branch} --force")
    if "error:" in result.lower():
        print(f"  ✗ Blocked")
    else:
        print(f"  ✓ Pushed {copied} files")
        
        # Create PR
        title = f"{group_name}: files"
        body = f"## {group_name}\n\n{copied} files from source."
        cmd = f'gh pr create -R oneaiguru/europe-ttp -B main -H {branch} -d -t "{title}" -b "{body}"'
        pr_result = sh(cmd)
        if "ERROR:" not in pr_result:
            print(f"  ✓ PR: {pr_result.strip()}")

print("\n✅ Remaining files pushed!")
