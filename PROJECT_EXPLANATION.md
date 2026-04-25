# 🏏 AI-Powered Cricket Highlight Generator: Ultimate Documentation (Roman Urdu)

Yeh document aapke project ke har folder, har file aur har important code line ki mukammal tafseel (explanation) hai. 

---

## 📂 1. Project ki Bunyad (Root Directory)

### 📄 `.env` & `.env.example`
*   **Kaam:** System ki "Secrets" save karta hai.
*   **Keys:**
    *   `OPENAI_API_KEY`: AI summaries likhne ke liye.
    *   `GOOGLE_APPLICATION_CREDENTIALS`: Scoreboard parhne (OCR) ke liye.
    *   `DB_NAME/USER/PASS`: Database se connect karne ke liye.

### 📄 `docker-compose.yml`
*   **Kaam:** Poore project ko containers mein pack karke chalata hai. Yeh batata hai ke "Backend", "Worker", "DB", aur "Redis" apas mein kaise mil kar kaam karenge.

---

## 📂 2. Backend (Django) - Dimagh aur Data

### 📁 `cricket_highlights/` (Core Config)
*   **`settings.py`:** Poore Django project ki configuration.
*   **`celery.py`:** Background tasks ka "Traffic Controller".
*   **`urls.py`:** API ke raste (Endpoints) define karta hai.

### 📁 `highlight_app/` (Application Logic)
*   **`models.py`:** Database table structures (`Video`, `Event`, `Highlight`).
*   **`api_views.py`:** Frontend se anay wali requests handle karta hai (Upload, Progress Check).
*   **`tasks.py`:** AI Engine ko call karne wala background script.
*   **`serializers.py`:** Database ke complex data ko simple JSON mein badalta hai taake React ise samajh sake.
*   **`admin.py`:** Django Admin Dashboard par data dikhane ke liye settings.
*   **📁 `migrations/`:** Database mein hone wali har tabdeeli (change) ka record.

---

## 📂 3. Processing Engine - AI ka Markaz (Center)

### 📄 `video_processor.py` (The Brain)
*   **Kaam:** Video ko frames mein torna, OCR run karna aur events detect karna.
*   **Important Code:** `if frame_count % config.FRAME_SAMPLE_RATE == 0` (Speed barhane ke liye frames skip karna).

### 📄 `summary_generator.py` (The Writer)
*   **Kaam:** OpenAI ya Gemini ko frames bhej kar commentary aur summary likhwana.

### 📄 `config.py`
*   **Kaam:** System ke parameters (Sample Rate, Detection Thresholds, Confidence levels).

### 📄 `utils.py`
*   **Kaam:** FFmpeg ke zariye video cutting aur OpenCV ke zariye frame processing ke "Helper Functions".

---

## 📂 4. Frontend (React + Vite) - User Interface

### 📁 `src/components/`
*   **`VideoUpload.tsx`:** Video drag-and-drop upload karne wala box.
*   **`HighlightCard.tsx`:** Processed highlight ko box mein dikhana.
*   **`JobStatus.tsx`:** Processing ki percentage dikhana.

### 📁 `src/pages/`
*   **`Dashboard.tsx`:** Main screen jahan upload aur results nazar aate hain.
*   **`History.tsx`:** Purani highlights ka record dekhne ke liye.

---

## 📂 5. Docker - Containerization

*   **`backend.Dockerfile`:** Python aur Django ka environment setup.
*   **`worker.Dockerfile`:** AI logic ke liye **FFmpeg** aur ML tools install karna.
*   **`frontend.Dockerfile`:** React build karke serve karna.

---

## ⚙️ Workflow (AI Kaise Kaam Karta Hai?)

1.  **Video Ingestion:** User video upload karta hai.
2.  **Sampling (S4/S5):** Video ke har 30th frame ko check kiya jata hai.
3.  **OCR Verification:** Scoreboard se match ka context liya jata hai.
4.  **Multimodal Detection:** Gemini/GPT-4 frames dekh kar batata hai ke "Wicket" giri hai ya "Six" laga hai.
5.  **Clipping & Summarization:** FFmpeg video cut karta hai aur AI summary likhti hai.
6.  **Delivery:** Dashboard par highlight "Ready" show hoti hai.

---

## 🏆 Exhibition Tips (Judges ke Sawalat)

1.  **Q: Processing kitni fast hai?**
    *   **Ans:** Humne intelligent sampling (skip frames) use ki hai, isliye yeh manual editing se 90% fast hai.
2.  **Q: Agar scoreboard na ho toh?**
    *   **Ans:** Humara system "Visual Cues" (Crowd celebration, Umpire signals) par fallback karta hai.
3.  **Q: Technology Stack kya hai?**
    *   **Ans:** Django (Backend), React (Frontend), Redis/Celery (Task Management), Docker (Deployment), Google/OpenAI (AI Engines).
