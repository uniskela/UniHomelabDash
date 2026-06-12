import type { NextConfig } from "next";

const homelabDevOrigins = [
  "192.168.*.*",
  "10.*.*.*",
  "172.16.*.*",
  "172.17.*.*",
  "172.18.*.*",
  "172.19.*.*",
  "172.2*.*.*",
];

const extraDevOrigin = process.env.ALLOWED_DEV_ORIGIN?.trim();

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["better-sqlite3"],
  allowedDevOrigins: extraDevOrigin
    ? [...homelabDevOrigins, extraDevOrigin]
    : homelabDevOrigins,
};

export default nextConfig;
