import { badRequest, json } from "../../../../lib/http";
import { deleteHistoryCard, getHistoryCard } from "../../../../lib/history-store";

export async function GET(_request, { params }) {
  const { id } = await params;
  const card = await getHistoryCard(id);

  if (!card) {
    return badRequest("History item not found", 404);
  }

  return json({ card });
}

export async function DELETE(_request, { params }) {
  try {
    const { id } = await params;
    await deleteHistoryCard(id);
    return json({ ok: true });
  } catch {
    return badRequest("History item not found", 404);
  }
}
