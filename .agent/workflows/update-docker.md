---
description: How to update Docker services after changing code
---

# Workflow: Updating Docker After Code Changes

Follow these steps whenever you modify the backend or engine code to ensure the changes are reflected in your running environment.

---

### Step 1: Navigate to the Docker Directory
// turbo
Open your terminal and move into the `docker` folder within your project.

### Step 2: Stop and Refresh Services
// turbo
Run the following command to rebuild the necessary containers. This will incorporate your latest code changes.

**To update EVERYTHING (Recommended):**
```powershell
docker compose up -d --build
```

---

### Why use `--build`?
Docker caches images to save time. Using the `--build` flag forces Docker to look at your files again and include any edits you've made to the `.py`, `.ts`, or `.css` files.

### Verification
Once the command finishes, ensure all containers are "Healthy" in Docker Desktop or by running:
```powershell
docker compose ps
```
