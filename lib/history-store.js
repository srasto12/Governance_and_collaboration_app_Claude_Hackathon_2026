import "server-only";

import { prisma } from "./prisma";

function parseJsonField(value, fallback) {
  if (!value) return fallback;

  try {
    const parsed = JSON.parse(value);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

export function serializeCardForStorage(card) {
  return {
    issue: card.issue,
    originalOpinion: card.originalOpinion,
    concern: card.concern,
    underlyingValue: card.underlyingValue,
    whoIsAffected: JSON.stringify(card.whoIsAffected || []),
    commonGround: card.commonGround,
    constructiveNextStep: card.constructiveNextStep,
    valueTags: JSON.stringify(card.valueTags || []),
    evidence: JSON.stringify(card.evidence || []),
    ethicalNotes: JSON.stringify(card.ethicalNotes || []),
    source: card.source || "unknown",
    runMeta: card.runMeta ? JSON.stringify(card.runMeta) : null,
    fallbackReason: card.fallbackReason || null
  };
}

export function mapHistoryRecord(record) {
  return {
    id: record.id,
    issue: record.issue,
    originalOpinion: record.originalOpinion,
    concern: record.concern,
    underlyingValue: record.underlyingValue,
    whoIsAffected: parseJsonField(record.whoIsAffected, []),
    commonGround: record.commonGround,
    constructiveNextStep: record.constructiveNextStep,
    valueTags: parseJsonField(record.valueTags, []),
    evidence: parseJsonField(record.evidence, []),
    ethicalNotes: parseJsonField(record.ethicalNotes, []),
    source: record.source,
    runMeta: parseJsonField(record.runMeta, null),
    fallbackReason: record.fallbackReason,
    createdAt: record.createdAt.toISOString()
  };
}

export async function saveHistoryCard(card) {
  const created = await prisma.cardHistory.create({
    data: serializeCardForStorage(card)
  });

  return mapHistoryRecord(created);
}

export async function listHistoryCards({ limit = 20, query = "" } = {}) {
  const trimmed = query.trim();

  try {
    const rows = await prisma.cardHistory.findMany({
      where: trimmed
        ? {
            OR: [
              { issue: { contains: trimmed } },
              { originalOpinion: { contains: trimmed } },
              { concern: { contains: trimmed } },
              { underlyingValue: { contains: trimmed } }
            ]
          }
        : undefined,
      orderBy: { createdAt: "desc" },
      take: limit
    });

    return rows.map(mapHistoryRecord);
  } catch {
    return [];
  }
}

export async function getHistoryCard(id) {
  try {
    const row = await prisma.cardHistory.findUnique({
      where: { id }
    });

    return row ? mapHistoryRecord(row) : null;
  } catch {
    return null;
  }
}

export async function deleteHistoryCard(id) {
  const row = await prisma.cardHistory.delete({
    where: { id }
  });

  return mapHistoryRecord(row);
}

export async function clearHistoryCards() {
  try {
    return await prisma.cardHistory.deleteMany();
  } catch {
    return { count: 0 };
  }
}
