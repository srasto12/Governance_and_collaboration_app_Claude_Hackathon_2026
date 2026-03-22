import { fallbackInsights, generateTinyFishInsights } from "../../../lib/common-ground";
import { badRequest, json } from "../../../lib/http";

export async function POST(request) {
  try {
    const body = await request.json();
    const cards = Array.isArray(body.cards) ? body.cards : [];

    if (cards.length < 2) {
      return badRequest("At least 2 cards are required");
    }

    if (!process.env.TINYFISH_API_KEY) {
      return json({ insights: fallbackInsights(cards) });
    }

    try {
      const insights = await generateTinyFishInsights(cards);
      return json({ insights });
    } catch (error) {
      const insights = fallbackInsights(cards);
      insights.fallbackReason = error.message;
      return json({ insights });
    }
  } catch (error) {
    return badRequest(error.message || "Failed to create insights", 500);
  }
}
