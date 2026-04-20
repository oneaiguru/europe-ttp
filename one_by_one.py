import subprocess
from pathlib import Path

SOURCE_REPO = "/Users/m/git/clients/aol/europe-ttp"

def sh(cmd):
    try:
        return subprocess.check_output(cmd, shell=True, text=True, stderr=subprocess.STDOUT)
    except subprocess.CalledProcessError as e:
        return f"ERROR: {str(e)}"

# Get all files
all_files = []
for f in Path(SOURCE_REPO).rglob('*'):
    if f.is_file():
        rel = str(f.relative_to(SOURCE_REPO))
        if not rel.startswith('.git') and 'node_modules' not in rel:
            all_files.append(rel)

all_files = sorted(all_files)
print(f"Total files: {len(all_files)}")

# Get files already on GitHub
github_files = set()
branches_output = sh("git branch -r")
for line in branches_output.split('\n'):
    if 'github/' in line and 'HEAD' not in line:
        branch = line.strip().split('/')[-1]
        try:
            files = sh(f"git ls-tree -r --name-only github/{branch}").split('\n')
            github_files.update(files)
        except:
            pass

missing = [f for f in all_files if f not in github_files]
print(f"Missing: {len(missing)}")

# Push by extension to isolate issues
by_ext = {}
for f in missing:
    if '.' in f:
        ext = f.rsplit('.', 1)[-1]
    else:
        ext = 'no-ext'
    
    # Skip high-risk files
    if any(x in f.lower() for x in ['key', 'secret', 'credential', 'service-account', 'sendgrid']):
        continue
    
    if ext not in by_ext:
        by_ext[ext] = []
    by_ext[ext].append(f)

# Try each extension group
for ext, files in sorted(by_ext.items()):
    if not files or len(files) > 200:
        continue
    
    branch = f"pr-{ext}-files"
    print(f"\n--- {ext}: {len(files)} files ---")
    
    sh("git checkout master")
    sh(f"git branch -D {branch} 2>/dev/null || true")
    sh(f"git checkout -b {branch}")
    
    for f in files[:50]:  # Max 50 per batch
        src_path = Path(SOURCE_REPO) / f
        try:
            content = src_path.read_text()
            p = Path(f)
            p.parent.mkdir(parents=True, exist_ok=True)
            p.write_text(content)
        except:
            pass
    
    sh("git add -A")
    sh(f'git commit -m "feat({ext}): add {ext} files"')
    
    result = sh(f"git push github {branch} --force")
    if "error:" in result.lower():
        print(f"  ✗ Blocked")
        sh("git checkout master")
        sh(f"git branch -D {branch}")
    else:
        print(f"  ✓ Pushed")
        # Create PR
        title = f"{ext} files"
        cmd = f'gh pr create -R oneaiguru/europe-ttp -B main -H {branch} -d -t "{title}" -b "{len(files[:50])} files"'
        pr_result = sh(cmd)
        if "http" in pr_result:
            print(f"  ✓ {pr_result.strip()}")

print("\n✅ Done!")
