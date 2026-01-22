import withPWA from "@ducanh2912/next-pwa";
import type { NextConfig } from "next";

const config = withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
});

const nextConfig: NextConfig = {
  /* config options here */
};

export default config(nextConfig);
