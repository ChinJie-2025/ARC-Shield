# ARC-Shield

ARC-Shield is a property safety and resilience platform prototype for strata residential and commercial developments. It combines incident intake and response tracking with evacuation planning and flood-readiness tools.

## Features

- Safety dashboard with incident priority, response stages, SLA timers, and resolution evidence.
- Incident report portal with location capture, optional photo evidence, and rules-based triage suggestions.
- Evacuation route simulation with exit-blocking and accessibility scenarios.
- Flood resilience dashboard with sample telemetry, threshold scenarios, and alert payload export.
- Local incident API that validates and persists incident records between app restarts.
- Browser-local fallback for incident records when the API is unavailable.

## Technology stack

| Layer | Technology | Use |
| --- | --- | --- |
| User interface | React 19 | Component-based single-page application |
| Frontend tooling | Vite 8 | Local development server and production asset build |
| Styling | CSS and Tailwind CSS 4 Vite plugin | Existing component styles and utility CSS support |
| Backend | Node.js built-in HTTP server | JSON API without an additional server framework |
| AI integration | Google Gemini API (REST) | Optional incident description review, called from the backend |
| Local persistence | JSON file (`data/incidents.json`) | Stores the incident collection for the local demo |
| Browser fallback | Web Storage API (`localStorage`) | Keeps incident and demo user state in the current browser |

## Requirements

- Node.js 20.19+ or 22.12+ (required by the Vite 8 toolchain)
- npm

## Run locally

Install the dependencies:

```sh
npm install
```

Start both the frontend and backend:

```sh
npm run dev:all
```

Open the local URL printed by Vite. The Vite development server forwards `/api` requests to the API port set by `API_PORT` in `.env` (default `3002`).

To run either service separately, use two terminals:

```sh
npm run api
```

```sh
npm run dev
```

## Configure Gemini

1. Create an API key in [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Open `.env` in the project root and paste the key after `GEMINI_API_KEY=`. If `.env` is missing, copy `.env.example` and name the copy `.env`.
3. Keep the key in `.env`; do not put it in React code, commit it, or share it.
4. Restart the API (or `npm run dev:all`) after saving `.env`.
5. In the incident report form, enter a description and select **Get Gemini safety review**.

Gemini is optional. If no key is configured, the existing rules-based triage still works and the Gemini review button reports that setup is needed. The backend reads `GEMINI_MODEL` from `.env`; the default is `gemini-3.8-flash`.

The Gemini review sends the incident description and location to Google's Gemini API. Avoid entering personal or sensitive information. Its result is an advisory only and does not replace emergency services, a qualified safety assessment, or the existing deterministic triage.

## API reference

### `GET /api/health`

Returns a small health response to show that the API process is running.

### `GET /api/incidents`

Returns the saved incident collection:

```json
{
  "incidents": []
}
```

### `PUT /api/incidents`

Validates and replaces the saved incident collection. The request body must include an `incidents` array. The API limits the collection to 500 records, checks required fields and allowed workflow statuses, and rejects duplicate IDs. Request bodies are limited to 1 MB.

### `POST /api/triage`

Accepts `{ "description": "...", "location": "..." }` and returns a structured preliminary risk, summary, suggested actions, and response teams. Requires `GEMINI_API_KEY` in `.env`. The API key stays on the backend and is sent to Google in the request header.

## Project structure

```text
src/
  components/   Shared navigation, page headers, login, and home hero
  data/         Incident triage rules, sample data, and flood models
  views/        Dashboard, reporting, evacuation, and flood screens
  App.jsx       App navigation, incident state, and API synchronization
server.mjs      Local incident API and JSON persistence
scripts/dev.mjs Starts Vite and the API together
.env.example    Gemini and API configuration template (copy to .env)
```

## Build

Create the production frontend bundle with:

```sh
npm run build
```

Preview the built frontend with:

```sh
npm run preview
```

The production preview serves the static frontend only; configure a deployed API and proxy separately for a hosted environment.

## Prototype scope

The backend and JSON data file are designed for local development and demos. The role switcher is not real authentication, and the local JSON store is not a shared or production database. Photo previews use browser object URLs and are not uploaded as durable media. The evacuation map and flood telemetry are interactive demonstrations and should not be used for real emergency decisions. A production deployment would need authenticated access, a shared database, durable media storage, audit controls, monitoring, and verified facility data.
