import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // TypeScript 에러가 있어도 빌드를 강제로 진행하도록 설정
  typescript: {
    ignoreBuildErrors: true,
  },
  // ESLint 에러(코드 스타일)가 있어도 빌드를 강제로 진행하도록 설정
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;