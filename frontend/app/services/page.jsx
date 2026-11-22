import { Suspense } from "react";
import { Browse } from "@/components/catalog";
export const metadata = { title: "Browse services" };
export default function Page() {
  return <Suspense fallback={<div className="section wrap" role="status">Loading services…</div>}><Browse /></Suspense>;
}