# Estratégias para Evitar Travamentos no Git

## Problemas Identificados

1. **Mensagens de commit muito longas**: O git pode travar com mensagens extremamente longas
2. **Muitos arquivos**: Adicionar muitos arquivos de uma vez pode ser lento
3. **Hooks ou configurações**: Embora não detectados, podem causar lentidão
4. **Editor de texto**: Se o git abrir um editor, pode travar a interface

## Soluções Implementadas

### 1. Script de Commit Rápido (`quick-commit.sh`)
```bash
# Uso mais seguro e rápido
./quick-commit.sh "Mensagem curta e objetiva"
```

**Características:**
- Mensagens limitadas e objetivas
- `git add --update` para arquivos já rastreados
- `--quiet` para reduzir output
- `set -e` para parar em erros
- Verificação prévia de mudanças

### 2. Comandos Git Alternativos

#### Commit Simples e Direto:
```bash
git add -A && git commit -m "Update" --no-verify --quiet
```

#### Commit por Partes:
```bash
# Adicionar apenas arquivos específicos
git add popup.js content.js background.js
git commit -m "Update core files" --quiet

# Depois adicionar outros
git add *.md *.css
git commit -m "Update docs and styles" --quiet
```

#### Commit com Timeout:
```bash
timeout 30s git commit -m "Update" || echo "Commit timeout"
```

### 3. Configurações Git Otimizadas

```bash
# Desabilitar hooks temporariamente
git config core.hooksPath /dev/null

# Commits mais rápidos
git config commit.verbose false
git config core.editor true  # Evita abrir editor

# Restaurar depois
git config --unset core.hooksPath
git config --unset core.editor
```

### 4. Debugging de Problemas

```bash
# Verificar se há problemas no repositório
git fsck --full --strict

# Limpar cache se necessário
git gc --prune=now

# Verificar configurações problemáticas
git config --list | grep -E "(editor|hook|core)"
```

## Uso Recomendado

1. **Para commits rápidos**: Use `./quick-commit.sh "mensagem"`
2. **Para commits grandes**: Divida em partes menores
3. **Em caso de travamento**: Use `Ctrl+C` e tente comando alternativo
4. **Para debugging**: Use comandos de verificação

## Comandos de Emergência

Se o git travar completamente:

```bash
# Matar processos git travados
pkill -f git

# Limpar locks
rm -f .git/index.lock .git/HEAD.lock

# Resetar se necessário (cuidado!)
git reset --soft HEAD
```
