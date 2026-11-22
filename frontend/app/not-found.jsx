import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function NotFound() {
  return <section className="wrap section empty"><p className="eyebrow">404</p><h1>Page not found</h1><p>This page may have moved.</p><Button asChild><Link href="/">Return home</Link></Button></section>;
}