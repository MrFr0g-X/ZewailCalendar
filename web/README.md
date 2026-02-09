# ZewailCalendar Web

A full-stack Next.js web application that converts Zewail City university schedules into calendar events. Upload your saved schedule HTML, preview your courses, and export to ICS or directly to Google Calendar.

**Live:** [zewailcalendar.vercel.app](https://zewailcalendar.vercel.app)

## Features

- **HTML Schedule Parsing** — Paste your saved registration page HTML and instantly see all your courses
- **ICS Export** — Download a standard `.ics` calendar file compatible with any calendar app
- **Google Calendar Integration** — One-click OAuth sign-in to import events directly into your Google Calendar
- **Auto-detection** — Automatically detects term dates, course types (Lecture/Lab), meeting times, and locations
- **Glassmorphism UI** — Liquid glass design with aurora background animations

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Styling:** Tailwind CSS v3, Framer Motion
- **Auth:** NextAuth.js v4 (Google OAuth)
- **API:** Google Calendar API via `googleapis`
- **UI Components:** Radix UI primitives, shadcn/ui

## Local Development

```bash
cd web
cp .env.example .env.local
# Fill in your Google OAuth credentials and NEXTAUTH_SECRET
npm install --legacy-peer-deps
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Description |
|---|---|
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `NEXTAUTH_URL` | App URL (`http://localhost:3000` for dev) |
| `NEXTAUTH_SECRET` | Random secret for session encryption |

## Deployment

Deployed on [Vercel](https://vercel.com). Set **Root Directory** to `web` in project settings.

Make sure to add `https://your-domain.vercel.app/api/auth/callback/google` as an authorized redirect URI in Google Cloud Console.
