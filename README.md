# CareerPilot AI — Your AI Career Copilot

Premium Next.js product layer around the existing **Lyzr Agent Studio** multi-agent system.

**Lyzr Director:** `Career Compass Director` (`6a76db38f4a62bfb53286743`) at `https://agent-prod.studio.lyzr.ai/v3/inference/chat/` coordinates Resume Analyzer, Job Finder, Talent Match, Resume Tailor, ATS Aligner. This repo does **not** rebuild agents — it is the UI/product.

## Stack
Next.js (App Router, TS), Tailwind, Framer Motion, Lucide, Zustand, react-markdown, react-dropzone, zod, uuid, pdf-parse, mammoth.

## Env
Copy `.env.example` to `.env.local`:
```
LYZR_API_KEY=...
LYZR_AGENT_ID=6a76db38f4a62bfb53286743
NEXT_PUBLIC_DEMO_MODE=false
```

## Run
```bash
npm install
npm run dev
# http://localhost:3000
```

## Security
`LYZR_API_KEY` is server-only (`lib/lyzr.ts` uses `server-only`). Browser calls `/api/chat` and `/api/resume`, never Lyzr directly.

## Pages
`/`, `/dashboard`, `/resume`, `/chat`, `/jobs`, `/jobs/[id]`, `/tailor`, `/ats`, `/applications`, `/settings`
