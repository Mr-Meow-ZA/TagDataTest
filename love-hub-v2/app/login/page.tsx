import { Heart } from "lucide-react";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { signIn } from "./actions";
import styles from "./login.module.css";

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect("/");
  }

  const { error } = await searchParams;

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <div className={styles.mark}><Heart aria-hidden="true" /></div>
        <p className={styles.eyebrow}>LOVE YOU MOST +1</p>
        <h1>Welcome home.</h1>
        <p className={styles.copy}>A private space for Rapha and Minette.</p>

        <form action={signIn} className={styles.form}>
          <label>
            Email
            <input name="email" type="email" autoComplete="email" required />
          </label>
          <label>
            Password
            <input name="password" type="password" autoComplete="current-password" required />
          </label>
          {error ? <p className={styles.error} role="alert">{error}</p> : null}
          <button type="submit">Enter Love Hub</button>
        </form>
      </section>
    </main>
  );
}
