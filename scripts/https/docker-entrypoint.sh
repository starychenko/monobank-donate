#!/bin/sh
set -e

# Перевіряємо наявність сертифікатів
CERT_FILE="/etc/nginx/ssl/server.crt"
KEY_FILE="/etc/nginx/ssl/server.key"
DOMAIN=${VITE_DOMAIN:-localhost}

# Перевіряємо, чи використовувати HTTPS
if [ "$VITE_USE_HTTPS" = "true" ] || [ -f "$CERT_FILE" ]; then
  echo "HTTPS конфігурація виявлена для фронтенду..."
  
  # Перевіряємо, чи існують сертифікати
  if [ ! -f "$CERT_FILE" ] || [ ! -f "$KEY_FILE" ]; then
    echo "SSL сертифікати не знайдено. Створюємо тимчасові самопідписані сертифікати..."
    
    # Створюємо самопідписані сертифікати
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
      -keyout $KEY_FILE -out $CERT_FILE \
      -subj "/CN=$DOMAIN" \
      -addext "subjectAltName=DNS:$DOMAIN,DNS:localhost"
    
    echo "Тимчасові SSL сертифікати створено."
  else
    echo "SSL сертифікати для фронтенду вже існують."
  fi
else
  echo "HTTPS не використовується, створення SSL сертифікатів пропущено."
fi

# Запускаємо оригінальну команду
exec "$@" 