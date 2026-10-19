# ARC-Shield

ARC-Shield is a safety and resilience dashboard prototype for a multi-level property. Residents can submit incident reports, explore evacuation routes, and view flood resilience information. Executives can review incident trends, manage reports, and use the same evacuation and flood tools.

> **Prototype notice:** The maps, telemetry, role switcher, and recommendations are demonstrations. Do not use this prototype for real emergency decisions. Follow on-site instructions and contact emergency services when needed.

## What it does

### Resident dashboard

- Facility-status hero with shortcuts to submit a report or open evacuation planning.
- Incident reporting with location entry, optional photo preview, GPS coordinate capture, rules-based triage, and optional Gemini review.
- Interactive multi-floor evacuation model with a connected 3D route, drag-to-orbit, zoom controls, floor selection, and level inspection.
- Flood resilience view with sample telemetry and scenario controls.

### Executive dashboard

- Incident workflow dashboard for reviewing, assigning, responding to, and resolving reports.
- Gemini report briefing that groups reports by their existing risk tier and summarizes each group.
- Repeat-issue panel that counts reports grouped by location and detected issue category.
- Evacuation planning and flood resilience views.

The role switch in the navigation is a demo access selector, not production authentication. Resident navigation includes reporting, evacuation, and flood resilience. Executive navigation includes the incident dashboard, evacuation, and flood resilience.

## Technology stack

| Layer | Technology | Purpose |
| --- | --- | --- |
| Frontend | React 19 | Interactive dashboard and reusable UI components |
| Development and bundling | Vite 8 | Local development server and production build |
| 3D visualization | Three.js | Multi-floor building and evacuation route rendering |
| Styling | CSS; Tailwind CSS 4 Vite plugin | Existing component styling and utility CSS support |
| Backend | Node.js built-in HTTP server | JSON API for incidents and Gemini features |
| AI | Google Gemini API over REST | Optional incident review and executive tier summaries |
| Local persistence | JSON file at `data/incidents.json` | Stores incidents for the local demo |
| Browser fallback | `localStorage` | Retains incident and demo user state in the browser |

## Requirements

- Node.js 20.19+ or 22.12+
- npm

## Start locally

Install packages from the project directory:

```sh
npm install
```

Start the API and frontend together:

```sh
npm run dev:all
```

Open the frontend URL printed by Vite. The API uses port `3002` by default. Vite forwards `/api` requests to the API port.

To run the API and frontend separately, use two terminals:

```sh
npm run api
```

```sh
npm run dev
```

If the API port is already occupied, set another `API_PORT` in `.env` and restart both services. The Vite proxy reads the same setting.

## Configure Gemini

1. Create an API key in [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Copy `.env.example` to a new file named `.env` in the project root.
3. Replace `replace_with_your_gemini_api_key` on the `GEMINI_API_KEY` line with your key.
4. Save `.env` and restart `npm run dev:all`.

Example configuration:

```dotenv
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-3.8-flash
API_PORT=3002
```

Keep the key in `.env`. Do not add it to frontend code or commit/share the file. Gemini is optional: rules-based triage and tier counts remain available without a key. Gemini-generated advice is an operator aid and requires human review. Avoid submitting personal or sensitive information because report descriptions and locations are sent to Google when Gemini is used.

## API

All endpoints use JSON. The local API reads `.env` at startup.

| Method and path | Purpose |
| --- | --- |
| `GET /api/health` | Check API availability and list supported features |
| `GET /api/incidents` | Read saved incident records |
| `PUT /api/incidents` | Validate and replace the saved incident collection (up to 500 records) |
| `POST /api/triage` | Request a Gemini assessment for a report description and location; requires `GEMINI_API_KEY` |
| `POST /api/tier-summary` | Group up to 200 reports by their supplied risk tier and return a concise summary for each non-empty tier; returns counts when Gemini is not configured |

Incident requests are limited to 1 MB. The backend validates required fields, statuses, and duplicate incident IDs before saving. Gemini credentials are sent by the backend and are not exposed to the browser.

## Project layout

```text
src/
  components/       Shared navigation, login selector, and page heroes
  data/             Sample incidents, classification rules, and flood models
  views/            Reporting, executive dashboard, evacuation, and flood views
  App.jsx           Role-based navigation and shared application state
server.mjs          Local JSON API, persistence, and Gemini integration
scripts/dev.mjs     Starts the frontend and API together
.env.example        Gemini and local API configuration template
data/               Local incident store, created when the API saves records
```

## Build and preview

Create a production frontend bundle:

```sh
npm run build
```

Preview the generated frontend bundle:

```sh
npm run preview
```

The preview serves the frontend only. A hosted deployment needs a separately deployed API and a configured API URL/proxy.

## Current limitations

- The role selector is not authentication or authorization. A production release needs identity management and server-side access controls.
- The JSON file is suitable for a local demo, not concurrent multi-user production use. Use a shared database for deployment.
- Photos are previewed in the browser and are not uploaded to durable storage.
- Browser GPS provides device coordinates, but this prototype has no facility geofence or indoor positioning system. It places a GPS-located user at the building entry point and asks them to confirm their level and corridor.
- Repeat reports are estimated from normalized location and keyword-based issue categories; this is not a verified duplicate-detection system.
- The evacuation building and flood telemetry are illustrative. Use verified facility maps, sensors, and emergency procedures for operational systems.
