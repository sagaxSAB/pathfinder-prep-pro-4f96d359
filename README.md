# Helm — AI Career Co-Pilot

Helm is your AI co-pilot for the full career journey: explore careers, sharpen your resume, and practice live interviews with instant feedback.

Built for the hackathon with **React + Vite + TypeScript + Tailwind + Lovable Cloud (Supabase) + Lovable AI Gateway (Gemini)**.

---

## ✨ Features

- **Career Exploration** — Search any role or take a short quiz to get salary ranges, AI-impact score, required skills, a learning roadmap, and a concrete next step.
- **Resume Analyzer** — Upload your PDF resume, get an overall score, ATS keyword gaps, and AI-rewritten bullet points.
- **AI Voice Interview** — Practice real interview questions out loud. Get scored on clarity, confidence, relevance, and structure, with a "better answer" example.

---

## 🛠 Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, Vite 5, TypeScript 5, Tailwind CSS, shadcn/ui |
| Routing / State | React Router, TanStack Query |
| Backend | Lovable Cloud (Supabase Edge Functions) |
| AI | Lovable AI Gateway → Google Gemini (2.5 Flash / 3 Flash Preview) |
| PDF parsing | pdfjs-dist |
| Voice | MediaRecorder API + Gemini multimodal transcription |

---

## 🚀 Run Locally (macOS)

### Prerequisites
- **Node.js 18+** ([download](https://nodejs.org/))
- npm (bundled with Node) or Bun

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server
npm run dev
```

Open **http://localhost:8080** in your browser.

> The `.env` file is auto-generated and already wired to the Lovable Cloud backend. No additional API keys are needed — AI calls go through the Lovable AI Gateway.

### Other useful commands

```bash
npm run build      # Production build
npm run preview    # Preview production build
npm test           # Run vitest
```

---

## 📁 Project Structure

```
src/
  pages/              # Index, Explore, Resume, Interview, NotFound
  components/         # PageShell, SiteHeader, Questionnaire, CareerProfileView, ui/
  lib/                # pdf.ts, utils.ts
  integrations/
    supabase/         # auto-generated client + types (DO NOT EDIT)
  types/career.ts     # shared TS types
supabase/
  functions/
    career-profile/   # Returns full career profile JSON
    career-recommend/ # Returns 3-5 career matches from quiz answers
    resume-analyze/   # Scores + improves a resume
    interview/        # Generates questions, scores answers, summarizes session
    transcribe/       # Audio → text via Gemini multimodal
```

---

## 🧠 How the AI Works

All edge functions call the **Lovable AI Gateway** at `https://ai.gateway.lovable.dev/v1/chat/completions` and use **OpenAI-style tool calling** to force structured JSON output. This means responses are always valid, typed objects — never free-form text the frontend has to parse.

---

## 🌐 Deployment

This project is deployed via Lovable. Edge functions deploy automatically on save.

- **Preview:** see your Lovable project preview URL
- **Publish:** click *Publish* in Lovable to get a live URL

---

## 📝 License

Built for hackathon submission.
