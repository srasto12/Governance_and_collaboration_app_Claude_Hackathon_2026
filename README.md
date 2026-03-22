# CommonGround Cards (Track 4 MVP)

AI-powered civic discussion tool that turns raw opinions into structured common-ground cards.

## Why this qualifies
- Core feature uses TinyFish API (`/v1/automation/run`) to generate deliberation cards.
- Project targets Governance & Collaboration outcomes: reducing polarization and improving group decisions.
- Includes explicit ethical framing (no false equivalence, no suppression of dissent, no truth arbitration).

## Quick start
1. Install Node.js 18+.
2. Set your TinyFish API key.
3. Run the app.

```powershell
$env:TINYFISH_API_KEY="your_key_here"
npm start
```

Then open: `http://localhost:3000`

Or create a local `.env` from `.env.example` and export variables in your shell.

## Environment variables
- `TINYFISH_API_KEY` (required for live TinyFish usage)
- `TINYFISH_BASE_URL` (optional, default: `https://agent.tinyfish.ai`)
- `PORT` (optional, default: `3000`)

## MVP screens
1. Input screen
- Select issue
- Enter opinion text

2. Card output screen
- Main concern
- Underlying value
- Common ground
- Constructive next step
- Value tags
- Optional evidence links (if returned)

3. Group insights screen
- Add 3-5 cards
- Generate shared values + compromise summary

## TinyFish links from organizers
- Free credits signup: `https://agent.tinyfish.ai/makeasplash?source=asuclaudehack`
- Cookbook PR ($25): `https://github.com/tinyfish-io/TinyFish-cookbook/blob/main/README.md`
- Accelerator golden tickets: `https://www.tinyfish.ai/accelerator`

## Notes
- If `TINYFISH_API_KEY` is missing or TinyFish call fails, the app falls back to local heuristic generation so the UI still demos.
- Group insights are local aggregation in this MVP.
