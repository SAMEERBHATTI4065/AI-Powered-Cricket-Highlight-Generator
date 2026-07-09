# 🧹 Project Maintenance & Cleanup Guide

This guide contains all the commands to keep your **AI-Powered Cricket Highlight Generator** project clean and free up disk space on your C: drive.

---

## 📊 1. Monitor Your Space
Before cleaning, see what is taking up space:
```bash
docker system df -v
```

---

## 🐳 2. Docker Cleanup Commands (Safe & Effective)

### A. Clean Build Cache (Best Space Saver)
This removes old, unused build layers. Run this if you have done many code changes.
```bash
docker builder prune -f
```

### B. Clean Temporary Processing Data (Safe)
This wipes the `temp_data` volume where the AI engine stores intermediate frames.
```bash
# First, find your exact volume name:
docker volume ls | grep temp_data

# Use that name in this command (replace 'docker_docker_temp_data' if different):
docker run --rm -v docker_docker_temp_data:/temp alpine sh -c "rm -rf /temp/*"
```

### C. Remove Unused Images & Containers
```bash
docker image prune -f
docker container prune -f
```

---

## 🐍 3. Application Cleanup (Recommended)

### A. Safe Session Cleanup (Keeps Recent Work)
Use this command inside the `docker` folder. It deletes sessions older than X hours.
```bash
# Deletes uploads and results older than 24 hours
docker compose exec backend python backend/manage.py cleanup_sessions --hours 24
```
**Note:** This is better than manual deletion because it won't crash the dashboard.

### B. Extreme Media Cleanup (Wipes Everything)
**⚠️ Warning:** This will delete **ALL** videos, highlights, and results from your dashboard.
```bash
# Use this ONLY if you want to start fresh
docker run --rm -v docker_docker_media_data:/media alpine sh -c "rm -rf /media/*"
```

---

## 🖥️ 4. Local System Cleanup

### A. Python Cache Cleanup
Optional. Removes `__pycache__` folders to keep the code folder tidy.
```powershell
Get-ChildItem -Path . -Include __pycache__ -Recurse | Remove-Item -Recurse -Force
```

### B. Windows Temp Files
Standard maintenance for C: drive space:
- Press `Win + R`, type `%temp%`, and delete all files.
- Press `Win + R`, type `temp`, and delete all files.

---

## ⚠️ Important Notes
- **AI Models:** These commands **do not** delete your AI models (EasyOCR, etc.).
- **Database:** Your PostgreSQL database (match info, users) is safe unless you delete the `postgres_data` volume.
- **Source Code:** Your `.py`, `.tsx`, and `.env` files are never touched by these commands.
