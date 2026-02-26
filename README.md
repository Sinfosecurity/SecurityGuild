# NYS Security Guard 8-Hour Pre-Assignment Training Quiz App

Web-based multiple choice quiz app for New York State Security Guard 8-Hour Pre-Assignment Training (per 9 NYCRR §6027.3).

## How to Run Locally
Because the app loads question banks via `fetch()` from `questions/*.json`, most browsers will block it if you open `index.html` directly with `file://...`.

### Option A (easiest on Mac)
Double-click `start.command`.

### Option B (manual)
Run a tiny local server from this folder, then open the URL it prints:

```bash
python3 -m http.server 5173
```

Then visit `http://localhost:5173`.

## To Expand the Question Bank
Edit the JSON files in `questions/`.

Each file must be a JSON array of objects like:

```json
{
  "question": "Question text…",
  "options": { "A": "…", "B": "…", "C": "…", "D": "…" },
  "correct": "A",
  "explanation": "Why A is correct…"
}
```

Note: the `questions/*.json` files in this repo may be empty placeholders until you populate them.

## Deploy to Railway
1. Go to [railway.app](https://railway.app) and sign in (GitHub).
2. Click **New Project** → **Deploy from GitHub repo**.
3. Select `Sinfosecurity/SecurityGuild` (or your fork).
4. Railway will detect the Node.js app and deploy. No extra config needed.
5. After deploy, click **Generate Domain** to get a public URL.

## Deploy to Vercel or Netlify
Upload this folder as a static site. No dynamic backend required.

## NYS Exam Alignment
All questions are based on NYS curriculum, NY Penal Law, and Article 7-A. Realistic, exam-style rigor is maintained throughout.