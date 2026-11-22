import { Dashboard } from "@/components/dashboard";
export default async function Page({ params }) {
  const { segments = [] } = await params;
  return <Dashboard segments={segments} />;
}