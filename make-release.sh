#!/bin/bash
set -e

VERSION="1.0.0"

# Pro package
OUTPUT_PRO="mergemind-pro-v$VERSION.zip"
STAGING_PRO="release-pro-$VERSION"

rm -rf "$STAGING_PRO"
mkdir "$STAGING_PRO"
cp -r dist "$STAGING_PRO/"
cp LICENSE "$STAGING_PRO/"
cp README.md "$STAGING_PRO/"
zip -r "$OUTPUT_PRO" "$STAGING_PRO"
rm -rf "$STAGING_PRO"
echo "✅ Created $OUTPUT_PRO"

# Startup package
OUTPUT_STARTUP="mergemind-startup-v$VERSION.zip"
STAGING_STARTUP="release-startup-$VERSION"

rm -rf "$STAGING_STARTUP"
mkdir "$STAGING_STARTUP"
cp -r dist "$STAGING_STARTUP/"
cp -r api "$STAGING_STARTUP/"
cp LICENSE "$STAGING_STARTUP/"
cp README.md "$STAGING_STARTUP/"
zip -r "$OUTPUT_STARTUP" "$STAGING_STARTUP"
rm -rf "$STAGING_STARTUP"
echo "✅ Created $OUTPUT_STARTUP"

# Enterprise package
OUTPUT_ENTERPRISE="mergemind-enterprise-v$VERSION.zip"
STAGING_ENTERPRISE="release-enterprise-$VERSION"

rm -rf "$STAGING_ENTERPRISE"
mkdir "$STAGING_ENTERPRISE"
cp -r dist "$STAGING_ENTERPRISE/"
cp -r api "$STAGING_ENTERPRISE/"
cp -r assets "$STAGING_ENTERPRISE/"
cp LICENSE "$STAGING_ENTERPRISE/"
cp README.md "$STAGING_ENTERPRISE/"
zip -r "$OUTPUT_ENTERPRISE" "$STAGING_ENTERPRISE"
rm -rf "$STAGING_ENTERPRISE"
echo "✅ Created $OUTPUT_ENTERPRISE"

