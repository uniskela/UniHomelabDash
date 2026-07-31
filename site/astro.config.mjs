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
          autogenerate: { directory: "getting-started" },
        },
        {
          label: "Using UniHomelabDash",
          autogenerate: { directory: "using" },
        },
        {
          label: "Integrations",
          autogenerate: { directory: "integrations" },
        },
        {
          label: "Operations",
          autogenerate: { directory: "operations" },
        },
        {
          label: "Project",
          autogenerate: { directory: "project" },
        },
      ],
    }),
  ],
});
