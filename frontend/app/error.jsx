"use client";
import { Button } from "@/components/ui/button";
export default function ErrorPage({ reset }) {
  return <section className="wrap section empty"><h1>Something went wrong</h1><p>Try loading the page again.</p><Button onClick={reset}>Try again</Button></section>;
}