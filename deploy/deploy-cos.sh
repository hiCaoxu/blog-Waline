#!/usr/bin/env bash
# 部署 CaoxuBlog 静态站点到腾讯云 COS
# 前置：安装并配置 coscli（https://cloud.tencent.com/document/product/436/71763）
#   coscli config add -b <bucket> -r <region> -a <secretid> -s <secretkey>
set -euo pipefail

# ====== 按实际情况修改 ======
BUCKET="your-bucket-1250000000"   # 存储桶名称（含 APPID）
REGION="ap-guangzhou"             # 地域
DIST_DIR="./"                     # 本仓库根目录即静态站点
# ============================

if ! command -v coscli >/dev/null 2>&1; then
  echo "未找到 coscli，请先安装并配置：https://cloud.tencent.com/document/product/436/71763"
  exit 1
fi

echo "同步 $DIST_DIR -> cos://$BUCKET/"
coscli sync "$DIST_DIR" "cos://$BUCKET/" --delete

echo "部署完成。若已接入 CDN，请到控制台刷新对应缓存。"
