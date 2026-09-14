#!/usr/bin/env bash
# =========================================================================
# 🔒 CRDISK SAAS - HOST NGINX & SSL CERTBOT PROVISIONING SCRIPT
# Subdomínio: crdisk.salessant.com.br -> http://127.0.0.1:3000
# =========================================================================

set -e

echo "➡️ [1/4] Criando configuração do Nginx em /etc/nginx/sites-available/crdisk..."
cat << 'EOF' > /etc/nginx/sites-available/crdisk
map $http_upgrade $connection_upgrade {
    default upgrade;
    '' close;
}

server {
    listen 80;
    listen [::]:80;
    server_name crdisk.salessant.com.br;

    client_max_body_size 30M;
    client_body_buffer_size 512k;

    # Headers de Segurança
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # WebSockets Gateway (/ws)
    location /ws {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }

    # Aplicação Web & APIs
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        proxy_read_timeout 120s;
        proxy_send_timeout 120s;
    }
}
EOF

echo "➡️ [2/4] Ativando site no Nginx..."
ln -sf /etc/nginx/sites-available/crdisk /etc/nginx/sites-enabled/crdisk

echo "➡️ [3/4] Testando sintaxe e recarregando Nginx..."
nginx -t
systemctl reload nginx

echo "➡️ [4/4] Emitindo certificado SSL Let's Encrypt para crdisk.salessant.com.br..."
certbot --nginx -d crdisk.salessant.com.br --non-interactive --agree-tos --register-unsafely-without-email || certbot --nginx -d crdisk.salessant.com.br

echo "✅ Configuração concluída com sucesso! Testando conectividade..."
curl -Ik https://crdisk.salessant.com.br
