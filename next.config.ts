import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });
    return config;
  },
    
    turbopack: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
    images: {
      remotePatterns: [
        {
          protocol: "https",
          hostname: "foypqawzzimrptgrkfej.supabase.co",
          port: "",
          pathname: "/storage/v1/object/public/**",
        },
        {
          protocol: "https",
          hostname: "images.unsplash.com",
          port: "",
          pathname: "/**",
        },
      ],
    },
  
};

export default nextConfig;
