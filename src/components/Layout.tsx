import { SignInButton } from "@/components/InternetIdentity";
import { cn } from "@/lib/utils";
import { Link, useRouterState } from "@tanstack/react-router";
import { BookOpenText, MonitorPlay, Settings, Sparkles } from "lucide-react";
import type { ReactNode } from "react";

type NavItem = {
  to: string;
  label: string;
  icon: typeof BookOpenText;
  ocid: string;
};

const navItems: NavItem[] = [
  { to: "/", label: "Sermões", icon: BookOpenText, ocid: "nav.sermons.link" },
  {
    to: "/projecao",
    label: "Projeção",
    icon: MonitorPlay,
    ocid: "nav.holyrics.link",
  },
  {
    to: "/configuracoes",
    label: "Configurações",
    icon: Settings,
    ocid: "nav.settings.link",
  },
];

function NavLink({ item }: { item: NavItem }) {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const isActive =
    item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
  const Icon = item.icon;
  return (
    <Link
      to={item.to}
      data-ocid={item.ocid}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-smooth",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        isActive
          ? "bg-sidebar-accent text-primary shadow-subtle"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
      )}
    >
      <Icon
        className={cn(
          "size-4 shrink-0 transition-colors",
          isActive
            ? "text-primary"
            : "text-muted-foreground group-hover:text-foreground",
        )}
        aria-hidden="true"
      />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const year = new Date().getFullYear();
  return (
    <div className="flex min-h-dvh bg-background text-foreground">
      <aside
        data-ocid="app.sidebar"
        className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex"
      >
        <div className="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-6">
          <Sparkles className="size-5 text-primary" aria-hidden="true" />
          <span className="font-display text-xl font-semibold tracking-tight text-gradient-gold">
            Kerigma
          </span>
        </div>
        <nav
          aria-label="Navegação principal"
          className="flex flex-1 flex-col gap-1 p-3"
        >
          {navItems.map((item) => (
            <NavLink key={item.to} item={item} />
          ))}
        </nav>
        <div className="border-t border-sidebar-border p-3">
          <SignInButton className="w-full rounded-lg border border-sidebar-border px-3 py-2 text-sm font-medium text-sidebar-foreground/80 transition-smooth hover:border-primary/50 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-60" />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-border bg-card/95 px-4 backdrop-blur md:px-8">
          <span className="font-display text-lg font-semibold text-gradient-gold md:hidden">
            Kerigma
          </span>
          <nav
            aria-label="Navegação principal"
            className="flex flex-1 items-center gap-1 overflow-x-auto md:hidden"
          >
            {navItems.map((item) => (
              <NavLink key={item.to} item={item} />
            ))}
          </nav>
          <div className="ml-auto hidden items-center gap-3 md:flex">
            <SignInButton className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground transition-smooth hover:border-primary/50 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-60" />
          </div>
        </header>

        <main className="atmosphere flex-1 px-4 py-6 md:px-8 md:py-8">
          {children}
        </main>

        <footer className="border-t border-border bg-card px-4 py-4 text-center text-xs text-muted-foreground md:px-8">
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-primary"
          >
            © {year}. Built with love using caffeine.ai
          </a>
        </footer>
      </div>
    </div>
  );
}
