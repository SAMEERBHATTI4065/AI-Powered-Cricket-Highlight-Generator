# 🏏 Docker & Deployment Guide

This guide provides the exact commands and step-by-step procedures to build your Docker images, push them to Docker Hub, and deploy code changes from VS Code directly to Hugging Face.

---

## 🐳 1. Docker Build & Docker Hub Workflow

There are two ways the Docker setup is used in this repository:
1. **Multi-Container Setup (Local Development / Scaling)**: Uses Docker Compose with split containers for backend and worker.
2. **Unified Single-Container Setup (Production / Hugging Face)**: Uses the root `Dockerfile` to package the entire app (React build, Django, Celery, Redis) into one container.

### A. Rebuilding Docker Images Locally

To ensure your local Docker images are up-to-date with your latest code changes:

#### Option 1: Rebuilding Multi-Container Services (Backend + Worker)
Run this command from the `docker` directory:
```bash
cd docker
docker compose build
```
This updates the local images:
* `cricket-backend:latest`
* `cricket-worker:latest`

#### Option 2: Rebuilding the Unified Image (Single Container)
Run this command from the **root** of the project directory:
```bash
docker build -t cricket-unified:latest .
```
This compiles the React frontend, packages it with Django/Redis/Celery, and builds a single image:
* `cricket-unified:latest`

---

### B. Pushing Images to Docker Hub

To push your built images to Docker Hub so you or others can pull them elsewhere, follow these steps:

#### Step 1: Log in to Docker Hub
Open your terminal and run:
```bash
docker login
```
*Enter your Docker Hub username (`sameer365`) and password (or Access Token).*

#### Step 2: Tag Your Images
Docker Hub requires images to be tagged with your Docker Hub username/namespace.

**For Multi-Container Images:**
```bash
# Tag the backend image
docker tag cricket-backend:latest sameer365/cricket-backend:latest

# Tag the worker image
docker tag cricket-worker:latest sameer365/cricket-worker:latest
```

**For the Unified Single-Container Image:**
```bash
# Tag the unified image
docker tag cricket-unified:latest sameer365/cricket-unified:latest
```

#### Step 3: Push to Docker Hub
Run the push commands:

**For Multi-Container Images:**
```bash
docker push sameer365/cricket-backend:latest
docker push sameer365/cricket-worker:latest
```

**For the Unified Single-Container Image:**
```bash
docker push sameer365/cricket-unified:latest
```

---

## 🤗 2. Deploying Changes to Hugging Face Spaces

Your Hugging Face Space is configured as a Git remote named `hf` pointing to:
`https://huggingface.co/spaces/Sameer4065/cricket-gen`

Since your Hugging Face Space uses `sdk: docker`, any code pushed to the `main` branch of that space automatically triggers Hugging Face to build the root `Dockerfile` and deploy the application.

Here is how you push code changes from VS Code:

### Option A: Directly Deploy Your Active Branch (Recommended)
If you are working on a feature branch (like `feature/gemini-integration`) and want to push and deploy it immediately to Hugging Face's `main` branch:

```bash
# 1. Stage your changes
git add .

# 2. Commit your changes
git commit -m "feat: updated code for cricket highlight generator"

# 3. Push and deploy to Hugging Face
git push hf feature/gemini-integration:main
```

> [!NOTE]
> The syntax `git push <remote> <local_branch>:<remote_branch>` pushes your current local branch to the remote's target branch. Hugging Face only builds/deploys the `main` branch, so we push to `:main`.

---

### Option B: Merge into Local `main` and Deploy
If you prefer to keep your local `main` branch synced before deploying:

```bash
# 1. Commit changes on your feature branch
git add .
git commit -m "feat: completed feature updates"

# 2. Switch to main and pull latest remote updates
git checkout main
git pull hf main

# 3. Merge feature branch into main
git merge feature/gemini-integration

# 4. Push and deploy to Hugging Face
git push hf main

# 5. Switch back to your feature branch to continue working
git checkout feature/gemini-integration
```

---

### ⚠️ Troubleshooting Hugging Face Pushes

If you receive errors during the push (e.g., non-fast-forward updates or rejected commits):

1. **Force Push (Use with caution)**:
   If your local codebase is the correct, definitive version and you want to overwrite whatever is on Hugging Face:
   ```bash
   git push hf feature/gemini-integration:main --force
   ```
2. **Git Credentials**:
   If Git asks for username/password for Hugging Face:
   * **Username**: Your Hugging Face username (e.g., `Sameer4065`).
   * **Password**: Use your Hugging Face **Access Token** with **Write** permissions (generate one at [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)).

---

## ⚙️ 3. Configuring Secrets and Google Auth on Hugging Face

Since `.env` is gitignored and NOT pushed to Hugging Face, you must configure all secrets and settings directly on Hugging Face and Google Cloud Console.

### A. Add Environment Secrets in Hugging Face Space Settings
1. Go to your Hugging Face Space: `https://huggingface.co/spaces/Sameer4065/cricket-gen`
2. Click on **Settings** (top right tab).
3. Scroll down to **Variables and secrets**.
4. Click **New secret** to add the following keys and values from your local `.env`:
   * `OPENAI_API_KEY` = `sk-proj-...`
   * `EMAIL_HOST` = `smtp.gmail.com`
   * `EMAIL_PORT` = `587`
   * `EMAIL_HOST_USER` = `bhattigofficial777888@gmail.com`
   * `EMAIL_HOST_PASSWORD` = `pupk vkzn zihp imlz`
   * `GOOGLE_CREDENTIALS_JSON` = *(Copy the **entire raw text** of your Google credentials JSON file `broken-463023-9245abcbef13.json`)*
     > [!TIP]
     > The backend startup script `start.sh` is configured to read `GOOGLE_CREDENTIALS_JSON` and automatically create the required file on the server at `/app/google-credentials.json` so Google Cloud Vision OCR works perfectly!

5. Restart your Space (click **Factory Restart** or **Restart** under Settings) so Hugging Face re-builds the space with these secrets.

### B. Configure Google OAuth (Google Sign-In) Client ID
Google Sign-in will block authentication from Hugging Face unless the Hugging Face domain is registered as an authorized origin.
1. Go to the [Google Cloud Console Credentials Page](https://console.cloud.google.com/apis/credentials).
2. Click on your OAuth 2.0 Client ID (e.g., the one corresponding to client ID `440023432666-3dsf0j0urad0efl20935t7bhriaam53n.apps.googleusercontent.com`).
3. Under **Authorized JavaScript origins**, click **ADD URI** and add your Hugging Face Space domain:
   * `https://sameer4065-cricket-gen.hf.space`
4. Click **Save**. Note: Google may take a few minutes to propagate these changes.
