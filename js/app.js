"use strict";

(function () {
  const PLACEHOLDER_PATTERN = /\$penerima/g;
  const HAS_PLACEHOLDER = /\$penerima/;
  const SUGGESTIONS = ["& Partner", "& Istri", "& Suami"];

  const templateInput = document.getElementById("template");
  const recipientInput = document.getElementById("recipient");
  const preview = document.getElementById("preview");
  const previewWarning = document.getElementById("preview-warning");
  const copyButton = document.getElementById("copy-btn");
  const copyLabel = document.getElementById("copy-label");
  const suggestBox = document.getElementById("suggest-box");

  function isBlocked() {
    return HAS_PLACEHOLDER.test(templateInput.value) && !recipientInput.value.trim();
  }

  function renderPreview() {
    const template = templateInput.value;
    const recipient = recipientInput.value.trim();
    const blocked = isBlocked();

    previewWarning.hidden = !blocked;
    copyButton.disabled = blocked;

    if (blocked) {
      preview.textContent = "";
      return;
    }

    preview.textContent = recipient
      ? template.replace(PLACEHOLDER_PATTERN, recipient)
      : template;
    if (!preview.textContent) {
      preview.textContent = "Hasil akan muncul di sini.";
    }
  }

  function getFinalText() {
    const template = templateInput.value;
    const recipient = recipientInput.value.trim();
    return recipient ? template.replace(PLACEHOLDER_PATTERN, recipient) : template;
  }

  async function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  }

  function showCopied() {
    const originalLabel = copyLabel.textContent;
    copyButton.classList.add("btn--success");
    copyLabel.textContent = "Tersalin!";
    setTimeout(() => {
      copyButton.classList.remove("btn--success");
      copyLabel.textContent = originalLabel;
    }, 1500);
  }

  function computeSuggestions(value) {
    if (SUGGESTIONS.some((suggestion) => value.endsWith(suggestion))) {
      return [];
    }
    const ampIndex = value.lastIndexOf("&");
    if (ampIndex === -1) {
      return [];
    }
    const query = value.slice(ampIndex + 1).trim();
    if (query.length === 0) {
      return SUGGESTIONS;
    }
    return SUGGESTIONS.filter((suggestion) =>
      suggestion.slice(1).trim().toLowerCase().startsWith(query.toLowerCase())
    );
  }

  function applySuggestion(suggestion) {
    const value = recipientInput.value;
    const ampIndex = value.lastIndexOf("&");
    recipientInput.value = value.slice(0, ampIndex) + suggestion;
    recipientInput.focus();
    suggestBox.hidden = true;
    renderPreview();
  }

  function renderSuggestions() {
    const items = computeSuggestions(recipientInput.value);
    suggestBox.innerHTML = "";

    if (items.length === 0) {
      suggestBox.hidden = true;
      return;
    }

    items.forEach((item) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "suggest-item";
      button.textContent = item;
      button.addEventListener("mousedown", (event) => event.preventDefault());
      button.addEventListener("click", () => applySuggestion(item));
      suggestBox.appendChild(button);
    });
    suggestBox.hidden = false;
  }

  templateInput.addEventListener("input", renderPreview);

  recipientInput.addEventListener("input", () => {
    renderPreview();
    renderSuggestions();
  });

  recipientInput.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      suggestBox.hidden = true;
    }
  });

  recipientInput.addEventListener("blur", () => {
    setTimeout(() => {
      suggestBox.hidden = true;
    }, 150);
  });

  document.addEventListener("click", (event) => {
    if (!suggestBox.contains(event.target) && event.target !== recipientInput) {
      suggestBox.hidden = true;
    }
  });

  copyButton.addEventListener("click", async () => {
    if (isBlocked()) {
      renderPreview();
      return;
    }
    const text = getFinalText();
    if (!text) return;
    try {
      await copyToClipboard(text);
      showCopied();
    } catch (error) {
      copyLabel.textContent = "Gagal menyalin";
      setTimeout(() => (copyLabel.textContent = "Salin"), 1500);
    }
  });

  renderPreview();
})();
