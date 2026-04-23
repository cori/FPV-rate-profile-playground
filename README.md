# FPV Rate Profile Playground

A web-based tool for visualizing, comparing, and sharing Betaflight Actual Rates profiles in real time.

## Features

- **Interactive rate curves** — roll, pitch, and yaw overlaid on a single graph
- **Throttle curve** — with mid-point and expo controls
- **Shareable URLs** — encode one or more profiles into a URL for instant comparison
- **Multi-profile overlay** — up to 5 profiles shown simultaneously (solid + dashed lines)
- **CLI import / export** — paste a Betaflight dump to load settings; copy commands back to your FC
- **LLM-friendly API** — POST a rate profile, get back a visualization URL

---

## Quick start (with server)

```bash
npm install
npm start          # http://localhost:3000
```

Or open `index.html` directly in a browser (URL sharing requires the server).

---

## API

The server exposes a small REST API so that tools, scripts, and LLMs can generate comparison URLs programmatically.

### Discovery endpoints

| Endpoint | Description |
|---|---|
| `GET /openapi.json` | OpenAPI 3.0 spec (machine-readable) |
| `GET /.well-known/ai-plugin.json` | AI plugin manifest |

### `POST /api/share`

Accept 1–5 rate profiles and return a shareable URL.

**Request**

```http
POST /api/share
Content-Type: application/json

{
  "profiles": [
    {
      "name": "Freestyle",
      "roll_rc_rate": 70,  "roll_rate": 670,  "roll_expo": 0,
      "pitch_rc_rate": 70, "pitch_rate": 670, "pitch_expo": 0,
      "yaw_rc_rate": 70,   "yaw_rate": 600,   "yaw_expo": 0,
      "thr_mid": 50, "thr_expo": 0
    }
  ]
}
```

All numeric fields are **optional** — missing fields fall back to Betaflight defaults.

**Response**

```json
{
  "url": "http://localhost:3000/?profiles=eyJuYW1lIjoiRnJlZXN..."
}
```

Open `url` in a browser to see the interactive visualization.

### Profile field reference

| Field | Range | Description |
|---|---|---|
| `name` | string | Optional display label |
| `roll_rc_rate` | 0–255 | Roll center sensitivity |
| `roll_rate` | 200–2000 | Roll max rate (deg/s) |
| `roll_expo` | 0–100 | Roll expo (0 = linear) |
| `pitch_rc_rate` | 0–255 | Pitch center sensitivity |
| `pitch_rate` | 200–2000 | Pitch max rate (deg/s) |
| `pitch_expo` | 0–100 | Pitch expo |
| `yaw_rc_rate` | 0–255 | Yaw center sensitivity |
| `yaw_rate` | 200–2000 | Yaw max rate (deg/s) |
| `yaw_expo` | 0–100 | Yaw expo |
| `thr_mid` | 0–100 | Throttle mid-point (50 → 0.50) |
| `thr_expo` | 0–100 | Throttle expo |

---

## Comparing profiles

Send multiple profiles to compare them side by side:

```bash
curl -s -X POST http://localhost:3000/api/share \
  -H 'Content-Type: application/json' \
  -d '{
    "profiles": [
      {"name":"Freestyle","roll_rc_rate":70,"roll_rate":670,"roll_expo":0,
       "pitch_rc_rate":70,"pitch_rate":670,"pitch_expo":0,
       "yaw_rc_rate":70,"yaw_rate":600,"yaw_expo":0,"thr_mid":50,"thr_expo":0},
      {"name":"Cinematic","roll_rc_rate":40,"roll_rate":400,"roll_expo":40,
       "pitch_rc_rate":40,"pitch_rate":400,"pitch_expo":40,
       "yaw_rc_rate":40,"yaw_rate":350,"yaw_expo":40,"thr_mid":55,"thr_expo":30}
    ]
  }' | jq -r .url
```

The returned URL shows both profiles overlaid: the **first profile** (solid lines) is loaded into the interactive editor; **additional profiles** appear as dashed reference overlays.

---

## Usage with an LLM

Point an LLM at this server. It can discover everything it needs from the plugin manifest and OpenAPI spec:

1. `GET /.well-known/ai-plugin.json` — the model finds the API description
2. `GET /openapi.json` — the model reads the schema
3. `POST /api/share` — the model sends profile data and returns the URL to you

**Example prompt to an LLM:**

> "I fly these rates: roll rc_rate 70, rate 670, expo 0 / pitch same / yaw rc_rate 65 rate 580 expo 0. My friend flies rc_rate 90, rate 900, expo 20 across all axes. Use the FPV Rate Playground at http://localhost:3000 to generate a comparison URL."

---

## URL format

Profiles are base64url-encoded JSON in the `?profiles=` query parameter. You can construct URLs directly:

```javascript
const profiles = [{ roll_rc_rate: 70, roll_rate: 670, /* … */ }];
const encoded  = btoa(JSON.stringify(profiles))
                   .replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const url = `http://localhost:3000/?profiles=${encoded}`;
```

---

## Parameters

### Rate Settings (Roll / Pitch / Yaw)

- **Center Sensitivity** (0–255): Rate at center stick
- **Max Rate** (200–2000 deg/s): Rate at full deflection
- **Expo** (0–100): Curvature — 0 = linear, higher = more center precision

### Throttle Settings

- **Mid Point** (0–100): Output at 50 % stick (50 → 0.50 = linear hover)
- **Expo** (0–100): Throttle response curve

---

## CLI import / export

**Import** — paste a Betaflight CLI dump and click *Import Settings*:

```
set rates_type = ACTUAL
set roll_rc_rate = 70
set roll_rate = 670
set roll_expo = 0
…
```

**Export** — the export textarea updates live; click *Copy to Clipboard*, then paste into Betaflight CLI and run `save`.

---

## Running tests

```bash
npm test
```

Uses Node's built-in test runner — no extra dependencies required.

---

## Technical details

- Vanilla JS + HTML5 Canvas (no frameworks)
- Express server for the share API and static serving
- Profiles encoded as base64url JSON in the URL — no database, no auth
- Implements Betaflight's **Actual Rates** algorithm exactly

## License

MIT
