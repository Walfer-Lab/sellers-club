/** @type {import('next').NextConfig} */
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com",
      "style-src 'self' 'unsafe-inline' https://api.fontshare.com https://cdn.fontshare.com",
      "font-src 'self' https://api.fontshare.com https://cdn.fontshare.com",
      "img-src 'self' data: blob: https://ersuemtbcjynjmmmamwa.supabase.co https://*.supabase.co https://*.s3.ap-southeast-2.amazonaws.com https://walferlab-file-content.s3.ap-southeast-2.amazonaws.com",
      "connect-src 'self' https://*.supabase.co https://api.razorpay.com https://lumberjack.razorpay.com https://*.s3.ap-southeast-2.amazonaws.com https://walferlab-file-content.s3.ap-southeast-2.amazonaws.com",
      "frame-src https://api.razorpay.com https://checkout.razorpay.com",
    ].join("; "),
  },
];

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ersuemtbcjynjmmmamwa.supabase.co",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "walferlab-file-content.s3.ap-southeast-2.amazonaws.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

module.exports = nextConfig;