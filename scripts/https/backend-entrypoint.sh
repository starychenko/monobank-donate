#!/bin/sh
set -e

# Перевіряємо наявність сертифікатів
CERT_FILE="/app/ssl/server.crt"
KEY_FILE="/app/ssl/server.key"
DOMAIN=${DOMAIN:-localhost}

# Перевіряємо, чи використовувати HTTPS
if [ "$USE_HTTPS" = "true" ]; then
  echo "HTTPS конфігурація виявлена для бекенду..."
  
  # Перевіряємо, чи існують сертифікати
  if [ ! -f "$CERT_FILE" ] || [ ! -f "$KEY_FILE" ]; then
    echo "SSL сертифікати для бекенду не знайдено. Створюємо тимчасові самопідписані сертифікати..."
    
    # Створюємо самопідписані сертифікати
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
      -keyout $KEY_FILE -out $CERT_FILE \
      -subj "/CN=$DOMAIN" \
      -addext "subjectAltName=DNS:$DOMAIN,DNS:localhost"
    
    # Оновлюємо змінні середовища для використання нових сертифікатів
    export SSL_KEY_PATH=$KEY_FILE
    export SSL_CERT_PATH=$CERT_FILE
    
    echo "Тимчасові SSL сертифікати для бекенду створено."
    echo " - Key: $KEY_FILE"
    echo " - Cert: $CERT_FILE"
  else
    echo "SSL сертифікати для бекенду вже існують."
    
    # Переконуємось, що шляхи до сертифікатів коректні
    if [ -z "$SSL_KEY_PATH" ]; then
      export SSL_KEY_PATH=$KEY_FILE
    fi
    
    if [ -z "$SSL_CERT_PATH" ]; then
      export SSL_CERT_PATH=$CERT_FILE
    fi
  fi
else
  echo "HTTPS не використовується для бекенду, створення SSL сертифікатів пропущено."
fi

# Запускаємо оригінальну команду
exec "$@" 