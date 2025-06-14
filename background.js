// Background script para gerenciar downloads
console.log('ChatGPT Image Downloader: Background script iniciado');

// Escuta mensagens do popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'download_images') {
        handleImageDownloads(request.images)
            .then(result => {
                sendResponse({ success: true, downloaded: result.downloaded, errors: result.errors });
            })
            .catch(error => {
                console.error('Erro no download:', error);
                sendResponse({ success: false, error: error.message });
            });
        
        // Retorna true para manter a conexão aberta para resposta assíncrona
        return true;
    }
});

async function handleImageDownloads(images) {
    let downloaded = 0;
    let errors = [];
    
    console.log(`Iniciando download de ${images.length} imagens`);
    
    // Processa downloads com delay para evitar rate limiting
    for (let i = 0; i < images.length; i++) {
        const image = images[i];
        
        try {
            // Gera nome único para o arquivo
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `chatgpt-image-${timestamp}-${i + 1}.png`;
            
            // Inicia o download
            const downloadId = await new Promise((resolve, reject) => {
                chrome.downloads.download({
                    url: image.url,
                    filename: `ChatGPT-Images/${filename}`,
                    saveAs: false, // Download automático sem dialog
                    conflictAction: 'uniquify' // Adiciona número se arquivo já existir
                }, (downloadId) => {
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message));
                    } else {
                        resolve(downloadId);
                    }
                });
            });
            
            console.log(`Download iniciado: ${filename} (ID: ${downloadId})`);
            downloaded++;
            
            // Pequeno delay entre downloads para não sobrecarregar
            if (i < images.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
        } catch (error) {
            console.error(`Erro ao baixar imagem ${i + 1}:`, error);
            errors.push({
                index: i + 1,
                url: image.url,
                error: error.message
            });
        }
    }
    
    console.log(`Downloads concluídos: ${downloaded} sucessos, ${errors.length} erros`);
    
    // Mostra notificação de conclusão
    if (downloaded > 0) {
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icon.png',
            title: 'ChatGPT Image Downloader',
            message: `${downloaded} imagens baixadas com sucesso!${errors.length > 0 ? ` (${errors.length} falharam)` : ''}`
        });
    }
    
    return { downloaded, errors };
}

// Listener para acompanhar o progresso dos downloads
chrome.downloads.onChanged.addListener((delta) => {
    if (delta.state && delta.state.current === 'complete') {
        console.log(`Download concluído: ID ${delta.id}`);
    } else if (delta.state && delta.state.current === 'interrupted') {
        console.log(`Download falhou: ID ${delta.id}`);
    }
});

// Função para limpar downloads antigos (opcional)
function cleanupOldDownloads() {
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
    chrome.downloads.search({
        filenameRegex: 'ChatGPT-Images/chatgpt-image-.*\\.png'
    }, (downloads) => {
        downloads.forEach(download => {
            if (download.startTime && new Date(download.startTime).getTime() < oneWeekAgo) {
                // Remove da lista de downloads (não remove o arquivo)
                chrome.downloads.erase({ id: download.id });
            }
        });
    });
}

// Limpa downloads antigos na inicialização
cleanupOldDownloads();

// Instala listener para quando a extensão é instalada
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        console.log('ChatGPT Image Downloader instalado com sucesso!');
        
        // Opcionalmente, abre uma aba de welcome
        // chrome.tabs.create({ url: 'https://chatgpt.com/library' });
    }
});
