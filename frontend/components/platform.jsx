"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { LoaderCircle } from "lucide-react";
import { Toaster, toast } from "sonner";
import { platform } from "@/lib/platform";
import { useTheme } from "./theme";
import { Button } from "@/components/ui/button";

const PlatformContext = createContext(null);
export function PlatformProvider({ children }) {
  const theme = useTheme();
  const [session, setSession] = useState({ user: null, loading: true, error: "" });
  const setUser = useCallback((user) => setSession({ user, loading: false, error: "" }), []);
  const refresh = useCallback(async () => {
    try {
      const user = await platform.session();
      setSession({ user, loading: false, error: "" });
      return user;
    } catch (error) {
      setSession({ user: null, loading: false, error: error.message });
    }
  }, []);
  useEffect(() => {
    refresh();
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [refresh]);
  return <PlatformContext.Provider value={{ ...session, refresh, setUser }}>
    {children}<Toaster theme={theme || "system"} richColors position="top-right" />
  </PlatformContext.Provider>;
}
export const usePlatform = () => useContext(PlatformContext);

export function Loading({ children = "Loading…" }) {
  return <div className="state loading" role="status"><LoaderCircle size={20} />{children}</div>;
}
export function Problem({ message, retry, href = "/", label = "Return home" }) {
  return <div className="state empty" role="alert"><p>{message}</p>{retry ? <Button onClick={retry}>Try again</Button> : <Button asChild><Link href={href}>{label}</Link></Button>}</div>;
}

export function Gate({ children, role }) {
  const { user, loading, error, refresh } = usePlatform();
  const router = useRouter();
  const path = usePathname();
  useEffect(() => {
    if (loading || error) return;
    if (!user) router.replace("/sign-in?next=" + encodeURIComponent(path + window.location.search));
    else if (!user.isBlocked && role && role !== user.role) router.replace("/dashboard/" + user.role);
  }, [loading, user, error, router, path, role]);

  if (error) return <Problem message={error} retry={refresh} />;
  if (user?.isBlocked) return <Problem message="This account has been blocked. Contact support for help." />;
  if (loading || !user || (role && role !== user.role)) return <Loading />;
  return children;
}

export function useResource(load) {
  const [resource, setResource] = useState({ data: null, error: "", loading: true });
  const [revision, setRevision] = useState(0);
  const reload = useCallback(() => setRevision((value) => value + 1), []);
  useEffect(() => {
    let current = true;
    setResource((previous) => ({ ...previous, error: "", loading: true }));
    Promise.resolve().then(load).then(
      (data) => { if (current) setResource({ data, error: "", loading: false }); },
      (error) => { if (current) setResource({ data: null, error: error.message, loading: false }); },
    );
    return () => { current = false; };
  }, [load, revision]);
  return { ...resource, reload };
}

export function useAction() {
  const [busy, setBusy] = useState(false);
  async function run(operation, message) {
    if (busy) return;
    setBusy(true);
    try {
      await operation();
      if (message) toast.success(message);
    } catch (error) {
      toast.error(error.message || "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }
  return { busy, run };
}