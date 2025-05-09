#!/bin/sh
set -e

CERT_FILE="/etc/nginx/ssl/server.crt"
KEY_FILE="/etc/nginx/ssl/server.key"
DOMAIN=${VITE_DOMAIN:-localhost}

# Check if HTTPS should be used
if [ "$VITE_USE_HTTPS" = "true" ] || [ -f "$CERT_FILE" ]; then
  echo "HTTPS configuration detected for frontend..."
  
  # Check if certificates exist
  if [ ! -f "$CERT_FILE" ] || [ ! -f "$KEY_FILE" ]; then
    echo "SSL certificates not found. Creating temporary self-signed certificates..."
    
    # Create self-signed certificates
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
      -keyout $KEY_FILE -out $CERT_FILE \
      -subj "/CN=$DOMAIN" \
      -addext "subjectAltName=DNS:$DOMAIN,DNS:localhost"
    
    echo "Temporary SSL certificates created."
  else
    echo "SSL certificates for frontend already exist."
  fi
else
  echo "HTTPS is not used, skipping SSL certificate creation."
fi

# Run the original command
exec "$@" 