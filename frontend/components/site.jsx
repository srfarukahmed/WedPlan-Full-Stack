"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, Instagram, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAction, usePlatform } from "./platform";
import { platform } from "@/lib/platform";
import { ThemeToggle } from "./theme";

const contact = process.env.NEXT_PUBLIC_FARUK_CONTACT_EMAIL || "faruk@wedplan.com";
const social = process.env.NEXT_PUBLIC_FARUK_SOCIAL_URL || "https://www.instagram.com/md___faruk_ahmed/";

export function Brand() {
  return <Link className="brand" href="/" aria-label="WedPlan home">
    <span className="brand-mark" aria-hidden="true">
      <img src="/wedplan-logo.webp" width="192" height="118" alt="" />
    </span>
    <span>WedPlan</span>
  </Link>;
}
function Header() {
  const path = usePathname();
  const router = useRouter();
  const { user, loading, setUser } = usePlatform();
  const { busy, run } = useAction();
  return <header className="site-header"><div className="wrap header-inner">
    <Brand />
    <nav className="main-nav" aria-label="Main navigation">
      <Link href="/" aria-current={path === "/" ? "page" : undefined}>Home</Link>
      <Link href="/services" aria-current={path.startsWith("/services") ? "page" : undefined}>Browse services</Link>
      {user && <Link href={"/dashboard/" + user.role} aria-current={path.startsWith("/dashboard") || path.startsWith("/payment") ? "page" : undefined}>Dashboard</Link>}
    </nav>
    <div className="account-nav">
      <ThemeToggle />
      {loading ? <span className="account-placeholder" /> : user ?
        <details className="account-menu" key={path} data-current={path === "/profile" || path.endsWith("/profile")}>
          <summary aria-label={"Account menu for " + user.name}>{user.image ? <img className="avatar" src={user.image} alt="" /> : <span className="avatar">{user.name?.charAt(0)}</span>}<span>{user.name}</span><ChevronDown size={15} /></summary>
          <div className="menu-panel"><p className="menu-name">{user.name}</p><Link href="/dashboard">Dashboard</Link><Link href="/profile" aria-current={path === "/profile" || path.endsWith("/profile") ? "page" : undefined}>Profile settings</Link><button disabled={busy} onClick={() => run(async () => { await platform.logout(); setUser(null); router.replace("/"); }, "Signed out.")}>Sign out</button></div>
        </details> :
        <><Link className="account-login" href="/sign-in" aria-current={path === "/sign-in" ? "page" : undefined}>Sign in</Link><Button asChild><Link className="account-signup" href="/sign-up">Sign up</Link></Button></>}
    </div>
  </div></header>;
}
function Footer() {
  return <footer className="footer"><div className="wrap">
    <div className="footer-grid">
      <div><Brand /><p>Find the people and places that make your celebration yours.</p></div>
      <div><h2>Explore</h2><Link href="/services">Browse services</Link><Link href="/sign-up">Create an account</Link></div>
      <div><h2>Contact</h2><a href={"mailto:" + contact}><Mail size={16} /> {contact}</a><a href={social} target="_blank" rel="noreferrer"><Instagram size={16} /> Instagram</a></div>
    </div>
    <div className="footer-bottom">© 2026 WedPlan by Faruk Ahmed</div>
  </div></footer>;
}
export function SiteFrame({ children }) {
  return <><a className="skip" href="#main">Skip to content</a><Header /><main id="main">{children}</main><Footer /></>;
}