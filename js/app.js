"use strict";

(function () {
  const PLACEHOLDER_PATTERN = /\$penerima/g;
  const HAS_PLACEHOLDER = /\$penerima/;
  const SUGGESTION_NAMES = ["Partner", "Istri", "Suami"];

  const templateInput = document.getElementById("template");
  const recipientInput = document.getElementById("recipient");
  const preview = document.getElementById("preview");
  const previewWarning = document.getElementById("preview-warning");
  const copyButton = document.getElementById("copy-btn");
  const copyLabel = document.getElementById("copy-label");
  const shareWaButton = document.getElementById("share-wa-btn");
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
    shareWaButton.disabled = blocked;

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

  function shareToWhatsApp() {
    const text = getFinalText();
    if (!text) return;
    const url = "https://api.whatsapp.com/send?text=" + encodeURIComponent(text);
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function findLastSeparator(value) {
    const separatorRegex = /&|\bdan\b/g;
    let match;
    let last = null;
    while ((match = separatorRegex.exec(value)) !== null) {
      last = {
        index: match.index,
        length: match[0].length,
        isWord: match[0] !== "&",
      };
    }
    return last;
  }

  function stripTrailingSeparators(text) {
    let previous;
    do {
      previous = text;
      text = text.replace(/(?:&|\bdan\b)\s*$/g, "");
    } while (text !== previous);
    return text;
  }

  function suggestionPrefix(separator) {
    return separator && separator.isWord ? "dan " : "& ";
  }

  function computeSuggestions(value) {
    const separator = findLastSeparator(value);
    if (!separator) {
      return [];
    }
    const query = value.slice(separator.index + separator.length).trim();
    const prefix = suggestionPrefix(separator);
    const suggestions = SUGGESTION_NAMES.filter((name) =>
      name.toLowerCase().startsWith(query.toLowerCase())
    ).map((name) => prefix + name);
    if (suggestions.some((suggestion) => value.endsWith(suggestion))) {
      return [];
    }
    return suggestions;
  }

  function capitalizeFirst(value) {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  function applySuggestion(suggestion) {
    const value = recipientInput.value;
    const separator = findLastSeparator(value);
    const base = separator
      ? stripTrailingSeparators(value.slice(0, separator.index))
      : value;
    recipientInput.value = capitalizeFirst(base + suggestion);
    recipientInput.focus();
    suggestBox.hidden = true;
    renderPreview();
  }

  let activeIndex = 0;

  function updateActiveClass() {
    const buttons = suggestBox.querySelectorAll(".suggest-item");
    buttons.forEach((button, index) => {
      button.classList.toggle("is-active", index === activeIndex);
    });
  }

  function renderSuggestions() {
    const items = computeSuggestions(recipientInput.value);
    suggestBox.innerHTML = "";
    activeIndex = 0;

    if (items.length === 0) {
      suggestBox.hidden = true;
      return;
    }

    items.forEach((item, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "suggest-item" + (index === activeIndex ? " is-active" : "");
      button.textContent = item;
      button.addEventListener("mousedown", (event) => event.preventDefault());
      button.addEventListener("mouseenter", () => {
        activeIndex = index;
        updateActiveClass();
      });
      button.addEventListener("click", () => applySuggestion(item));
      suggestBox.appendChild(button);
    });
    suggestBox.hidden = false;
  }

  templateInput.addEventListener("input", renderPreview);

  recipientInput.addEventListener("input", () => {
    const caret = recipientInput.selectionStart;
    const value = recipientInput.value;
    const capitalized = capitalizeFirst(value);
    if (capitalized !== value) {
      recipientInput.value = capitalized;
      recipientInput.setSelectionRange(caret, caret);
    }
    renderPreview();
    renderSuggestions();
  });

  recipientInput.addEventListener("keydown", (event) => {
    if (suggestBox.hidden) {
      return;
    }

    const buttons = suggestBox.querySelectorAll(".suggest-item");

    if (event.key === "ArrowDown") {
      event.preventDefault();
      activeIndex = (activeIndex + 1) % buttons.length;
      updateActiveClass();
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      activeIndex = (activeIndex - 1 + buttons.length) % buttons.length;
      updateActiveClass();
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (buttons[activeIndex]) {
        buttons[activeIndex].click();
      }
    } else if (event.key === "Escape") {
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

  shareWaButton.addEventListener("click", () => {
    if (isBlocked()) {
      renderPreview();
      return;
    }
    shareToWhatsApp();
  });

  renderPreview();
})();
