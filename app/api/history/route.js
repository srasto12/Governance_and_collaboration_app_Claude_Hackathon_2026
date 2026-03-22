import { json } from "../../../lib/http";
import { clearHistoryCards, listHistoryCards } from "../../../lib/history-store";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit")) || 20, 100);
  const query = searchParams.get("q") || "";
  const history = await listHistoryCards({ limit, query });

  return json({ history });
}

export async function DELETE() {
  await clearHistoryCards();
  return json({ ok: true });
}
