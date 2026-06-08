import type { MetadataRoute } from "next";

// Served by Next.js at /manifest.webmanifest and auto-linked in <head>.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Best Texas Display",
    short_name: "TX Display",
    description:
      "Discover, share, and vote for the best holiday decoration displays across Texas.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#F8F6F1",
    theme_color: "#1B3A5C",
    categories: ["lifestyle", "entertainment"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
