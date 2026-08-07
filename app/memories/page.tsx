import type { Metadata } from "next";
import Link from "next/link";
import { Camera, Heart, ImagePlus, Pencil, Plus, Sparkles, Trash2 } from "lucide-react";
import { createMemory, deleteMemory, updateMemory } from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { RealtimeRefresh } from "@/components/realtime-refresh";
import {
  formatDate,
  getSignedPhotoUrl,
  requireLoveHubContext,
} from "@/lib/love-hub";

export const metadata: Metadata = {
  title: "Memories",
};

type MemoriesPageProps = {
  searchParams: Promise<{ error?: string; created?: string; updated?: string; deleted?: string }>;
};

export default async function MemoriesPage({ searchParams }: MemoriesPageProps) {
  const context = await requireLoveHubContext();
  const params = await searchParams;

  const [{ data: members }, { data: memories, error }] = await Promise.all([
    context.supabase
      .from("love_hub_members")
      .select("display_name")
      .eq("household_id", context.household.id)
      .order("joined_at"),
    context.supabase
      .from("love_hub_memories")
      .select("id, title, story, happened_on, photo_path, is_favourite, created_at, updated_at")
      .eq("household_id", context.household.id)
      .order("is_favourite", { ascending: false })
      .order("happened_on", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false }),
  ]);

  if (error) throw new Error(error.message);

  const withPhotos = await Promise.all(
    (memories ?? []).map(async (memory) => ({
      ...memory,
      photoUrl: await getSignedPhotoUrl(context.supabase, memory.photo_path),
    })),
  );

  return (
    <AppShell
      context={context}
      active="memories"
      memberNames={members?.map((member) => member.display_name)}
    >
      <RealtimeRefresh householdId={context.household.id} tables={["love_hub_memories"]} />

      <section className="page-header memory-header">
        <div>
          <p className="eyebrow"><Sparkles size={15} /> OUR BEAUTIFULLY ORDINARY LIFE</p>
          <h1>Memories worth keeping close.</h1>
          <p>
            The grand adventures are lovely. The tiny moments are usually the ones that become home.
          </p>
        </div>
        <a className="primary-button" href="#new"><Plus size={17} /> Add memory</a>
      </section>

      {params.error ? <div className="notice notice-error page-notice">{params.error}</div> : null}
      {params.created ? <div className="notice notice-success page-notice">Memory added to your story.</div> : null}
      {params.updated ? <div className="notice notice-success page-notice">Memory updated.</div> : null}
      {params.deleted ? <div className="notice notice-success page-notice">Memory removed.</div> : null}

      <section className="create-panel" id="new">
        <div className="create-panel-copy">
          <span className="create-icon"><ImagePlus /></span>
          <div>
            <p className="eyebrow">ADD TO OUR STORY</p>
            <h2>Save a moment before it slips away.</h2>
            <p>A photo is optional. The feeling is the important part.</p>
          </div>
        </div>
        <form action={createMemory} className="form-grid" encType="multipart/form-data">
          <label className="span-2">
            Title
            <input name="title" required maxLength={140} placeholder="The day we…" />
          </label>
          <label>
            Date
            <input name="happened_on" type="date" />
          </label>
          <label>
            Photo
            <input name="photo" type="file" accept="image/jpeg,image/png,image/webp" />
          </label>
          <label className="span-2">
            The story
            <textarea name="story" maxLength={4000} placeholder="What happened, what made you laugh, what you never want to forget…" />
          </label>
          <label className="check-row">
            <input name="is_favourite" type="checkbox" />
            This one belongs in our favourites
          </label>
          <button className="primary-button align-end" type="submit">
            <Heart size={17} /> Save memory
          </button>
        </form>
      </section>

      {withPhotos.length ? (
        <section className="memory-grid" aria-label="Saved memories">
          {withPhotos.map((memory, index) => (
            <article className={`memory-card memory-card-${(index % 4) + 1}`} key={memory.id}>
              <div
                className={memory.photoUrl ? "memory-image has-image" : "memory-image memory-placeholder"}
                style={memory.photoUrl ? { backgroundImage: `url("${memory.photoUrl}")` } : undefined}
              >
                {!memory.photoUrl ? (
                  <div className="memory-placeholder-copy">
                    <Camera />
                    <span>{memory.title}</span>
                  </div>
                ) : null}
                {memory.is_favourite ? (
                  <span className="favourite-badge"><Heart size={14} fill="currentColor" /> Favourite</span>
                ) : null}
              </div>
              <div className="memory-card-body">
                <p className="eyebrow">{formatDate(memory.happened_on ?? memory.created_at)}</p>
                <h2>{memory.title}</h2>
                {memory.story ? <p>{memory.story}</p> : <p className="muted-copy">A picture in the story, waiting for a few words.</p>}

                <details className="edit-drawer">
                  <summary><Pencil size={15} /> Edit memory</summary>
                  <form action={updateMemory} className="stack-form compact" encType="multipart/form-data">
                    <input type="hidden" name="id" value={memory.id} />
                    <label>Title<input name="title" defaultValue={memory.title} required maxLength={140} /></label>
                    <label>Date<input name="happened_on" type="date" defaultValue={memory.happened_on ?? ""} /></label>
                    <label>Story<textarea name="story" defaultValue={memory.story ?? ""} maxLength={4000} /></label>
                    <label>Replace photo<input name="photo" type="file" accept="image/jpeg,image/png,image/webp" /></label>
                    <label className="check-row">
                      <input name="is_favourite" type="checkbox" defaultChecked={memory.is_favourite} />
                      Favourite
                    </label>
                    <button className="primary-button" type="submit">Save changes</button>
                  </form>
                  <form action={deleteMemory} className="danger-row">
                    <input type="hidden" name="id" value={memory.id} />
                    <button className="danger-button" type="submit"><Trash2 size={15} /> Delete memory</button>
                  </form>
                </details>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <section className="empty-state">
          <span className="empty-icon"><Camera /></span>
          <h2>Your first memory is waiting.</h2>
          <p>Start with the one that already makes both of you smile.</p>
          <Link className="primary-button" href="#new">Add the first one</Link>
        </section>
      )}
    </AppShell>
  );
}
