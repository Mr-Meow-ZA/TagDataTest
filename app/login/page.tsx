import Link from "next/link";
import { Heart, LockKeyhole, Mail, Sparkles } from "lucide-react";
import { redirect } from "next/navigation";
import { getOptionalUser } from "@/lib/love-hub";
import { sendPasswordReset, signIn, signUp } from "./actions";

type LoginPageProps = {
  searchParams: Promise<{
    mode?: string;
    error?: string;
    next?: string;
    checkEmail?: string;
    resetSent?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { user } = await getOptionalUser();
  const params = await searchParams;
  const next = params.next?.startsWith("/") ? params.next : "/";

  if (user) {
    redirect(next);
  }

  const signingUp = params.mode === "signup";

  return (
    <main className="auth-page">
      <section className="auth-art">
        <div className="auth-orbit orbit-one" />
        <div className="auth-orbit orbit-two" />
        <div className="auth-story-card">
          <span className="brand-mark brand-mark-large"><Heart fill="currentColor" /></span>
          <p className="eyebrow light">LOVE YOU MOST +1</p>
          <h1>Our little corner of the world.</h1>
          <p>
            Private memories, plans, notes, movie nights, beach days and every beautifully ordinary part of us.
          </p>
          <div className="auth-quote">
            <Sparkles size={18} />
            <span>“You are my favourite ordinary day.”</span>
          </div>
        </div>
      </section>

      <section className="auth-panel">
        <div className="auth-card">
          <div className="auth-heading">
            <p className="eyebrow">{signingUp ? "JOIN LOVE HUB" : "WELCOME HOME"}</p>
            <h2>{signingUp ? "Create your private account." : "Come back to us."}</h2>
            <p>
              {signingUp
                ? "Use the invitation link Rapha shared with you."
                : "Sign in with the Supabase account created for Love Hub."}
            </p>
          </div>

          {params.error ? <div className="notice notice-error">{params.error}</div> : null}
          {params.checkEmail ? (
            <div className="notice notice-success">
              Check your email to confirm the new account, then return to the invitation link.
            </div>
          ) : null}
          {params.resetSent ? (
            <div className="notice notice-success">
              Password reset instructions are on their way. Check your inbox and spam folder.
            </div>
          ) : null}

          <form action={signingUp ? signUp : signIn} className="stack-form">
            <input type="hidden" name="next" value={next} />
            <label>
              <span><Mail size={16} /> Email</span>
              <input name="email" type="email" autoComplete="email" required placeholder="you@example.com" />
            </label>
            <label>
              <span><LockKeyhole size={16} /> Password</span>
              <input
                name="password"
                type="password"
                autoComplete={signingUp ? "new-password" : "current-password"}
                minLength={8}
                required
                placeholder="At least 8 characters"
              />
            </label>
            <button className="primary-button wide" type="submit">
              {signingUp ? "Create account" : "Enter Love Hub"}
            </button>
          </form>

          <div className="auth-switch">
            {signingUp ? (
              <p>
                Already have an account?{" "}
                <Link href={`/login?next=${encodeURIComponent(next)}`}>Sign in</Link>
              </p>
            ) : (
              <p>
                Joining Rapha?{" "}
                <Link href={`/login?mode=signup&next=${encodeURIComponent(next)}`}>Create your account</Link>
              </p>
            )}
          </div>

          {!signingUp ? (
            <details className="auth-reset">
              <summary>Forgot your password?</summary>
              <form action={sendPasswordReset} className="inline-form">
                <input name="email" type="email" required placeholder="Your account email" />
                <button type="submit">Send reset link</button>
              </form>
            </details>
          ) : null}
        </div>
      </section>
    </main>
  );
}
