const backend = process.env.NEXT_PUBLIC_WEDPLAN_MODE === "services" ? undefined : process.env.WEDPLAN_BACKEND_URL?.replace(/\/$/, "");

export default {
  async rewrites() {
    return backend ? [{ source: "/api/:path*", destination: backend + "/api/:path*" }] : [];
  },
};