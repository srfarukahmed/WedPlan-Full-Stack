"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LayoutGrid, CalendarDays, Layers, PlusCircle, UserRound, Users, CreditCard, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { platform } from "@/lib/platform";
import { categories, nextReviewStatuses, visible } from "@/lib/demo";
import { Gate, Loading, Problem, useAction, usePlatform, useResource } from "./platform";
import { money, Photo, vendorName } from "./catalog";
import { Profile, imageTypes } from "./account";

const overview = ["", "Overview", LayoutGrid];
const profile = ["profile", "Profile settings", UserRound];
const navigation = {
  customer: [overview, ["my-bookings", "My bookings", CalendarDays], profile],
  vendor: [overview, ["my-services", "My services", Layers], ["add-service", "Add service", PlusCircle], ["booking-requests", "Booking requests", CalendarDays], ["subscription", "Subscription", CreditCard], profile],
  admin: [overview, ["users", "Manage users", Users], ["services", "Manage services", ShieldCheck], ["transactions", "Transactions", CreditCard], profile],
};

const loadDashboard = () => platform.dashboard();
const date = (value) => value ? new Date(value.length === 10 ? value + "T12:00:00" : value).toLocaleDateString("en-BD", { dateStyle: "medium" }) : "—";
const count = (items, status) => items.filter((item) => item.status === status).length;

export function Dashboard({ segments }) {
  const [role, page = "", id] = segments;
  const knownPage = !role || ((Object.hasOwn(navigation, role) ? navigation[role] : null)?.some(([slug]) => (slug === page && !id)) || (role === "vendor" && page === "edit-service" && id));
  if (segments.length > 3 || !knownPage) return <Problem message="This dashboard page could not be found." href="/dashboard" label="Open dashboard" />;
  return <Gate role={role}><DashboardFrame page={page} id={id} /></Gate>;
}
function DashboardFrame({ page, id }) {
  const { user } = usePlatform();
  const nav = Object.hasOwn(navigation, user.role) ? navigation[user.role] : null;
  const base = "/dashboard/" + user.role;
  if (!nav) return <Problem message="No dashboard is available for this account." />;
  const current = page === "edit-service" ? "my-services" : page;
  return <div className="wrap dashboard">
    <aside className="sidebar">
      <p className="eyebrow">{user.role.toUpperCase()} DASHBOARD</p>
      <nav aria-label="Dashboard navigation">{nav.map(([slug, label, Icon]) => <Link key={slug} href={base + (slug ? "/" + slug : "")} aria-current={current === slug ? "page" : undefined}><Icon size={18} />{label}</Link>)}</nav>
    </aside>
    <div className="dashboard-main">{page === "profile" ? <Profile /> : page === "add-service" ? <ServiceForm /> : page === "subscription" ? <Subscription /> : <DashboardContent key={page + (id || "")} page={page} id={id} role={user.role} />}</div>
  </div>;
}
function DashboardContent({ page, id, role }) {
  const { data, error, loading, reload } = useResource(loadDashboard);
  if (loading && !data) return <Loading>Loading dashboard…</Loading>;
  if (error) return <Problem message={error} retry={reload} />;
  if (page === "edit-service") {
    const service = data.services.find((item) => item.id === id);
    return service ? <ServiceForm service={service} /> : <Problem message="This service is unavailable." href="/dashboard/vendor/my-services" label="My services" />;
  }
  if (["my-services", "services"].includes(page)) return <Services items={data.services} role={role} reload={reload} />;
  if (["my-bookings", "booking-requests"].includes(page)) return <Bookings items={data.bookings} role={role} reload={reload} />;
  if (page === "users") return <ManageUsers items={data.users} reload={reload} />;
  if (page === "transactions") return <Transactions items={data.transactions} />;
  return <Overview data={data} />;
}
function Title({ children, description }) {
  return <div className="dashboard-title"><h1>{children}</h1>{description && <p>{description}</p>}</div>;
}
function Overview({ data }) {
  const { user } = usePlatform();
  const { services, bookings, users, transactions } = data;
  const metrics = {
    customer: [["Total booking requests", bookings.length], ["Pending bookings", count(bookings, "pending")], ["Accepted bookings", count(bookings, "accepted")], ["Rejected bookings", count(bookings, "rejected")]],
    vendor: [["Total services", services.length], ["Active services", services.filter(visible).length], ["Pending booking requests", count(bookings, "pending")], ["Accepted bookings", count(bookings, "accepted")], ["Subscription plan", user.subscriptionPlan || "free"]],
    admin: [["Registered users", users.length], ["Vendors", users.filter((item) => item.role === "vendor").length], ["Customers", users.filter((item) => item.role === "customer").length], ["Total services", services.length], ["Pending services", count(services, "pending")], ["Transactions", transactions.length]],
  };
  const next = { customer: ["/services", "Browse wedding services"], vendor: ["/dashboard/vendor/add-service", "Add a service"], admin: ["/dashboard/admin/services", "Review services"] }[user.role];
  return <><Title description="Here’s what’s happening in your WedPlan account.">Welcome, {user.name.split(" ")[0]}</Title><div className="stats">{metrics[user.role].map(([label, value]) => <Card as="article" className="stat" key={label}><p>{label}</p><strong>{value}</strong></Card>)}</div><Button asChild><Link href={next[0]}>{next[1]}</Link></Button></>;
}
function Rows({ children, empty, count }) {
  return count ? <div className="record-list">{children}</div> : <div className="state empty panel">{empty}</div>;
}
function Confirm({ action, item, children, variant = "danger", disabled, message = "Please confirm this change." }) {
  const [open, setOpen] = useState(false);
  if (!open) return <Button variant={variant} disabled={disabled} onClick={() => setOpen(true)}>{children}</Button>;
  return <div className="confirmation" role="group" aria-label={"Confirm action for " + item}>
    <p>{message}</p><div className="actions"><Button variant={variant} disabled={disabled} onClick={() => { setOpen(false); action(); }}>Confirm {children.toLowerCase()}</Button><Button variant="ghost" onClick={() => setOpen(false)}>Keep</Button></div>
  </div>;
}
function Services({ items, role, reload }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("");
  const { busy, run } = useAction();
  const admin = role === "admin";
  const filtered = items.filter((item) => (!filter || item.status === filter) && [item.serviceName, item.category, item.location, vendorName(item.vendor)].join(" ").toLowerCase().includes(query.toLowerCase().trim()));
  const act = (operation, message) => run(async () => { await operation(); reload(); }, message);
  return <>
    <div className="section-top"><Title description={admin ? "Review submissions and manage published listings." : "Manage your listings, approval status, and availability."}>{admin ? "Manage services" : "My services"}</Title>{!admin && <Button asChild><Link href="/dashboard/vendor/add-service">Add service</Link></Button>}</div>
    <div className="table-filters"><Input aria-label="Search listings" placeholder="Search listings" value={query} onChange={(event) => setQuery(event.target.value)} /><select aria-label="Approval status" value={filter} onChange={(event) => setFilter(event.target.value)}><option value="">All statuses</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select></div>
    <Rows count={filtered.length} empty="No services match your filters.">
      {filtered.map((item) => <article className="record panel" key={item.id}>
        <div className="record-summary"><Photo className="record-photo" src={item.images?.[0]} /><div><h2>{item.serviceName}</h2><p>{item.category} · {item.location} · {money(item.price)}</p>{admin && <p>{vendorName(item.vendor)}</p>}</div><div className="record-status"><Badge value={item.status} /><Badge value={item.pausedByPlan ? "hidden on Free" : item.active ? "active" : "inactive"} /></div></div>
        <details className="record-details"><summary>Service information</summary><p>{item.description}</p></details>
        <div className="actions">
          {!admin && <Button variant="outline" asChild><Link href={"/dashboard/vendor/edit-service/" + encodeURIComponent(item.id)}>Edit service</Link></Button>}
          {admin && nextReviewStatuses(item.status).map((status) => <Button key={status} variant="outline" disabled={busy} onClick={() => act(() => platform.patchService(item.id, { status }, role), "Review status saved.")}>{{ approved: "Approve", rejected: "Reject", pending: "Return to review" }[status]}</Button>)}
          {item.status === "approved" && <Button variant="outline" disabled={busy} onClick={() => act(() => platform.patchService(item.id, { active: !item.active && !item.pausedByPlan }, role), "Availability updated.")}>{item.active || item.pausedByPlan ? "Deactivate" : "Activate"}</Button>}
          <Confirm item={item.serviceName} disabled={busy} action={() => act(() => platform.removeService(item.id, role), "Service deleted.")}>Delete</Confirm>
        </div>
      </article>)}
    </Rows>
  </>;
}

function ServiceForm({ service }) {
  const router = useRouter();
  const { busy, run } = useAction();
  function submit(event) {
    event.preventDefault();
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    const files = new FormData(event.currentTarget).getAll("images").filter((file) => file.size);
    run(async () => {
      if (![fields.serviceName, fields.description, fields.location].every((value) => value.trim()) || !Number.isFinite(Number(fields.price)) || Number(fields.price) <= 0) throw new Error("Complete every field and enter a valid price.");
      if (files.length > 4) throw new Error("Choose up to four images.");
      const images = files.length ? await Promise.all(files.map((file) => platform.upload(file, "service"))) : service?.images;
      if (!images?.length) throw new Error("Upload at least one service image.");
      await platform.saveService(service?.id, { serviceName: fields.serviceName.trim(), category: fields.category, description: fields.description.trim(), price: Number(fields.price), location: fields.location.trim(), images });
      router.push("/dashboard/vendor/my-services");
    }, "Service submitted for review.");
  }
  return <><Title description="An admin reviews new and updated listings before they can be published.">{service ? "Edit service" : "Add a service"}</Title>
    <form className="panel padded form-stack profile-content" onSubmit={submit}>
      <label>Service name<Input name="serviceName" defaultValue={service?.serviceName} maxLength={120} required /></label>
      <label>Category<select name="category" defaultValue={service?.category || ""} required><option value="" disabled>Choose a category</option>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
      <label>Description<textarea name="description" defaultValue={service?.description} rows={5} maxLength={2500} required /></label>
      <label>Price (BDT)<Input name="price" type="number" min="1" max="100000000" defaultValue={service?.price} required /></label>
      <label>Location<Input name="location" defaultValue={service?.location} maxLength={120} required /></label>
      {service?.images?.length > 0 && <div className="thumbnails">{service.images.map((src, index) => <Photo key={index} src={src} alt={"Current photo " + (index + 1)} />)}</div>}
      <label>{service ? "Replace photos (optional)" : "Service photos"}<Input name="images" type="file" accept={imageTypes} multiple required={!service} /><small>Choose up to four images, up to 5 MB each.</small></label>
      <div className="actions"><Button disabled={busy}>{busy ? "Submitting…" : "Submit for review"}</Button><Button variant="ghost" asChild><Link href="/dashboard/vendor/my-services">Cancel</Link></Button></div>
    </form></>;
}
function Bookings({ items, role, reload }) {
  const { busy, run } = useAction();
  const vendor = role === "vendor";
  const act = (id, status) => run(async () => { await platform.updateBooking(id, status); reload(); }, "Booking marked " + status + ".");
  return <><Title description={vendor ? "Review and respond to requests for your services." : "Track your wedding service requests."}>{vendor ? "Booking requests" : "My bookings"}</Title>
    <Rows count={items.length} empty="You don’t have any booking requests yet.">
      {items.map((item) => <article className="record panel" key={item.id}>
        <div className="record-summary"><Photo className="record-photo" src={item.service?.images?.[0]} /><div><h2>{item.service?.serviceName || "Wedding service"}</h2><p>{vendor ? item.customer?.name : vendorName(item.vendor)}</p><p>{date(item.eventDate)} · {item.eventLocation}</p>{!vendor && <p>Requested {date(item.createdAt)}</p>}</div><Badge value={item.status} /></div>
        <details className="record-details"><summary>Booking details</summary><dl><dt>{vendor ? "Customer" : "Vendor"}</dt><dd>{vendor ? item.customer?.email : item.vendor?.email || vendorName(item.vendor)}</dd><dt>Requested</dt><dd>{date(item.createdAt)}</dd><dt>Message</dt><dd>{item.message || "No message provided."}</dd></dl></details>
        {item.status === "pending" && <div className="actions">{vendor ? <><Button disabled={busy} onClick={() => act(item.id, "accepted")}>Accept</Button><Confirm disabled={busy} item={item.id} action={() => act(item.id, "rejected")}>Reject</Confirm></> : <Confirm disabled={busy} item={item.id} action={() => act(item.id, "cancelled")}>Cancel request</Confirm>}</div>}
      </article>)}
    </Rows></>;
}
function ManageUsers({ items, reload }) {
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("");
  const { busy, run } = useAction();
  const filtered = items.filter((item) => (!role || item.role === role) && (item.name + " " + item.email).toLowerCase().includes(query.toLowerCase().trim()));
  return <><Title description="Find registered accounts and manage their access.">Manage users</Title>
    <div className="table-filters"><Input aria-label="Search users" placeholder="Name or email" value={query} onChange={(event) => setQuery(event.target.value)} /><select aria-label="Filter by role" value={role} onChange={(event) => setRole(event.target.value)}><option value="">All roles</option><option value="customer">Customer</option><option value="vendor">Vendor</option><option value="admin">Admin</option></select></div>
    <Rows count={filtered.length} empty="No accounts match your filters.">{filtered.map((item) => <article className="record panel" key={item.id}>
      <div className="record-summary user-record"><div><h2>{item.name}</h2><p>{item.email}</p></div><div className="record-status"><Badge value={item.role} /><Badge value={item.isBlocked ? "blocked" : "active"} /></div></div>
      <details className="record-details"><summary>User details</summary><dl><dt>Account role</dt><dd>{item.role}</dd>{item.businessName && <><dt>Business</dt><dd>{item.businessName}</dd></>}{item.role === "vendor" && <><dt>Plan</dt><dd>{item.subscriptionPlan || "free"}</dd></>}{item.phone && <><dt>Phone</dt><dd>{item.phone}</dd></>}</dl></details>
      {item.role !== "admin" && <div className="actions"><Confirm variant={item.isBlocked ? "outline" : "danger"} message={item.isBlocked ? "Restore access for this account?" : "Suspend access for this account?"} item={item.name} disabled={busy} action={() => run(async () => { await platform.block(item.id, !item.isBlocked); reload(); }, "Account access updated.")}>{item.isBlocked ? "Unblock" : "Block"}</Confirm></div>}
    </article>)}</Rows>
  </>;
}
function Transactions({ items }) {
  return <><Title description="Review payment records from vendor subscriptions.">Transactions</Title>
    <Rows count={items.length} empty="There are no subscription transactions yet.">{items.map((item) => <article className="record panel" key={item.id}>
      <div className="transaction-entry">
        <span className="billing-icon"><CreditCard size={19} aria-hidden="true" /></span>
        <div><h2>{vendorName(item.vendor)}</h2><p>{item.vendor?.email}</p><p>{item.plan === "premium" ? "Premium subscription" : item.plan} · {date(item.createdAt)}</p></div>
        <div className="transaction-amount"><strong>{money(item.amount, item.currency)}</strong><Badge value={item.status} /></div>
      </div>
    </article>)}</Rows>
  </>;
}
const loadPlan = () => platform.subscription();
const entitlementDate = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Dhaka", dateStyle: "long", timeStyle: "short",
});

function Subscription() {
  const { user, setUser } = usePlatform();
  const { busy, run } = useAction();
  const plan = useResource(loadPlan);
  const [planIntent, setPlanIntent] = useState(null);
  useEffect(() => { if (plan.data?.profile) setUser(plan.data.profile); }, [plan.data?.profile, setUser]);

  const premium = user.subscriptionPlan === "premium";
  const expiry = Date.parse(user.premiumValidUntil ?? "");
  const entitled = expiry > Date.now();
  const dayCount = entitled ? Math.ceil((expiry - Date.now()) / 86400000) : 0;
  const validThrough = entitled ? entitlementDate.format(expiry) : "";
  const renewing = entitled && !user.cancelAtPeriodEnd;
  const price = plan.data?.price;
  const configured = plan.data?.configured;
  const unavailable = plan.error || plan.data?.pricingUnavailable;
  const priceText = price && new Intl.NumberFormat("en-BD", { style: "currency", currency: price.currency.toUpperCase() }).format(price.amount);
  const interval = price && ((price.count > 1 ? price.count + " " : "") + price.interval + (price.count > 1 ? "s" : ""));

  function change(action, message) {
    return run(async () => {
      setUser(await platform.changePlan(action));
      setPlanIntent(null);
      plan.reload();
    }, message);
  }

  return <>
    <Title>Subscription</Title>
    <Card className="padded billing-summary">
      <span className="billing-icon"><CreditCard size={22} /></span>
      <div>
        <p className="eyebrow">CURRENT PLAN</p><h2>{premium ? "Premium" : "Free"}</h2>
        {entitled
          ? <p>Paid Premium valid through <strong>{validThrough} (Dhaka)</strong></p>
          : null}
      </div>
      {premium && entitled && <span className="validity-pill">{dayCount} {dayCount === 1 ? "day" : "days"} left</span>}
    </Card>

    <div className="plan-grid">
      <Card as="article" className="padded plan">
        <h2>Free</h2><p className="billing-price">{money(0, price?.currency ?? "BDT")}</p>
        <ul><li>Up to 3 active services</li><li>Vendor dashboard</li><li>Booking request management</li></ul>
      </Card>
      <Card as="article" className="padded plan premium-plan">
        <h2>Premium</h2>
        {price && <p className="billing-price">{priceText}<small> / {interval}</small></p>}
        <ul><li>Unlimited active services</li><li>Premium vendor badge</li><li>All Free plan features</li></ul>
        {!entitled && !premium && <Confirm item="Stripe checkout" disabled={busy || !configured || !price} variant="default"
          message={price ? "Continue to Stripe test checkout for " + priceText + " every " + interval + "? This starts a recurring test subscription." : "Stripe pricing is unavailable."}
          action={() => run(async () => { window.location.assign(await platform.checkout()); })}>Upgrade to Premium</Confirm>}
      </Card>
    </div>

    {entitled && <Card className="padded plan-controls">
      <div className="renewal-control">
        <div><strong>Use Premium features</strong><p>Switch between Free and Premium during the paid period on this account.</p></div>
        <button type="button" className="billing-switch" role="switch" aria-label="Use Premium features" aria-checked={premium}
          disabled={busy || !!planIntent} onClick={() => setPlanIntent(premium ? "free" : "premium")}><span /></button>
      </div>
      {planIntent && <section className="plan-consent" role="group" aria-labelledby="plan-consent-title">
        <h3 id="plan-consent-title">Switch to {planIntent === "free" ? "Free" : "Premium"}?</h3>
        <p>This account has {dayCount} {dayCount === 1 ? "day" : "days"} of Premium left, through <strong>{validThrough} (Dhaka)</strong>.</p>
        <p>{planIntent === "free"
          ? "Only three listings will stay visible while Free is selected. Your additional listings can return when you switch back."
          : "Your Premium features will resume immediately, with no checkout or extra payment."} Automatic renewal stays {renewing ? "on" : "off"}.</p>
        <div className="actions"><Button disabled={busy} onClick={() => change(planIntent === "free" ? "choose-free" : "choose-premium", planIntent === "free" ? "Free selected. Your paid Premium time is still available." : "Premium restored. No payment was needed.")}>Confirm switch to {planIntent === "free" ? "Free" : "Premium"}</Button>
          <Button variant="ghost" disabled={busy} onClick={() => setPlanIntent(null)}>Keep current plan</Button></div>
      </section>}
      <div className="renewal-control">
        <div><strong>Automatic renewal</strong><p>{renewing ? "Your paid period is set to renew. Turn this off to avoid the next renewal." : "Your paid period will expire without renewal."}</p></div>
        <button type="button" className="billing-switch" role="switch" aria-label="Automatic renewal" aria-checked={renewing}
          disabled={busy || !configured || !!planIntent} onClick={() => renewing ? change("end-renewal", "Automatic renewal stopped.") : change("resume-renewal", "Automatic renewal resumed.")}><span /></button>
      </div>
    </Card>}

    {unavailable ? <div className="actions"><p>Could not load Stripe billing details.</p><Button variant="ghost" onClick={plan.reload}>Retry</Button></div>
      : !plan.loading && !configured && <p>Stripe checkout is unavailable.</p>}
  </>;
}
