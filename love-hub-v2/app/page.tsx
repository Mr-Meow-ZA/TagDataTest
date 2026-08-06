import { CalendarDays, Camera, Clapperboard, Heart, Map, MessageCircle, Plus, Sparkles } from "lucide-react";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { signOut } from "./login/actions";

const nav = [
  [Heart, "Today"], [Camera, "Memories"], [CalendarDays, "Plans"],
  [Clapperboard, "Watchlist"], [Map, "Adventures"], [MessageCircle, "Messages"],
] as const;

export default async function HomePage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: membership } = await supabase
    .from("love_hub_members")
    .select("household_id, display_name, role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) {
    return (
      <main className="access-pending">
        <Heart />
        <h1>Your account is signed in, but it has not been added to Love Hub.</h1>
        <form action={signOut}><button type="submit">Sign out</button></form>
      </main>
    );
  }

  const [{ data: household }, memories, plans, watchlist, messages] = await Promise.all([
    supabase
      .from("love_hub_households")
      .select("name, relationship_started_on")
      .eq("id", membership.household_id)
      .single(),
    supabase.from("love_hub_memories").select("id", { count: "exact", head: true }).eq("household_id", membership.household_id),
    supabase.from("love_hub_plans").select("id", { count: "exact", head: true }).eq("household_id", membership.household_id),
    supabase.from("love_hub_watchlist_items").select("id", { count: "exact", head: true }).eq("household_id", membership.household_id),
    supabase.from("love_hub_messages").select("id", { count: "exact", head: true }).eq("household_id", membership.household_id),
  ]);

  const cards = [
    { eyebrow: "PLANS", title: plans.count ? `${plans.count} shared plan${plans.count === 1 ? "" : "s"}` : "Plan our weekend", copy: "Beach weather, wine tasting, or a cosy movie day?", icon: CalendarDays },
    { eyebrow: "MEMORIES", title: memories.count ? `${memories.count} saved memor${memories.count === 1 ? "y" : "ies"}` : "Save our first memory", copy: "Keep the tiny moments we never want to forget.", icon: Camera },
    { eyebrow: "WATCHLIST", title: watchlist.count ? `${watchlist.count} title${watchlist.count === 1 ? "" : "s"} waiting` : "Pick tonight's movie", copy: "Popcorn, Astros and one shared decision.", icon: Clapperboard },
    { eyebrow: "MESSAGES", title: messages.count ? `${messages.count} private note${messages.count === 1 ? "" : "s"}` : "Something for Snoppie", copy: "A private message waiting only for her.", icon: MessageCircle },
  ];

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#today"><span>R</span><strong>Love You Most +1</strong><span>M</span></a>
        <nav className="desktop-nav" aria-label="Primary navigation">
          {nav.map(([Icon, label]) => <a key={label} href={`#${label.toLowerCase()}`}><Icon size={17}/>{label}</a>)}
        </nav>
        <form action={signOut}><button className="avatar" type="submit" aria-label="Sign out">{membership.display_name.slice(0, 1)}+M</button></form>
      </header>

      <section className="hero" id="today">
        <div className="hero-copy">
          <p className="kicker"><Sparkles size={15}/> PRIVATE · {membership.role.toUpperCase()}</p>
          <h1>Welcome home,<br/><em>{membership.display_name}.</em></h1>
          <p>One shared place for our memories, plans, messages, movies and all the beautifully ordinary parts of us.</p>
          <div className="hero-actions"><button><Plus size={17}/> Add a memory</button><a href="#plans">Plan something</a></div>
        </div>
        <div className="love-card">
          <p>TOGETHER SINCE</p><strong>{household?.relationship_started_on ?? "15 March 2025"}</strong>
          <div className="divider"/>
          <blockquote>“Soulmate from the first date. Love you most. Plus one.”</blockquote>
          <span>{household?.name ?? "Rapha & Minette"} — our little family with Liam</span>
        </div>
      </section>

      <section className="content">
        <div className="section-heading"><div><p>OUR SHARED HOME</p><h2>Everything that makes us, us.</h2></div><a href="#story">View our story →</a></div>
        <div className="card-grid">
          {cards.map(({eyebrow,title,copy,icon:Icon}) => <article className="feature-card" key={eyebrow}><div className="icon"><Icon/></div><p>{eyebrow}</p><h3>{title}</h3><span>{copy}</span><button>Open →</button></article>)}
        </div>

        <section className="weekend" id="plans">
          <div><p>THIS WEEKEND</p><h2>What should we do?</h2><span>Three ideas picked for us.</span></div>
          <div className="idea"><b>01</b><div><strong>Beach, blanket &amp; snacks</strong><span>Golden hour in Strand or Gordon&apos;s Bay.</span></div></div>
          <div className="idea"><b>02</b><div><strong>Stellenbosch wine date</strong><span>One new farm, one old favourite.</span></div></div>
          <div className="idea"><b>03</b><div><strong>Family adventure with Liam</strong><span>Games, treats and something worth remembering.</span></div></div>
        </section>
      </section>

      <nav className="mobile-nav" aria-label="Mobile navigation">
        {nav.slice(0,5).map(([Icon,label]) => <a key={label} href={`#${label.toLowerCase()}`}><Icon/><span>{label}</span></a>)}
      </nav>
    </main>
  );
}
