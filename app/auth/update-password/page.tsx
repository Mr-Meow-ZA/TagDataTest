import { Heart, KeyRound } from "lucide-react";
import { redirect } from "next/navigation";
import { getOptionalUser } from "@/lib/love-hub";
import { updatePassword } from "@/app/login/actions";

type UpdatePasswordPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function UpdatePasswordPage({ searchParams }: UpdatePasswordPageProps) {
  const { user } = await getOptionalUser();
  const { error } = await searchParams;

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="simple-auth-page">
      <section className="simple-auth-card">
        <span className="brand-mark brand-mark-large"><Heart fill="currentColor" /></span>
        <p className="eyebrow">SECURE YOUR LOVE HUB</p>
        <h1>Choose a new password.</h1>
        <p>Use at least eight characters and keep it private.</p>
        {error ? <div className="notice notice-error">{error}</div> : null}
        <form action={updatePassword} className="stack-form">
          <label>
            <span><KeyRound size={16} /> New password</span>
            <input name="password" type="password" minLength={8} required autoComplete="new-password" />
          </label>
          <label>
            <span><KeyRound size={16} /> Confirm password</span>
            <input name="confirm_password" type="password" minLength={8} required autoComplete="new-password" />
          </label>
          <button className="primary-button wide" type="submit">Update password</button>
        </form>
      </section>
    </main>
  );
}
