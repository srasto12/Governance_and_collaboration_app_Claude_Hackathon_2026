"use client";

import { useEffect, useState } from "react";

import { DEMO_OPINIONS, ISSUE_OPTIONS } from "../lib/constants";

function formatRelativeTime(value) {
  if (!value) return "";

  const date = new Date(value);
  const diffMs = date.getTime() - Date.now();
  const absMs = Math.abs(diffMs);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const units = [
    ["day", 1000 * 60 * 60 * 24],
    ["hour", 1000 * 60 * 60],
    ["minute", 1000 * 60],
    ["second", 1000]
  ];

  for (const [unit, size] of units) {
    if (absMs >= size || unit === "second") {
      return rtf.format(Math.round(diffMs / size), unit);
    }
  }

  return date.toLocaleString();
}

function cardIdentity(card) {
  return card?.id || `${card?.issue}-${card?.concern}-${card?.underlyingValue}`;
}

async function api(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Request failed (${response.status})`);
  }

  return data;
}

function Field({ label, children }) {
  return (
    <div className="field">
      <div className="field-label">{label}</div>
      <div>{children}</div>
    </div>
  );
}

function HistoryItem({ item, active, onSelect, onDelete }) {
  return (
    <button
      type="button"
      className={`history-item${active ? " active" : ""}`}
      onClick={() => onSelect(item)}
    >
      <div className="history-meta">
        <span className="history-issue">{item.issue}</span>
        <span className="history-time" title={new Date(item.createdAt).toLocaleString()}>
          {formatRelativeTime(item.createdAt)}
        </span>
      </div>
      <div className="history-concern">{item.concern}</div>
      <div className="history-footer">
        <div className="history-tags">
          {(item.valueTags || []).slice(0, 2).map((tag) => (
            <span key={tag} className="tag subtle">
              {tag}
            </span>
          ))}
        </div>
        <span
          className="history-delete"
          onClick={(event) => {
            event.stopPropagation();
            onDelete(item.id);
          }}
        >
          Remove
        </span>
      </div>
    </button>
  );
}

function CardView({ card }) {
  if (!card) {
    return <div className="empty-state">Select a history item or generate a card to see structured output.</div>;
  }

  return (
    <article className="card-panel">
      <div className="card-header">
        <div>
          <div className="eyebrow">{card.issue}</div>
          <h3>Structured Civic Card</h3>
        </div>
        <span className={`source-badge ${card.source === "tinyfish" ? "good" : "warn"}`}>
          {card.source === "tinyfish" ? "TinyFish" : "Fallback"}
        </span>
      </div>

      <Field label="Original Opinion">{card.originalOpinion}</Field>
      <Field label="Main Concern">{card.concern}</Field>
      <Field label="Underlying Value">{card.underlyingValue}</Field>
      <Field label="Who Is Affected">
        {card.whoIsAffected?.length ? card.whoIsAffected.join(", ") : "Not specified"}
      </Field>
      <Field label="Common Ground">{card.commonGround}</Field>
      <Field label="Constructive Next Step">{card.constructiveNextStep}</Field>
      <Field label="Value Tags">
        <div className="tags">
          {(card.valueTags || []).map((tag) => (
            <span key={tag} className="tag">
              {tag}
            </span>
          ))}
        </div>
      </Field>

      {!!card.evidence?.length && (
        <Field label="TinyFish Web Evidence">
          <div className="evidence-list">
            {card.evidence.map((item, index) => (
              <a
                key={`${item.url || "evidence"}-${index}`}
                className="evidence-card"
                href={item.url || "#"}
                target="_blank"
                rel="noreferrer"
              >
                <strong>{item.title || "Source"}</strong>
                <span>{item.note || "Evidence used for issue context."}</span>
              </a>
            ))}
          </div>
        </Field>
      )}

      {!!card.ethicalNotes?.length && (
        <Field label="Ethical Notes">
          <ul className="compact-list">
            {card.ethicalNotes.map((note, index) => (
              <li key={`${note}-${index}`}>{note}</li>
            ))}
          </ul>
        </Field>
      )}

      {card.runMeta && (
        <Field label="TinyFish Run">
          Run ID: {card.runMeta.runId || "n/a"} | Steps: {String(card.runMeta.numOfSteps ?? "n/a")}
        </Field>
      )}

      {card.fallbackReason && <Field label="Fallback Reason">{card.fallbackReason}</Field>}
    </article>
  );
}

function InsightsView({ insights }) {
  if (!insights) {
    return <div className="empty-state">Add at least two cards to compare shared values and recommendations.</div>;
  }

  return (
    <div className="insights-panel">
      <Field label="Shared Values">
        <ul className="compact-list">
          {(insights.sharedValues || []).length ? (
            insights.sharedValues.map((item) => (
              <li key={`${item.value}-${item.count}`}>
                {item.value} ({item.count})
              </li>
            ))
          ) : (
            <li>None detected</li>
          )}
        </ul>
      </Field>

      <Field label="Compromise Summary">{insights.compromiseSummary || "No summary returned."}</Field>

      <div className="solution-callout">
        <div className="field-label">Recommended Solution</div>
        <p>{insights.recommendedSolution || "No recommendation returned."}</p>
        <div className="solution-grid">
          <div>
            <div className="field-label">Why This Helps</div>
            <p>{insights.solutionReasoning || "No reasoning returned."}</p>
          </div>
          <div>
            <div className="field-label">Main Tradeoff</div>
            <p>{insights.mainTradeoff || "No tradeoff returned."}</p>
          </div>
          <div>
            <div className="field-label">Suggested Pilot</div>
            <p>{insights.suggestedPilot || "No pilot suggestion returned."}</p>
          </div>
          <div>
            <div className="field-label">Facilitation Tip</div>
            <p>{insights.facilitationTip || "No facilitation tip returned."}</p>
          </div>
        </div>
      </div>

      <Field label="Success Metrics">
        <ul className="compact-list">
          {(insights.successMetrics || []).length ? (
            insights.successMetrics.map((metric) => <li key={metric}>{metric}</li>)
          ) : (
            <li>No metrics suggested</li>
          )}
        </ul>
      </Field>

      <div className="insights-footer">
        <span className={`source-badge ${insights.source === "tinyfish" ? "good" : "warn"}`}>
          {insights.source === "tinyfish" ? "TinyFish Insights" : "Fallback Insights"}
        </span>
        {insights.fallbackReason && <span className="subtle-text">Fallback reason: {insights.fallbackReason}</span>}
      </div>
    </div>
  );
}

export default function CommonGroundApp({ initialHistory }) {
  const firstCard = initialHistory[0] || null;
  const [history, setHistory] = useState(initialHistory);
  const [selectedHistoryId, setSelectedHistoryId] = useState(firstCard?.id || null);
  const [currentCard, setCurrentCard] = useState(firstCard);
  const [groupCards, setGroupCards] = useState([]);
  const [insights, setInsights] = useState(null);
  const [health, setHealth] = useState({ loading: true, tinyfishEnabled: false });
  const [search, setSearch] = useState("");
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [runningInsights, setRunningInsights] = useState(false);
  const [clearingHistory, setClearingHistory] = useState(false);
  const [demoIndex, setDemoIndex] = useState(0);
  const [form, setForm] = useState({
    issue: firstCard?.issue || ISSUE_OPTIONS[0],
    opinion: firstCard?.originalOpinion || ""
  });

  useEffect(() => {
    let ignore = false;

    async function loadHealth() {
      try {
        const data = await api("/api/health", { method: "GET" });
        if (!ignore) {
          setHealth({ loading: false, ...data });
        }
      } catch {
        if (!ignore) {
          setHealth({ loading: false, tinyfishEnabled: false, unavailable: true });
        }
      }
    }

    loadHealth();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        setLoadingHistory(true);
        const response = await fetch(`/api/history?limit=20&q=${encodeURIComponent(search)}`, {
          signal: controller.signal
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to load history");
        }

        if (!controller.signal.aborted) {
          setHistory(data.history || []);
        }
      } catch {
        if (!controller.signal.aborted) {
          setHistory([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingHistory(false);
        }
      }
    }, 200);

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [search]);

  function syncCardSelection(card) {
    setCurrentCard(card);
    setSelectedHistoryId(card?.id || null);

    if (card) {
      setForm({
        issue: card.issue,
        opinion: card.originalOpinion
      });
    }
  }

  function loadDemoOpinion() {
    const item = DEMO_OPINIONS[demoIndex];
    setForm({
      issue: item.issue,
      opinion: item.opinion
    });
    setDemoIndex((value) => (value + 1) % DEMO_OPINIONS.length);
  }

  async function refreshHistory(nextSelectedId) {
    const data = await api(`/api/history?limit=20&q=${encodeURIComponent(search)}`, { method: "GET" });
    const nextHistory = data.history || [];
    setHistory(nextHistory);

    const targetId = nextSelectedId || selectedHistoryId;
    const target = targetId ? nextHistory.find((item) => item.id === targetId) : null;

    if (target) {
      syncCardSelection(target);
      return;
    }

    if (!nextHistory.length) {
      setCurrentCard(null);
      setSelectedHistoryId(null);
      return;
    }

    if (!currentCard || nextSelectedId) {
      syncCardSelection(nextHistory[0]);
    }
  }

  async function handleGenerateCard(event) {
    event.preventDefault();

    if (!form.opinion.trim()) {
      window.alert("Enter an opinion first.");
      return;
    }

    setGenerating(true);

    try {
      const data = await api("/api/card", {
        method: "POST",
        body: JSON.stringify({
          issue: form.issue,
          opinion: form.opinion.trim()
        })
      });

      syncCardSelection(data.card);
      await refreshHistory(data.card.id);
    } catch (error) {
      window.alert(error.message);
    } finally {
      setGenerating(false);
    }
  }

  function handleAddToGroup() {
    if (!currentCard) return;

    if (groupCards.length >= 5) {
      window.alert("Group is capped at 5 cards for local demos.");
      return;
    }

    if (groupCards.some((item) => cardIdentity(item) === cardIdentity(currentCard))) {
      window.alert("This card is already in the group.");
      return;
    }

    setGroupCards((items) => [...items, currentCard]);
  }

  function handleResetGroup() {
    setGroupCards([]);
    setInsights(null);
  }

  async function handleGenerateInsights() {
    if (groupCards.length < 2) return;

    setRunningInsights(true);

    try {
      const data = await api("/api/insights", {
        method: "POST",
        body: JSON.stringify({ cards: groupCards })
      });
      setInsights(data.insights);
    } catch (error) {
      window.alert(error.message);
    } finally {
      setRunningInsights(false);
    }
  }

  async function handleDeleteHistoryItem(id) {
    try {
      await api(`/api/history/${id}`, { method: "DELETE" });
      setGroupCards((items) => items.filter((item) => item.id !== id));
      await refreshHistory();

      if (selectedHistoryId === id) {
        const data = await api(`/api/history?limit=20&q=${encodeURIComponent(search)}`, { method: "GET" });
        const nextHistory = data.history || [];
        setHistory(nextHistory);
        if (nextHistory.length) {
          syncCardSelection(nextHistory[0]);
        } else {
          setCurrentCard(null);
          setSelectedHistoryId(null);
        }
      }
    } catch (error) {
      window.alert(error.message);
    }
  }

  async function handleClearHistory() {
    if (!history.length) return;

    const confirmed = window.confirm("Clear all saved history items?");
    if (!confirmed) return;

    setClearingHistory(true);

    try {
      await api("/api/history", { method: "DELETE" });
      setHistory([]);
      setCurrentCard(null);
      setSelectedHistoryId(null);
      setGroupCards([]);
      setInsights(null);
    } catch (error) {
      window.alert(error.message);
    } finally {
      setClearingHistory(false);
    }
  }

  return (
    <main className="page-shell">
      <div className="background-orb orb-a" />
      <div className="background-orb orb-b" />

      <header className="hero">
        <div>
          <div className="hero-badge">Governance and Collaboration Track</div>
          <h1>CommonGround Cards</h1>
          <p>
            A more production-ready civic deliberation app for turning student opinions into balanced,
            evidence-backed discussion cards and group recommendations.
          </p>
        </div>
        <div className={`status-pill ${health.tinyfishEnabled ? "good" : "warn"}`}>
          {health.loading
            ? "Checking TinyFish status..."
            : health.unavailable
              ? "Server status unavailable"
              : health.tinyfishEnabled
                ? "TinyFish connected"
                : "TinyFish key missing, fallback mode active"}
        </div>
      </header>

      <section className="workspace-grid">
        <aside className="panel history-panel">
          <div className="panel-heading">
            <div>
              <div className="eyebrow">1. History / Previous Issues</div>
              <h2>Recent cards</h2>
            </div>
            <button
              type="button"
              className="ghost-button"
              onClick={handleClearHistory}
              disabled={clearingHistory || !history.length}
            >
              {clearingHistory ? "Clearing..." : "Clear all"}
            </button>
          </div>

          <label className="stack">
            <span className="field-label">Search history</span>
            <input
              className="text-input"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search issue, concern, or value"
            />
          </label>

          <div className="history-list">
            {loadingHistory ? (
              <div className="empty-state">Refreshing saved cards...</div>
            ) : history.length ? (
              history.map((item) => (
                <HistoryItem
                  key={item.id}
                  item={item}
                  active={selectedHistoryId === item.id}
                  onSelect={syncCardSelection}
                  onDelete={handleDeleteHistoryItem}
                />
              ))
            ) : (
              <div className="empty-state">No saved cards yet. Generate a card and it will appear here.</div>
            )}
          </div>
        </aside>

        <section className="panel">
          <div className="panel-heading">
            <div>
              <div className="eyebrow">2. Input</div>
              <h2>Create a card</h2>
            </div>
          </div>

          <form className="stack large-gap" onSubmit={handleGenerateCard}>
            <label className="stack">
              <span className="field-label">Issue</span>
              <select
                className="text-input"
                value={form.issue}
                onChange={(event) => setForm((value) => ({ ...value, issue: event.target.value }))}
              >
                {ISSUE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="stack">
              <span className="field-label">Opinion</span>
              <textarea
                className="text-input text-area"
                value={form.opinion}
                onChange={(event) => setForm((value) => ({ ...value, opinion: event.target.value }))}
                placeholder="Example: Parking prices punish commuter students who live far away and have no choice but to drive."
              />
            </label>

            <div className="button-row">
              <button type="submit" className="primary-button" disabled={generating}>
                {generating ? "Generating..." : "Generate card"}
              </button>
              <button type="button" className="ghost-button" onClick={loadDemoOpinion}>
                Load demo opinion
              </button>
            </div>
          </form>

          <div className="support-copy">
            Clicking a history item also restores its issue and opinion into this form so you can regenerate
            or iterate quickly.
          </div>
        </section>

        <section className="panel">
          <div className="panel-heading">
            <div>
              <div className="eyebrow">3. Card Output</div>
              <h2>Active card</h2>
            </div>
            <div className="button-row">
              <button type="button" className="ghost-button" onClick={handleGenerateCard} disabled={generating}>
                Regenerate
              </button>
              <button type="button" className="primary-button" onClick={handleAddToGroup} disabled={!currentCard}>
                Add to group
              </button>
            </div>
          </div>

          <CardView card={currentCard} />
        </section>

        <section className="panel">
          <div className="panel-heading">
            <div>
              <div className="eyebrow">4. Group Insights</div>
              <h2>Compare perspectives</h2>
            </div>
          </div>

          <p className="support-copy">
            Keep the recommended solution flow intact by comparing multiple cards, surfacing shared values, and
            proposing a pilot-oriented compromise.
          </p>

          <div className="group-list">
            {groupCards.length ? (
              groupCards.map((card, index) => (
                <div key={cardIdentity(card)} className="group-card">
                  <div className="group-card-header">
                    <strong>
                      {index + 1}. {card.issue}
                    </strong>
                    <span className="subtle-text">{card.underlyingValue}</span>
                  </div>
                  <p>{card.concern}</p>
                  <div className="tags">
                    {(card.valueTags || []).map((tag) => (
                      <span key={`${cardIdentity(card)}-${tag}`} className="tag subtle">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">No cards in the group yet.</div>
            )}
          </div>

          <div className="button-row">
            <button
              type="button"
              className="primary-button"
              onClick={handleGenerateInsights}
              disabled={runningInsights || groupCards.length < 2}
            >
              {runningInsights ? "Analyzing..." : "Generate group insights"}
            </button>
            <button type="button" className="ghost-button" onClick={handleResetGroup}>
              Reset group
            </button>
          </div>

          <InsightsView insights={insights} />
        </section>
      </section>

      <footer className="footer-note">
        Ethical note: this tool supports dialogue quality. It does not replace experts, settle truth, or erase
        minority viewpoints in the name of consensus.
      </footer>
    </main>
  );
}
