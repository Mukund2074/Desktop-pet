#!/bin/bash
# Copy the built app to /Applications
cp -R src-tauri/target/release/bundle/macos/Desktop\ Pet.app /Applications/Desktop\ Pet.app 2>/dev/null || true
echo "Done: /Applications/Desktop Pet.app updated"
