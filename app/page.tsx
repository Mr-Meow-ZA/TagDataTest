import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Camera,
  Clapperboard,
  Compass,
  Heart,
  MessageCircleHeart,
  Plus,
  Sparkles,
  Users,
} from "lucide-react";
import { createMemory, createMessage } from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { RealtimeRefresh } from "@/components/realtime-refresh";
import {
  daysTogether,
  formatDate,
  formatDateTime,
  getSignedPhotoUrl,
  greeting,
  promptOfTheDay,
  requireLoveHubContext,
} from "@/lib/love-hub";

type HomePageProps = {
  searchParams: Promise<{ error?: string; passwordUpdated?: string }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const context = await requireLoveHubContext();
  const params = await searchParams;
  const now = new Date().toISOString();

  const [
    { data: members },
    { data: memories },
    { data: plans },
    { data: latestMessages },
    { count: watchCount },
    { count: adventureCount },
  ] = await Promise.all([
    context.supabase
      .from("love_hub_members")
      .select("user_id, display_name, role")
      .eq("household_id", context.household.id)
      .order("joined_at"),
    context.supabase
      .from("love_hub_memories")
      .select("id, title, story, happened_on, photo_path, is_favourite, created_at")
      .eq("household_id", context.household.id)
      .order("happened_on", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(4),
    context.supabase
      .from("love_hub_plans")
      .select("id, title, location, starts_at, status, includes_liam")
      .eq("household_id", context.household.id)
      .neq("status", "cancelled")
      .or(`starts_at.gte.${now},starts_at.is.null`)
      .order("starts_at", { ascending: true, nullsFirst: false })
      .limit(3),
    context.supabase
      .from("love_hub_messages")
      .select("id, body, author_id, created_at")
      .eq("household_id", context.household.id)
      .order("created_at", { ascending: false })
      .limit(1),
    context.supabase
      .from("love_hub_watchlist_items")
      .select("id", { count: "exact", head: true })
      .eq("household_id", context.household.id)
      .neq("status", "watched"),
    context.supabase
      .from("love_hub_adventures")
      .select("id", { count: "exact", head: true })
      .eq("household_id", context.household.id)
      .neq("status", "done"),
  ]);

  const latestMemory = memories?.[0] ?? null;
  const latestMemoryPhoto = await getSignedPhotoUrl(context.supabase, latestMemory?.photo_path);
  const nextPlan = plans?.[0] ?? null;
  const latestMessage = latestMessages?.[0] ?? null;
  const authorName =
    members?.find((member) => member.user_id === latestMessage?.author_id)?.display_name ??
    context.membership.display_name;
  const memberNames = members?.map((member) => member.display_name) ?? [];
  const togetherDays = daysTogether(context.household.relationship_started_on);

  return (
    <AppShell context={context} active="today" memberNames={memberNames}>
      <RealtimeRefresh
        householdId={context.household.id}
        tables={[
          "love_hub_memories",
          "love_hub_plans",
          "love_hub_messages",
          "love_hub_watchlist_items",
          "love_hub_adventures",
        ]}
      />

      {params.error ? <div className="notice notice-error page-notice">{params.error}</div> : null}
      {params.passwordUpdated ? (
        <div className="notice notice-success page-notice">Your password has been updated.</div>
      ) : null}

      <section className="home-hero">
        <div className="hero-glow hero-glow-one" />
        <div className="hero-glow hero-glow-two" />
        <div className="hero-copy">
          <p className="eyebrow light"><Sparkles size={15} /> OUR LITTLE CORNER</p>
          <h1>
            {greeting()},<br />
            <em>{context.membership.display_name}.</em>
          </h1>
          <p className="hero-lead">
            A private home for the life you are building together — the big adventures, the tiny rituals,
            and all the ordinary magic in between.
          </p>
          <div className="hero-actions">
            <Link className="light-button" href="/memories#new"><Camera size={17} /> Add a memory</Link>
            <Link className="glass-button" href="/messages#new"><MessageCircleHeart size={17} /> Leave a note</Link>
          </div>
        </div>

        <div className="hero-keepsake">
          <div
            className={latestMemoryPhoto ? "keepsake-photo has-image" : "keepsake-photo"}
            style={latestMemoryPhoto ? { backgroundImage: `url("${latestMemoryPhoto}")` } : undefined}
          >
            {!latestMemoryPhoto ? (
              <>
                <span className="silhouette silhouette-one" />
                <span className="silhouette silhouette-two" />
                <Heart className="keepsake-heart" fill="currentColor" />
              </>
            ) : null}
          </div>
          <div className="keepsake-caption">
            <span>{latestMemory ? "LATEST MEMORY" : "OUR STORY STARTS HERE"}</span>
            <strong>{latestMemory?.title ?? "Rapha + Minette"}</strong>
            <small>{latestMemory ? formatDate(latestMemory.happened_on ?? latestMemory.created_at) : "15 March 2025"}</small>
          </div>
        </div>
      </section>

      <section className="metric-strip" aria-label="Love Hub highlights">
        <article>
          <strong>{togetherDays.toLocaleString("en-ZA")}</strong>
          <span>days of choosing each other</span>
        </article>
        <article>
          <strong>{memories?.length ?? 0}</strong>
          <span>recent memories close by</span>
        </article>
        <article>
          <strong>{watchCount ?? 0}</strong>
          <span>things waiting to watch</span>
        </article>
        <article>
          <strong>{adventureCount ?? 0}</strong>
          <span>adventures still calling</span>
        </article>
      </section>

      <section className="dashboard-grid">
        <article className="feature-panel span-7 next-plan-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">NEXT LITTLE THING</p>
              <h2>{nextPlan?.title ?? "Plan something worth looking forward to"}</h2>
            </div>
            <CalendarDays size={28} />
          </div>
          {nextPlan ? (
            <div className="plan-spotlight">
              <div className="date-badge">
                <strong>{nextPlan.starts_at ? formatDate(nextPlan.starts_at, { day: "2-digit" }) : "?"}</strong>
                <span>{nextPlan.starts_at ? formatDate(nextPlan.starts_at, { month: "short" }) : "SOON"}</span>
              </div>
              <div>
                <p>{nextPlan.location || "Location still to be decided"}</p>
                <strong>{formatDateTime(nextPlan.starts_at)}</strong>
                {nextPlan.includes_liam ? <span className="pill">Liam is coming too</span> : null}
              </div>
            </div>
          ) : (
            <p className="panel-copy">
              Add a date night, beach mission, family adventure or wonderfully lazy day at home.
            </p>
          )}
          <Link className="text-link" href="/plans">Open plans <ArrowRight size={16} /></Link>
        </article>

        <article className="feature-panel span-5 note-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">LATEST NOTE</p>
              <h2>{latestMessage ? `From ${authorName}` : "Say the thing now"}</h2>
            </div>
            <MessageCircleHeart size={27} />
          </div>
          <blockquote>
            {latestMessage?.body ?? "“You are my favourite ordinary day.”"}
          </blockquote>
          <small>{latestMessage ? formatDateTime(latestMessage.created_at) : "A Love Hub classic"}</small>
          <Link className="text-link" href="/messages">Read your notes <ArrowRight size={16} /></Link>
        </article>

        <article className="feature-panel span-5 prompt-panel">
          <p className="eyebrow">QUESTION FOR US</p>
          <h2>{promptOfTheDay()}</h2>
          <details className="quick-composer">
            <summary><Plus size={16} /> Answer with a private note</summary>
            <form action={createMessage} className="stack-form compact">
              <textarea name="body" required maxLength={4000} placeholder="Write the honest, sweet, silly answer…" />
              <button className="primary-button" type="submit">Save for us</button>
            </form>
          </details>
        </article>

        <article className="feature-panel span-7 favourites-panel">
          <div>
            <p className="eyebrow">THE STUFF THAT FEELS LIKE US</p>
            <h2>Cats, beach days, wine, cards, music, gaming, naps, cuddles and lasagna on toast.</h2>
          </div>
          <div className="favourite-orbit">
            <span>🐈</span><span>🌊</span><span>🍷</span><span>🎮</span><span>🃏</span>
          </div>
        </article>
      </section>

      <section className="section-block">
        <div className="section-title-row">
          <div>
            <p className="eyebrow">QUICK START</p>
            <h2>Make today part of the story.</h2>
          </div>
          <Link className="text-link" href="/story">View our story <ArrowRight size={16} /></Link>
        </div>

        <div className="quick-grid">
          <details className="quick-card" id="quick-memory">
            <summary>
              <span className="quick-icon"><Camera /></span>
              <strong>Capture a memory</strong>
              <small>A photo, a date and the story behind it.</small>
            </summary>
            <form action={createMemory} className="stack-form compact" encType="multipart/form-data">
              <label>Title<input name="title" required maxLength={140} placeholder="The moment we…" /></label>
              <label>Date<input name="happened_on" type="date" /></label>
              <label>Story<textarea name="story" maxLength={4000} placeholder="What made it ours?" /></label>
              <label>Photo<input name="photo" type="file" accept="image/jpeg,image/png,image/webp" /></label>
              <label className="check-row"><input name="is_favourite" type="checkbox" /> Mark as a favourite</label>
              <button className="primary-button" type="submit">Save memory</button>
            </form>
          </details>

          <Link className="quick-card quick-link-card" href="/plans#new">
            <span className="quick-icon"><CalendarDays /></span>
            <strong>Plan a little adventure</strong>
            <small>Give yourselves something to look forward to.</small>
            <ArrowRight />
          </Link>

          <Link className="quick-card quick-link-card" href="/watchlist#new">
            <span className="quick-icon"><Clapperboard /></span>
            <strong>Fix the movie-night debate</strong>
            <small>Keep one shared queue and rate the winners.</small>
            <ArrowRight />
          </Link>

          <Link className="quick-card quick-link-card" href="/adventures#new">
            <span className="quick-icon"><Compass /></span>
            <strong>Dream bigger together</strong>
            <small>Save places, dates and family missions for later.</small>
            <ArrowRight />
          </Link>
        </div>
      </section>

      {(members?.length ?? 0) < 2 ? (
        <section className="partner-banner">
          <div className="partner-icon"><Users /></div>
          <div>
            <p className="eyebrow light">ONE LAST PIECE</p>
            <h2>Bring Minette home.</h2>
            <p>Create a secure invitation link so this becomes a genuinely shared space.</p>
          </div>
          <Link className="light-button" href="/settings#invite">Create invitation</Link>
        </section>
      ) : null}
    </AppShell>
  );
}
