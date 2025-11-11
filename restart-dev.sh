#!/bin/bash

# Restart the development server with proper environment variables
echo "Restarting Cloudflare dev server..."

# Navigate to functions directory
cd functions

# Export environment variables explicitly
export JWT_SECRET="farmers_boot_jwt_secret_2024_secure_random_key_generated_for_authentication_tokens"
export RESEND_API_KEY="re_gYQWMQY1_5fqkWdXxrJXVSuXAMygXzGLs"
export FROM_EMAIL="noreply@farmersboot.com"
export APP_URL="http://localhost:3000"
export NODE_ENV="development"

echo "Environment variables set:"
echo "JWT_SECRET: $JWT_SECRET"
echo "RESEND_API_KEY: $RESEND_API_KEY"
echo "Starting server..."

# Start the dev server
npx wrangler dev