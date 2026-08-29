#!/usr/bin/env bash
# 部署 CaoxuBlog 静态站点到腾讯云 COS（可选刷新 CDN）
#
# 前置：安装并配置 coscli（https://cloud.tencent.com/document/product/436/71763）
#   coscli config add -b <bucket> -r <region> -a <secretid> -s <secretkey>
#
# 运行：bash deploy/deploy-cos.sh
# 可用环境变量覆盖： COS_BUCKET / CDN_DOMAIN
set -euo pipefail

# ====== 按实际情况修改（或用环境变量覆盖） ======
COS_BUCKET="${COS_BUCKET:-your-bucket-1250000000}"   # 存储桶名称（含 APPID）
CDN_DOMAIN="${CDN_DOMAIN:-}"                          # 接入的 CDN 域名，如 blog.example.com；留空则跳过刷新
# =============================================

# 站点根文件与目录：明确列出，避免把 .git / .workbuddy / tools / PROMPTS.md / package.json 传上去
FILES=("index.html" "404.html" "sitemap.xml" "robots.txt" "feed.xml")
DIRS=("assets")

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if ! command -v coscli >/dev/null 2>&1; then
  echo "未找到 coscli，请先安装并配置：https://cloud.tencent.com/document/product/436/71763"
  exit 1
fi

cd "$ROOT_DIR"
echo "==> 同步站点文件 -> cos://$COS_BUCKET/"

for f in "${FILES[@]}"; do
  if [ -f "$f" ]; then
    echo "    $f"
    coscli cp "$f" "cos://$COS_BUCKET/$f"
  else
    echo "    跳过（不存在）：$f"
  fi
done

for d in "${DIRS[@]}"; do
  echo "    $d/ （--delete 清理远端多余文件）"
  coscli sync "$d" "cos://$COS_BUCKET/$d" --delete
done

echo "==> 同步完成"

if [ -n "$CDN_DOMAIN" ]; then
  if command -v tccli >/dev/null 2>&1; then
    echo "==> 刷新 CDN 缓存：https://$CDN_DOMAIN/"
    tccli cdn PurgePathCache --Paths "https://$CDN_DOMAIN/" --FlushType flush \
      || echo "    CDN 刷新失败，请到控制台手动刷新。"
  else
    echo "==> 未安装 tccli，请到 CDN 控制台手动刷新：https://$CDN_DOMAIN/"
  fi
else
  echo "==> 未设置 CDN_DOMAIN，跳过缓存刷新。若已接入 CDN，请到控制台刷新对应缓存。"
fi

echo "==> 全部完成"
