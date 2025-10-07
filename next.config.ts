// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ajoutez la configuration 'images' ici pour autoriser les hôtes externes
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        // 🎯 L'hôte exact à autoriser
        hostname: 'pixabay.com', 
      },
    ],
  },
  
  /* config options here */
};

export default nextConfig;