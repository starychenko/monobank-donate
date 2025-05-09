#!/bin/sh
set -e

CERT_FILE="/app/ssl/server.crt"
KEY_FILE="/app/ssl/server.key"
DOMAIN=${DOMAIN:-localhost}

# Check if HTTPS should be used
if [ "$USE_HTTPS" = "true" ]; then
  echo "HTTPS configuration detected for backend..."
  
  # Check if certificates exist
  if [ ! -f "$CERT_FILE" ] || [ ! -f "$KEY_FILE" ]; then
    echo "SSL certificates for backend not found. Creating temporary self-signed certificates..."
    
    # Create self-signed certificates
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
      -keyout $KEY_FILE -out $CERT_FILE \
      -subj "/CN=$DOMAIN" \
      -addext "subjectAltName=DNS:$DOMAIN,DNS:localhost"
    
    # Update environment variables to use new certificates
    export SSL_KEY_PATH=$KEY_FILE
    export SSL_CERT_PATH=$CERT_FILE
    
    echo "Temporary SSL certificates for backend created."
    echo " - Key: $KEY_FILE"
    echo " - Cert: $CERT_FILE"
  else
    echo "SSL certificates for backend already exist."
    
    # Make sure certificate paths are correct
    if [ -z "$SSL_KEY_PATH" ]; then
      export SSL_KEY_PATH=$KEY_FILE
    fi
    
    if [ -z "$SSL_CERT_PATH" ]; then
      export SSL_CERT_PATH=$CERT_FILE
    fi
  fi
else
  echo "HTTPS is not used for backend, skipping SSL certificate creation."
fi

# Run the original command
exec "$@" 