/** @type {import('next').NextConfig} */
const nextConfig = {
  // ロリポップ！デプロイナウは Next.js を standalone 出力で動かす。
  // 純粋な静的ホスティング（out/ を丸ごと置く）に切り替えたい場合は output: 'export' にする。
  output: 'standalone',
  reactStrictMode: true,
  images: { unoptimized: true },
};

module.exports = nextConfig;
