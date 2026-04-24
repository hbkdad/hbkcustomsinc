const form = document.getElementById("quote-form");
const statusEl = document.getElementById("form-status");
const stepEls = Array.from(document.querySelectorAll(".form-step"));
const stepPills = Array.from(document.querySelectorAll(".step-pill"));

let currentStep = 1;

function setStatus(message, state = "") {
  if (!statusEl) return;
  statusEl.textContent = message;
  statusEl.dataset.state = state;
}

function fieldsForStep(step) {
  const stepEl = document.querySelector(`.form-step[data-step="${step}"]`);
  return stepEl ? Array.from(stepEl.querySelectorAll("input, select, textarea")) : [];
}

function validateStep(step) {
  const fields = fieldsForStep(step);

  for (const field of fields) {
    if (!field.reportValidity()) {
      field.focus();
      return false;
    }
  }

  return true;
}

function goToStep(step) {
  currentStep = step;

  for (const stepEl of stepEls) {
    const isActive = Number(stepEl.dataset.step) === step;
    stepEl.classList.toggle("is-active", isActive);
    stepEl.hidden = !isActive;
  }

  for (const pill of stepPills) {
    const pillStep = Number(pill.dataset.stepTarget);
    pill.classList.toggle("is-active", pillStep === step);
    pill.classList.toggle("is-complete", pillStep < step);
  }
}

document.querySelectorAll(".next-btn").forEach((button) => {
  button.addEventListener("click", () => {
    if (!validateStep(currentStep)) return;
    goToStep(Math.min(currentStep + 1, stepEls.length));
    setStatus("", "");
  });
});

document.querySelectorAll(".back-btn").forEach((button) => {
  button.addEventListener("click", () => {
    goToStep(Math.max(currentStep - 1, 1));
    setStatus("", "");
  });
});

stepPills.forEach((pill) => {
  pill.addEventListener("click", () => {
    const target = Number(pill.dataset.stepTarget);

    if (target > currentStep && !validateStep(currentStep)) {
      return;
    }

    goToStep(target);
  });
});

form?.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!validateStep(currentStep)) return;

  const submitButton = form.querySelector('.form-step[data-step="3"] .submit-btn');
  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());

  submitButton.disabled = true;
  submitButton.textContent = "Sending Request";
  setStatus("Saving your request...", "");

  try {
    const response = await fetch("/api/quotes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Could not send your request.");
    }

    form.reset();
    goToStep(1);
    setStatus("Request saved. HBK can review and follow up from the intake queue now.", "success");
  } catch (error) {
    setStatus(error.message || "Something went wrong while saving the request.", "error");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Send Quote Request";
  }
});

goToStep(1);
