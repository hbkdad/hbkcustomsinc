const unlockButton = document.getElementById("unlock-dashboard");
const refreshButton = document.getElementById("refresh-dashboard");
const accessInput = document.getElementById("access-code");
const statusEl = document.getElementById("dashboard-status");
const gate = document.getElementById("dashboard-gate");
const main = document.getElementById("dashboard-main");
const leadList = document.getElementById("lead-list");
const leadTotal = document.getElementById("lead-total");
const latestTrade = document.getElementById("lead-latest-trade");
const latestBudget = document.getElementById("lead-latest-budget");

const ACCESS_KEY = "hbk-dashboard-access-code";

function setStatus(message, state = "") {
  statusEl.textContent = message;
  statusEl.dataset.state = state;
}

function readStoredCode() {
  return window.localStorage.getItem(ACCESS_KEY) || "";
}

function storeCode(value) {
  window.localStorage.setItem(ACCESS_KEY, value);
}

function renderLeads(leads) {
  leadList.innerHTML = "";

  if (!leads.length) {
    leadList.innerHTML = '<p class="empty-state">No quote requests yet.</p>';
    leadTotal.textContent = "0";
    latestTrade.textContent = "-";
    latestBudget.textContent = "-";
    return;
  }

  leadTotal.textContent = String(leads.length);
  latestTrade.textContent = leads[0].trade || "-";
  latestBudget.textContent = leads[0].lead_status || "-";

  for (const lead of leads) {
    const article = document.createElement("article");
    article.className = "lead-card";

    const meta = [
      lead.trade,
      lead.service_type,
      lead.timeline || "No timeline",
      lead.budget_range || "No budget"
    ].filter(Boolean);

    const currentStatus = lead.lead_status || "new";

    article.innerHTML = `
      <div class="lead-head">
        <div>
          <h4>${lead.business_name || "Unknown business"}</h4>
          <p>${lead.name || "Unknown contact"}</p>
        </div>
        <span class="pill small-pill">${new Date(lead.created_at).toLocaleString()}</span>
      </div>
      <div class="lead-meta">${meta.map((item) => `<span>${item}</span>`).join("")}</div>
      <div class="lead-links">
        <a href="mailto:${lead.email}">${lead.email}</a>
        <a href="tel:${lead.phone.replace(/[^0-9+]/g, "")}">${lead.phone}</a>
        ${lead.website_url ? `<a href="${lead.website_url}" target="_blank" rel="noreferrer">Current site</a>` : ""}
      </div>
      <p class="lead-summary">${lead.project_summary || ""}</p>
      ${lead.notes ? `<div class="lead-notes"><strong>Notes:</strong> ${lead.notes}</div>` : ""}
      <div class="lead-manage">
        <label class="manage-field">
          <span>Status</span>
          <select data-lead-status="${lead.id}">
            <option value="new" ${currentStatus === "new" ? "selected" : ""}>New</option>
            <option value="follow-up" ${currentStatus === "follow-up" ? "selected" : ""}>Follow-Up</option>
            <option value="quoted" ${currentStatus === "quoted" ? "selected" : ""}>Quoted</option>
            <option value="won" ${currentStatus === "won" ? "selected" : ""}>Won</option>
            <option value="closed" ${currentStatus === "closed" ? "selected" : ""}>Closed</option>
          </select>
        </label>
        <label class="manage-field manage-notes">
          <span>Internal Notes</span>
          <textarea data-lead-notes="${lead.id}" placeholder="Private follow-up notes, next step, quote details...">${lead.internal_notes || ""}</textarea>
        </label>
        <div class="manage-actions">
          <button type="button" class="submit-btn save-lead-btn" data-lead-save="${lead.id}">Save Lead</button>
          <p class="inline-status" data-lead-message="${lead.id}"></p>
        </div>
      </div>
    `;

    leadList.appendChild(article);
  }

  attachLeadActions();
}

function setInlineMessage(id, message, state = "") {
  const el = document.querySelector(`[data-lead-message="${id}"]`);
  if (!el) return;
  el.textContent = message;
  el.dataset.state = state;
}

async function saveLead(id) {
  const code = readStoredCode();
  const statusField = document.querySelector(`[data-lead-status="${id}"]`);
  const notesField = document.querySelector(`[data-lead-notes="${id}"]`);
  const saveButton = document.querySelector(`[data-lead-save="${id}"]`);

  if (!code || !statusField || !notesField || !saveButton) {
    return;
  }

  saveButton.disabled = true;
  setInlineMessage(id, "Saving...", "");

  try {
    const response = await fetch(`/api/quotes?access_code=${encodeURIComponent(code)}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        id,
        leadStatus: statusField.value,
        internalNotes: notesField.value
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Could not save lead.");
    }

    setInlineMessage(id, "Saved.", "success");
  } catch (error) {
    setInlineMessage(id, error.message || "Could not save lead.", "error");
  } finally {
    saveButton.disabled = false;
  }
}

function attachLeadActions() {
  document.querySelectorAll("[data-lead-save]").forEach((button) => {
    button.addEventListener("click", () => {
      saveLead(button.dataset.leadSave);
    });
  });
}

async function loadDashboard(code) {
  setStatus("Loading lead queue...", "");

  const response = await fetch(`/api/quotes?access_code=${encodeURIComponent(code)}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Could not load dashboard.");
  }

  renderLeads(data.leads || []);
  gate.hidden = true;
  main.hidden = false;
  setStatus("Dashboard loaded.", "success");
}

async function unlock() {
  const code = accessInput.value.trim() || readStoredCode();

  if (!code) {
    setStatus("Enter your access code first.", "error");
    return;
  }

  unlockButton.disabled = true;

  try {
    await loadDashboard(code);
    storeCode(code);
  } catch (error) {
    setStatus(error.message || "Could not unlock the dashboard.", "error");
  } finally {
    unlockButton.disabled = false;
  }
}

unlockButton?.addEventListener("click", unlock);
accessInput?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    unlock();
  }
});

refreshButton?.addEventListener("click", async () => {
  const code = readStoredCode();

  if (!code) {
    main.hidden = true;
    gate.hidden = false;
    setStatus("Enter your access code to reload the dashboard.", "");
    return;
  }

  try {
    await loadDashboard(code);
  } catch (error) {
    setStatus(error.message || "Could not refresh the dashboard.", "error");
  }
});

const savedCode = readStoredCode();
if (savedCode) {
  accessInput.value = savedCode;
  unlock();
}
