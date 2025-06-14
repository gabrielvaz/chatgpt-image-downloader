#!/bin/bash

# Script para commits mais robustos e rápidos
# Uso: ./quick-commit.sh "mensagem do commit"

set -e  # Para em caso de erro

COMMIT_MSG="${1:-Update code}"

echo "🔄 Iniciando commit rápido..."

# Verifica se há mudanças
if [ -z "$(git status --porcelain)" ]; then
    echo "✅ Nenhuma mudança detectada para commit"
    exit 0
fi

# Adiciona arquivos de forma mais específica
echo "📁 Adicionando arquivos modificados..."
git add --update  # Adiciona apenas arquivos já rastreados que foram modificados

# Se há arquivos novos, adiciona também
if [ -n "$(git status --porcelain | grep '^??')" ]; then
    echo "📄 Adicionando arquivos novos..."
    git add .
fi

# Commit rápido sem editor
echo "💾 Fazendo commit..."
git commit -m "$COMMIT_MSG" --quiet

echo "✅ Commit realizado com sucesso: $COMMIT_MSG"
git log --oneline -1
