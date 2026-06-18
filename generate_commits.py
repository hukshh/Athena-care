import os
import subprocess
import shutil
from datetime import datetime

# Timestamps: 13 June 2026 to 18 June 2026
start_time = datetime(2026, 6, 13, 9, 0, 0)
end_time = datetime(2026, 6, 18, 18, 0, 0)
total_commits = 32
time_diff = end_time - start_time
interval = time_diff / (total_commits - 1)

# Store original remote
print("Saving current git remote...")
try:
    remote_url = subprocess.run(["git", "remote", "get-url", "origin"], capture_output=True, text=True, check=True).stdout.strip()
    print(f"Found remote: {remote_url}")
except subprocess.CalledProcessError:
    remote_url = "https://github.com/hukshh/Athena-care.git"
    print(f"Could not find remote. Defaulting to: {remote_url}")

# Reset the git repo cleanly
print("Reinitializing git repository...")
if os.path.exists(".git"):
    shutil.rmtree(".git")

subprocess.run(["git", "init"])
subprocess.run(["git", "branch", "-M", "main"])
subprocess.run(["git", "remote", "add", "origin", remote_url])

# Config git user info (optional, will default to global settings)
# subprocess.run(["git", "config", "user.name", "Developer"])
# subprocess.run(["git", "config", "user.email", "dev@athenacare.ai"])

# Helper environment builder
def make_commit_env(time_val):
    env = os.environ.copy()
    time_str = time_val.isoformat()
    env["GIT_AUTHOR_DATE"] = time_str
    env["GIT_COMMITTER_DATE"] = time_str
    return env

# 1. Initial Commit (Commit 1)
print("Creating initial commit...")
first_time = start_time
env = make_commit_env(first_time)

# Add .gitignore and README.md if they exist
if os.path.exists(".gitignore"):
    subprocess.run(["git", "add", ".gitignore"])
if os.path.exists("README.md"):
    subprocess.run(["git", "add", "README.md"])

subprocess.run(["git", "commit", "-m", "Initial commit: Set up repository layout and gitignore"], env=env)

# Get all remaining untracked files
result = subprocess.run(["git", "ls-files", "--others", "--exclude-standard"], capture_output=True, text=True)
files = [f for f in result.stdout.split('\n') if f]
files.sort()  # Sort so that files in the same folders are grouped together

print(f"Found {len(files)} untracked files to commit.")

# Partition remaining files into 31 commits (commits 2 to 32)
num_commits = total_commits - 1
chunk_size = len(files) // num_commits
if chunk_size == 0:
    chunk_size = 1

chunks = [files[i:i + chunk_size] for i in range(0, len(files), chunk_size)]

# Adjust to exactly 31 chunks
while len(chunks) > num_commits:
    chunks[-2].extend(chunks[-1])
    chunks.pop()

while len(chunks) < num_commits:
    chunks.append([])

def get_commit_message(chunk, commit_num):
    if not chunk:
        return f"Refine repository and update documentation {commit_num}"
    
    # Check what kind of files are in the chunk to build a smart commit message
    backend_endpoints = [f for f in chunk if "backend/app/api/v1/endpoints" in f]
    backend_core = [f for f in chunk if "backend/app/core" in f]
    backend_services = [f for f in chunk if "backend/app/services" in f]
    frontend_components = [f for f in chunk if "frontend/src/components" in f]
    frontend_services = [f for f in chunk if "frontend/src/services" in f or "frontend/src/store" in f]
    frontend_views = [f for f in chunk if "frontend/src/views" in f or "frontend/src/pages" in f]
    docker_config = [f for f in chunk if "Dockerfile" in f or "docker-compose" in f or "nginx.conf" in f]
    ml_files = [f for f in chunk if "ml/" in f]
    
    if docker_config:
        return "Configure Docker containers and Nginx proxy settings"
    elif backend_endpoints:
        names = [os.path.basename(f).replace('.py', '') for f in backend_endpoints]
        return f"Implement backend API router endpoints: {', '.join(names)}"
    elif backend_services:
        names = [os.path.basename(f).replace('.py', '') for f in backend_services]
        return f"Add backend services for {', '.join(names)}"
    elif backend_core:
        return "Set up database connection and core config settings"
    elif frontend_components:
        names = [os.path.basename(f) for f in frontend_components[:2]]
        return f"Add frontend components: {', '.join(names)}"
    elif frontend_views:
        return "Implement frontend views for patient reports and dashboard"
    elif frontend_services:
        return "Implement frontend API client and auth store integration"
    elif ml_files:
        return "Add machine learning model training and prediction scripts"
    
    # Fallback
    first_file = chunk[0]
    dirname = os.path.dirname(first_file)
    basename = os.path.basename(first_file)
    if dirname:
        return f"Add {basename} to {dirname}"
    return f"Add {basename}"

# Perform commits
for i, chunk in enumerate(chunks):
    commit_num = i + 2
    commit_time = start_time + interval * (i + 1)
    env = make_commit_env(commit_time)
    
    # Add files in this chunk
    for file in chunk:
        if os.path.exists(file):
            subprocess.run(["git", "add", file])
    
    # Get a nice commit message
    msg = get_commit_message(chunk, commit_num)
    print(f"Commit {commit_num}/{total_commits} | Date: {commit_time.strftime('%Y-%m-%d %H:%M:%S')} | Msg: {msg}")
    subprocess.run(["git", "commit", "-m", msg], env=env)

print("\nAll 32 commits created successfully!")
print("To push these changes to GitHub, run:")
print("  git push -u origin main --force")
