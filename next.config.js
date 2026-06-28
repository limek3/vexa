/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,
  distDir: process.env.NEXT_DIST_DIR || '.next',
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      { source: '/desktop/today', destination: '/desktop/schedule', permanent: false },
      { source: '/desktop/bookings', destination: '/desktop/schedule', permanent: false },
      { source: '/desktop/calendar', destination: '/desktop/schedule', permanent: false },
      { source: '/desktop/stats', destination: '/desktop/analytics', permanent: false },
      { source: '/desktop/master-profile', destination: '/desktop/profile', permanent: false },
      { source: '/desktop/design', destination: '/desktop/appearance', permanent: false },
      { source: '/desktop/account', destination: '/desktop/settings', permanent: false },
    ];
  },
}

module.exports = nextConfig
