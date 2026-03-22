const state = {
  currentCard: null,
  groupCards: [],
  demoIndex: 0
};

const demoOpinions = [
  {
    issue: 'Parking',
    opinion: 'Parking prices punish students who live far away and have no choice but to drive.'
  },
  {
    issue: 'Parking',
    opinion: 'Lower parking prices could make already limited spaces even harder to find during peak hours.'
  },
  {
    issue: 'Parking',
    opinion: 'Accessible parking near classrooms still needs improvement for students with mobility needs.'
  }
];

const refs = {
  issue: document.getElementById('issue'),
  opinion: document.getElementById('opinion'),
  statusPill: document.getElementById('statusPill'),
  cardEmpty: document.getElementById('cardEmpty'),
  cardView: document.getElementById('cardView'),
  groupCards: document.getElementById('groupCards'),
  insightsView: document.getElementById('insightsView'),
  generateBtn: document.getElementById('generateBtn'),
  regenerateBtn: document.getElementById('regenerateBtn'),
  addGroupBtn: document.getElementById('addGroupBtn'),
  insightsBtn: document.getElementById('insightsBtn'),
  resetBtn: document.getElementById('resetBtn'),
  seedBtn: document.getElementById('seedBtn')
};

function escapeHtml(str) {
  return String(str || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

async function api(url, payload) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

function renderCard(card) {
  refs.cardEmpty.classList.add('hidden');
  refs.cardView.classList.remove('hidden');

  const tags = (card.valueTags || [])
    .map(tag => `<span class="tag">${escapeHtml(tag)}</span>`)
    .join('');

  const affected = Array.isArray(card.whoIsAffected) && card.whoIsAffected.length
    ? `<div class="field"><strong>Who Is Affected</strong>${escapeHtml(card.whoIsAffected.join(', '))}</div>`
    : '';

  const evidence = Array.isArray(card.evidence) && card.evidence.length
    ? `
      <div class="evidence">
        <strong>TinyFish Web Evidence</strong>
        ${card.evidence
          .map((item) => {
            const title = escapeHtml(item.title || 'Source');
            const note = escapeHtml(item.note || '');
            const href = escapeHtml(item.url || '#');
            return `
              <div>
                <a href="${href}" target="_blank" rel="noreferrer">${title}</a>
                <div class="hint">${note}</div>
              </div>
            `;
          })
          .join('')}
      </div>
    `
    : '';

  const runMeta = card.runMeta
    ? `<div class="field"><strong>TinyFish Run</strong>ID: ${escapeHtml(card.runMeta.runId || 'n/a')} | Steps: ${escapeHtml(String(card.runMeta.numOfSteps ?? 'n/a'))}</div>`
    : '';

  const fallbackReason = card.fallbackReason
    ? `<div class="field"><strong>Fallback Reason</strong>${escapeHtml(card.fallbackReason)}</div>`
    : '';

  const ethical = Array.isArray(card.ethicalNotes) && card.ethicalNotes.length
    ? `
      <div class="field">
        <strong>Ethical Notes</strong>
        <ul class="ethics-list">
          ${card.ethicalNotes.map(note => `<li>${escapeHtml(note)}</li>`).join('')}
        </ul>
      </div>
    `
    : '';

  refs.cardView.innerHTML = `
    <h3>${escapeHtml(card.issue)} Card</h3>
    <div class="field"><strong>Main Concern</strong>${escapeHtml(card.concern)}</div>
    <div class="field"><strong>Underlying Value</strong>${escapeHtml(card.underlyingValue)}</div>
    ${affected}
    <div class="field"><strong>Common Ground</strong>${escapeHtml(card.commonGround)}</div>
    <div class="field"><strong>Constructive Next Step</strong>${escapeHtml(card.constructiveNextStep)}</div>
    <div class="field"><strong>Value Tags</strong><div class="tags">${tags}</div></div>
    ${evidence}
    <div class="field"><strong>Engine</strong>${escapeHtml(card.source || 'unknown')}</div>
    ${runMeta}
    ${fallbackReason}
    ${ethical}
  `;

  refs.regenerateBtn.disabled = false;
  refs.addGroupBtn.disabled = false;
}

function renderGroup() {
  if (!state.groupCards.length) {
    refs.groupCards.innerHTML = '<div class="empty">No cards in group yet.</div>';
  } else {
    refs.groupCards.innerHTML = state.groupCards.map((card, i) => {
      const tags = (card.valueTags || []).join(', ');
      const affected = Array.isArray(card.whoIsAffected) ? card.whoIsAffected.join(', ') : '';

      return `
        <div class="group-row">
          <strong>${i + 1}. ${escapeHtml(card.issue)}</strong><br>
          ${escapeHtml(card.concern)}<br>
          <span class="hint">Values: ${escapeHtml(tags || 'none')}</span><br>
          <span class="hint">Affected: ${escapeHtml(affected || 'not specified')}</span>
        </div>
      `;
    }).join('');
  }

  refs.insightsBtn.disabled = state.groupCards.length < 2;
}

async function generateCard() {
  const issue = refs.issue.value;
  const opinion = refs.opinion.value.trim();

  if (!opinion) {
    alert('Enter an opinion first.');
    return;
  }

  refs.generateBtn.disabled = true;
  refs.regenerateBtn.disabled = true;
  refs.generateBtn.textContent = 'Generating...';

  try {
    const { card } = await api('/api/card', { issue, opinion });
    state.currentCard = card;
    renderCard(card);
  } catch (err) {
    alert(err.message);
  } finally {
    refs.generateBtn.disabled = false;
    refs.generateBtn.textContent = 'Generate Card';
  }
}

async function generateInsights() {
  refs.insightsBtn.disabled = true;
  refs.insightsBtn.textContent = 'Analyzing...';

  try {
    const { insights } = await api('/api/insights', { cards: state.groupCards });
    refs.insightsView.classList.remove('hidden');

    const rows = (insights.sharedValues || [])
      .map(v => `<li>${escapeHtml(v.value)} (${escapeHtml(String(v.count))})</li>`)
      .join('');

    refs.insightsView.innerHTML = `
      <strong>Shared Values</strong>
      <ul>${rows || '<li>None detected</li>'}</ul>
      <strong>Compromise Summary</strong>
      <p>${escapeHtml(insights.compromiseSummary || '')}</p>
      <strong>Facilitation Tip</strong>
      <p>${escapeHtml(insights.facilitationTip || '')}</p>
      <small>Source: ${escapeHtml(insights.source || 'unknown')}</small>
    `;
  } catch (err) {
    alert(err.message);
  } finally {
    refs.insightsBtn.disabled = state.groupCards.length < 2;
    refs.insightsBtn.textContent = 'Generate Group Insights';
  }
}

function addCurrentToGroup() {
  if (!state.currentCard) return;

  if (state.groupCards.length >= 5) {
    alert('Group is capped at 5 cards for MVP demos.');
    return;
  }

  const exists = state.groupCards.some(
    (card) =>
      card.issue === state.currentCard.issue &&
      card.concern === state.currentCard.concern &&
      card.underlyingValue === state.currentCard.underlyingValue
  );

  if (exists) {
    alert('This card is already in the group.');
    return;
  }

  state.groupCards.push(state.currentCard);
  renderGroup();
}

function resetGroup() {
  state.groupCards = [];
  refs.insightsView.classList.add('hidden');
  refs.insightsView.innerHTML = '';
  renderGroup();
}

function loadDemoOpinions() {
  const item = demoOpinions[state.demoIndex];
  refs.issue.value = item.issue;
  refs.opinion.value = item.opinion;
  state.demoIndex = (state.demoIndex + 1) % demoOpinions.length;
}

async function checkHealth() {
  try {
    const res = await fetch('/api/health');
    const data = await res.json();

    if (data.tinyfishEnabled) {
      refs.statusPill.textContent = 'TinyFish API: Connected';
      refs.statusPill.classList.remove('pill-warn');
      refs.statusPill.classList.add('pill-good');
    } else {
      refs.statusPill.textContent = 'TinyFish API: Missing key (fallback mode)';
      refs.statusPill.classList.remove('pill-good');
      refs.statusPill.classList.add('pill-warn');
    }
  } catch {
    refs.statusPill.textContent = 'Server status unavailable';
    refs.statusPill.classList.remove('pill-good');
    refs.statusPill.classList.add('pill-warn');
  }
}

refs.generateBtn.addEventListener('click', generateCard);
refs.regenerateBtn.addEventListener('click', generateCard);
refs.addGroupBtn.addEventListener('click', addCurrentToGroup);
refs.insightsBtn.addEventListener('click', generateInsights);
refs.resetBtn.addEventListener('click', resetGroup);
refs.seedBtn.addEventListener('click', loadDemoOpinions);

renderGroup();
checkHealth();