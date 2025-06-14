// Background script para gerenciar downloads com configurações personalizadas
console.log('ChatGPT Image Downloader: Background script iniciado');

// Escuta mensagens do popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'download_images') {
        handleImageDownloads(request.images, request.settings || {})
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

async function handleImageDownloads(images, settings) {
    let downloaded = 0;
    let errors = [];
    
    // Configurações padrão
    const defaultSettings = {
        downloadFolder: 'ChatGPT-Images',
        downloadInterval: '5000'
    };
    
    const finalSettings = { ...defaultSettings, ...settings };
    
    console.log(`Iniciando download de ${images.length} imagens com configurações:`, finalSettings);
    
    // Processa downloads com intervalo configurável
    for (let i = 0; i < images.length; i++) {
        const image = images[i];
        
        try {
            // Generate filename using the improved function
            const filename = generateFilename(image, i, images.length);
            const fullPath = `${finalSettings.downloadFolder}/${filename}`;
            
            console.log(`Downloading image ${i + 1}/${images.length}: ${filename}`);
            
            // Inicia o download
            const downloadId = await new Promise((resolve, reject) => {
                chrome.downloads.download({
                    url: image.url,
                    filename: fullPath,
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
            
            // Aplica intervalo entre downloads se não for o último
            if (i < images.length - 1) {
                const delay = getDownloadDelay(finalSettings.downloadInterval);
                console.log(`Aguardando ${delay}ms antes do próximo download...`);
                await new Promise(resolve => setTimeout(resolve, delay));
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
        let notificationMessage = `${downloaded} imagens baixadas com sucesso!`;
        if (errors.length > 0) {
            notificationMessage += ` (${errors.length} falharam)`;
        }
        
        try {
            await chrome.notifications.create({
                type: 'basic',
                iconUrl: 'icon.png',
                title: 'ChatGPT Image Downloader',
                message: notificationMessage
            });
        } catch (notificationError) {
            console.log('Erro ao mostrar notificação:', notificationError);
        }
    }
    
    return { downloaded, errors };
}

function cleanTitleForFilename(title) {
    if (!title) return null;
    
    return title
        // Remove caracteres especiais mas mantém acentos, hífens e underscores
        .replace(/[^\w\s\-_()áéíóúâêôàçãõÁÉÍÓÚÂÊÔÀÇÃÕüÜñÑ]/gi, '')
        // Remove múltiplos espaços
        .replace(/\s+/g, ' ')
        .trim()
        // Remove parênteses vazios
        .replace(/\(\s*\)/g, '')
        // Substitui espaços por hífens
        .replace(/\s/g, '-')
        // Remove hífens múltiplos
        .replace(/-+/g, '-')
        // Remove underscores múltiplos 
        .replace(/_+/g, '_')
        // Remove hífen/underscore no início e fim
        .replace(/^[-_]+|[-_]+$/g, '')
        // Converte para minúsculas exceto primeira letra de cada palavra
        .toLowerCase()
        .replace(/\b\w/g, l => l.toUpperCase())
        // Volta para minúsculas para consistência
        .toLowerCase()
        // Limita o tamanho máximo
        .substring(0, 60)
        // Remove hífen final se foi cortado no meio
        .replace(/-+$/, '');
}

// Função auxiliar para gerar nomes de arquivos mais organizados
function generateFilename(image, index, totalImages) {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const paddedIndex = String(index + 1).padStart(String(totalImages).length, '0');
    
    let filename;
    
    if (image.title) {
        const cleanTitle = cleanTitleForFilename(image.title);
        
        if (cleanTitle && cleanTitle.length >= 3) {
            // Use image timestamp if available for better organization
            if (image.timestamp) {
                try {
                    const imgDate = new Date(image.timestamp);
                    const imgDateStr = imgDate.toISOString().split('T')[0];
                    const imgTimeStr = imgDate.toTimeString().split(' ')[0].replace(/:/g, '-');
                    filename = `${imgDateStr}_${cleanTitle}_${paddedIndex}.png`;
                } catch (e) {
                    // If timestamp parsing fails, use current date
                    filename = `${dateStr}_${cleanTitle}_${paddedIndex}.png`;
                }
            } else {
                filename = `${dateStr}_${cleanTitle}_${paddedIndex}.png`;
            }
        } else {
            // If title cleaning resulted in empty or too short string, use fallback
            if (image.timestamp) {
                try {
                    const imgDate = new Date(image.timestamp);
                    const imgDateStr = imgDate.toISOString().split('T')[0];
                    const imgTimeStr = imgDate.toTimeString().split(' ')[0].replace(/:/g, '-');
                    filename = `${imgDateStr}_${imgTimeStr}_chatgpt-image_${paddedIndex}.png`;
                } catch (e) {
                    filename = `${dateStr}_chatgpt-image_${paddedIndex}.png`;
                }
            } else {
                filename = `${dateStr}_chatgpt-image_${paddedIndex}.png`;
            }
        }
    } else {
        // No title available
        if (image.timestamp) {
            try {
                const imgDate = new Date(image.timestamp);
                const imgDateStr = imgDate.toISOString().split('T')[0];
                const imgTimeStr = imgDate.toTimeString().split(' ')[0].replace(/:/g, '-');
                filename = `${imgDateStr}_${imgTimeStr}_chatgpt_${paddedIndex}.png`;
            } catch (e) {
                filename = `${dateStr}_chatgpt-image_${paddedIndex}.png`;
            }
        } else {
            const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
            filename = `${dateStr}_${timeStr}_chatgpt_${paddedIndex}.png`;
        }
    }
    
    return filename;
}

function getDownloadDelay(intervalSetting) {
    switch (intervalSetting) {
        case '2000':
            return 2000;
        case '5000':
            return 5000;
        case '10000':
            return 10000;
        case '20000':
            return 20000;
        case 'random':
            // Aleatório entre 2-10 segundos
            return Math.floor(Math.random() * 8000) + 2000;
        default:
            return 5000; // Padrão de 5 segundos
    }
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
async function cleanupOldDownloads() {
    try {
        const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        
        const downloads = await new Promise((resolve) => {
            chrome.downloads.search({
                filenameRegex: 'ChatGPT.*chatgpt-.*\\.png'
            }, resolve);
        });
        
        downloads.forEach(download => {
            if (download.startTime && new Date(download.startTime).getTime() < oneWeekAgo) {
                // Remove da lista de downloads (não remove o arquivo)
                chrome.downloads.erase({ id: download.id });
            }
        });
    } catch (error) {
        console.log('Erro ao limpar downloads antigos:', error);
    }
}

// Instala listener para quando a extensão é instalada
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        console.log('ChatGPT Image Downloader instalado com sucesso!');
        
        // Define configurações padrão
        chrome.storage.sync.set({
            chatgptImageDownloaderSettings: {
                downloadFolder: 'ChatGPT-Images',
                downloadInterval: '5000'
            }
        });
    } else if (details.reason === 'update') {
        console.log('ChatGPT Image Downloader atualizado!');
    }
});

// Limpa downloads antigos na inicialização
cleanupOldDownloads();
