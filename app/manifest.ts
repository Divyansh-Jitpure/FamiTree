import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FamiTree",
    short_name: "FamiTree",
    description:
      "Build and explore family trees in a multilingual, mobile-friendly app.",
    start_url: "/hi",
    display: "standalone",
    background_color: "#f6f1e8",
    theme_color: "#b35c2e",
    lang: "hi",
    icons: [],
  };
}
