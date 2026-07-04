"use client";

import { useState } from "react";

export function CopyToClipboardButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="rounded bg-foreground px-4 py-3 font-medium text-background"
    >
      {copied ? "Copied!" : "Copy list"}
    </button>
  );
}
