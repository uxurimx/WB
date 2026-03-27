import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "WB Diesel Control",
    short_name: "WB Diesel",
    description: "Control de cargas de diesel para flota WB",
    start_url: "/overview",
    display: "standalone",
    background_color: "#0f0f13",
    theme_color: "#4f46e5",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
