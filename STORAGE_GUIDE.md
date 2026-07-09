# Cricket Highlight Project: Storage Guide

This document explains how to manage data storage for the project. By default, it is configured to use **Bind Mounts** for easier analysis.

## Current Setup: External Drive Relocation
All data is now configured to be stored on an external drive to prevent C: drive exhaustion.
- **Root Path:** Defined by `HOST_DATA_ROOT` in `.env` (currently `E:\Cricket_Data`)
- **Database:** `docker/data/postgres/` (Remains on C: for performance)
- **Media (Highlights):** `${HOST_DATA_ROOT}/media/`
- **Logs:** `${HOST_DATA_ROOT}/logs/`
- **Analysis Files:** `${HOST_DATA_ROOT}/analysis/`

### How to Revert to Named Volumes
If you want to move data back into Docker's internal volumes (cleaner setup, but harder to see files), follow these steps:

1. **Modify `docker-compose.yml`:**
   - Change `./data/postgres` back to `postgres_data`
   - Change `./data/media` back to `media_data`
   - (and so on for logs, temp, and analysis)
   - Uncomment the `volumes:` section at the bottom.

2. **Run the following command:**
```bash
docker compose down
docker compose up -d --build
```

### Prompt to Switch Modes
You can ask me to do this for you by saying:
**"Switch my Docker storage back to named volumes"**
OR
**"Switch my Docker storage to local bind mounts"**

> [!WARNING]
> Switching storage modes may result in "losing" access to previous data because the new paths will be empty. You may need to manually move files from `docker/data` if you want to keep them.
