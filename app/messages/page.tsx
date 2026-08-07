import type { Metadata } from "next";
import {
  Heart,
  MessageCircleHeart,
  Send,
  Sparkles,
  Trash2,
} from "lucide-react";
import { createMessage, deleteMessage } from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { RealtimeRefresh } from "@/components/realtime-refresh";
import { formatDateTime, promptOfTheDay, requireLoveHubContext } from "@/lib/love-hub";

export const metadata: Metadata = {
  title: "Private notes",
};

type MessagesPageProps = {
  searchParams: Promise<{ error?: string; sent?: string }>;
};

export default async function MessagesPage({ searchParams }: MessagesPageProps) {
  const context = await requireLoveHubContext();
  const params = await searchParams;

  const [{ data: members }, { data: messages, error }] = await Promise.all([
    context.supabase
      .from("love_hub_members")
      .select("user_id, display_name")
      .eq("household_id", context.household.id)
      .order("joined_at"),
    context.supabase
      .from("love_hub_messages")
      .select("id, body, author_id, created_at")
      .eq("household_id", context.household.id)
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  if (error) throw new Error(error.message);

  const names = new Map((members ?? []).map((member) => [member.user_id, member.display_name]));
  const ordered = [...(messages ?? [])].reverse();

  return (
    <AppShell
      context={context}
      active="messages"
      memberNames={members?.map((member) => member.display_name)}
    >
      <RealtimeRefresh householdId={context.household.id} tables={["love_hub_messages"]} />

      <section className="page-header messages-header">
        <div>
          <p className="eyebrow"><Sparkles size={15} /> JUST BETWEEN US</p>
          <h1>Love notes, honest thoughts and silly little messages.</h1>
          <p>Not a chat app trying to replace your conversations. A place for the words worth keeping.</p>
        </div>
      </section>

      {params.error ? <div className="notice notice-error page-notice">{params.error}</div> : null}
      {params.sent ? <div className="notice notice-success page-notice">Your note is waiting here for both of you.</div> : null}

      <section className="message-layout">
        <aside className="note-inspiration">
          <span className="create-icon"><Heart fill="currentColor" /></span>
          <p className="eyebrow">TODAY'S OPENING LINE</p>
          <blockquote>{promptOfTheDay()}</blockquote>
          <p>Answer it. Ignore it. Write something completely different. The point is simply to say the thing.</p>
        </aside>

        <div className="message-column">
          <form action={createMessage} className="message-composer" id="new">
            <label htmlFor="message-body">Leave a private note</label>
            <textarea
              id="message-body"
              name="body"
              required
              maxLength={4000}
              placeholder="Something sweet, honest, funny, grateful, flirty or completely random…"
            />
            <div className="composer-footer">
              <span><MessageCircleHeart size={15} /> Only Love Hub members can read this.</span>
              <button className="primary-button" type="submit"><Send size={16} /> Save note</button>
            </div>
          </form>

          {ordered.length ? (
            <div className="message-stream">
              {ordered.map((message) => {
                const mine = message.author_id === context.user.id;
                const author = names.get(message.author_id) ?? "Love Hub";
                return (
                  <article className={mine ? "message-bubble mine" : "message-bubble"} key={message.id}>
                    <div className="message-meta">
                      <strong>{mine ? "You" : author}</strong>
                      <span>{formatDateTime(message.created_at)}</span>
                    </div>
                    <p>{message.body}</p>
                    {mine ? (
                      <form action={deleteMessage}>
                        <input type="hidden" name="id" value={message.id} />
                        <button className="message-delete" type="submit" aria-label="Delete note">
                          <Trash2 size={14} />
                        </button>
                      </form>
                    ) : null}
                  </article>
                );
              })}
            </div>
          ) : (
            <section className="empty-state compact-empty">
              <span className="empty-icon"><MessageCircleHeart /></span>
              <h2>The first note can be tiny.</h2>
              <p>“Thinking of you” is a perfectly good beginning.</p>
            </section>
          )}
        </div>
      </section>
    </AppShell>
  );
}
