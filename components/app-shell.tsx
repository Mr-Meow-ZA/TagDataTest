import Link from "next/link";
import {
  CalendarDays,
  Camera,
  Clapperboard,
  Compass,
  Heart,
  Home,
  MessageCircleHeart,
  Settings,
  Sparkles,
} from "lucide-react";
import { signOut } from "@/app/login/actions";
import type { LoveHubContext } from "@/lib/love-hub";
import { daysTogether, initials } from "@/lib/love-hub";

export type AppSection =
  | "today"
  | "story"
  | "memories"
  | "plans"
  | "watchlist"
  | "adventures"
  | "messages"
  | "settings";

const navItems = [
  { id: "today", href: "/", label: "Today", icon: Home },
  { id: "story", href: "/story", label: "Our story", icon: Heart },
  { id: "memories", href: "/memories", label: "Memories", icon: Camera },
  { id: "plans", href: "/plans", label: "Plans", icon: CalendarDays },
  { id: "watchlist", href: "/watchlist", label: "Watchlist", icon: Clapperboard },
  { id: "adventures", href: "/adventures", label: "Adventures", icon: Compass },
  { id: "messages", href: "/messages", label: "Notes", icon: MessageCircleHeart },
] as const;

const mobileItems = [
  navItems[0],
  navItems[2],
  navItems[3],
  navItems[6],
  navItems[1],
] as const;

type AppShellProps = {
  context: LoveHubContext;
  active: AppSection;
  memberNames?: string[];
  children: React.ReactNode;
};

export function AppShell({ context, active, memberNames = [], children }: AppShellProps) {
  const allNames = memberNames.length ? memberNames : [context.membership.display_name];

  return (
    <div className="app-frame">
      <aside className="sidebar">
        <Link className="brand-lockup" href="/">
          <span className="brand-mark"><Heart size={19} fill="currentColor" /></span>
          <span>
            <strong>Love You Most +1</strong>
            <small>{context.household.name}</small>
          </span>
        </Link>

        <nav className="desktop-nav" aria-label="Love Hub sections">
          {navItems.map(({ id, href, label, icon: Icon }) => (
            <Link
              key={id}
              href={href}
              className={active === id ? "nav-link is-active" : "nav-link"}
              aria-current={active === id ? "page" : undefined}
            >
              <Icon size={18} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-love-note">
          <Sparkles size={18} />
          <small>Together for</small>
          <strong>{daysTogether(context.household.relationship_started_on).toLocaleString("en-ZA")} days</strong>
          <span>and still arguing about who loves who most.</span>
        </div>
      </aside>

      <div className="app-column">
        <header className="app-topbar">
          <Link className="mobile-brand" href="/">
            <Heart size={18} fill="currentColor" />
            <strong>Love Hub</strong>
          </Link>

          <div className="topbar-people" aria-label="Love Hub members">
            <div className="avatar-stack">
              {allNames.slice(0, 3).map((name, index) => (
                <span className={`avatar avatar-${(index % 3) + 1}`} key={name} title={name}>
                  {initials(name)}
                </span>
              ))}
            </div>
            <div className="topbar-copy">
              <span>Private shared home</span>
              <strong>{context.household.name}</strong>
            </div>
          </div>

          <div className="topbar-actions">
            <Link className="icon-button" href="/settings" aria-label="Open settings">
              <Settings size={19} />
            </Link>
            <form action={signOut}>
              <button className="profile-button" type="submit" title="Sign out">
                {initials(context.membership.display_name)}
              </button>
            </form>
          </div>
        </header>

        <main className="page-canvas">{children}</main>

        <nav className="mobile-nav" aria-label="Primary navigation">
          {mobileItems.map(({ id, href, label, icon: Icon }) => (
            <Link
              key={id}
              href={href}
              className={active === id ? "mobile-nav-link is-active" : "mobile-nav-link"}
              aria-current={active === id ? "page" : undefined}
            >
              <Icon size={21} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
