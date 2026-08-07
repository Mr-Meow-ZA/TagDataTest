import type { Metadata } from "next";
import {
  CalendarDays,
  Check,
  Clock3,
  MapPin,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";
import {
  createPlan,
  deletePlan,
  setPlanStatus,
  updatePlan,
} from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { RealtimeRefresh } from "@/components/realtime-refresh";
import {
  formatDateTime,
  requireLoveHubContext,
  toDateTimeLocal,
} from "@/lib/love-hub";

export const metadata: Metadata = {
  title: "Plans",
};

type PlansPageProps = {
  searchParams: Promise<{ error?: string; created?: string; updated?: string; deleted?: string }>;
};

export default async function PlansPage({ searchParams }: PlansPageProps) {
  const context = await requireLoveHubContext();
  const params = await searchParams;

  const [{ data: members }, { data: plans, error }] = await Promise.all([
    context.supabase
      .from("love_hub_members")
      .select("display_name")
      .eq("household_id", context.household.id)
      .order("joined_at"),
    context.supabase
      .from("love_hub_plans")
      .select("id, title, notes, location, starts_at, ends_at, status, includes_liam, created_at")
      .eq("household_id", context.household.id)
      .order("starts_at", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false }),
  ]);

  if (error) throw new Error(error.message);

  const upcoming = (plans ?? []).filter((plan) => plan.status === "planned");
  const ideas = (plans ?? []).filter((plan) => plan.status === "idea");
  const done = (plans ?? []).filter((plan) => plan.status === "done");
  const cancelled = (plans ?? []).filter((plan) => plan.status === "cancelled");

  return (
    <AppShell
      context={context}
      active="plans"
      memberNames={members?.map((member) => member.display_name)}
    >
      <RealtimeRefresh householdId={context.household.id} tables={["love_hub_plans"]} />

      <section className="page-header plans-header">
        <div>
          <p className="eyebrow"><Sparkles size={15} /> THINGS TO LOOK FORWARD TO</p>
          <h1>Plans for the two of you — and the three of you.</h1>
          <p>Date nights, family missions, lazy Sundays and ideas that are not ready to become dates yet.</p>
        </div>
        <a className="primary-button" href="#new"><Plus size={17} /> Add a plan</a>
      </section>

      {params.error ? <div className="notice notice-error page-notice">{params.error}</div> : null}
      {params.created ? <div className="notice notice-success page-notice">Plan added.</div> : null}
      {params.updated ? <div className="notice notice-success page-notice">Plan updated.</div> : null}
      {params.deleted ? <div className="notice notice-success page-notice">Plan removed.</div> : null}

      <section className="create-panel" id="new">
        <div className="create-panel-copy">
          <span className="create-icon"><CalendarDays /></span>
          <div>
            <p className="eyebrow">PUT IT ON OUR HORIZON</p>
            <h2>Give the next good day somewhere to begin.</h2>
            <p>Leave the date blank to keep it as an idea.</p>
          </div>
        </div>
        <form action={createPlan} className="form-grid">
          <label className="span-2">
            Plan
            <input name="title" required maxLength={160} placeholder="Sunset picnic, movie night, mystery drive…" />
          </label>
          <label>
            Starts
            <input name="starts_at" type="datetime-local" />
          </label>
          <label>
            Ends
            <input name="ends_at" type="datetime-local" />
          </label>
          <label className="span-2">
            Location
            <input name="location" maxLength={240} placeholder="Strand, Stellenbosch, home…" />
          </label>
          <label>
            Stage
            <select name="status" defaultValue="idea">
              <option value="idea">Idea</option>
              <option value="planned">Planned</option>
            </select>
          </label>
          <label className="check-row align-center">
            <input name="includes_liam" type="checkbox" />
            Liam is part of this one
          </label>
          <label className="span-2">
            Notes
            <textarea name="notes" maxLength={4000} placeholder="What should we bring, book, remember or avoid?" />
          </label>
          <button className="primary-button align-end" type="submit">Save plan</button>
        </form>
      </section>

      <section className="section-block">
        <div className="section-title-row">
          <div>
            <p className="eyebrow">COMING UP</p>
            <h2>{upcoming.length ? `${upcoming.length} plan${upcoming.length === 1 ? "" : "s"} on the calendar` : "Nothing fixed yet"}</h2>
          </div>
        </div>
        {upcoming.length ? (
          <div className="plan-list">
            {upcoming.map((plan) => (
              <PlanCard plan={plan} key={plan.id} />
            ))}
          </div>
        ) : (
          <div className="empty-inline">
            <CalendarDays />
            <div><strong>Choose one idea and give it a date.</strong><span>Anticipation is half the fun.</span></div>
          </div>
        )}
      </section>

      <section className="section-block">
        <div className="section-title-row">
          <div>
            <p className="eyebrow">MAYBE, SOMEDAY, DEFINITELY</p>
            <h2>The idea garden.</h2>
          </div>
        </div>
        {ideas.length ? (
          <div className="idea-grid">
            {ideas.map((plan) => (
              <PlanCard plan={plan} key={plan.id} compact />
            ))}
          </div>
        ) : (
          <div className="empty-inline">
            <Sparkles />
            <div><strong>No loose ideas yet.</strong><span>Save the next “we should totally…” before it disappears.</span></div>
          </div>
        )}
      </section>

      {done.length || cancelled.length ? (
        <section className="section-block subdued-section">
          <details>
            <summary className="history-summary">
              <Check size={18} /> Past plans ({done.length + cancelled.length})
            </summary>
            <div className="idea-grid history-grid">
              {[...done, ...cancelled].map((plan) => (
                <PlanCard plan={plan} key={plan.id} compact />
              ))}
            </div>
          </details>
        </section>
      ) : null}
    </AppShell>
  );
}

type PlanCardProps = {
  plan: {
    id: string;
    title: string;
    notes: string | null;
    location: string | null;
    starts_at: string | null;
    ends_at: string | null;
    status: string;
    includes_liam: boolean;
  };
  compact?: boolean;
};

function PlanCard({ plan, compact = false }: PlanCardProps) {
  return (
    <article className={compact ? "plan-card compact-card" : "plan-card"}>
      <div className="plan-date-block">
        <CalendarDays size={19} />
        <strong>{plan.starts_at ? formatDateTime(plan.starts_at) : "Date to be decided"}</strong>
        {plan.ends_at ? <small>Until {formatDateTime(plan.ends_at)}</small> : null}
      </div>
      <div className="plan-main">
        <div className="card-title-row">
          <div>
            <span className={`status-pill status-${plan.status}`}>{plan.status}</span>
            <h3>{plan.title}</h3>
          </div>
          {plan.includes_liam ? <span className="liam-pill"><Users size={14} /> Family plan</span> : null}
        </div>
        {plan.location ? <p className="meta-line"><MapPin size={15} /> {plan.location}</p> : null}
        {plan.notes ? <p className="card-copy">{plan.notes}</p> : null}

        <div className="card-actions">
          {plan.status !== "done" ? (
            <form action={setPlanStatus}>
              <input type="hidden" name="id" value={plan.id} />
              <input type="hidden" name="status" value={plan.status === "idea" ? "planned" : "done"} />
              <button className="soft-button" type="submit">
                {plan.status === "idea" ? <><Clock3 size={15} /> Put on calendar</> : <><Check size={15} /> Mark done</>}
              </button>
            </form>
          ) : null}
          <details className="edit-drawer inline-drawer">
            <summary><Pencil size={15} /> Edit</summary>
            <form action={updatePlan} className="stack-form compact">
              <input type="hidden" name="id" value={plan.id} />
              <label>Title<input name="title" defaultValue={plan.title} required /></label>
              <label>Starts<input name="starts_at" type="datetime-local" defaultValue={toDateTimeLocal(plan.starts_at)} /></label>
              <label>Ends<input name="ends_at" type="datetime-local" defaultValue={toDateTimeLocal(plan.ends_at)} /></label>
              <label>Location<input name="location" defaultValue={plan.location ?? ""} /></label>
              <label>Status
                <select name="status" defaultValue={plan.status}>
                  <option value="idea">Idea</option>
                  <option value="planned">Planned</option>
                  <option value="done">Done</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </label>
              <label>Notes<textarea name="notes" defaultValue={plan.notes ?? ""} /></label>
              <label className="check-row">
                <input name="includes_liam" type="checkbox" defaultChecked={plan.includes_liam} />
                Liam is coming
              </label>
              <button className="primary-button" type="submit">Save changes</button>
            </form>
            <form action={deletePlan} className="danger-row">
              <input type="hidden" name="id" value={plan.id} />
              <button className="danger-button" type="submit"><Trash2 size={15} /> Delete</button>
            </form>
          </details>
        </div>
      </div>
    </article>
  );
}
