#!/bin/bash
# Script para resetar e reseeder o banco de dados

set -e

echo "🗑️  Resetando banco de dados..."
npx prisma migrate reset --force

echo "✅ Banco de dados resetado com sucesso!"
echo ""
echo "🌱 Sistema RBAC configurado com sucesso!"
echo ""
echo "📌 Dados criados:"
echo "   - Admin user: admin@teste.com"
echo "   - Password: Teste@123"
echo ""
echo "✨ Pronto para uso!"
