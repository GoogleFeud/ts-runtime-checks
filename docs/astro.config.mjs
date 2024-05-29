import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import react from "@astrojs/react";
//import relativeLinks from 'astro-relative-links';

import tailwind from "@astrojs/tailwind";

import relativeLinks from "astro-relative-links";

// https://astro.build/config
export default defineConfig({
    site: "https://googlefeud.github.io/ts-runtime-checks",
    base: "./",
    redirects: {
        "/": "./playground"
    },
    integrations: [mdx(), sitemap(), react(), tailwind(), relativeLinks()]
});