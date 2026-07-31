import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

export default defineConfig({
  site: "https://uniskela.github.io",
  base: "/UniHomelabDash",
  integrations: [
    starlight({
      title: "UniHomelabDash",
      description:
        "Documentation for the self-hosted, mobile-first homelab control plane.",
      logo: {
        src: "./src/assets/logo-wordmark-horizontal.svg",
        replacesTitle: true,
      },
      favicon: "/favicon.svg",
      customCss: ["./src/styles/starlight.css"],
      lastUpdated: true,
      editLink: {
        baseUrl:
          "https://github.com/uniskela/UniHomelabDash/edit/main/site/",
      },
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/uniskela/UniHomelabDash",
        },
      ],
      sidebar: [
        {
          label: "Getting started",
          items: [{ autogenerate: { directory: "getting-started" } }],
        },
        {
          label: "Using UniHomelabDash",
          items: [{ autogenerate: { directory: "using" } }],
        },
        {
          label: "Integrations",
          items: [{ autogenerate: { directory: "integrations" } }],
        },
        {
          label: "Operations",
          items: [{ autogenerate: { directory: "operations" } }],
        },
        {
          label: "Project",
          items: [{ autogenerate: { directory: "project" } }],
        },
      ],
    }),
  ],
});
