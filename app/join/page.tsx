import type { Metadata } from "next";
import { Heart, Link2, LockKeyhole, Mail, Sparkles, UserRound } from "lucide-react";
import { redirect } from "next/navigation";
import { acceptInvite } from "@/app/actions";
import { signIn, signUp } from "@/app/login/actions";
import { getOptionalUser } from "@/lib/love-hub";

export const metadata: Metadata = {
  title: "Join Love Hub",
};

type JoinPageProps = {
  searchParams: Promise<{ token?: string; error?: string }>;
};

export default async function JoinPage({ searchParams }: JoinPageProps) {
  const params = await searchParams;
  const token = params.token ?? "";
  const { supabase, user } = await getOptionalUser();

  if (user) {
    const { data: membership } = await supabase
      .from("love_hub_members")
      .select("household_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (membership) {
      redirect("/");
    }
  }

  const next = token ? `/join?token=${encodeURIComponent(token)}` : "/join";

  return (
    <main className="join-page">
      <section className="join-card">
        <div className="join-mark"><Heart fill="currentColor" /></div>
        <p className="eyebrow"><Sparkles size={15} /> A PRIVATE INVITATION</p>
        <h1>You have been invited home.</h1>
        <p className="join-intro">
          Love Hub is a private shared space for Rapha and Minette — memories, plans, notes and the life you are building together.
        </p>

        {params.error ? <div className="notice notice-error">{params.error}</div> : null}

        {!token ? (
          <div className="join-missing">
            <Link2 />
            <h2>This page needs an invitation link.</h2>
            <p>Ask Rapha to create a fresh one from Love Hub settings.</p>
          </div>
        ) : user ? (
          <form action={acceptInvite} className="stack-form join-form">
            <input type="hidden" name="token" value={token} />
            <div className="signed-in-chip">
              <Mail size={16} />
              Signed in as {user.email}
            </div>
            <label>
              <span><UserRound size={16} /> What should Love Hub call you?</span>
              <input name="display_name" required maxLength={80} placeholder="Minette" autoFocus />
            </label>
            <button className="primary-button wide" type="submit">Accept invitation</button>
          </form>
        ) : (
          <div className="join-auth-grid">
            <section>
              <p className="eyebrow">ALREADY HAVE AN ACCOUNT</p>
              <h2>Sign in and accept.</h2>
              <form action={signIn} className="stack-form compact">
                <input type="hidden" name="next" value={next} />
                <label><span><Mail size={16} /> Email</span><input name="email" type="email" required autoComplete="email" /></label>
                <label><span><LockKeyhole size={16} /> Password</span><input name="password" type="password" required autoComplete="current-password" /></label>
                <button className="soft-button wide" type="submit">Sign in</button>
              </form>
            </section>
            <section>
              <p className="eyebrow">NEW TO LOVE HUB</p>
              <h2>Create your account.</h2>
              <form action={signUp} className="stack-form compact">
                <input type="hidden" name="next" value={next} />
                <label><span><Mail size={16} /> Email</span><input name="email" type="email" required autoComplete="email" /></label>
                <label><span><LockKeyhole size={16} /> Password</span><input name="password" type="password" minLength={8} required autoComplete="new-password" /></label>
                <button className="primary-button wide" type="submit">Create account</button>
              </form>
            </section>
          </div>
        )}
      </section>
    </main>
  );
}
