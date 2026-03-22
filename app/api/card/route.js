import { generateCard } from "../../../lib/common-ground";
import { badRequest, json } from "../../../lib/http";
import { saveHistoryCard } from "../../../lib/history-store";

export async function POST(request) {
  try {
    const body = await request.json();
    const issue = typeof body.issue === "string" ? body.issue.trim() : "";
    const opinion = typeof body.opinion === "string" ? body.opinion.trim() : "";

    if (!issue || !opinion) {
      return badRequest("issue and opinion are required");
    }

    const card = await generateCard(issue, opinion);
    const savedCard = await saveHistoryCard(card);

    return json({ card: savedCard });
  } catch (error) {
    return badRequest(error.message || "Failed to create card", 500);
  }
}
