<div align="center">

# 🏏 AI-Powered Cricket Highlight Generator

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/Django-4.2-092E20?style=for-the-badge&logo=django&logoColor=white" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white" />
  <img src="https://img.shields.io/badge/Celery-Async_Worker-37814A?style=for-the-badge&logo=celery&logoColor=white" />
  <img src="https://img.shields.io/badge/OpenAI-GPT_Vision-412991?style=for-the-badge&logo=openai&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-15-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/Redis-7-DC382D?style=for-the-badge&logo=redis&logoColor=white" />
</p>

<p align="center">
  <strong>An end-to-end AI system that automatically detects and extracts exciting moments from raw cricket match footage using computer vision, OCR, and large language models.</strong>
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-getting-started">Getting Started</a> •
  <a href="#-usage">Usage</a> •
  <a href="#-project-structure">Project Structure</a> •
  <a href="#-api-reference">API Reference</a>
</p>

---

</div>

## 📌 Overview

The **AI-Powered Cricket Highlight Generator** is a full-stack web application that transforms long cricket match videos into concise highlight reels — **automatically, intelligently, and without manual editing.**

The system uses a multi-stage AI pipeline:
1. **Frame Extraction** — Samples video frames at intervals
2. **OCR Scoreboard Reading** — Reads live score using Google Cloud Vision API
3. **Event Detection** — Identifies key moments (wickets, sixes, fours, etc.)
4. **AI Summarization** — Uses OpenAI GPT to generate natural language summaries
5. **Clip Extraction** — Cuts and exports highlight clips as `.mp4` files
6. **Web Delivery** — Serves highlights through a beautiful React frontend

---

## ✨ Features

| Feature | Description |
|---|---|
| 🎬 **Auto Highlight Detection** | Detects wickets, boundaries, and milestones automatically |
| 🔍 **OCR Scoreboard Reading** | Reads live scores from the scoreboard using Google Cloud Vision |
| 🤖 **AI Commentary** | GPT-4 Vision generates natural language summaries for each highlight |
| 📹 **Clip Extraction** | Precise clip cutting using FFmpeg with configurable buffers |
| ⚡ **Async Processing** | Celery + Redis queue for non-blocking background jobs |
| 🌍 **Multi-format Support** | Handles MP4, AVI, MOV, MKV, and more |
| 📊 **Dashboard** | Real-time job progress tracking in the React UI |
| 🐳 **Fully Dockerized** | One-command setup with Docker Compose |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER BROWSER                             │
│                    React + Vite Frontend                        │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP / REST API
┌────────────────────────────▼────────────────────────────────────┐
│                   Django REST Framework (Port 8000)             │
│              Upload API │ Job Status API │ Highlights API       │
└──────────┬─────────────────────────────────────┬───────────────┘
           │ Celery Task Queue                    │ PostgreSQL DB
┌──────────▼──────────────┐          ┌────────────▼──────────────┐
│    Redis Message Broker  │          │   PostgreSQL 15 Database  │
│    (Port 6379)           │          │   Videos, Events, Jobs    │
└──────────┬──────────────┘          └───────────────────────────┘
           │
┌──────────▼──────────────────────────────────────────────────────┐
│                  AI Processing Engine (Celery Worker)           │
│                                                                 │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │   Frame     │  │  Google OCR  │  │  OpenAI GPT-4 Vision   │ │
│  │  Extractor  │→ │  Scoreboard  │→ │  Event Summarizer      │ │
│  └─────────────┘  └──────────────┘  └────────────────────────┘ │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              FFmpeg Clip Extractor                      │   │
│  │         (Precise timestamp-based cutting)               │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Backend
- **Python 3.11** — Core language
- **Django 4.2** + **Django REST Framework** — API Server
- **Celery** — Distributed async task processing
- **PostgreSQL 15** — Primary database
- **Redis 7** — Message broker & result backend

### AI / ML Pipeline
- **OpenCV** — Frame extraction and image processing
- **Google Cloud Vision API** — OCR for scoreboard reading
- **OpenAI GPT-4 Vision** — Event detection & AI commentary
- **FFmpeg** — Video clip extraction

### Frontend
- **React 18** + **TypeScript** — UI framework
- **Vite** — Build tool & dev server
- **TailwindCSS** — Utility-first styling
- **Shadcn/UI** — Component library

### Infrastructure
- **Docker** + **Docker Compose** — Containerization
- **Nginx** (via Vite preview) — Static file serving

---

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed:

| Tool | Version | Download |
|---|---|---|
| Docker Desktop | Latest | [docker.com](https://www.docker.com/products/docker-desktop/) |
| Git | Latest | [git-scm.com](https://git-scm.com/) |

> **Note:** You do NOT need Python, Node.js, or FFmpeg installed locally. Everything runs inside Docker containers.

---

### Step 1 — Clone the Repository

```bash
git clone https://github.com/SAMEERBHATTI4065/AI-Powered-Cricket-Highlight-Generator.git
cd AI-Powered-Cricket-Highlight-Generator
```

---

### Step 2 — Configure Environment Variables

Copy the example environment file and fill in your API keys:

```bash
cp .env.example .env
```

Now edit `.env` with your credentials:

```env
# Google Cloud Vision API (for OCR scoreboard reading)
GOOGLE_APPLICATION_CREDENTIALS=your-google-credentials.json

# OpenAI API Key (for AI event detection & summaries)
OPENAI_API_KEY=sk-proj-your-key-here

# Storage path (Windows users: use forward slashes)
HOST_DATA_ROOT=E:/Cricket_Data
```

> 🔑 **Getting API Keys:**
> - **Google Cloud Vision:** Create a project at [console.cloud.google.com](https://console.cloud.google.com), enable Cloud Vision API, and download a service account JSON key.
> - **OpenAI:** Get your API key from [platform.openai.com/api-keys](https://platform.openai.com/api-keys)

---

### Step 3 — Place Google Credentials

Place your Google Cloud service account JSON file in the project root directory and update the `.env` file with its filename.

---

### Step 4 — Build & Run with Docker

```bash
# Navigate to the docker directory
cd docker

# Build and start all services (first time takes ~5-10 minutes)
docker compose up --build

# OR run in detached (background) mode
docker compose up --build -d
```

This starts **5 services** simultaneously:
| Service | Port | Description |
|---|---|---|
| `backend` | 8000 | Django REST API |
| `worker` | — | Celery AI processing worker |
| `db` | 5432 | PostgreSQL database |
| `redis` | 6379 | Message broker |

---

### Step 5 — Run Database Migrations

```bash
# In a new terminal window (while containers are running)
docker compose exec backend python /app/backend/manage.py migrate
docker compose exec backend python /app/backend/manage.py createsuperuser
```

---

### Step 6 — Start the Frontend

```bash
# In a new terminal, navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at:
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8000
- **Django Admin:** http://localhost:8000/admin

---

## 📖 Usage

### 1. Upload a Cricket Video
- Open the web app at `http://localhost:5173`
- Click **"Upload Video"**
- Select your cricket match video file (MP4, AVI, MOV, MKV supported)
- Click **"Process"** to start the AI pipeline

### 2. Monitor Progress
- The dashboard shows real-time job progress
- Processing time depends on video length (typically 5-15 min per hour of footage)

### 3. View & Download Highlights
- Once complete, highlights appear in the **"My Highlights"** section
- Each highlight includes an AI-generated summary
- Click to preview or download individual clips

---

## 📁 Project Structure

```
AI-Powered-Cricket-Highlight-Generator/
│
├── 📄 .env.example              # Environment template (copy to .env)
├── 📄 .gitignore                # Git ignore rules
├── 📄 README.md                 # You are here!
│
├── 🐍 backend/                  # Django REST API
│   ├── cricket_highlights/      # Main Django project
│   ├── highlight_app/           # Core app (models, views, tasks)
│   │   ├── models.py            # Video, Event, Highlight models
│   │   ├── views.py             # API endpoints
│   │   ├── tasks.py             # Celery async task definitions
│   │   └── serializers.py       # DRF serializers
│   ├── manage.py                # Django management utility
│   └── requirements.txt         # Python dependencies
│
├── ⚙️ processing_engine/        # AI Pipeline Core
│   ├── video_processor.py       # Main processing orchestrator
│   ├── summary_generator.py     # OpenAI GPT integration
│   ├── config.py                # Processing configuration
│   └── utils.py                 # Helper utilities
│
├── ⚛️ frontend/                 # React + TypeScript UI
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   ├── pages/               # Route-level page components
│   │   └── App.tsx              # Root application component
│   ├── package.json             # Node dependencies
│   └── vite.config.ts           # Vite build configuration
│
└── 🐳 docker/                   # Docker configuration
    ├── docker-compose.yml        # Multi-service orchestration
    ├── backend.Dockerfile        # Django container definition
    ├── worker.Dockerfile         # Celery worker container
    └── frontend.Dockerfile       # React build container
```

---

## 🔌 API Reference

### Upload Video
```http
POST /api/upload/
Content-Type: multipart/form-data

Body: { video: <file> }
```

### Get Job Status
```http
GET /api/jobs/{job_id}/status/
```

### List Highlights
```http
GET /api/highlights/
GET /api/highlights/{video_id}/
```

### Download Highlight Clip
```http
GET /api/highlights/{highlight_id}/download/
```

---

## ⚙️ Configuration

Key settings can be adjusted in `processing_engine/config.py`:

| Parameter | Default | Description |
|---|---|---|
| `FRAME_SAMPLE_RATE` | 30 | Extract 1 frame every N frames |
| `PRE_EVENT_BUFFER` | 10s | Seconds before event to include |
| `POST_EVENT_BUFFER` | 5s | Seconds after event to include |
| `CONFIDENCE_THRESHOLD` | 0.7 | Minimum AI confidence for event detection |
| `MAX_CLIP_DURATION` | 60s | Maximum length of a single highlight clip |

---

## 🐳 Docker Commands Reference

```bash
# Start all services
docker compose up -d

# Stop all services
docker compose down

# View logs for a specific service
docker compose logs -f backend
docker compose logs -f worker

# Rebuild after code changes
docker compose up --build

# Remove all containers and volumes (full reset)
docker compose down -v

# Enter a running container's shell
docker compose exec backend bash
docker compose exec worker bash
```

---

## 🧪 Running Tests

```bash
# Backend tests
docker compose exec backend python manage.py test

# Frontend tests
cd frontend
npm run test
```

---

## 🔧 Troubleshooting

| Problem | Solution |
|---|---|
| `Port 8000 already in use` | Run `docker compose down` then try again |
| `Database connection refused` | Wait 30 seconds for PostgreSQL to initialize |
| `Celery worker not processing` | Check Redis is running: `docker compose ps` |
| `OCR not detecting scores` | Verify Google credentials JSON is correctly placed |
| `Video processing stuck` | Check worker logs: `docker compose logs -f worker` |
| `Frontend not loading` | Ensure `npm install` completed successfully |

---

## 🤝 Contributing

Contributions, issues and feature requests are welcome!

1. **Fork** the repository
2. Create a **feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add some amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. Open a **Pull Request**

---

## 📜 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Sameer Bhatti**

[![GitHub](https://img.shields.io/badge/GitHub-SAMEERBHATTI4065-181717?style=for-the-badge&logo=github)](https://github.com/SAMEERBHATTI4065)

---

<div align="center">

**⭐ If you found this project useful, please give it a star! ⭐**

*Built with ❤️ using Python, Django, React, and AI*

</div>
