"use client";

import { useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BadgeCheck, CreditCard, CircleX, ShieldCheck } from "lucide-react";
import { platform, demoMode } from "@/lib/platform";
import { Button } from "@/components/ui/button";
import { Gate, Loading, Problem, useAction, usePlatform, useResource } from "./platform";

const subscription = "/dashboard/vendor/subscription";
export function Payment({ result }) {
  return <Gate role="vendor"><section className="wrap section payment"><div className="panel padded payment-card"><div className="payment-kicker"><ShieldCheck size={18} /> STRIPE TEST CHECKOUT</div>
    {result === "success" ? <PaymentStatus /> : result === "demo" && demoMode ? <DemoCheckout /> : <><CircleX size={36} /><h1>Checkout cancelled</h1><ReturnLink /></>}
  </div></section></Gate>;
}
function ReturnLink() {
  return <Button asChild><Link href={subscription}>Return to subscription</Link></Button>;
}
function PaymentStatus() {
  const { refresh } = usePlatform();
  const check = useCallback(async () => {
    const sessionId = new URLSearchParams(window.location.search).get("session_id");
    if (!demoMode && !sessionId) throw new Error("A checkout reference is required to verify this payment.");
    const data = await platform.payment(sessionId);
    if (data.status === "paid") await refresh();
    return data;
  }, [refresh]);
  const { data, error, loading, reload } = useResource(check);
  const checks = useRef(0);
  useEffect(() => {
    if (loading || error || data?.status !== "pending" || checks.current >= 12) return;
    const timer = setTimeout(() => { checks.current++; reload(); }, 2000);
    return () => clearTimeout(timer);
  }, [data?.status, error, loading, reload]);
  if (loading && !data) return <Loading>Verifying checkout…</Loading>;
  if (error) return <Problem message={error} retry={reload} />;
  const paid = data?.status === "paid";
  const active = paid && data.premiumActive !== false;
  const failed = ["failed", "expired", "cancelled"].includes(data?.status);
  return <>{paid ? <BadgeCheck size={36} /> : <CreditCard size={36} />}
    <h1>{active ? "Premium is active" : paid ? "Payment recorded" : failed ? "Payment was not completed" : "Awaiting payment confirmation"}</h1>
    <p>{active ? "Your vendor account can now publish unlimited active services." : paid ? "Check your subscription page for your current plan." : failed ? "Return to your subscription to start a new checkout." : checks.current >= 12 ? "Still waiting for Stripe. Check status before trying another checkout." : "Waiting for Stripe to confirm your payment."}</p>
    <div className="actions">{!paid && !failed && <Button variant="outline" disabled={loading} onClick={() => { checks.current = 0; reload(); }}>{loading ? "Checking…" : "Check status"}</Button>}<ReturnLink /></div>
  </>;
}
function DemoCheckout() {
  const router = useRouter();
  const { refresh } = usePlatform();
  const { busy, run } = useAction();
  const complete = (confirmed) => run(async () => {
    await platform.completeCheckout(confirmed);
    await refresh();
    router.replace(confirmed ? "/payment/success" : "/payment/cancel");
  });
  return <><CreditCard size={36} /><h1>Demo checkout</h1><p>Premium vendor plan · BDT 2,490</p><p>This demo uses no payment details.</p><div className="actions"><Button disabled={busy} onClick={() => complete(true)}>{busy ? "Processing…" : "Simulate payment"}</Button><Button variant="outline" disabled={busy} onClick={() => complete(false)}>Cancel checkout</Button></div></>;
}