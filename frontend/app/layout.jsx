import "./globals.css";
import { PlatformProvider } from "@/components/platform";
import { SiteFrame } from "@/components/site";

export const metadata = {
  authors: [{ name: "Faruk Ahmed" }],
  title: { default: "WedPlan | Wedding services", template: "%s | WedPlan" },
  description: "Discover wedding venues, photographers, florists, and more. Find the people who will bring your celebration to life.",
};

const initializeTheme = `try {
  const theme = localStorage.getItem("wedplan-theme");
  if (theme === "dark" || theme === "light") document.documentElement.dataset.theme = theme;
} catch {}`;

export default function Layout({ children }) {
  return <html lang="en" suppressHydrationWarning>
    <head><script dangerouslySetInnerHTML={{ __html: initializeTheme }} /></head><body><PlatformProvider><SiteFrame>{children}</SiteFrame></PlatformProvider></body></html>;
}