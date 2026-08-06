import { CalendarDays, Camera, Clapperboard, Heart, Map, MessageCircle, Plus, Sparkles } from "lucide-react";

const nav = [
  [Heart, "Today"], [Camera, "Memories"], [CalendarDays, "Plans"],
  [Clapperboard, "Watchlist"], [Map, "Adventures"], [MessageCircle, "Messages"],
] as const;

const cards = [
  { eyebrow: "NEXT UP", title: "Plan our weekend", copy: "Beach weather, wine tasting, or a cosy movie day?", icon: CalendarDays },
  { eyebrow: "LATEST MEMORY", title: "A little ordinary magic", copy: "Save the tiny moments we never want to forget.", icon: Camera },
  { eyebrow: "OUR WATCHLIST", title: "Pick tonight's movie", copy: "Popcorn, Astros and one shared decision.", icon: Clapperboard },
  { eyebrow: "LEAVE A NOTE", title: "Something for Snoppie", copy: "A private message waiting only for her.", icon: MessageCircle },
];

export default function HomePage() {
  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#today"><span>R</span><strong>Love You Most +1</strong><span>M</span></a>
        <nav className="desktop-nav" aria-label="Primary navigation">
          {nav.map(([Icon, label]) => <a key={label} href={`#${label.toLowerCase()}`}><Icon size={17}/>{label}</a>)}
        </nav>
        <button className="avatar" aria-label="Open profile">R+M</button>
      </header>

      <section className="hero" id="today">
        <div className="hero-copy">
          <p className="kicker"><Sparkles size={15}/> OUR LITTLE CORNER OF THE WORLD</p>
          <h1>Good morning,<br/><em>my favourite person.</em></h1>
          <p>One shared place for our memories, plans, messages, movies and all the beautifully ordinary parts of us.</p>
          <div className="hero-actions"><button><Plus size={17}/> Add a memory</button><a href="#plans">Plan something</a></div>
        </div>
        <div className="love-card">
          <p>TOGETHER SINCE</p><strong>15 March 2025</strong>
          <div className="divider"/>
          <blockquote>“Soulmate from the first date. Love you most. Plus one.”</blockquote>
          <span>Rapha, Minette &amp; Liam — our little family</span>
        </div>
      </section>

      <section className="content">
        <div className="section-heading"><div><p>OUR SHARED HOME</p><h2>Everything that makes us, us.</h2></div><a href="#story">View our story →</a></div>
        <div className="card-grid">
          {cards.map(({eyebrow,title,copy,icon:Icon}) => <article className="feature-card" key={title}><div className="icon"><Icon/></div><p>{eyebrow}</p><h3>{title}</h3><span>{copy}</span><button>Open →</button></article>)}
        </div>

        <section className="weekend" id="plans">
          <div><p>THIS WEEKEND</p><h2>What should we do?</h2><span>Three ideas picked for us.</span></div>
          <div className="idea"><b>01</b><div><strong>Beach, blanket &amp; snacks</strong><span>Golden hour in Strand or Gordon's Bay.</span></div></div>
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
