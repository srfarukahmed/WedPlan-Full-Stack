"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { Camera, MapPin, Flower2, Utensils, Sparkles, Shirt, Search, ShieldCheck, CalendarCheck, HeartHandshake, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gate, Loading, Problem, useAction, usePlatform, useResource } from "./platform";
import { platform } from "@/lib/platform";
import { categories, visible } from "@/lib/demo";

const categoryIcons = [Camera, Building2, Flower2, Utensils, Sparkles, Shirt];
export const vendorName = (user) => user?.businessName || user?.name || "Wedding vendor";
const bangladeshDivisions = ["Barishal", "Chattogram", "Dhaka", "Khulna", "Mymensingh", "Rajshahi", "Rangpur", "Sylhet"];
export const money = (value, currency = "BDT") => new Intl.NumberFormat("en-BD", { style: "currency", currency: currency.toUpperCase(), minimumFractionDigits: 0 }).format(value);
const catalog = () => platform.catalog();

export function Photo({ src, alt = "", ...props }) {
  return <img src={src || "/photos/0.jpg"} alt={alt} onError={(event) => {
    if (!event.currentTarget.getAttribute("src").endsWith("/photos/0.jpg")) event.currentTarget.src = "/photos/0.jpg";
  }} {...props} />;
}

function ServiceCard({ service }) {
  const { vendor, category, serviceName, price, location, images, id } = service;
  return <Card as="article" className="listing">
    <div className="listing-photo"><Photo src={images?.[0]} loading="lazy" /><span className="photo-tag">{category}</span></div>
    <div className="listing-body">
      <h3>{serviceName}</h3>
      <p className="vendor-line">{vendorName(vendor)} {vendor?.subscriptionPlan === "premium" && <Badge value="premium" />}</p>
      <p className="location"><MapPin size={15} />{location}</p>
      <div className="listing-bottom"><div><span>From</span><strong>{money(price)}</strong></div><Button variant="outline" asChild><Link href={"/services/" + encodeURIComponent(id)} aria-label={"View details for " + serviceName}>View details</Link></Button></div>
    </div>
  </Card>;
}
function ServiceGrid({ entries, empty = "No services are available yet." }) {
  if (!entries.length) return <div className="empty panel">{empty}</div>;
  return <div className="service-grid">{entries.map((service) => <ServiceCard key={service.id} service={service} />)}</div>;
}

function Heading({ title, note, eyebrow }) {
  return <div className="section-heading">{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h2>{title}</h2>{note && <p>{note}</p>}</div>;
}
export function Home() {
  const { data, error, loading, reload } = useResource(catalog);
  const reduce = useReducedMotion();
  const router = useRouter();
  function search(event) {
    event.preventDefault();
    const query = new FormData(event.currentTarget).get("q").trim();
    router.push(query ? "/services?q=" + encodeURIComponent(query) : "/services");
  }
  return <div className="home-page">
    <section className="home-hero"><div className="wrap home-hero-grid">
      <div className="home-hero-copy">
        <motion.div className="home-hero-content" initial={reduce ? false : { y: 12 }} animate={{ y: 0 }} transition={{ duration: 0.45 }}>
          <p className="eyebrow">WEDDING SERVICES ACROSS BANGLADESH</p>
          <h1>Find the people for <em>your day.</em></h1>
          <p>Discover venues, photographers, florists and more for a celebration that feels like yours.</p>
          <form className="home-hero-search" role="search" aria-label="Find wedding services" onSubmit={search}>
            <div className="search-field"><Search size={18} aria-hidden="true" /><Input type="search" name="q" aria-label="Search the directory" placeholder="Try photography or Dhaka" /></div>
            <Button type="submit">Search</Button>
          </form>
          <Link className="home-browse-link" href="/services">Explore wedding services</Link>
        </motion.div>
      </div>
      <figure className="home-hero-photo"><Photo src="/photos/3.jpg" alt="An outdoor reception table set with flowers and glassware" fetchPriority="high" /></figure>
    </div></section>
    <section className="home-section home-categories wrap">
      <Heading title="Explore by category" />
      <div className="category-grid" role="list" aria-label="Wedding service categories">{categories.map((category, index) => {
        const Icon = categoryIcons[index];
        return <div className="category-item" role="listitem" key={category}><Link className="category" href={"/services?category=" + encodeURIComponent(category)}><span><Icon size={24} strokeWidth={1.55} /></span>{category}</Link></div>;
      })}</div>
    </section>
    <section className="home-section home-featured"><div className="wrap">
      <div className="section-top"><Heading title="Featured wedding services" note="Browse available listings from venues, studios and wedding professionals." /><Button variant="outline" asChild><Link href="/services">Browse all services</Link></Button></div>
      {loading ? <Loading>Loading wedding services…</Loading> : error ? <Problem message={error} retry={reload} /> : <ServiceGrid entries={data.filter(visible).slice(0, 6)} />}
    </div></section>
    <section className="home-section wrap home-benefits">
      <figure className="home-benefits-photo"><Photo src="/photos/2.jpg" alt="A garden wedding ceremony setting with flowers" loading="lazy" /></figure>
      <div><Heading title="Why choose WedPlan?" />
      <div className="home-benefit-list">
        {[[ShieldCheck, "Reviewed listings", "Published services are reviewed before they appear in the directory."], [CalendarCheck, "Bookings in one place", "Send requests, check replies, and manage pending bookings from your dashboard."], [HeartHandshake, "Work directly with vendors", "Share your plans with the people who’ll help bring them to life."]].map(([Icon, title, copy]) => <article key={title}><span className="home-icon"><Icon size={20} aria-hidden="true" /></span><div><h3>{title}</h3><p>{copy}</p></div></article>)}
      </div></div>
    </section>
    <section className="home-section home-how"><div className="wrap"><Heading title="How WedPlan works" /><div className="home-steps">
      {[["Explore the directory", "Find services by category, location, and budget."], ["Send a booking request", "Share your event date, location, and any details the vendor should know."], ["Check your dashboard", "See when vendors respond and manage your requests."]].map(([title, copy]) => <article className="benefit" key={title}><h3>{title}</h3><p>{copy}</p></article>)}
    </div></div></section>
  </div>;
}

export function Browse() {
  const params = useSearchParams();
  const initialCategory = params.get("category") || "";
  const initialQuery = params.get("q") || "";
  return <BrowseFilters key={JSON.stringify([initialCategory, initialQuery])} initialCategory={initialCategory} initialQuery={initialQuery} />;
}
function BrowseFilters({ initialCategory, initialQuery }) {
  const router = useRouter();
  const { data, error, loading, reload } = useResource(catalog);
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(categories.includes(initialCategory) ? initialCategory : "");
  const [location, setLocation] = useState("");
  const [sort, setSort] = useState("");
  const [budget, setBudget] = useState("");
  const publicServices = (data || []).filter(visible);
  const locations = [...new Set([...bangladeshDivisions, ...publicServices.map((service) => service.location)])].sort();
  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const filtered = publicServices.filter((service) => terms.every((term) => [service.serviceName, service.category, service.location, vendorName(service.vendor), service.description].join(" ").toLowerCase().includes(term))
    && (!category || service.category === category) && (!location || service.location === location) && (!budget || service.price <= Number(budget)));
  if (sort) filtered.sort((first, second) => (sort === "asc" ? 1 : -1) * (first.price - second.price));
  return <>
    <div className="page-banner"><div className="wrap"><p className="eyebrow">THE WEDDING DIRECTORY</p><h1>Browse wedding services</h1><p>Find the people and places that fit your plans.</p></div></div>
    <section className="wrap section catalog">
      <form className="filters panel" onSubmit={(event) => event.preventDefault()}>
        <label><span>Search services</span><div className="search-field"><Search size={17} /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, vendor, or keyword" /></div></label>
        <label>Category<select value={category} onChange={(event) => setCategory(event.target.value)}><option value="">All categories</option>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>Location<select value={location} onChange={(event) => setLocation(event.target.value)}><option value="">All locations</option>{locations.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>Max budget<Input type="number" min="0" placeholder="BDT" value={budget} onChange={(event) => setBudget(event.target.value)} /></label>
        <label>Sort by<select value={sort} onChange={(event) => setSort(event.target.value)}><option value="">Featured</option><option value="asc">Price low to high</option><option value="desc">Price high to low</option></select></label>
      </form>
      {loading ? <Loading>Loading wedding services…</Loading> : error ? <Problem message={error} retry={reload} /> : <><div className="results-bar"><p aria-live="polite">{filtered.length} {filtered.length === 1 ? "service" : "services"} found</p>{(query || category || location || budget || sort) && <Button variant="ghost" onClick={() => { setQuery(""); setCategory(""); setLocation(""); setBudget(""); setSort(""); if (initialCategory || initialQuery) router.replace("/services", { scroll: false }); }}>Clear filters</Button>}</div><ServiceGrid entries={filtered} empty="No services match your filters. Try another search or clear your filters." /></>}
    </section>
  </>;
}

export function ServiceDetail({ id }) {
  return <Gate><Detail id={id} /></Gate>;
}
function Detail({ id }) {
  const load = useCallback(() => platform.service(id), [id]);
  const { data: service, error, loading } = useResource(load);
  const { user } = usePlatform();
  const [selected, setSelected] = useState(0);
  const [booking, setBooking] = useState(false);
  const router = useRouter();
  const { busy, run } = useAction();
  if (loading) return <Loading>Loading service…</Loading>;
  if (error || !service || !visible(service)) return <Problem message={error || "This service is unavailable."} href="/services" label="Browse services" />;
  const images = service.images || [];
  const now = new Date();
  const today = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  function submit(event) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    run(async () => {
      if (!values.eventLocation.trim()) throw new Error("Enter the event location.");
      await platform.book(id, { ...values, eventLocation: values.eventLocation.trim(), message: values.message.trim() });
      router.push("/dashboard/customer/my-bookings");
    }, "Booking request sent.");
  }
  return <section className="wrap section">
    <Link className="text-link" href="/services">Back to services</Link>
    <div className="detail-grid">
      <div><Photo className="detail-photo" src={images[selected]} alt={service.serviceName + " gallery image " + (selected + 1)} />
      {images.length > 1 && <div className="thumbnails">{images.map((src, index) => <button key={index} type="button" aria-label={"Show image " + (index + 1)} aria-pressed={selected === index} onClick={() => setSelected(index)}><Photo src={src} /></button>)}</div>}</div>
      <div className="detail-copy">
        <p className="eyebrow">{service.category}</p><h1>{service.serviceName}</h1><p className="location"><MapPin size={17} />{service.location}</p>
        <p>{service.description}</p>
        <div className="panel detail-vendor"><strong>{vendorName(service.vendor)}</strong>{service.vendor?.subscriptionPlan === "premium" && <Badge value="premium">Premium vendor</Badge>}{service.vendor?.bio && <p>{service.vendor.bio}</p>}<p>From <strong>{money(service.price)}</strong></p></div>
        {user.role === "customer" && user.id !== service.vendorId && (!booking ? <Button onClick={() => setBooking(true)}>Request booking</Button> :
          <form className="form-stack" onSubmit={submit}>
            <label>Event date<Input name="eventDate" type="date" min={today} required /></label>
            <label>Event location<Input name="eventLocation" required maxLength={160} /></label>
            <label>Additional message<textarea name="message" rows={4} maxLength={1500} /></label>
            <div className="actions"><Button disabled={busy}>{busy ? "Sending…" : "Send booking request"}</Button><Button type="button" variant="ghost" onClick={() => setBooking(false)}>Close</Button></div>
          </form>)}
      </div>
    </div>
  </section>;
}