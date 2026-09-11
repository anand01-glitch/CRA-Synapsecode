/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    outputFileTracingIncludes: {
      '/**': ['./prisma/dev.db', './dev.db'],
    },
  },
};

module.exports = nextConfig;
