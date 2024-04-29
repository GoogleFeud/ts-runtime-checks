import createMDX from "@next/mdx";

/** @type {import('next').NextConfig} */
const nextConfig = {
    pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
    reactStrictMode: true,
    //assetPrefix: "./",
    output: "export",
    eslint: {
        ignoreDuringBuilds: true
    },
    typescript: {
        ignoreBuildErrors: true,
  },
};

const withMDX = createMDX({
    extension: /\.mdx?$/,
    options: {
        remarkPlugins: [],
        rehypePlugins: []
    },
});

export default withMDX(nextConfig);
