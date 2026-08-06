"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function value(formData: FormData, key: string, maxLength = 500) {
  return String(formData.get(key) ?? "").trim().slice(0, maxLength);
}

function safeNext(input: string) {
  return input.startsWith("/") && !input.startsWith("//") ? input : "/";
}

async function appOrigin() {
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const protocol = headerStore.get("x-forwarded-proto") ?? "https";
  return host ? `${protocol}://${host}` : "https://love-hub-v2-preview.vercel.app";
}

export async function signIn(formData: FormData) {
  const email = value(formData, "email", 320);
  const password = String(formData.get("password") ?? "");
  const next = safeNext(value(formData, "next", 500) || "/");

  if (!email || !password) {
    redirect(`/login?error=${encodeURIComponent("Enter your email and password.")}&next=${encodeURIComponent(next)}`);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(
      `/login?error=${encodeURIComponent("Login failed. Check your details and try again.")}&next=${encodeURIComponent(next)}`,
    );
  }

  redirect(next);
}

export async function signUp(formData: FormData) {
  const email = value(formData, "email", 320);
  const password = String(formData.get("password") ?? "");
  const next = safeNext(value(formData, "next", 500) || "/join");

  if (!email || password.length < 8) {
    redirect(
      `/login?mode=signup&error=${encodeURIComponent("Use a valid email and a password of at least 8 characters.")}&next=${encodeURIComponent(next)}`,
    );
  }

  const supabase = await createSupabaseServerClient();
  const origin = await appOrigin();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/confirm?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) {
    redirect(
      `/login?mode=signup&error=${encodeURIComponent(error.message)}&next=${encodeURIComponent(next)}`,
    );
  }

  if (data.session) {
    redirect(next);
  }

  redirect(`/login?checkEmail=1&next=${encodeURIComponent(next)}`);
}

export async function sendPasswordReset(formData: FormData) {
  const email = value(formData, "email", 320);
  if (!email) {
    redirect(`/login?error=${encodeURIComponent("Enter the email address for your account.")}`);
  }

  const supabase = await createSupabaseServerClient();
  const origin = await appOrigin();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/confirm?next=${encodeURIComponent("/auth/update-password")}`,
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/login?resetSent=1");
}

export async function updatePassword(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");

  if (password.length < 8 || password !== confirmPassword) {
    redirect(
      `/auth/update-password?error=${encodeURIComponent(
        password !== confirmPassword
          ? "The passwords do not match."
          : "Use a password of at least 8 characters.",
      )}`,
    );
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirect(`/auth/update-password?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/?passwordUpdated=1");
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
