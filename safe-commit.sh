#!/bin/bash

# Função para commits robustos e rápidos - macOS compatible
# Evita travamentos e timeouts

commit_safe() {
    local message="${1:-Update files}"
    
    echo "🔄 Iniciando commit seguro..."
    
    # Verifica se há mudanças
    if [ -z "$(git status --porcelain)" ]; then
        echo "✅ Nada para commit"
        return 0
    fi
    
    # Adiciona arquivos principais primeiro
    echo "📁 Adicionando arquivos principais..."
    git add *.js *.css *.html *.json 2>/dev/null || true
    
    # Depois adiciona documentação
    echo "📄 Adicionando documentação..."
    git add *.md 2>/dev/null || true
    
    # Adiciona scripts
    echo "🔧 Adicionando scripts..."
    git add *.sh 2>/dev/null || true
    
    # Commit sem verificação para ser mais rápido
    echo "💾 Fazendo commit..."
    git commit -m "$message" --no-verify --quiet || {
        echo "❌ Falha no commit detalhado, tentando commit simples..."
        git commit -m "Update" --no-verify --quiet 2>/dev/null || {
            echo "❌ Commit falhou - verificando problemas..."
            git status --porcelain
            return 1
        }
    }
    
    echo "✅ Commit realizado: $message"
    git log --oneline -1
}

# Chama a função se script for executado diretamente
if [ "${BASH_SOURCE[0]}" == "${0}" ]; then
    commit_safe "$@"
fi
