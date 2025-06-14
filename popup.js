document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('config-form');
    const statusDiv = document.getElementById('status');
    const downloadBtn = document.getElementById('download-btn');
    const btnText = document.getElementById('btn-text');
    const btnLoading = document.getElementById('btn-loading');

    // Carrega configurações salvas
    loadSavedSettings();

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        handleDownload();
    });

    // Salva configurações quando mudam
    form.addEventListener('change', saveSettings);

    async function handleDownload() {
        try {
            showStatus('Verificando página atual...', 'info');
            setButtonLoading(true);

            // Verifica se estamos na página correta
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (!tab.url.includes('chatgpt.com/library')) {
                showStatus('❌ Por favor, navegue para chatgpt.com/library primeiro', 'error');
                setButtonLoading(false);
                return;
            }

            // Coleta configurações do formulário
            const formData = new FormData(form);
            const config = {
                filter: formData.get('filter'),
                count: parseInt(formData.get('count')) || 10,
                days: parseInt(formData.get('days')) || 7,
                date: formData.get('date')
            };

            // Valida configurações
            if (config.filter === 'date' && !config.date) {
                showStatus('❌ Por favor, selecione uma data', 'error');
                setButtonLoading(false);
                return;
            }

            showStatus('Coletando imagens da página...', 'info');

            // Injeta script para coletar imagens
            const results = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: collectImages,
                args: [config]
            });

            if (results && results[0] && results[0].result) {
                const { images, message } = results[0].result;
                
                if (images.length === 0) {
                    showStatus('❌ ' + (message || 'Nenhuma imagem encontrada'), 'error');
                    setButtonLoading(false);
                    return;
                }

                showStatus(`Iniciando download de ${images.length} imagens...`, 'info');

                // Envia para background script
                chrome.runtime.sendMessage({
                    type: 'download_images',
                    images: images
                }, function(response) {
                    if (response && response.success) {
                        showStatus(`✅ Download iniciado! ${images.length} imagens serão baixadas.`, 'success');
                    } else {
                        showStatus('❌ Erro ao iniciar downloads', 'error');
                    }
                    setButtonLoading(false);
                });

            } else {
                showStatus('❌ Erro ao coletar imagens da página', 'error');
                setButtonLoading(false);
            }

        } catch (error) {
            console.error('Erro:', error);
            showStatus('❌ Erro: ' + error.message, 'error');
            setButtonLoading(false);
        }
    }

    function showStatus(message, type) {
        statusDiv.textContent = message;
        statusDiv.className = `status ${type}`;
        statusDiv.classList.remove('hidden');
        
        if (type === 'success') {
            setTimeout(() => {
                statusDiv.classList.add('hidden');
            }, 5000);
        }
    }

    function setButtonLoading(loading) {
        downloadBtn.disabled = loading;
        if (loading) {
            btnText.classList.add('hidden');
            btnLoading.classList.remove('hidden');
        } else {
            btnText.classList.remove('hidden');
            btnLoading.classList.add('hidden');
        }
    }

    function saveSettings() {
        const formData = new FormData(form);
        const settings = {
            filter: formData.get('filter'),
            count: formData.get('count'),
            days: formData.get('days'),
            date: formData.get('date')
        };
        
        chrome.storage.sync.set({ chatgptImageDownloaderSettings: settings });
    }

    function loadSavedSettings() {
        chrome.storage.sync.get(['chatgptImageDownloaderSettings'], function(result) {
            if (result.chatgptImageDownloaderSettings) {
                const settings = result.chatgptImageDownloaderSettings;
                
                // Restaura radio button
                if (settings.filter) {
                    const radio = form.querySelector(`input[value="${settings.filter}"]`);
                    if (radio) radio.checked = true;
                }
                
                // Restaura valores dos inputs
                if (settings.count) {
                    form.querySelector('input[name="count"]').value = settings.count;
                }
                if (settings.days) {
                    form.querySelector('input[name="days"]').value = settings.days;
                }
                if (settings.date) {
                    form.querySelector('input[name="date"]').value = settings.date;
                }
            }
        });
    }
});

// Função que será injetada na página para coletar imagens
function collectImages(config) {
    try {
        // Aguarda um pouco para garantir que a página carregou
        const images = [];
        
        // Seleciona todas as imagens da galeria
        const imageElements = document.querySelectorAll('.group\\/imagegen-image img');
        
        if (imageElements.length === 0) {
            return {
                images: [],
                message: 'Nenhuma imagem encontrada. Certifique-se de estar na aba Library do ChatGPT.'
            };
        }

        // Coleta informações das imagens
        imageElements.forEach((img, index) => {
            if (img.src && img.src.startsWith('https://')) {
                const imageData = {
                    url: img.src,
                    alt: img.alt || `image-${index + 1}`,
                    index: index
                };

                // Tenta extrair timestamp do elemento pai (opcional)
                try {
                    const parentDiv = img.closest('.group\\/imagegen-image');
                    if (parentDiv) {
                        // Procura por elementos com data/time information
                        const timeElement = parentDiv.querySelector('[title*="202"]') || 
                                          parentDiv.querySelector('[data-time]') ||
                                          parentDiv.querySelector('time');
                        
                        if (timeElement) {
                            imageData.timestamp = timeElement.getAttribute('title') || 
                                                timeElement.getAttribute('data-time') || 
                                                timeElement.textContent;
                        }
                    }
                } catch (e) {
                    // Ignora erros na extração de timestamp
                }

                images.push(imageData);
            }
        });

        // Aplica filtros
        let filteredImages = [...images];
        
        switch (config.filter) {
            case 'count':
                filteredImages = images.slice(0, config.count);
                break;
                
            case 'days':
                // Para filtro por dias, usamos os últimos N elementos
                // (assumindo que as imagens estão ordenadas por data)
                const daysAgo = new Date();
                daysAgo.setDate(daysAgo.getDate() - config.days);
                
                // Se não temos timestamps, pega as primeiras N imagens
                filteredImages = images.slice(0, Math.min(images.length, config.days * 5));
                break;
                
            case 'date':
                // Para filtro por data específica, seria necessário mais lógica
                // Por agora, retorna todas (implementação básica)
                break;
                
            case 'all':
            default:
                // Já temos todas as imagens
                break;
        }

        return {
            images: filteredImages,
            message: `${filteredImages.length} imagens encontradas`
        };

    } catch (error) {
        return {
            images: [],
            message: `Erro ao coletar imagens: ${error.message}`
        };
    }
}
