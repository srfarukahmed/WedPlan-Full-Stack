import { notFound } from "next/navigation";
import { Payment } from "@/components/payment";
import { demoMode } from "@/lib/platform-mode";
export default async function Page({ params }) {
  const { result } = await params;
  if (result === "demo" ? !demoMode : !["success", "cancel"].includes(result)) notFound();
  return <Payment result={result} />;
}