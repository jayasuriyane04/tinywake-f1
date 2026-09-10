# TinyWake

A private, persistent voice-intelligence console inspired by the TinyWake brief.

## Implemented
- Device simulator fleet with persistent names, connection state, and versioned configuration
- Wake-phrase and confidence-threshold validation, scenario playback, idempotent saved sessions
- Searchable session history, CSV export, details, event logs, and charts derived from database records
- Binary WAV upload to a configurable external ASR service; measured transcription latency, duration, and byte count
- Server-side validation, D1 SQLite persistence, and source-aware reporting

## Run

Use Node.js 22.13+ and npm:

```
npm install
npm run dev
```

Generate schema changes with `npm run db:generate`. Apply the generated Drizzle SQL to the local D1 database through Wrangler before opening the console. Production Sites deployments apply the committed migrations automatically. Hosting metadata is in `.openai/hosting.json`.

## ASR integration

Set server-side environment values `ASR_URL` (an HTTPS endpoint) and optional `ASR_TOKEN`. The endpoint must accept a binary `audio/wav` POST and return `{ "text": "transcribed words" }`. Authentication is `Authorization: Bearer <token>`. A 45-second timeout applies. Uploads must be 16 kHz mono 16-bit PCM WAV, 0.1–60 seconds. Raw audio is not persisted. The UI remains a functional simulator without an ASR endpoint; it never substitutes scenario text for a failed real transcription.

## Scope and provenance

The default 128 sessions are labeled simulation fixtures. Their text, timings, byte counts, RSSI, and confidence values are examples. Charts use those persisted records rather than independent graphic fixtures. Configuration applies to a software node, not a physical device. Only the wake threshold and cooldown are exercised in simulation; audio frontend parameters are stored for later integration.

Physical ESP32 firmware, local keyword detection, trained TFLite artifacts, streaming WebSocket transport, hardware heartbeat handling, dataset training, and hardware benchmarks are not implemented or verified in this version. No physical model measurements are claimed. The real-audio flow uses a manually simulated wake boundary and whole-file upload, not live edge streaming.

The deployment is private to its owner. Do not make it public without adding application-level user isolation and device authentication.

## Validation

Run `npx tsc --noEmit` and `npm run build`. The integration checks in `tests/api.test.mjs` exercise an isolated local workspace. They add a small number of test records. Supply `TINYWake_TEST_URL` only for a disposable local environment. Do not run mutation tests against the deployed user workspace.

WebMCP navigation and simulator creation are feature-detected and use the same UI actions. No supported browser WebMCP validation context was available during construction.
