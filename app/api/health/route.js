import { json } from "../../../lib/http";

export async function GET() {
  return json({
    ok: true,
    tinyfishEnabled: Boolean(process.env.TINYFISH_API_KEY),
    tinyfishBaseUrl: process.env.TINYFISH_BASE_URL || "https://agent.tinyfish.ai"
  });
}
