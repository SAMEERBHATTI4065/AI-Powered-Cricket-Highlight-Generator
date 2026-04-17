# 🏏 Cricket Highlight Project — Prompt Guide

> **How to give prompts to the AI assistant** so it can continue working on this project exactly as it is now.

---

## 🔑 Project Context Prompt (Copy-paste this FIRST in every new conversation)

```
My project is a Cricket Highlight Generator located at:
c:\Users\HomePC\OneDrive\Desktop\Amazing\Cricket_highlight_Project\Cricket_highlight_Project

Tech stack:
- Backend: Django + Celery (Python)
- Frontend: React (Vite) in /frontend/
- Processing: Custom video_processor.py + summary_generator.py in /processing_engine/
- Docker: docker-compose setup in /docker/
- Database: SQLite (db.sqlite3)
- APIs: Google Vision OCR + OpenAI GPT-4o-mini

Key files:
- processing_engine/video_processor.py — Main pipeline (audio extraction → energy peaks → OCR → event verification → clip generation → merge)
- processing_engine/summary_generator.py — LLM-powered match summary
- backend/highlight_app/tasks.py — Celery task that triggers processing
- backend/highlight_app/views.py — Django views
- frontend/src/ — React frontend

The project has Docker support for deployment.
```

---

## 📋 Example Prompts for Common Tasks

### 1. Bug Fixing
```
Mera [feature name] kaam nahi kar raha. Error yeh aa raha hai: [paste error].
File: [file path]
Fix karo aur terminal mein batao kya change kiya.
```

### 2. Add New Feature
```
Mujhe [feature description] add karni hai.
- Yeh kahan affect karega: [files/components]
- Expected behavior: [describe]
Pehle plan banao, phir implement karo.
```

### 3. Frontend Changes
```
Frontend mein [page/component] change karna hai.
Current look: [describe or share screenshot]
New design: [describe what you want]
```

### 4. Docker / Deployment
```
Docker services update karne hain. Follow the /update-docker workflow.
Changes: [describe what changed]
```

### 5. Processing Pipeline Changes
```
Video processing pipeline mein [change description] karna hai.
Affected files: video_processor.py, summary_generator.py
Ensure terminal logging remains verbose.
```

### 6. Database Changes
```
Database mein [model/field] add/change karna hai.
Model file: backend/highlight_app/models.py
Run migrations after changes.
```

---

## ⚡ Quick Tips

| Tip | Example |
|-----|---------|
| **Be specific** about file names | "video_processor.py mein energy threshold change karo" |
| **Share errors** with full traceback | Copy-paste terminal output |
| **Mention affected files** | "views.py aur tasks.py dono update karo" |
| **Ask for plan first** if unsure | "Pehle plan banao, phir implement karo" |
| **Request terminal logging** | "Terminal mein har step dikhao" |
| **Reference this guide** | "PROMPT_GUIDE.md follow karo" |

---

## 🔄 Workflow Commands

- `/update-docker` — Updates Docker services after code changes
