import "server-only";

import { ISSUE_OPTION_SET, VALUE_TAGS } from "./constants";

const TINYFISH_API_KEY = process.env.TINYFISH_API_KEY;
const TINYFISH_BASE_URL = process.env.TINYFISH_BASE_URL || "https://agent.tinyfish.ai";

const ISSUE_SOURCES = {
  Parking: {
    officialUrl: "https://cfo.asu.edu/parking-transit",
    label: "ASU Parking and Transit Services"
  },
  Tuition: {
    officialUrl: "https://tuition.asu.edu/",
    label: "ASU Tuition"
  },
  Housing: {
    officialUrl: "https://housing.asu.edu/",
    label: "ASU Housing"
  },
  "Club Funding": {
    officialUrl: "https://eoss.asu.edu/clubs",
    label: "ASU Student Organizations"
  },
  "Campus Safety": {
    officialUrl: "https://cfo.asu.edu/police",
    label: "ASU Police and Safety"
  },
  Sustainability: {
    officialUrl: "https://cfo.asu.edu/sustainability",
    label: "ASU Sustainability"
  },
  Accessibility: {
    officialUrl: "https://eoss.asu.edu/accessibility",
    label: "ASU Accessibility"
  },
  Other: {
    officialUrl: "https://www.asu.edu/",
    label: "ASU Home"
  }
};

function pickValues(text) {
  const lower = String(text || "").toLowerCase();
  const scores = VALUE_TAGS.map((tag) => ({ tag, score: 0 }));

  function bump(tag, count = 1) {
    const row = scores.find((item) => item.tag === tag);
    if (row) row.score += count;
  }

  if (/cost|expensive|price|fee|afford|budget|tuition/.test(lower)) bump("affordability", 2);
  if (/fair|equal|equity|unfair|justice/.test(lower)) bump("fairness", 2);
  if (/access|available|reach|commuter|distance|disabled|accessible/.test(lower)) bump("access", 2);
  if (/safe|security|danger|risk|police|lighting/.test(lower)) bump("safety", 2);
  if (/easy|convenient|time|hours|faster|late/.test(lower)) bump("convenience", 1);
  if (/inclusive|belong|bias|voice|represented|club/.test(lower)) bump("inclusion", 1);
  if (/clear|transparent|trust|communication/.test(lower)) bump("transparency", 1);
  if (/stress|mental|health|burnout|support|wellbeing/.test(lower)) bump("wellbeing", 1);
  if (/climate|green|emission|sustainable|environment/.test(lower)) bump("sustainability", 1);

  return scores
    .sort((a, b) => b.score - a.score)
    .filter((item) => item.score > 0)
    .map((item) => item.tag)
    .slice(0, 3);
}

function inferAffected(issue, opinion) {
  const lower = String(opinion || "").toLowerCase();
  const affected = new Set(["Students"]);

  if (/commuter|drive|parking/.test(lower)) affected.add("Commuter students");
  if (/disabled|accessible|accessibility/.test(lower)) affected.add("Students with disabilities");
  if (/housing|dorm|resident/.test(lower)) affected.add("Resident students");
  if (/club|organization/.test(lower)) affected.add("Student organizations");
  if (/cost|price|fee|tuition|afford/.test(lower)) affected.add("Low-income students");
  if (/safety|security|police/.test(lower)) affected.add("Campus safety staff");

  if (issue === "Parking") affected.add("Campus transportation staff");
  if (issue === "Accessibility") affected.add("Accessibility services staff");
  if (issue === "Campus Safety") affected.add("ASU administration");

  return [...affected].slice(0, 4);
}

export function fallbackCard(issue, opinion) {
  const values = pickValues(opinion);
  const chosen = values.length ? values : ["fairness", "access"];

  return {
    issue,
    originalOpinion: opinion,
    concern: `This opinion points to a practical ${issue.toLowerCase()} issue affecting the student experience.`,
    underlyingValue: chosen[0].charAt(0).toUpperCase() + chosen[0].slice(1),
    whoIsAffected: inferAffected(issue, opinion),
    commonGround:
      "Most people can agree campus policies should be fair, workable, and clear to the people affected.",
    constructiveNextStep: `Test one small ${issue.toLowerCase()} policy change, gather feedback from affected groups, and review the results publicly.`,
    valueTags: chosen,
    evidence: [],
    ethicalNotes: [
      "This tool supports dialogue quality and does not decide who is right.",
      "Minority viewpoints should not be erased in the name of consensus."
    ]
  };
}

export function fallbackInsights(cards) {
  const counts = new Map();

  cards.forEach((card) => {
    (card.valueTags || []).forEach((tag) => {
      counts.set(tag, (counts.get(tag) || 0) + 1);
    });
  });

  const sharedValues = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([value, count]) => ({ value, count }));

  const top = sharedValues.map((item) => item.value).slice(0, 3);
  const compromiseSummary = top.length
    ? `A reasonable compromise would prioritize ${top.join(", ")}, test a limited policy option, and review the impact with both students and administrators.`
    : "A reasonable compromise would test one limited policy option and review it using transparent criteria.";

  return {
    sharedValues,
    compromiseSummary,
    facilitationTip:
      "Start with shared values first, then ask each group for one non-negotiable need and one flexible preference.",
    recommendedSolution:
      "Test a limited pilot policy that addresses the most common concerns without making a permanent campus-wide change yet.",
    solutionReasoning:
      "A pilot allows the university and students to evaluate fairness, access, and practicality before scaling.",
    mainTradeoff:
      "A smaller pilot may not solve the issue for everyone immediately, but it reduces risk and allows evidence-based adjustment.",
    suggestedPilot: "Run the policy in one area or for one semester, then review outcomes publicly.",
    successMetrics: ["student satisfaction", "usage levels", "equity impact", "operational feasibility"],
    source: "fallback"
  };
}

function coerceTinyFishResultObject(result) {
  if (result && typeof result === "object" && !Array.isArray(result)) {
    return result;
  }

  if (typeof result === "string") {
    const trimmed = result.trim();

    try {
      return JSON.parse(trimmed);
    } catch {
      const start = trimmed.indexOf("{");
      const end = trimmed.lastIndexOf("}");
      if (start >= 0 && end > start) {
        try {
          return JSON.parse(trimmed.slice(start, end + 1));
        } catch {
          return null;
        }
      }
    }
  }

  return null;
}

async function runTinyFishOnSource(issue, opinion) {
  const source = ISSUE_SOURCES[issue] || ISSUE_SOURCES.Other;
  const url = `${TINYFISH_BASE_URL}/v1/automation/run`;

  const goal = `
Read this official ASU page and extract concise civic discussion evidence for the issue "${issue}".

Also consider this student opinion:
"${opinion}"

Return STRICT JSON only using this schema:
{
  "title": "string",
  "mainConcern": "string",
  "underlyingValue": "string",
  "whoIsAffected": ["string"],
  "commonGround": "string",
  "constructiveNextStep": "string",
  "valueTags": ["fairness|access|safety|affordability|convenience|inclusion|transparency|wellbeing|sustainability"],
  "evidence": [
    {
      "title": "string",
      "url": "string",
      "note": "string"
    }
  ],
  "ethicalNotes": ["string"]
}

Rules:
- Be neutral and concise.
- Use only information grounded in the page and the user opinion.
- Do not overclaim certainty.
- Focus on productive civic dialogue, stakeholder impact, tradeoffs, and constructive next steps.
`.trim();

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": TINYFISH_API_KEY
    },
    body: JSON.stringify({
      url: source.officialUrl,
      goal,
      browser_profile: "lite",
      api_integration: "hackasu-common-ground"
    }),
    cache: "no-store"
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(`TinyFish API error (${response.status}): ${text}`);
  }

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("TinyFish returned non-JSON response");
  }

  if (data.status && data.status !== "COMPLETED") {
    throw new Error(`TinyFish run status: ${data.status}`);
  }

  const resultObj = coerceTinyFishResultObject(data.result);
  if (!resultObj) {
    throw new Error("TinyFish result missing parseable JSON object");
  }

  const fallback = fallbackCard(issue, opinion);
  const evidence = Array.isArray(resultObj.evidence) ? resultObj.evidence.slice(0, 3) : [];

  if (!evidence.length) {
    evidence.push({
      title: String(resultObj.title || source.label),
      url: source.officialUrl,
      note: String(resultObj.mainConcern || "Official source reviewed for issue context.")
    });
  }

  return {
    issue,
    originalOpinion: opinion,
    concern: String(resultObj.mainConcern || fallback.concern),
    underlyingValue: String(resultObj.underlyingValue || fallback.underlyingValue),
    whoIsAffected:
      Array.isArray(resultObj.whoIsAffected) && resultObj.whoIsAffected.length
        ? resultObj.whoIsAffected.slice(0, 4)
        : fallback.whoIsAffected,
    commonGround: String(resultObj.commonGround || fallback.commonGround),
    constructiveNextStep: String(resultObj.constructiveNextStep || fallback.constructiveNextStep),
    valueTags:
      Array.isArray(resultObj.valueTags) && resultObj.valueTags.length
        ? resultObj.valueTags.slice(0, 4)
        : fallback.valueTags,
    evidence,
    ethicalNotes:
      Array.isArray(resultObj.ethicalNotes) && resultObj.ethicalNotes.length
        ? resultObj.ethicalNotes.slice(0, 3)
        : fallback.ethicalNotes,
    source: "tinyfish",
    runMeta: {
      runId: data.run_id || data.runId || null,
      numOfSteps: data.num_of_steps || data.numOfSteps || null
    }
  };
}

export async function generateTinyFishInsights(cards) {
  const url = `${TINYFISH_BASE_URL}/v1/automation/run`;

  const compactCards = cards.map((card) => ({
    issue: card.issue,
    concern: card.concern,
    underlyingValue: card.underlyingValue,
    whoIsAffected: Array.isArray(card.whoIsAffected) ? card.whoIsAffected : [],
    valueTags: Array.isArray(card.valueTags) ? card.valueTags : [],
    commonGround: card.commonGround || "",
    constructiveNextStep: card.constructiveNextStep || ""
  }));

  const goal = `
You are analyzing multiple civic discussion cards for a Governance and Collaboration app.

Return STRICT JSON only using this schema:
{
  "sharedValues": [
    { "value": "string", "count": number }
  ],
  "compromiseSummary": "string",
  "facilitationTip": "string",
  "recommendedSolution": "string",
  "solutionReasoning": "string",
  "mainTradeoff": "string",
  "suggestedPilot": "string",
  "successMetrics": ["string"]
}

Rules:
- Focus on overlap across the cards.
- Emphasize shared values, tradeoffs, and constructive compromise.
- The recommended solution should be balanced and realistic.
- Prefer pilot solutions over sweeping permanent changes.
- Be concise and neutral.
- Do not invent values not supported by the cards.
`.trim();

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": TINYFISH_API_KEY
    },
    body: JSON.stringify({
      url: "https://example.com",
      goal: `${goal}\n\nCards:\n${JSON.stringify(compactCards, null, 2)}`,
      browser_profile: "lite",
      api_integration: "hackasu-common-ground-insights"
    }),
    cache: "no-store"
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(`TinyFish insights error (${response.status}): ${text}`);
  }

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("TinyFish insights returned non-JSON response");
  }

  if (data.status && data.status !== "COMPLETED") {
    throw new Error(`TinyFish insights run status: ${data.status}`);
  }

  const resultObj = coerceTinyFishResultObject(data.result);
  if (!resultObj) {
    throw new Error("TinyFish insights result missing parseable JSON object");
  }

  return {
    sharedValues: Array.isArray(resultObj.sharedValues)
      ? resultObj.sharedValues
          .map((item) => ({
            value: String(item.value || "").trim(),
            count: Number(item.count) || 0
          }))
          .filter((item) => item.value && item.count > 0)
      : [],
    compromiseSummary: String(resultObj.compromiseSummary || ""),
    facilitationTip: String(resultObj.facilitationTip || ""),
    recommendedSolution: String(resultObj.recommendedSolution || ""),
    solutionReasoning: String(resultObj.solutionReasoning || ""),
    mainTradeoff: String(resultObj.mainTradeoff || ""),
    suggestedPilot: String(resultObj.suggestedPilot || ""),
    successMetrics: Array.isArray(resultObj.successMetrics)
      ? resultObj.successMetrics.map((item) => String(item).trim()).filter(Boolean)
      : [],
    source: "tinyfish"
  };
}

export async function generateCard(issue, opinion) {
  const normalizedIssue = ISSUE_OPTION_SET.has(issue) ? issue : "Other";

  if (!TINYFISH_API_KEY) {
    return {
      ...fallbackCard(normalizedIssue, opinion),
      source: "fallback",
      fallbackReason: "TinyFish API key missing"
    };
  }

  try {
    return await runTinyFishOnSource(normalizedIssue, opinion);
  } catch (error) {
    return {
      ...fallbackCard(normalizedIssue, opinion),
      source: "fallback",
      fallbackReason: error.message
    };
  }
}
