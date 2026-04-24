const form = document.getElementById("quote-form");
const statusEl = document.getElementById("form-status");

function setStatus(message, state = "") {
  statusEl.textContent = message;
  statusEl.dataset.state = state;
}

form?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const submitButton = form.querySelector(".submit-btn");
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
    setStatus("Request saved. HBK can review and follow up from the intake queue now.", "success");
  } catch (error) {
    setStatus(error.message || "Something went wrong while saving the request.", "error");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Send Quote Request";
  }
});
