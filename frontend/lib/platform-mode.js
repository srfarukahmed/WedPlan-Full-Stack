export const proxyMode = process.env.NEXT_PUBLIC_WEDPLAN_MODE === "proxy";
export const API_URL = proxyMode ? "" : process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
export const demoMode = !proxyMode && !API_URL;
