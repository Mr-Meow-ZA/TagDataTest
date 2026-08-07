"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CopyField({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="copy-field">
      <input value={value} readOnly aria-label="Invite link" />
      <button type="button" onClick={copy}>
        {copied ? <Check size={17} /> : <Copy size={17} />}
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
