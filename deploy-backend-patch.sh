#!/bin/bash
# Deploy only the chat service changes to avoid large file upload

echo "Creating minimal commit with only chat changes..."

# Reset to clean state
git reset --hard origin/main

# Stage only the chat files
git add src/controllers/chat.controller.ts
git add src/services/chat.service.ts

# Commit
git commit -m "Add metadata support to chat messages"

# Push
git push origin main

echo "Deploy complete! Render will auto-deploy."
