#!/bin/bash
# Figma画像ダウンロードスクリプト
# ※ URLは短期間で期限切れになります。取得後すぐに実行してください。
# 実行方法: sh download-images.sh
IMAGES_DIR="$(cd "$(dirname "$0")" && pwd)/images"

echo "Downloading Figma images to: $IMAGES_DIR"
echo ""

curl -L -o "$IMAGES_DIR/hero.jpg" \
  "https://www.figma.com/api/mcp/asset/219e68c3-2896-4c11-b64f-f2325bcc1c0e.jpeg" \
  && echo "✓ hero.jpg" || echo "✗ hero.jpg (failed)"

curl -L -o "$IMAGES_DIR/hero-connecting.png" \
  "https://www.figma.com/api/mcp/asset/60e18a68-cd9e-41a9-8a39-313938a7167a.png" \
  && echo "✓ hero-connecting.png" || echo "✗ hero-connecting.png (failed)"

curl -L -o "$IMAGES_DIR/service-pa.png" \
  "https://www.figma.com/api/mcp/asset/61047d99-91b4-47c0-82d6-f2a43ece4665.png" \
  && echo "✓ service-pa.png" || echo "✗ service-pa.png (failed)"

curl -L -o "$IMAGES_DIR/service-lighting.png" \
  "https://www.figma.com/api/mcp/asset/0eee2e9c-736e-4561-b1fb-64d05fbe33e1.png" \
  && echo "✓ service-lighting.png" || echo "✗ service-lighting.png (failed)"

curl -L -o "$IMAGES_DIR/service-hall.png" \
  "https://www.figma.com/api/mcp/asset/b523a946-e688-4947-8a0e-1ed893cb52c8.png" \
  && echo "✓ service-hall.png" || echo "✗ service-hall.png (failed)"

curl -L -o "$IMAGES_DIR/service-livehouse.png" \
  "https://www.figma.com/api/mcp/asset/9c2e3132-aa43-45d7-b626-fb1ba63fed6c.png" \
  && echo "✓ service-livehouse.png" || echo "✗ service-livehouse.png (failed)"

echo ""
echo "Done! Files in $IMAGES_DIR:"
ls -lh "$IMAGES_DIR"
