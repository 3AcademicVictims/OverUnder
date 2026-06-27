/** @type {import('next').NextConfig} */
const nextConfig = {
  // The pipeline agents live in ../backend (outside this app dir). Next needs
  // externalDir to transpile and import TypeScript modules from there.
  experimental: {
    externalDir: true,
  },
};

export default nextConfig;
