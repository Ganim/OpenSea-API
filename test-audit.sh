#!/bin/bash

# Script para executar testes do sistema de Audit
# Usage: ./test-audit.sh [option]

echo "🧪 Testes do Sistema de Audit"
echo "=============================="
echo ""

case "$1" in
  "unit")
    echo "📝 Executando testes unitários..."
    npm test -- audit
    ;;
  "e2e")
    echo "🌐 Executando testes E2E..."
    npm run test:e2e -- audit
    ;;
  "list")
    echo "📋 Executando testes de listagem..."
    npm run test:e2e -- v1-list-audit-logs.e2e.spec
    ;;
  "history")
    echo "📜 Executando testes de histórico..."
    npm run test:e2e -- v1-get-entity-history.e2e.spec
    ;;
  "rollback")
    echo "↩️ Executando testes de rollback..."
    npm run test:e2e -- v1-preview-rollback.e2e.spec
    ;;
  "compare")
    echo "🔄 Executando testes de comparação..."
    npm run test:e2e -- v1-compare-versions.e2e.spec
    ;;
  "all")
    echo "🚀 Executando TODOS os testes..."
    echo ""
    echo "1️⃣ Testes Unitários:"
    npm test -- audit
    echo ""
    echo "2️⃣ Testes E2E:"
    npm run test:e2e -- audit
    ;;
  *)
    echo "Uso: ./test-audit.sh [option]"
    echo ""
    echo "Opções disponíveis:"
    echo "  unit      - Executar testes unitários"
    echo "  e2e       - Executar todos os testes E2E"
    echo "  list      - Executar testes de listagem"
    echo "  history   - Executar testes de histórico"
    echo "  rollback  - Executar testes de rollback"
    echo "  compare   - Executar testes de comparação"
    echo "  all       - Executar TODOS os testes (unit + e2e)"
    echo ""
    echo "Exemplo: ./test-audit.sh e2e"
    ;;
esac
