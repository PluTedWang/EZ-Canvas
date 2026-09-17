import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  agentRules: false,
};

export default createNextIntlPlugin("./lib/i18n.ts")(nextConfig);
