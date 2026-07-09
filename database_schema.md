# CricketAI — Database Schema (Roman Urdu Explanation)

Is document me poore project ki database ki tables (models) ka explanation hai Roman Urdu me.

---

## 1. `auth_user` — Django ka Built-in User Table

Ye Django ka default user table hai. Jab bhi koi naya user register karta hai, toh iska data yahan save hota hai.

| Field | Type | Explanation |
|---|---|---|
| `id` | Integer (Auto) | Har user ka unique number (primary key). Django khud generate karta hai. |
| `username` | String (150) | User ka unique username jo login karne ke liye use hota hai. |
| `email` | String (254) | User ka email address. Signup ke waqt diya jaata hai. |
| `password` | String (128) | User ka password — ye hashed (encrypted) form me save hota hai, plain text nahi. |
| `first_name` | String (150) | User ka pehla naam (optional). |
| `last_name` | String (150) | User ka surname (optional). |
| `is_active` | Boolean | Kya user account active hai? `True` = haan, `False` = suspended. |
| `is_staff` | Boolean | Kya user admin panel access kar sakta hai? `True` = haan. |
| `is_superuser` | Boolean | Kya user superadmin hai? `True` = sab kuch access kar sakta hai. |
| `date_joined` | DateTime | User ne kab register kiya — date aur time save hota hai. |
| `last_login` | DateTime | User ne last kab login kiya. |

> **Rishta (Relationship):** Ye table `AnalysisSession` table se connected hai through `ForeignKey`. Ek user ke bohot saare sessions ho sakte hain.

---

## 2. `highlight_app_analysissession` — Match Analysis Sessions Table

Ye table har cricket match analysis ka record rakhta hai. Jab bhi user video upload karta hai aur highlight generate karta hai, toh ek naya record yahan banta hai.

| Field | Type | Explanation |
|---|---|---|
| `id` | Integer (Auto) | Har session ka unique number (primary key). |
| `user_id` | Integer (FK → User) | Kis user ne ye session create kiya? Agar guest hai toh `NULL` hota hai. |
| `session_id` | String (100) | Ek unique ID jo backend generate karta hai (UUID format). |
| `video_title` | String (255) | Original video file ka naam jo user ne upload kiya, e.g. "Pakistan_vs_India.mp4". |
| `summary_text` | Text | AI ne jo match summary generate ki — poori text form me yahan save hoti hai. |
| `events_json` | JSON | Match ke events (boundaries, wickets, overs) ka data JSON format me. Ye list hoti hai. |
| `video_path` | String (500) | Server par generated highlight video ka file path. |
| `share_token` | String (64) | Ek secure random token — is se koi bhi generated highlights ko share link ke zariye dekh sakta hai. |
| `created_at` | DateTime | Session kab create hua — date aur time. |

> **Rishta:** `user_id` field `auth_user` table ki `id` se connected hai (`ForeignKey`). Agar user delete ho jaye toh session me `NULL` aa jaata hai (`SET_NULL`), session delete nahi hota.

---

## 3. `highlight_app_emailverificationcode` — Email OTP Codes Table

Ye naya table hai jo signup ke waqt email verification ke liye use hota hai. Jab user apna email dalta hai, toh ek 6-digit code generate hota hai aur is table me save hota hai.

| Field | Type | Explanation |
|---|---|---|
| `id` | Integer (Auto) | Har code record ka unique number. |
| `email` | Email | Kis email par code bheja gaya. |
| `code` | String (6) | 6-digit numeric OTP code, e.g. "482917". |
| `created_at` | DateTime | Code kab generate hua — is se expiry check hoti hai (10 minute baad expire). |
| `is_used` | Boolean | Kya code already use ho chuka hai? `True` = used, `False` = abhi active hai. |

> **Logic:** Jab user email dalta hai toh backend ye code create karke email bhejta hai. User woh code frontend me enter karta hai, backend verify karta hai. Agar 10 minute se zyada ho gaye toh code expire ho jaata hai.

---

## Relationships Diagram

```
auth_user (1) ──────── (N) highlight_app_analysissession
   │                         │
   │ id ◄────────────── user_id (FK, nullable)
   │
   │
highlight_app_emailverificationcode (standalone — no FK)
   │
   └── email field se relate karta hai logically
```

**Summary:**
- Ek **User** ke paas multiple **AnalysisSession** ho sakte hain (1-to-Many relationship).
- **EmailVerificationCode** standalone hai — sirf signup ke waqt email verify karne ke liye use hota hai.
- Django ka built-in **User** model handle karta hai authentication, password hashing, aur session management.
