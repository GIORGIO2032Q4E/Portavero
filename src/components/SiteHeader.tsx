"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navigaciisPunktebi = [
  { href: "/vin-check", label: "VIN check" },
  { href: "/vehicles", label: "Vehicle guide" },
  { href: "/shipping", label: "Shipping" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/account", label: "Sign in" },
];

export default function SiteHeader() {
  const mimdinareGverdi = usePathname();
  const [meniuGakhsnilia, setMenuOpen] = useState(false);

  function dakhureMeniu() {
    setMenuOpen(false);
  }

  return (
    <header className="site-header" onKeyDown={(event) => { if (event.key === "Escape") dakhureMeniu(); }}>
      <div className="header-inner">
        <Link href="/" className="brand" aria-label="Portavero home" onClick={dakhureMeniu}>
          <span className="brand-mark" aria-hidden="true">P</span>
          <span>Portavero</span>
        </Link>

        <button
          type="button"
          className="menu-toggle"
          aria-label={meniuGakhsnilia ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={meniuGakhsnilia}
          aria-controls="primary-navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span className={"menu-glyph" + (meniuGakhsnilia ? " is-open" : "")} aria-hidden="true"><span /><span /></span>
        </button>

        <nav
          id="primary-navigation"
          className={"main-nav" + (meniuGakhsnilia ? " is-open" : "")}
          aria-label="Main navigation"
        >
          {navigaciisPunktebi.map((item) => {
            const active = mimdinareGverdi === item.href || mimdinareGverdi.startsWith(item.href + "/");
            return (
              <Link
                href={item.href}
                key={item.href}
                aria-current={active ? "page" : undefined}
                className={active ? "nav-link is-active" : "nav-link"}
                onClick={dakhureMeniu}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <Link href="/vin-check" className="button button-small button-dark header-cta" onClick={dakhureMeniu}>
          Start with VIN <span aria-hidden="true">↗</span>
        </Link>
      </div>
    </header>
  );
}
