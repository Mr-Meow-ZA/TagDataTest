import type { Metadata } from "next";
import {
  Check,
  Compass,
  Map,
  MapPin,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import {
  createAdventure,
  deleteAdventure,
  updateAdventure,
} from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { RealtimeRefresh } from "@/components/realtime-refresh";
import { formatDate, requireLoveHubContext } from "@/lib/love-hub";

export const metadata: Metadata = {
  title: "Adventures",
};

type AdventuresPageProps = {
  searchParams: Promise<{ error?: string; created?: string; updated?: string; deleted?: string }>;
};

const categoryEmoji: Record<string, string> = {
  date: "♡",
  food: "🍴",
  outdoors: "☀",
  travel: "✈",
  family: "☻",
  home: "⌂",
  surprise: "✦",
};

export default async function AdventuresPage({ searchParams }: AdventuresPageProps) {
  const context = await requireLoveHubContext();
  const params = await searchParams;

  const [{ data: members }, { data: adventures, error }] = await Promise.all([
    context.supabase
      .from("love_hub_members")
      .select("display_name")
      .eq("household_id", context.household.id)
      .order("joined_at"),
    context.supabase
      .from("love_hub_adventures")
      .select("id, title, location, category, notes, status, completed_at, created_at")
      .eq("household_id", context.household.id)
      .order("status")
      .order("created_at", { ascending: false }),
  ]);

  if (error) throw new Error(error.message);

  const ideas = (adventures ?? []).filter((item) => item.status === "idea");
  const planned = (adventures ?? []).filter((item) => item.status === "planned");
  const done = (adventures ?? []).filter((item) => item.status === "done");
  const total = adventures?.length ?? 0;
  const progress = total ? Math.round((done.length / total) * 100) : 0;

  return (
    <AppShell
      context={context}
      active="adventures"
      memberNames={members?.map((member) => member.display_name)}
    >
      <RealtimeRefresh householdId={context.household.id} tables={["love_hub_adventures"]} />

      <section className="page-header adventure-header">
        <div>
          <p className="eyebrow"><Sparkles size={15} /> THE LIFE WE STILL GET TO LIVE</p>
          <h1>Big dreams, tiny missions and the next good story.</h1>
          <p>A shared bucket list for dates, drives, food, travel, home days and family adventures.</p>
        </div>
        <a className="primary-button" href="#new"><Plus size={17} /> Add adventure</a>
      </section>

      {params.error ? <div className="notice notice-error page-notice">{params.error}</div> : null}
      {params.created ? <div className="notice notice-success page-notice">Adventure saved.</div> : null}
      {params.updated ? <div className="notice notice-success page-notice">Adventure updated.</div> : null}
      {params.deleted ? <div className="notice notice-success page-notice">Adventure removed.</div> : null}

      <section className="adventure-progress-panel">
        <div className="progress-ring" style={{ "--progress": `${progress * 3.6}deg` } as React.CSSProperties}>
          <div><strong>{progress}%</strong><span>lived</span></div>
        </div>
        <div>
          <p className="eyebrow light">OUR ADVENTURE MAP</p>
          <h2>{done.length} complete · {planned.length} planned · {ideas.length} waiting</h2>
          <p>The point is not to finish the list. The point is to keep making one together.</p>
        </div>
        <Map size={72} />
      </section>

      <section className="create-panel" id="new">
        <div className="create-panel-copy">
          <span className="create-icon"><Compass /></span>
          <div>
            <p className="eyebrow">ADD TO THE MAP</p>
            <h2>Save the next “we should do that”.</h2>
            <p>It can be ambitious, ridiculous, romantic or wonderfully low effort.</p>
          </div>
        </div>
        <form action={createAdventure} className="form-grid">
          <label className="span-2">
            Adventure
            <input name="title" required maxLength={180} placeholder="Sunrise breakfast, mystery drive, weekend away…" />
          </label>
          <label>
            Category
            <select name="category" defaultValue="date">
              <option value="date">Date</option>
              <option value="food">Food</option>
              <option value="outdoors">Outdoors</option>
              <option value="travel">Travel</option>
              <option value="family">Family</option>
              <option value="home">At home</option>
              <option value="surprise">Surprise</option>
            </select>
          </label>
          <label>
            Stage
            <select name="status" defaultValue="idea">
              <option value="idea">Idea</option>
              <option value="planned">Planned</option>
              <option value="done">Done</option>
            </select>
          </label>
          <label className="span-2">
            Location
            <input name="location" maxLength={240} placeholder="A place, a neighbourhood, or 'wherever the road goes'" />
          </label>
          <label className="span-2">
            Notes
            <textarea name="notes" maxLength={4000} placeholder="What makes this one worth doing?" />
          </label>
          <button className="primary-button align-end" type="submit">Save adventure</button>
        </form>
      </section>

      {planned.length ? (
        <section className="section-block">
          <div className="section-title-row">
            <div><p className="eyebrow">NEXT ON THE MAP</p><h2>Ready to become real.</h2></div>
          </div>
          <div className="adventure-grid featured-adventures">
            {planned.map((item) => <AdventureCard item={item} key={item.id} />)}
          </div>
        </section>
      ) : null}

      <section className="section-block">
        <div className="section-title-row">
          <div><p className="eyebrow">THE BUCKET LIST</p><h2>{ideas.length ? "Where should we go next?" : "The map needs a few pins"}</h2></div>
        </div>
        {ideas.length ? (
          <div className="adventure-grid">
            {ideas.map((item) => <AdventureCard item={item} key={item.id} />)}
          </div>
        ) : (
          <div className="empty-inline">
            <Compass />
            <div><strong>Add one easy thing and one wildly optimistic thing.</strong><span>A good shared list needs both.</span></div>
          </div>
        )}
      </section>

      {done.length ? (
        <section className="section-block subdued-section">
          <details open>
            <summary className="history-summary"><Check size={18} /> Adventures lived ({done.length})</summary>
            <div className="adventure-grid history-grid">
              {done.map((item) => <AdventureCard item={item} key={item.id} />)}
            </div>
          </details>
        </section>
      ) : null}
    </AppShell>
  );
}

type Adventure = {
  id: string;
  title: string;
  location: string | null;
  category: string;
  notes: string | null;
  status: string;
  completed_at: string | null;
};

function AdventureCard({ item }: { item: Adventure }) {
  return (
    <article className="adventure-card">
      <div className="adventure-number">{categoryEmoji[item.category] ?? "✦"}</div>
      <div>
        <div className="card-title-row">
          <span className={`status-pill status-${item.status}`}>{item.status}</span>
          {item.completed_at ? <small>{formatDate(item.completed_at)}</small> : null}
        </div>
        <h3>{item.title}</h3>
        {item.location ? <p className="meta-line"><MapPin size={15} /> {item.location}</p> : null}
        {item.notes ? <p className="card-copy">{item.notes}</p> : null}
      </div>
      <details className="edit-drawer">
        <summary><Pencil size={15} /> Edit</summary>
        <form action={updateAdventure} className="stack-form compact">
          <input type="hidden" name="id" value={item.id} />
          <label>Title<input name="title" defaultValue={item.title} required /></label>
          <label>Location<input name="location" defaultValue={item.location ?? ""} /></label>
          <label>Category
            <select name="category" defaultValue={item.category}>
              <option value="date">Date</option>
              <option value="food">Food</option>
              <option value="outdoors">Outdoors</option>
              <option value="travel">Travel</option>
              <option value="family">Family</option>
              <option value="home">At home</option>
              <option value="surprise">Surprise</option>
            </select>
          </label>
          <label>Status
            <select name="status" defaultValue={item.status}>
              <option value="idea">Idea</option>
              <option value="planned">Planned</option>
              <option value="done">Done</option>
            </select>
          </label>
          <label>Notes<textarea name="notes" defaultValue={item.notes ?? ""} /></label>
          <button className="primary-button" type="submit">Save changes</button>
        </form>
        <form action={deleteAdventure} className="danger-row">
          <input type="hidden" name="id" value={item.id} />
          <button className="danger-button" type="submit"><Trash2 size={15} /> Delete</button>
        </form>
      </details>
    </article>
  );
}
