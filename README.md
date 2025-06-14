# ChatGPT Image Downloader

Uma extensão Chrome que permite baixar imagens em lote da biblioteca do ChatGPT (https://chatgpt.com/library) com filtros personalizados e organização inteligente de arquivos.

## ✨ Principais Recursos

- **🎯 Extração Inteligente de Títulos**: Utiliza títulos das imagens (span.line-clamp-2 e alt) para nomenclatura organizada
- **� Organização Automática**: Arquivos nomeados com data e título limpo (ex: `2025-06-14_painel-do-chatgpt_001.png`)
- **🌐 Interface Moderna**: Design inspirado no OpenAI com largura otimizada de 360px
- **⚙️ Configurações Personalizáveis**: Pasta de destino e intervalo entre downloads
- **📊 Estimativa em Tempo Real**: Prévia da quantidade de imagens e títulos que serão utilizados

## 🚀 Funcionalidades

- **Filtros Avançados**: 
  - Todas as imagens disponíveis
  - N imagens mais recentes
  - Imagens dos últimos X dias
  - Imagens de uma data específica
- **Download Inteligente**: 
  - Intervalos personalizáveis (2s, 5s, 10s, 20s, aleatório)
  - Nomenclatura baseada em títulos extraídos
  - Preservação de acentos portugueses
  - Organização cronológica automática
- **Interface Moderna**: 
  - Design OpenAI-inspired
  - Configurações persistentes
  - Feedback visual em tempo real
  - Tooltips informativos

## 📦 Instalação

### Instalação Manual (Modo Desenvolvedor)

1. **Clone ou baixe** este repositório
2. **Abra o Chrome** e vá para `chrome://extensions/`
3. **Ative** o "Modo do desenvolvedor" no canto superior direito
4. **Clique** em "Carregar sem compactação"
5. **Selecione** a pasta da extensão (`chatgpt-image-downloader`)
6. A extensão será instalada e aparecerá na barra de ferramentas

## 🎯 Como Usar

1. **Faça login** no ChatGPT (https://chatgpt.com)
2. **Navegue** para a página da biblioteca: https://chatgpt.com/library
3. **Clique** no ícone da extensão na barra de ferramentas
4. **Selecione** o filtro desejado:
   - **Todas**: Baixa todas as imagens visíveis
   - **Últimas N**: Baixa as N imagens mais recentes
   - **Últimos X dias**: Baixa imagens dos últimos X dias
   - **Data específica**: Baixa imagens de uma data específica
5. **Clique** em "Iniciar Download"
6. As imagens serão baixadas automaticamente na pasta `Downloads/ChatGPT-Images/`

## 🎨 Extração Inteligente de Títulos

A extensão utiliza um sistema avançado para extrair títulos das imagens e organizar os arquivos:

### Como Funciona
1. **Busca por `.line-clamp-2`**: Primeira prioridade para elementos com título principal
2. **Elementos de título**: `.line-clamp-1`, `.font-medium`, títulos de conversação
3. **Atributos HTML**: `alt`, `aria-label`, `title` como fallback
4. **Validação inteligente**: Filtra textos irrelevantes (datas, números, termos técnicos)

### Exemplos de Nomenclatura
```
HTML da imagem:
<span class="line-clamp-2">Painel do ChatGPT: Iniciar Download</span>
<img alt="Painel do ChatGPT: Iniciar Download" src="...">

Arquivo gerado:
2025-06-14_painel-do-chatgpt-iniciar-download_001.png
```

### Características
- ✅ Preserva acentos portugueses (á, é, í, ó, ú, ç, ã, õ)
- ✅ Remove caracteres problemáticos para sistemas de arquivos
- ✅ Organização cronológica automática
- ✅ Numeração sequencial para evitar conflitos
- ✅ Fallback para timestamp quando título não disponível

## 🔧 Estrutura do Projeto

```
chatgpt-image-downloader/
├── manifest.json          # Configuração da extensão
├── popup.html             # Interface do usuário
├── popup.js               # Lógica do popup
├── style.css              # Estilos da interface
├── content.js             # Script que roda na página do ChatGPT
├── background.js          # Service worker para downloads
├── icon.png               # Ícone da extensão
└── README.md              # Este arquivo
```

## 🛠️ Tecnologias Utilizadas

- **Manifest V3**: Versão mais recente da API de extensões do Chrome
- **Chrome Extensions API**: Para downloads e manipulação de abas
- **JavaScript ES6+**: Lógica moderna e assíncrona
- **CSS3**: Interface moderna e responsiva
- **HTML5**: Estrutura semântica

## 📋 Permissões Necessárias

- `activeTab`: Para acessar a aba atual
- `downloads`: Para baixar as imagens
- `scripting`: Para injetar scripts na página
- `storage`: Para salvar preferências do usuário
- `https://chatgpt.com/library*`: Acesso específico à biblioteca do ChatGPT

## 🐛 Resolução de Problemas

### A extensão não encontra imagens
- Certifique-se de estar na página `https://chatgpt.com/library`
- Verifique se você está logado no ChatGPT
- Aguarde a página carregar completamente antes de usar a extensão

### Downloads não começam
- Verifique se o navegador permite downloads automáticos
- Confira se há espaço suficiente no disco
- Verifique as configurações de download do Chrome

### Erro de permissões
- Certifique-se de que a extensão está ativada
- Recarregue a página do ChatGPT após instalar a extensão
- Verifique se o "Modo desenvolvedor" está ativado (para instalação manual)

## 🔄 Desenvolvimento

Para contribuir com o projeto:

1. **Fork** este repositório
2. **Crie** uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. **Faça** suas alterações
4. **Teste** a extensão localmente
5. **Commit** suas mudanças (`git commit -am 'Adiciona nova funcionalidade'`)
6. **Push** para a branch (`git push origin feature/nova-funcionalidade`)
7. **Abra** um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.

## ⚠️ Aviso Legal

Esta extensão é um projeto independente e não é afiliada ao OpenAI ou ChatGPT. Use por sua própria conta e risco, respeitando os termos de serviço do ChatGPT.

## 📞 Suporte

Se você encontrar problemas ou tiver sugestões, por favor:
- Abra uma issue no GitHub
- Descreva detalhadamente o problema
- Inclua prints de tela se necessário
