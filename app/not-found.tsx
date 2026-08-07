import Link from "next/link";
import { Heart, Home } from "lucide-react";

export default function NotFound() {
  return (
    <main className="simple-auth-page">
      <section className="simple-auth-card">
        <span className="brand-mark brand-mark-large"><Heart fill="currentColor" /></span>
        <p className="eyebrow">LOST, BUT STILL LOVED</p>
        <h1>This little corner does not exist.</h1>
        <p>The link may be old, or the page may have moved while Love Hub was growing up.</p>
        <Link className="primary-button" href="/"><Home size={16} /> Go home</Link>
      </section>
    </main>
  );
}
