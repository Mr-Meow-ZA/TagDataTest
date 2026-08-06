import { redirect } from "next/navigation";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type LoveHubMembership = {
  household_id: string;
  user_id: string;
  display_name: string;
  role: "owner" | "member";
  joined_at: string;
};

export type LoveHubHousehold = {
  id: string;
  slug: string;
  name: string;
  relationship_started_on: string;
  created_at: string;
  updated_at: string;
};

export type LoveHubContext = {
  supabase: SupabaseClient;
  user: User;
  membership: LoveHubMembership;
  household: LoveHubHousehold;
};

export async function requireLoveHubContext(): Promise<LoveHubContext> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: membership, error: membershipError } = await supabase
    .from("love_hub_members")
    .select("household_id, user_id, display_name, role, joined_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (membershipError) {
    throw new Error(`Could not load Love Hub membership: ${membershipError.message}`);
  }

  if (!membership) {
    redirect("/join");
  }

  const { data: household, error: householdError } = await supabase
    .from("love_hub_households")
    .select("id, slug, name, relationship_started_on, created_at, updated_at")
    .eq("id", membership.household_id)
    .single();

  if (householdError || !household) {
    throw new Error(`Could not load Love Hub household: ${householdError?.message ?? "Unknown error"}`);
  }

  return {
    supabase,
    user,
    membership: membership as LoveHubMembership,
    household: household as LoveHubHousehold,
  };
}

export async function getOptionalUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, user };
}

export async function getSignedPhotoUrl(
  supabase: SupabaseClient,
  path: string | null | undefined,
  expiresIn = 60 * 60,
) {
  if (!path) return null;

  const { data, error } = await supabase.storage
    .from("love-hub-private")
    .createSignedUrl(path, expiresIn);

  if (error) return null;
  return data.signedUrl;
}

export function daysTogether(startDate: string) {
  const start = new Date(`${startDate}T00:00:00+02:00`).getTime();
  const now = Date.now();
  return Math.max(1, Math.floor((now - start) / 86_400_000) + 1);
}

export function formatDate(
  value: string | null | undefined,
  options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" },
) {
  if (!value) return "Someday";
  const date = value.includes("T") ? new Date(value) : new Date(`${value}T12:00:00+02:00`);
  return new Intl.DateTimeFormat("en-ZA", {
    timeZone: "Africa/Johannesburg",
    ...options,
  }).format(date);
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return "Date to be decided";
  return formatDate(value, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function toDateTimeLocal(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Johannesburg",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${byType.year}-${byType.month}-${byType.day}T${byType.hour}:${byType.minute}`;
}

export function greeting() {
  const hour = Number(
    new Intl.DateTimeFormat("en-ZA", {
      timeZone: "Africa/Johannesburg",
      hour: "2-digit",
      hourCycle: "h23",
    }).format(new Date()),
  );

  if (hour < 5) return "Still awake";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

const dailyPrompts = [
  "What tiny thing made you think of me today?",
  "What ordinary moment should we never forget?",
  "Where should our next unplanned drive end?",
  "What is one thing I do that feels like home?",
  "Which song belongs in the soundtrack of us?",
  "What would make this weekend feel properly ours?",
  "What are you proud of us for lately?",
  "What should we cook, order, or completely improvise tonight?",
  "What is one memory that still makes you laugh out loud?",
  "What do you want more of in our next hundred days?",
];

export function promptOfTheDay() {
  const day = Math.floor(Date.now() / 86_400_000);
  return dailyPrompts[day % dailyPrompts.length];
}

export function posterGradient(seed: string) {
  const palettes = [
    ["#163a32", "#d98f84"],
    ["#7e5e69", "#f0bf8e"],
    ["#315f59", "#c8d8bb"],
    ["#8a5a44", "#f1d5b5"],
    ["#23364f", "#b7a0ca"],
    ["#5b3d52", "#d6a5a1"],
  ];
  const score = Array.from(seed).reduce((sum, character) => sum + character.charCodeAt(0), 0);
  const [from, to] = palettes[score % palettes.length];
  return `linear-gradient(145deg, ${from}, ${to})`;
}
