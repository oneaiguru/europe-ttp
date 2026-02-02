import subprocess
import json
from pathlib import Path

SOURCE_REPO = "/Users/m/git/clients/aol/europe-ttp"

def sh(cmd):
    try:
        return subprocess.check_output(cmd, shell=True, text=True, stderr=subprocess.STDOUT)
    except subprocess.CalledProcessError as e:
        return f"ERROR: {e.output}"

# Files to NEVER include
SECRET_FILES = {
    'artofliving-ttcdesk-dev-b3dbc09298ee.json',
    'ttc_portal_sendgrid_key.txt',
}

# Clean constants.py - remove secrets
def clean_constants(content):
    lines = []
    for line in content.split('\n'):
        if 'SENDGRID' in line.upper() or 'SG_' in line:
            if '=' in line:
                var = line.split('=')[0].strip()
                lines.append(f"{var} = 'SENDGRID_KEY_PLACEHOLDER'  # REDACTED")
            else:
                lines.append('# REDACTED')
        else:
            lines.append(line)
    return '\n'.join(lines)

groups = json.loads(Path("/tmp/legacy_groups.json").read_text())

# Create README
Path("README.md").write_text("# Europe TTP\n\nLegacy migration repository.\n\n### PR Bundles\n")
sh("git add README.md")
sh("git commit -m 'init: initialize repository'")
result = sh("git push github main -u --force")
print(f"Main push: {'✓' if 'error:' not in result.lower() else '✗ Blocked'}")

# Create PR for each group
for group_name, files in groups.items():
    print(f"\n--- {group_name} ({len(files)} files) ---")
    
    # Create branch
    sh(f"git checkout -b {group_name}")
    
    # Copy files from source repo
    copied = 0
    for f in files:
        if any(s in f for s in SECRET_FILES):
            continue
            
        src_path = Path(SOURCE_REPO) / f
        if not src_path.exists():
            continue
            
        try:
            content = src_path.read_text()
            
            # Clean constants.py
            if f == 'constants.py':
                content = clean_constants(content)
            
            # Write file
            p = Path(f)
            p.parent.mkdir(parents=True, exist_ok=True)
            p.write_text(content)
            copied += 1
        except:
            pass
    
    if copied == 0:
        print(f"  ✗ No files copied")
        continue
    
    # Commit
    sh("git add -A")
    msg = f"feat({group_name}): add {group_name} legacy code\n\nCopied {copied} files from source."
    sh(f'git commit -m "{msg}"')
    
    # Push
    result = sh(f"git push github {group_name} --force")
    if "error:" in result.lower():
        print(f"  ✗ Push blocked")
    else:
        print(f"  ✓ Pushed {copied} files")
    
    # Back to main
    sh("git checkout main")

print("\n✅ Done creating branches!")
