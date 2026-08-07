import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Camera, Heart, Sparkles } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { RealtimeRefresh } from "@/components/realtime-refresh";
import {
  daysTogether,
  formatDate,
  getSignedPhotoUrl,
  requireLoveHubContext,
} from "@/lib/love-hub";

export const metadata: Metadata = {
  title: "Our story",
};

export default async function StoryPage() {
  const context = await requireLoveHubContext();

  const [{ data: members }, { data: memories, error }] = await Promise.all([
    context.supabase
      .from("love_hub_members")
      .select("display_name, joined_at")
      .eq("household_id", context.household.id)
      .order("joined_at"),
    context.supabase
      .from("love_hub_memories")
      .select("id, title, story, happened_on, photo_path, is_favourite, created_at")
      .eq("household_id", context.household.id)
      .order("happened_on", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true }),
  ]);

  if (error) throw new Error(error.message);

  const timeline = await Promise.all(
    (memories ?? []).map(async (memory) => ({
      ...memory,
      photoUrl: await getSignedPhotoUrl(context.supabase, memory.photo_path),
    })),
  );

  const favourites = timeline.filter((memory) => memory.is_favourite).length;
  const totalDays = daysTogether(context.household.relationship_started_on);

  return (
    <AppShell
      context={context}
      active="story"
      memberNames={members?.map((member) => member.display_name)}
    >
      <RealtimeRefresh householdId={context.household.id} tables={["love_hub_memories"]} />

      <section className="story-hero">
        <div className="story-rings" />
        <div>
          <p className="eyebrow light"><Sparkles size={15} /> RAPHA + MINETTE</p>
          <h1>It looked like home from the beginning.</h1>
          <blockquote>“Soulmate from the first date. Love you most. Plus one.”</blockquote>
        </div>
        <div className="story-date">
          <span>TOGETHER SINCE</span>
          <strong>{formatDate(context.household.relationship_started_on, { day: "numeric", month: "long", year: "numeric" })}</strong>
          <small>{totalDays.toLocaleString("en-ZA")} days and counting</small>
        </div>
      </section>

      <section className="story-stats">
        <article><strong>{timeline.length}</strong><span>memories saved</span></article>
        <article><strong>{favourites}</strong><span>all-time favourites</span></article>
        <article><strong>{members?.length ?? 1}</strong><span>people building this home</span></article>
      </section>

      <section className="section-block">
        <div className="section-title-row">
          <div>
            <p className="eyebrow">THE TIMELINE</p>
            <h2>Our story, one moment at a time.</h2>
          </div>
          <Link className="primary-button" href="/memories#new"><Camera size={16} /> Add a chapter</Link>
        </div>

        {timeline.length ? (
          <div className="timeline">
            <article className="timeline-item timeline-origin">
              <div className="timeline-dot"><Heart size={17} fill="currentColor" /></div>
              <div className="timeline-date">{formatDate(context.household.relationship_started_on)}</div>
              <div className="timeline-card">
                <p className="eyebrow">THE BEGINNING</p>
                <h3>The first day of us.</h3>
                <p>Everything before this was the route. Everything after became the story.</p>
              </div>
            </article>

            {timeline.map((memory, index) => (
              <article className="timeline-item" key={memory.id}>
                <div className="timeline-dot">{index + 1}</div>
                <div className="timeline-date">{formatDate(memory.happened_on ?? memory.created_at)}</div>
                <div className={memory.photoUrl ? "timeline-card with-photo" : "timeline-card"}>
                  {memory.photoUrl ? (
                    <div
                      className="timeline-photo"
                      style={{ backgroundImage: `url("${memory.photoUrl}")` }}
                      role="img"
                      aria-label={memory.title}
                    />
                  ) : null}
                  <div>
                    {memory.is_favourite ? <span className="favourite-badge"><Heart size={13} fill="currentColor" /> Favourite</span> : null}
                    <h3>{memory.title}</h3>
                    {memory.story ? <p>{memory.story}</p> : null}
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <section className="empty-state">
            <span className="empty-icon"><Heart /></span>
            <h2>The beginning is already here.</h2>
            <p>Add the first memory and let the timeline grow naturally from there.</p>
            <Link className="primary-button" href="/memories#new">Add first memory <ArrowRight size={16} /></Link>
          </section>
        )}
      </section>
    </AppShell>
  );
}
