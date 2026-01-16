#!/bin/bash
# ==================================
# Setup JWT RS256 Keys
# ==================================
# Este script gera as chaves RSA e mostra como configurá-las no .env

set -e

KEYS_DIR="keys"

echo "🔐 Gerando chaves JWT RS256..."
echo ""

# Criar diretório se não existir
mkdir -p "$KEYS_DIR"

# Gerar chaves
openssl genrsa -out "$KEYS_DIR/private.pem" 2048 2>/dev/null
openssl rsa -in "$KEYS_DIR/private.pem" -pubout -out "$KEYS_DIR/public.pem" 2>/dev/null

echo "✅ Chaves geradas em $KEYS_DIR/"
echo ""
echo "📋 Adicione as seguintes variáveis ao seu .env:"
echo ""
echo "# =========================================="
echo "# JWT RS256 Keys"
echo "# =========================================="

# Converter para uma única linha
PRIVATE_KEY=$(cat "$KEYS_DIR/private.pem" | awk '{printf "%s\\n", $0}')
PUBLIC_KEY=$(cat "$KEYS_DIR/public.pem" | awk '{printf "%s\\n", $0}')

echo "JWT_PRIVATE_KEY=\"$PRIVATE_KEY\""
echo ""
echo "JWT_PUBLIC_KEY=\"$PUBLIC_KEY\""
echo ""
echo "# =========================================="
echo ""
echo "🔒 IMPORTANTE: Nunca commite as chaves no repositório!"
echo "   As chaves estão em: $KEYS_DIR/"
echo "   O diretório $KEYS_DIR/ já está no .gitignore"
