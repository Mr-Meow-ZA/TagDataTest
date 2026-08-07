"use client";

import { useEffect } from "react";
import { Heart, RotateCcw } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="simple-auth-page">
      <section className="simple-auth-card">
        <span className="brand-mark brand-mark-large"><Heart fill="currentColor" /></span>
        <p className="eyebrow">LOVE HUB HIT A BUMP</p>
        <h1>That did not go to plan.</h1>
        <p>Your data is still private. Try the page again, and check the latest deployment logs if it keeps happening.</p>
        <button className="primary-button" type="button" onClick={reset}>
          <RotateCcw size={16} /> Try again
        </button>
      </section>
    </main>
  );
}
