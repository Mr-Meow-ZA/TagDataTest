import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
  Heart,
  KeyRound,
  Link2,
  LockKeyhole,
  Settings,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users,
} from "lucide-react";
import {
  createInvite,
  updateDisplayName,
  updateHousehold,
} from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { CopyField } from "@/components/copy-field";
import { formatDate, requireLoveHubContext } from "@/lib/love-hub";

export const metadata: Metadata = {
  title: "Settings",
};

type SettingsPageProps = {
  searchParams: Promise<{
    error?: string;
    saved?: string;
    profile?: string;
    invite?: string;
  }>;
};

async function currentOrigin() {
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const protocol = headerStore.get("x-forwarded-proto") ?? "https";
  return host ? `${protocol}://${host}` : "https://love-hub-v2-preview.vercel.app";
}

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const context = await requireLoveHubContext();
  const params = await searchParams;
  const origin = await currentOrigin();

  const { data: members, error } = await context.supabase
    .from("love_hub_members")
    .select("user_id, display_name, role, joined_at")
    .eq("household_id", context.household.id)
    .order("joined_at");

  if (error) throw new Error(error.message);

  const inviteLink = params.invite
    ? `${origin}/join?token=${encodeURIComponent(params.invite)}`
    : null;

  return (
    <AppShell
      context={context}
      active="settings"
      memberNames={members?.map((member) => member.display_name)}
    >
      <section className="page-header settings-header">
        <div>
          <p className="eyebrow"><Sparkles size={15} /> MAKE IT YOURS</p>
          <h1>The private details behind your shared home.</h1>
          <p>Manage names, dates, access and the invitation that brings Minette into Love Hub.</p>
        </div>
      </section>

      {params.error ? <div className="notice notice-error page-notice">{params.error}</div> : null}
      {params.saved ? <div className="notice notice-success page-notice">Shared settings saved.</div> : null}
      {params.profile ? <div className="notice notice-success page-notice">Your name has been updated.</div> : null}

      <section className="settings-grid">
        <article className="settings-card">
          <div className="settings-card-heading">
            <span className="settings-icon"><UserRound /></span>
            <div>
              <p className="eyebrow">YOUR PROFILE</p>
              <h2>How Love Hub greets you.</h2>
            </div>
          </div>
          <form action={updateDisplayName} className="stack-form">
            <label>
              Display name
              <input name="display_name" defaultValue={context.membership.display_name} required maxLength={80} />
            </label>
            <button className="primary-button" type="submit">Save my name</button>
          </form>
          <div className="settings-footnote">
            <KeyRound size={15} />
            <span>Need a new password? Use the reset link on the sign-in screen.</span>
          </div>
        </article>

        <article className="settings-card">
          <div className="settings-card-heading">
            <span className="settings-icon"><Heart /></span>
            <div>
              <p className="eyebrow">SHARED IDENTITY</p>
              <h2>The name and date at the heart of it.</h2>
            </div>
          </div>
          <form action={updateHousehold} className="stack-form">
            <label>
              Shared home name
              <input
                name="name"
                defaultValue={context.household.name}
                required
                maxLength={120}
                disabled={context.membership.role !== "owner"}
              />
            </label>
            <label>
              Together since
              <input
                name="relationship_started_on"
                type="date"
                defaultValue={context.household.relationship_started_on}
                required
                disabled={context.membership.role !== "owner"}
              />
            </label>
            <button
              className="primary-button"
              type="submit"
              disabled={context.membership.role !== "owner"}
            >
              Save shared settings
            </button>
          </form>
          {context.membership.role !== "owner" ? (
            <p className="muted-copy">Only the household owner can change shared settings.</p>
          ) : null}
        </article>

        <article className="settings-card span-2" id="invite">
          <div className="settings-card-heading">
            <span className="settings-icon"><Users /></span>
            <div>
              <p className="eyebrow">PEOPLE WITH A KEY</p>
              <h2>{members?.length === 1 ? "Bring Minette home." : "Your private little household."}</h2>
            </div>
          </div>

          <div className="member-list">
            {(members ?? []).map((member) => (
              <div className="member-row" key={member.user_id}>
                <span className="member-avatar">{member.display_name.slice(0, 1).toUpperCase()}</span>
                <div>
                  <strong>{member.display_name}</strong>
                  <small>Joined {formatDate(member.joined_at)} · {member.role}</small>
                </div>
                <CheckCircle2 size={20} />
              </div>
            ))}
          </div>

          {context.membership.role === "owner" ? (
            <div className="invite-box">
              <div>
                <p className="eyebrow">SECURE ONE-TIME INVITE</p>
                <h3>Create a private link for Minette.</h3>
                <p>
                  The link expires after seven days and can only be used once. It never exposes a database key or password.
                </p>
              </div>
              {inviteLink ? (
                <>
                  <CopyField value={inviteLink} />
                  <p className="invite-warning">
                    Send this link privately. Anyone holding it can join until it is used or expires.
                  </p>
                </>
              ) : (
                <form action={createInvite}>
                  <button className="primary-button" type="submit"><Link2 size={16} /> Create invitation link</button>
                </form>
              )}
            </div>
          ) : null}
        </article>

        <article className="settings-card span-2 security-card">
          <div className="settings-card-heading">
            <span className="settings-icon"><ShieldCheck /></span>
            <div>
              <p className="eyebrow">PRIVACY BY DESIGN</p>
              <h2>Your memories are not public content.</h2>
            </div>
          </div>
          <div className="security-grid">
            <div><LockKeyhole /><strong>Private sign-in</strong><span>Every page requires an authenticated Love Hub account.</span></div>
            <div><Users /><strong>Household isolation</strong><span>Row Level Security limits every record to the two of you.</span></div>
            <div><CalendarDays /><strong>Private photos</strong><span>Images live in a non-public bucket and use temporary signed links.</span></div>
            <div><Settings /><strong>No secret in the browser</strong><span>The app uses only Supabase’s publishable key; no service role is exposed.</span></div>
          </div>
        </article>
      </section>

      <section className="settings-footer">
        <div>
          <p className="eyebrow">LOVE HUB STATUS</p>
          <h2>Private, connected and still safely in preview.</h2>
          <p>The original Love Hub remains untouched until you decide this version is ready to replace it.</p>
        </div>
        <Link className="soft-button" href="/">Back home</Link>
      </section>
    </AppShell>
  );
}
