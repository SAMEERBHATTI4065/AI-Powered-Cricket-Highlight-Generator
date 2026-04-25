# 🧹 Project Maintenance & Cleanup Guide

This guide contains all the commands and steps to keep your **AI-Powered Cricket Highlight Generator** project clean and free up disk space on your C: drive.

---

## 🐳 1. Docker Cleanup Commands

Use these commands when your C: drive is getting full due to Docker usage.

### A. Clean Build Cache (Biggest Space Saver)
This removes old build layers that are no longer needed.
```bash
docker builder prune -f
```

### B. Clean Temporary Processing Data
This wipes the `temp_data` volume where the AI engine stores intermediate video frames.
```bash
docker run --rm -v docker_docker_temp_data:/temp alpine sh -c "rm -rf /temp/*"
```

### C. Remove Unused Images & Containers
Deletes "dangling" images and stopped containers that are taking up space.
```bash
docker image prune -f
docker container prune -f
```

### D. Clean Processed Highlights (Optional)
**Warning:** This will delete your generated highlights from the dashboard. Only use if you don't need old results.
```bash
docker run --rm -v docker_docker_media_data:/media alpine sh -c "rm -rf /media/*"
```

---

## 🐍 2. Python & System Cleanup

### A. Remove Python Cache
Run this in PowerShell from the project root to delete all `__pycache__` folders.
```powershell
Get-ChildItem -Path . -Include __pycache__ -Recurse | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
```

### B. Windows Temp Files
You can manually clear these folders to free up system space:
- `%TEMP%` (User Temp)
- `C:\Windows\Temp` (System Temp)

---

## 📊 3. Monitoring Space
To see exactly where Docker is using space, run:
```bash
docker system df -v
```

---

## ⚠️ Important Notes
- **Model Accuracy:** None of these commands affect your AI models or code logic.
- **Database:** These commands **do not** delete your PostgreSQL database (users, match metadata, etc.).
- **Source Code:** Your `.py`, `.tsx`, and `.env` files are 100% safe.
