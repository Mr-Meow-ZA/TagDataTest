import type { Metadata } from "next";
import {
  Clapperboard,
  Film,
  Pencil,
  Play,
  Plus,
  Sparkles,
  Star,
  Trash2,
  Tv,
} from "lucide-react";
import {
  createWatchlistItem,
  deleteWatchlistItem,
  updateWatchlistItem,
} from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { RealtimeRefresh } from "@/components/realtime-refresh";
import { posterGradient, requireLoveHubContext } from "@/lib/love-hub";

export const metadata: Metadata = {
  title: "Watchlist",
};

type WatchlistPageProps = {
  searchParams: Promise<{ error?: string; created?: string; updated?: string; deleted?: string }>;
};

export default async function WatchlistPage({ searchParams }: WatchlistPageProps) {
  const context = await requireLoveHubContext();
  const params = await searchParams;

  const [{ data: members }, { data: items, error }] = await Promise.all([
    context.supabase
      .from("love_hub_members")
      .select("display_name")
      .eq("household_id", context.household.id)
      .order("joined_at"),
    context.supabase
      .from("love_hub_watchlist_items")
      .select("id, title, media_type, status, rating, notes, created_at")
      .eq("household_id", context.household.id)
      .order("status")
      .order("created_at", { ascending: false }),
  ]);

  if (error) throw new Error(error.message);

  const waiting = (items ?? []).filter((item) => item.status === "want_to_watch");
  const watching = (items ?? []).filter((item) => item.status === "watching");
  const watched = (items ?? []).filter((item) => item.status === "watched");

  return (
    <AppShell
      context={context}
      active="watchlist"
      memberNames={members?.map((member) => member.display_name)}
    >
      <RealtimeRefresh householdId={context.household.id} tables={["love_hub_watchlist_items"]} />

      <section className="page-header watch-header">
        <div>
          <p className="eyebrow"><Sparkles size={15} /> POPCORN DIPLOMACY</p>
          <h1>One queue. Fewer “what do you want to watch?” loops.</h1>
          <p>Save the contenders, pick tonight’s winner and remember what was actually worth it.</p>
        </div>
        <a className="primary-button" href="#new"><Plus size={17} /> Add a title</a>
      </section>

      {params.error ? <div className="notice notice-error page-notice">{params.error}</div> : null}
      {params.created ? <div className="notice notice-success page-notice">Added to the queue.</div> : null}
      {params.updated ? <div className="notice notice-success page-notice">Watchlist updated.</div> : null}
      {params.deleted ? <div className="notice notice-success page-notice">Removed from the queue.</div> : null}

      <section className="create-panel" id="new">
        <div className="create-panel-copy">
          <span className="create-icon"><Clapperboard /></span>
          <div>
            <p className="eyebrow">ADD A CONTENDER</p>
            <h2>Save it now. Debate it later.</h2>
            <p>Movies, series and the shows you both swear you will finish.</p>
          </div>
        </div>
        <form action={createWatchlistItem} className="form-grid">
          <label className="span-2">
            Title
            <input name="title" required maxLength={180} placeholder="The next thing we should watch…" />
          </label>
          <label>
            Type
            <select name="media_type" defaultValue="movie">
              <option value="movie">Movie</option>
              <option value="series">Series</option>
            </select>
          </label>
          <label>
            Stage
            <select name="status" defaultValue="want_to_watch">
              <option value="want_to_watch">Want to watch</option>
              <option value="watching">Watching</option>
              <option value="watched">Watched</option>
            </select>
          </label>
          <label className="span-2">
            Why this one?
            <textarea name="notes" maxLength={4000} placeholder="Who suggested it, why it looks good, or the snack pairing it deserves…" />
          </label>
          <button className="primary-button align-end" type="submit">Add to queue</button>
        </form>
      </section>

      {watching.length ? (
        <section className="section-block">
          <div className="section-title-row">
            <div>
              <p className="eyebrow">CURRENTLY WATCHING</p>
              <h2>Press play again.</h2>
            </div>
          </div>
          <div className="poster-grid featured-posters">
            {watching.map((item) => <WatchCard item={item} key={item.id} featured />)}
          </div>
        </section>
      ) : null}

      <section className="section-block">
        <div className="section-title-row">
          <div>
            <p className="eyebrow">THE QUEUE</p>
            <h2>{waiting.length ? `${waiting.length} title${waiting.length === 1 ? "" : "s"} waiting` : "The queue is suspiciously empty"}</h2>
          </div>
        </div>
        {waiting.length ? (
          <div className="poster-grid">
            {waiting.map((item) => <WatchCard item={item} key={item.id} />)}
          </div>
        ) : (
          <div className="empty-inline">
            <Film />
            <div><strong>Add the one you keep seeing everywhere.</strong><span>Future-you can decide whether the hype was justified.</span></div>
          </div>
        )}
      </section>

      {watched.length ? (
        <section className="section-block subdued-section">
          <details open>
            <summary className="history-summary"><Star size={18} /> Watched together ({watched.length})</summary>
            <div className="poster-grid history-posters">
              {watched.map((item) => <WatchCard item={item} key={item.id} />)}
            </div>
          </details>
        </section>
      ) : null}
    </AppShell>
  );
}

type WatchItem = {
  id: string;
  title: string;
  media_type: string;
  status: string;
  rating: number | null;
  notes: string | null;
};

function WatchCard({ item, featured = false }: { item: WatchItem; featured?: boolean }) {
  return (
    <article className={featured ? "watch-card featured-watch-card" : "watch-card"}>
      <div className="poster-art" style={{ background: posterGradient(item.title) }}>
        <span className="poster-type">
          {item.media_type === "series" ? <Tv size={15} /> : <Film size={15} />}
          {item.media_type}
        </span>
        <div className="poster-title">
          {item.status === "watching" ? <Play size={20} fill="currentColor" /> : null}
          <strong>{item.title}</strong>
        </div>
      </div>
      <div className="watch-card-body">
        <div className="card-title-row">
          <span className={`status-pill status-${item.status}`}>{item.status.replaceAll("_", " ")}</span>
          {item.rating ? (
            <span className="rating">{Array.from({ length: item.rating }, (_, index) => <Star key={index} size={13} fill="currentColor" />)}</span>
          ) : null}
        </div>
        {item.notes ? <p>{item.notes}</p> : <p className="muted-copy">No persuasive pitch was provided.</p>}
        <details className="edit-drawer">
          <summary><Pencil size={15} /> Edit</summary>
          <form action={updateWatchlistItem} className="stack-form compact">
            <input type="hidden" name="id" value={item.id} />
            <label>Title<input name="title" defaultValue={item.title} required /></label>
            <label>Type
              <select name="media_type" defaultValue={item.media_type}>
                <option value="movie">Movie</option>
                <option value="series">Series</option>
              </select>
            </label>
            <label>Status
              <select name="status" defaultValue={item.status}>
                <option value="want_to_watch">Want to watch</option>
                <option value="watching">Watching</option>
                <option value="watched">Watched</option>
              </select>
            </label>
            <label>Rating
              <select name="rating" defaultValue={item.rating ?? ""}>
                <option value="">Not rated</option>
                <option value="1">1 — Regret</option>
                <option value="2">2 — Barely</option>
                <option value="3">3 — Fine</option>
                <option value="4">4 — Good</option>
                <option value="5">5 — New favourite</option>
              </select>
            </label>
            <label>Notes<textarea name="notes" defaultValue={item.notes ?? ""} /></label>
            <button className="primary-button" type="submit">Save changes</button>
          </form>
          <form action={deleteWatchlistItem} className="danger-row">
            <input type="hidden" name="id" value={item.id} />
            <button className="danger-button" type="submit"><Trash2 size={15} /> Remove</button>
          </form>
        </details>
      </div>
    </article>
  );
}
