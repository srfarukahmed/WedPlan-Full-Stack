const isServices = process.env.NEXT_PUBLIC_WEDPLAN_MODE === "services";
export const proxyMode = isServices || process.env.NEXT_PUBLIC_WEDPLAN_MODE === "proxy";
export const imageUploadMaxMb = isServices ? 4 : 5;
export const API_URL = proxyMode ? "" : process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
export const demoMode = !proxyMode && !API_URL;
