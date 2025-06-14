#!/bin/bash

# Build script for Chrome Web Store submission
echo "🏗️  Building ChatGPT Image Downloader for Chrome Web Store..."

# Create build directory
BUILD_DIR="build"
PACKAGE_NAME="chatgpt-image-downloader-v1.0"

# Clean previous builds
rm -rf "$BUILD_DIR"
rm -f "$PACKAGE_NAME.zip"

# Create build directory
mkdir -p "$BUILD_DIR"

echo "📁 Copying production files..."

# Copy essential files for Chrome Web Store
cp manifest.json "$BUILD_DIR/"
cp popup.html "$BUILD_DIR/"
cp popup.js "$BUILD_DIR/"
cp popup.css "$BUILD_DIR/"
cp content.js "$BUILD_DIR/"
cp background.js "$BUILD_DIR/"
cp icon.png "$BUILD_DIR/"
cp LICENSE "$BUILD_DIR/"
cp README_EN.md "$BUILD_DIR/README.md"

echo "🧹 Cleaning up development artifacts..."

# Remove any development-specific code or comments
# This is where you'd run any minification or optimization

# Optional: Remove console.log statements for production
# sed -i '' '/console\.log/d' "$BUILD_DIR"/*.js

echo "📦 Creating ZIP package..."

# Create the ZIP file for Chrome Web Store submission
cd "$BUILD_DIR"
zip -r "../$PACKAGE_NAME.zip" . -x "*.DS_Store*"
cd ..

echo "✨ Build complete!"
echo ""
echo "📋 Package contents:"
unzip -l "$PACKAGE_NAME.zip"

echo ""
echo "🎯 Next steps:"
echo "1. Test the extension by loading '$BUILD_DIR' in Chrome"
echo "2. Create screenshots of the extension in action"
echo "3. Go to Chrome Web Store Developer Console"
echo "4. Upload '$PACKAGE_NAME.zip'"
echo "5. Fill out the store listing with screenshots and description"
echo ""
echo "📄 See CHROME_STORE_GUIDE.md for detailed submission instructions"

# Verify the package
echo ""
echo "🔍 Package verification:"
if [ -f "$PACKAGE_NAME.zip" ]; then
    echo "✅ Package created successfully: $PACKAGE_NAME.zip"
    echo "📊 Package size: $(du -h "$PACKAGE_NAME.zip" | cut -f1)"
else
    echo "❌ Package creation failed"
    exit 1
fi

# List what was included
echo ""
echo "📋 Files included in package:"
unzip -l "$PACKAGE_NAME.zip" | grep -E '\.(json|html|js|css|png|md)$'
