"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { demoMode, loadIntegrations, platform } from "@/lib/platform";
import { demoAccounts, demoPassword } from "@/lib/demo";
import { Photo } from "./catalog";
import { useAction, usePlatform, useResource } from "./platform";

export const imageTypes = "image/jpeg,image/png,image/webp,image/avif";

export function AuthForm({ signup = false }) {
  const router = useRouter();
  const { setUser } = usePlatform();
  const integrations = useResource(loadIntegrations);
  const [googleError, setGoogleError] = useState(false);
  useEffect(() => {
    setGoogleError(new URLSearchParams(window.location.search).get("oauth") === "google");
  }, []);
  const { busy, run } = useAction();
  function redirectTarget() {
    const next = new URLSearchParams(window.location.search).get("next");
    return next && /^\/(?:services\/|dashboard(?:\/|$)|profile(?:\?|$)|payment\/)/.test(next) && !next.includes("\\") ? next : "/dashboard";
  }
  function finish(user) {
    setUser(user);
    const target = redirectTarget();
    router.replace(target === "/dashboard" ? "/dashboard/" + user.role : target);
  }
  function submit(event) {
    event.preventDefault();
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    run(async () => {
      if (!signup) {
        const user = await platform.login({ email: fields.email.trim(), password: fields.password });
        if (!user) throw new Error("Your session could not be established.");
        finish(user);
        return;
      }
      if (!fields.name.trim() || !/(?=.*[a-z])(?=.*[A-Z]).{6,}/.test(fields.password)) {
        throw new Error("Enter your name and use at least six characters, including upper and lowercase letters.");
      }
      const image = fields.image.size ? await platform.upload(fields.image, "registration") : undefined;
      const user = await platform.signup({ name: fields.name.trim(), email: fields.email.trim(), password: fields.password, role: fields.role, image });
      if (user) finish(user);
      else router.replace("/sign-in");
    }, signup ? "Account created." : "Signed in.");
  }
  return <section className="wrap auth-section">
    <div className="auth-art"><Photo src="/photos/3.jpg" alt="A wedding reception with floral details" /><div><p className="eyebrow">WEDPLAN</p><h2>Make it your day.</h2></div></div>
    <div className="auth-content">
      <p className="eyebrow">{signup ? "JOIN WEDPLAN" : "WELCOME BACK"}</p>
      <h1>{signup ? "Create an account" : "Sign in"}</h1>
      <p>{signup ? "Plan your wedding or list your services." : "Pick up where you left off."}</p>
      <form className="form-stack" onSubmit={submit}>
        {signup && <label>Full name<Input name="name" autoComplete="name" maxLength={100} required /></label>}
        <label>Email address<Input name="email" type="email" autoComplete="email" required /></label>
        <label>Password<Input name="password" type="password" autoComplete={signup ? "new-password" : "current-password"} minLength={signup ? 6 : undefined} required />{signup && <small>At least 6 characters with uppercase and lowercase letters.</small>}</label>
        {signup && <><label>Account role<select name="role"><option value="customer">Customer</option><option value="vendor">Vendor</option></select></label><label>Profile image (optional)<Input type="file" accept={imageTypes} name="image" /></label></>}
        <Button disabled={busy}>{busy ? "Please wait…" : signup ? "Create account" : "Sign in"}</Button>
        {!demoMode && <>
          <Button type="button" variant="outline" disabled={busy || !integrations.data?.google} onClick={() => run(() => {
            const origin = window.location.origin;
            const errorPage = new URL(signup ? "/sign-up" : "/sign-in", origin);
            errorPage.searchParams.set("oauth", "google");
            errorPage.searchParams.set("next", redirectTarget());
            return platform.google(new URL(redirectTarget(), origin).href, errorPage.href);
          })}>Continue with Google</Button>
          {googleError && <p role="alert">Google sign-in did not complete. Try again or sign in with email.</p>}
          {integrations.error ? <div className="actions"><p>Could not check Google sign-in availability.</p><Button type="button" variant="ghost" onClick={integrations.reload}>Retry</Button></div>
            : !integrations.loading && !integrations.data?.google && <p>Google sign-in is unavailable until the site owner configures it. You can sign in with email.</p>}
        </>}
      </form>
      {demoMode && !signup && <div className="demo-accounts"><p>Try a demo account</p><div className="actions">{demoAccounts.map((account) => <Button variant="outline" key={account.id} disabled={busy} onClick={() => run(async () => finish(await platform.login({ email: account.email, password: demoPassword })), "Signed in as " + account.role + ".")}>{account.role}</Button>)}</div></div>}
      <p className="auth-switch">{signup ? "Already have an account?" : "New to WedPlan?"} <Link className="text-link" href={signup ? "/sign-in" : "/sign-up"}>{signup ? "Sign in" : "Create an account"}</Link></p>
    </div>
  </section>;
}

export function Profile() {
  const { user, refresh } = usePlatform();
  const { busy, run } = useAction();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [removePhoto, setRemovePhoto] = useState(false);
  const fileInput = useRef(null);
  useEffect(() => {
    if (!file) { setPreview(""); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function submit(event) {
    event.preventDefault();
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    run(async () => {
      if (!fields.name.trim()) throw new Error("Enter your name.");
      const image = file ? await platform.upload(file, "profile") : removePhoto ? null : user.image;
      await platform.updateProfile({ name: fields.name.trim(), phone: fields.phone.trim(), bio: fields.bio.trim(), image, ...(user.role === "vendor" ? { businessName: fields.businessName.trim() } : {}) });
      await refresh();
      setFile(null);
      setRemovePhoto(false);
      if (fileInput.current) fileInput.current.value = "";
    }, "Profile updated.");
  }
  const image = preview || (!removePhoto && user.image);
  const initials = user.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  return <div className="profile-content profile-editor">
    <h1>Profile settings</h1><p>Manage your photo, contact information and bio.</p>
    <form className="form-stack" onSubmit={submit} key={user.id}>
      <section className="panel padded profile-header">
        {image ? <Photo src={image} className="profile-avatar" alt="Profile photo preview" /> : <span className="profile-initials" aria-hidden="true">{initials}</span>}
        <div><Badge value={user.role} /><h2>{user.name}</h2><p>{user.businessName || user.email}</p></div>
      </section>
      <section className="form-stack panel padded">
        <h2>Profile photo</h2>
        <label>Choose an image<Input ref={fileInput} type="file" accept={imageTypes} name="image" onChange={(event) => {
          setFile(event.target.files?.[0] ?? null);
          setRemovePhoto(false);
        }} /><small>JPEG, PNG, WebP or AVIF, up to 5 MB.</small></label>
        {image && <Button type="button" variant="outline" onClick={() => { setFile(null); setRemovePhoto(true); if (fileInput.current) fileInput.current.value = ""; }}>Remove photo</Button>}
      </section>
      <section className="form-stack panel padded">
        <h2>Account details</h2>
        <div className="profile-fields">
          <label>Full name<Input defaultValue={user.name} name="name" autoComplete="name" maxLength={100} required /></label>
          <label>Email address<Input value={user.email} readOnly /></label>
          <label>Phone number<Input name="phone" type="tel" autoComplete="tel" defaultValue={user.phone} maxLength={32} /></label>
          {user.role === "vendor" && <label>Business name<Input name="businessName" defaultValue={user.businessName} maxLength={100} /></label>}
        </div>
        <label>About<textarea name="bio" rows={4} maxLength={1000} defaultValue={user.bio} /></label>
        <Button disabled={busy}>{busy ? "Saving…" : "Save profile"}</Button>
      </section>
    </form>
  </div>;
}
