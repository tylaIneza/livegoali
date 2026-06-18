import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "upload.wikimedia.org" },
      { protocol: "https", hostname: "**.imgur.com" },
      { protocol: "https", hostname: "crests.football-data.org" },
    ],
  },
  serverExternalPackages: ["bcryptjs", "pg"],
};

export default nextConfig;
