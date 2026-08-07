import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Love You Most +1",
    short_name: "Love Hub",
    description: "Rapha and Minette's private shared home.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f1e8",
    theme_color: "#153a31",
    orientation: "portrait",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
