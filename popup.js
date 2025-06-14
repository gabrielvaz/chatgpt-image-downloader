document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('config-form');
    const statusDiv = document.getElementById('status');
    const downloadBtn = document.getElementById('download-btn');
    const btnText = document.getElementById('btn-text');
    const btnLoading = document.getElementById('btn-loading');
    const imageEstimate = document.getElementById('image-estimate');
    const estimateCount = document.getElementById('estimate-count');
    
    // Settings elements
    const settingsBtn = document.getElementById('settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    const closeSettingsBtn = document.getElementById('close-settings');
    const saveSettingsBtn = document.getElementById('save-settings');
    const downloadFolderInput = document.getElementById('download-folder');
    const downloadIntervalSelect = document.getElementById('download-interval');

    // Load saved settings and form data
    loadSavedSettings();
    loadSavedFormData();

    // Event listeners
    form.addEventListener('submit', handleDownload);
    form.addEventListener('change', handleFormChange);
    settingsBtn.addEventListener('click', openSettings);
    closeSettingsBtn.addEventListener('click', closeSettings);
    saveSettingsBtn.addEventListener('click', saveSettings);
    
    // Close modal when clicking outside
    settingsModal.addEventListener('click', function(e) {
        if (e.target === settingsModal) closeSettings();
    });

    // Estimate images when form changes
    form.addEventListener('change', debounce(estimateImages, 300));

    async function handleDownload() {
        event.preventDefault();
        
        try {
            showStatus('Verificando página atual...', 'info');
            setButtonLoading(true);

            // Check if we're on the correct page
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (!tab.url.includes('chat.openai.com/library') && !tab.url.includes('chatgpt.com/library')) {
                showStatus('❌ Por favor, navegue para chat.openai.com/library primeiro', 'error');
                setButtonLoading(false);
                return;
            }

            // Collect form configuration
            const formData = new FormData(form);
            const config = {
                filter: formData.get('filter'),
                count: parseInt(formData.get('count')) || 10,
                days: parseInt(formData.get('days')) || 7,
                date: formData.get('date')
            };

            // Validate configuration
            if (config.filter === 'date' && !config.date) {
                showStatus('❌ Por favor, selecione uma data', 'error');
                setButtonLoading(false);
                return;
            }

            showStatus('Coletando imagens da página...', 'info');

            // Inject script to collect images
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

                // Get download settings
                const settings = await getSettings();

                // Send to background script
                chrome.runtime.sendMessage({
                    type: 'download_images',
                    images: images,
                    settings: settings
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

    async function estimateImages() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (!tab.url.includes('chat.openai.com/library') && !tab.url.includes('chatgpt.com/library')) {
                imageEstimate.classList.add('hidden');
                return;
            }

            const formData = new FormData(form);
            const config = {
                filter: formData.get('filter'),
                count: parseInt(formData.get('count')) || 10,
                days: parseInt(formData.get('days')) || 7,
                date: formData.get('date')
            };

            // Quick estimation with title preview
            const results = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: estimateImageCount,
                args: [config]
            });

            if (results && results[0] && results[0].result) {
                const { count, titlesPreview } = results[0].result;
                if (count > 0) {
                    estimateCount.textContent = count;
                    imageEstimate.classList.remove('hidden');
                    
                    // Add tooltip with title examples
                    if (titlesPreview && titlesPreview.length > 0) {
                        const previewText = titlesPreview.slice(0, 3).join(', ');
                        estimateCount.title = `Exemplos de títulos: ${previewText}${titlesPreview.length > 3 ? '...' : ''}`;
                    }
                } else {
                    imageEstimate.classList.add('hidden');
                }
            }
        } catch (error) {
            console.log('Estimation error:', error);
            imageEstimate.classList.add('hidden');
        }
    }

    function handleFormChange() {
        saveFormData();
        // Trigger estimation after form change
        setTimeout(estimateImages, 100);
    }

    function openSettings() {
        settingsModal.classList.remove('hidden');
    }

    function closeSettings() {
        settingsModal.classList.add('hidden');
    }

    async function saveSettings() {
        const settings = {
            downloadFolder: downloadFolderInput.value.trim() || 'ChatGPT-Images',
            downloadInterval: downloadIntervalSelect.value
        };

        await chrome.storage.sync.set({ chatgptImageDownloaderSettings: settings });
        
        showStatus('✅ Configurações salvas!', 'success');
        setTimeout(() => {
            closeSettings();
            statusDiv.classList.add('hidden');
        }, 1500);
    }

    async function getSettings() {
        const result = await chrome.storage.sync.get(['chatgptImageDownloaderSettings']);
        return result.chatgptImageDownloaderSettings || {
            downloadFolder: 'ChatGPT-Images',
            downloadInterval: '5000'
        };
    }

    async function loadSavedSettings() {
        const settings = await getSettings();
        downloadFolderInput.value = settings.downloadFolder;
        downloadIntervalSelect.value = settings.downloadInterval;
    }

    function saveFormData() {
        const formData = new FormData(form);
        const formSettings = {
            filter: formData.get('filter'),
            count: formData.get('count'),
            days: formData.get('days'),
            date: formData.get('date')
        };
        
        chrome.storage.sync.set({ chatgptImageDownloaderFormData: formSettings });
    }

    function loadSavedFormData() {
        chrome.storage.sync.get(['chatgptImageDownloaderFormData'], function(result) {
            if (result.chatgptImageDownloaderFormData) {
                const formData = result.chatgptImageDownloaderFormData;
                
                // Restore radio button
                if (formData.filter) {
                    const radio = form.querySelector(`input[value="${formData.filter}"]`);
                    if (radio) radio.checked = true;
                }
                
                // Restore input values
                if (formData.count) {
                    form.querySelector('input[name="count"]').value = formData.count;
                }
                if (formData.days) {
                    form.querySelector('input[name="days"]').value = formData.days;
                }
                if (formData.date) {
                    form.querySelector('input[name="date"]').value = formData.date;
                }
            }
        });
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

    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Initial estimation
    setTimeout(estimateImages, 500);
});

// Function to estimate image count (injected into page)
function estimateImageCount(config) {
    try {
        const images = document.querySelectorAll('.group\\/imagegen-image img, [data-testid*="image"] img, .image-container img');
        const totalImages = images.length;
        
        if (totalImages === 0) return { count: 0, titlesPreview: [] };

        // Extract titles for preview
        const titlesPreview = [];
        for (let i = 0; i < Math.min(images.length, 5); i++) {
            const img = images[i];
            const title = extractImageTitleFromImg(img);
            if (title) {
                titlesPreview.push(title);
            }
        }

        let estimatedCount;
        switch (config.filter) {
            case 'count':
                estimatedCount = Math.min(totalImages, config.count);
                break;
                
            case 'days':
                // For days filter, estimate all available images since we don't limit by quantity
                estimatedCount = totalImages;
                break;
                
            case 'date':
                // For specific date, estimate all available images for that date
                estimatedCount = totalImages;
                break;
                
            case 'all':
            default:
                estimatedCount = totalImages;
                break;
        }
        
        return { count: estimatedCount, titlesPreview };
    } catch (error) {
        return { count: 0, titlesPreview: [] };
    }
}

// Helper function for title extraction in estimation (simplified version)
function extractImageTitleFromImg(img) {
    try {
        const parentElement = img.closest('[data-testid], .group\\/imagegen-image, .image-container, .relative, .flex');
        
        if (parentElement) {
            // Look for title elements
            const titleElement = parentElement.querySelector('.line-clamp-2, .line-clamp-1, .font-medium');
            if (titleElement && titleElement.textContent) {
                const text = titleElement.textContent.trim();
                if (text.length > 3 && text.length < 100) {
                    return text;
                }
            }
        }
        
        // Fallback to alt attribute
        if (img.alt && img.alt.trim() && img.alt.length > 3) {
            return img.alt.trim();
        }
        
        return null;
    } catch (e) {
        return null;
    }
}

// Function to collect images (injected into page)
function collectImages(config) {
    try {
        const images = [];
        
        // Multiple selectors to catch different image types
        const selectors = [
            '.group\\/imagegen-image img',
            '[data-testid*="image"] img',
            '.image-container img',
            'img[src*="oaiusercontent.com"]',
            'img[src*="files.oaiusercontent.com"]'
        ];
        
        let imageElements = [];
        
        // Try each selector and combine results
        selectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                if (el.src && el.src.startsWith('https://') && 
                    (el.src.includes('oaiusercontent.com') || el.src.includes('openai.com'))) {
                    imageElements.push(el);
                }
            });
        });
        
        // Remove duplicates based on src
        const uniqueElements = [];
        const seenUrls = new Set();
        
        imageElements.forEach(img => {
            if (!seenUrls.has(img.src)) {
                seenUrls.add(img.src);
                uniqueElements.push(img);
            }
        });

        if (uniqueElements.length === 0) {
            return {
                images: [],
                message: 'Nenhuma imagem encontrada. Certifique-se de estar na biblioteca do ChatGPT com imagens visíveis.'
            };
        }

        // Collect image information with better title extraction
        uniqueElements.forEach((img, index) => {
            const imageData = {
                url: img.src,
                alt: img.alt || `image-${index + 1}`,
                index: index,
                title: null
            };

            // Extract better title from various sources
            try {
                const parentElement = img.closest('[data-testid], .group\\/imagegen-image, .image-container, .relative, .flex');
                if (parentElement) {
                    // Look for span with line-clamp-2 class (title preview)
                    let titleElement = parentElement.querySelector('.line-clamp-2');
                    
                    if (!titleElement) {
                        // Fallback: look for any span that might contain title
                        const spans = parentElement.querySelectorAll('span');
                        titleElement = Array.from(spans).find(span => 
                            span.textContent && 
                            span.textContent.trim().length > 5 && 
                            span.textContent.trim().length < 100 &&
                            !span.textContent.includes('•') &&
                            !span.textContent.match(/^\d+$/) // Not just numbers
                        );
                    }
                    
                    if (titleElement && titleElement.textContent) {
                        imageData.title = titleElement.textContent.trim();
                    }
                    
                    // If no title found, try to extract from alt attribute
                    if (!imageData.title && img.alt && img.alt.length > 5) {
                        imageData.title = img.alt;
                    }
                    
                    // Look for date elements
                    const dateElements = parentElement.querySelectorAll('[title*="202"], [data-time], time, [datetime]');
                    dateElements.forEach(el => {
                        const dateText = el.getAttribute('title') || el.getAttribute('data-time') || 
                                       el.getAttribute('datetime') || el.textContent;
                        if (dateText && dateText.includes('202')) {
                            imageData.timestamp = dateText;
                        }
                    });
                    
                    // Also check parent elements for date info
                    let current = parentElement;
                    let depth = 0;
                    while (current && depth < 5) {
                        const timeEl = current.querySelector('time, [datetime]');
                        if (timeEl) {
                            imageData.timestamp = timeEl.getAttribute('datetime') || 
                                                timeEl.getAttribute('title') || 
                                                timeEl.textContent;
                            break;
                        }
                        current = current.parentElement;
                        depth++;
                    }
                }
            } catch (e) {
                // Ignore extraction errors
            }

            images.push(imageData);
        });

        // Apply filters with improved logic
        let filteredImages = [...images];
        
        switch (config.filter) {
            case 'count':
                filteredImages = images.slice(0, config.count);
                break;
                
            case 'days':
                // For days filter, try to use actual timestamps if available
                const daysAgo = new Date();
                daysAgo.setDate(daysAgo.getDate() - config.days);
                
                const imagesWithDates = images.filter(img => {
                    if (img.timestamp) {
                        try {
                            const imgDate = new Date(img.timestamp);
                            return imgDate >= daysAgo;
                        } catch (e) {
                            return true; // Include if date parsing fails
                        }
                    }
                    return true; // Include if no timestamp
                });
                
                // If we have dated images, use them, otherwise use all images
                if (imagesWithDates.length > 0 && imagesWithDates.length < images.length) {
                    filteredImages = imagesWithDates;
                } else {
                    // If no timestamp filtering is possible, include all images
                    // User specifically selected a day range, so give them all available images
                    filteredImages = images;
                }
                break;
                
            case 'date':
                if (config.date) {
                    const targetDate = new Date(config.date);
                    const targetDateStr = targetDate.toISOString().split('T')[0];
                    
                    filteredImages = images.filter(img => {
                        if (img.timestamp) {
                            try {
                                const imgDate = new Date(img.timestamp);
                                const imgDateStr = imgDate.toISOString().split('T')[0];
                                return imgDateStr === targetDateStr;
                            } catch (e) {
                                return false;
                            }
                        }
                        return false;
                    });
                    
                    // If no images found for specific date, return empty
                    if (filteredImages.length === 0) {
                        return {
                            images: [],
                            message: `Nenhuma imagem encontrada para a data ${config.date}. Verifique se há imagens dessa data na biblioteca.`
                        };
                    }
                }
                break;
                
            case 'all':
            default:
                // Keep all images
                break;
        }

        return {
            images: filteredImages,
            message: `${filteredImages.length} imagens coletadas com sucesso`
        };

    } catch (error) {
        return {
            images: [],
            message: `Erro ao coletar imagens: ${error.message}`
        };
    }
}
