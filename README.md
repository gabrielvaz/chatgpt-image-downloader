# ChatGPT Image Downloader

Uma extensão Chrome que permite baixar imagens em lote da biblioteca do ChatGPT (https://chatgpt.com/library) com filtros personalizados.

## 🚀 Funcionalidades

- **Filtros de Download**: 
  - Todas as imagens disponíveis
  - N imagens mais recentes
  - Imagens dos últimos X dias
  - Imagens de uma data específica
- **Download Automático**: Baixa todas as imagens selecionadas automaticamente
- **Interface Intuitiva**: Popup simples e fácil de usar
- **Salva Preferências**: Lembra suas configurações para próximas utilizações

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
