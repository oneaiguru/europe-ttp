import subprocess
from pathlib import Path

SOURCE_REPO = "/Users/m/git/clients/aol/europe-ttp"

def sh(cmd):
    try:
        return subprocess.check_output(cmd, shell=True, text=True, stderr=subprocess.STDOUT)
    except subprocess.CalledProcessError as e:
        return f"ERROR: {e.output}"

# Get all files from source
all_files = set()
for f in Path(SOURCE_REPO).rglob('*'):
    if f.is_file():
        rel = str(f.relative_to(SOURCE_REPO))
        if not rel.startswith('.git') and 'node_modules' not in rel:
            all_files.add(rel)

print(f"Source files: {len(all_files)}")

# Get files already on GitHub (from all branches)
branches_output = sh("git branch -r")
github_files = set()
for line in branches_output.split('\n'):
    if 'github/' in line and 'HEAD' not in line:
        branch = line.strip().split('/')[-1]
        if branch in ['main', 'master']:
            continue
        # Get files from this branch
        try:
            files = sh(f"git ls-tree -r --name-only github/{branch}").split('\n')
            github_files.update(files)
        except:
            pass

print(f"Files on GitHub: {len(github_files)}")

# Files still missing
missing = all_files - github_files
print(f"Missing files: {len(missing)}")

# Group remaining files
groups = {
    "yaml-config": [],
    "json-schema": [],
    "root-files": [],
    "misc": [],
}

for f in missing:
    if f.endswith('.yaml') or f.endswith('.yml'):
        groups['yaml-config'].append(f)
    elif f.endswith('.json'):
        groups['json-schema'].append(f)
    elif '/' not in f:
        groups['root-files'].append(f)
    else:
        groups['misc'].append(f)

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
            # Try to read as text
            content = src_path.read_text()
            
            # Skip obvious secrets
            if any(x in f.lower() for x in ['key', 'secret', 'password', 'credential']):
                if '.json' in f:
                    continue  # Skip JSON files with keys in name
            
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
        
        cmd = f'gh pr create -R oneaiguru/europe-ttp -B main -H {branch} -d -t "{group_name}" -b "{copied} files"'
        pr_result = sh(cmd)
        if "ERROR:" not in pr_result:
            print(f"  ✓ PR created")

print("\n✅ Final groups pushed!")
