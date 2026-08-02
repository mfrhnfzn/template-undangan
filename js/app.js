"use strict";

(function () {
  const PLACEHOLDER_PATTERN = /\$penerima/g;

  const templateInput = document.getElementById("template");
  const recipientInput = document.getElementById("recipient");
  const preview = document.getElementById("preview");
  const copyButton = document.getElementById("copy-btn");
  const copyLabel = document.getElementById("copy-label");

  function renderPreview() {
    const template = templateInput.value;
    const recipient = recipientInput.value.trim();
    const text = recipient ? template.replace(PLACEHOLDER_PATTERN, recipient) : template;
    preview.textContent = text || "Hasil akan muncul di sini.";
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

  templateInput.addEventListener("input", renderPreview);
  recipientInput.addEventListener("input", renderPreview);

  copyButton.addEventListener("click", async () => {
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
