"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

const key = "wedplan-theme";
const changeEvent = "wedplan-theme-change";
const systemQuery = "(prefers-color-scheme: dark)";

function subscribe(onChange) {
  const media = window.matchMedia(systemQuery);
  media.addEventListener("change", onChange);
  window.addEventListener(changeEvent, onChange);
  window.addEventListener("storage", onStorage);
  function onStorage(event) {
    if (event.key !== key && event.key !== null) return;
    if (event.newValue === "dark" || event.newValue === "light") document.documentElement.dataset.theme = event.newValue;
    else delete document.documentElement.dataset.theme;
    onChange();
  }
  return () => {
    media.removeEventListener("change", onChange);
    window.removeEventListener(changeEvent, onChange);
    window.removeEventListener("storage", onStorage);
  };
}
function activeTheme() {
  return document.documentElement.dataset.theme || (window.matchMedia(systemQuery).matches ? "dark" : "light");
}
export function useTheme() {
  return useSyncExternalStore(subscribe, activeTheme, () => undefined);
}
export function ThemeToggle() {
  const theme = useTheme();
  function toggle() {
    const next = activeTheme() === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem(key, next); } catch {}
    window.dispatchEvent(new Event(changeEvent));
  }
  return <Button type="button" variant="ghost" size="icon" className="theme-toggle" role="switch" aria-label="Dark mode" aria-checked={theme === "dark"} onClick={toggle}>
    <Moon className="theme-moon" size={19} aria-hidden="true" /><Sun className="theme-sun" size={19} aria-hidden="true" />
  </Button>;
}