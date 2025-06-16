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

    // Progress modal elements
    const progressModal = document.getElementById('progress-modal');
    const progressText = document.getElementById('progress-text');
    const progressDetails = document.getElementById('progress-details');
    const progressCurrent = document.getElementById('progress-current');
    const progressTotal = document.getElementById('progress-total');
    const progressBar = document.getElementById('progress-bar');
    const progressFolderPath = document.getElementById('progress-folder-path');
    const progressSuccess = document.getElementById('progress-success');
    const successCount = document.getElementById('success-count');
    const cancelDownloadBtn = document.getElementById('cancel-download');
    const closeProgressBtn = document.getElementById('close-progress');

    // Manual selection elements
    const manualModal = document.getElementById('manual-modal');
    const closeManualBtn = document.getElementById('close-manual');
    const manualLoading = document.getElementById('manual-loading');
    const manualControls = document.getElementById('manual-controls');
    const selectionCount = document.getElementById('selection-count');
    const totalImagesCount = document.getElementById('total-images-count');
    const selectAllBtn = document.getElementById('select-all');
    const deselectAllBtn = document.getElementById('deselect-all');
    const downloadSelectedBtn = document.getElementById('download-selected');
    const imagesList = document.getElementById('images-list');

    // Global variables
    let downloadCancelled = false;
    let allImages = [];
    let selectedImages = [];

    // Load saved settings and form data
    loadSavedSettings();
    loadSavedFormData();

    // Event listeners
    form.addEventListener('submit', handleDownload);
    form.addEventListener('change', handleFormChange);
    settingsBtn.addEventListener('click', openSettings);
    closeSettingsBtn.addEventListener('click', closeSettings);
    saveSettingsBtn.addEventListener('click', saveSettings);
    
    // Progress modal listeners
    cancelDownloadBtn.addEventListener('click', cancelDownload);
    closeProgressBtn.addEventListener('click', closeProgressModal);
    
    // Manual selection listeners
    closeManualBtn.addEventListener('click', closeManualModal);
    selectAllBtn.addEventListener('click', selectAllImages);
    deselectAllBtn.addEventListener('click', deselectAllImages);
    downloadSelectedBtn.addEventListener('click', downloadSelectedImages);
    
    // Close modals when clicking outside
    settingsModal.addEventListener('click', function(e) {
        if (e.target === settingsModal) closeSettings();
    });
    
    progressModal.addEventListener('click', function(e) {
        if (e.target === progressModal && !downloadCancelled) cancelDownload();
    });
    
    manualModal.addEventListener('click', function(e) {
        if (e.target === manualModal) closeManualModal();
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

            // Handle manual selection
            if (config.filter === 'manual') {
                setButtonLoading(false);
                await openManualSelection(tab.id);
                return;
            }

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

                // Start download with progress
                await startDownloadWithProgress(images);

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
        try {
            // Show loading state
            saveSettingsBtn.disabled = true;
            saveSettingsBtn.textContent = 'Salvando...';
            
            const settings = {
                downloadFolder: downloadFolderInput.value.trim() || 'ChatGPT-Images',
                downloadInterval: downloadIntervalSelect.value
            };

            await chrome.storage.sync.set({ chatgptImageDownloaderSettings: settings });
            
            // Show success feedback
            saveSettingsBtn.textContent = '✅ Salvo!';
            showStatus('✅ Configurações salvas com sucesso!', 'success');
            
            // Close modal after short delay
            setTimeout(() => {
                closeSettings();
                statusDiv.classList.add('hidden');
                
                // Reset button state
                saveSettingsBtn.disabled = false;
                saveSettingsBtn.textContent = 'Salvar Configurações';
            }, 1000);
            
        } catch (error) {
            console.error('Error saving settings:', error);
            showStatus('❌ Erro ao salvar configurações: ' + error.message, 'error');
            
            // Reset button state on error
            saveSettingsBtn.disabled = false;
            saveSettingsBtn.textContent = 'Salvar Configurações';
        }
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

    // Progress Modal Functions
    async function startDownloadWithProgress(images) {
        try {
            const settings = await getSettings();
            
            // Show progress modal
            openProgressModal(images.length, settings.downloadFolder);
            
            // Reset cancel flag
            downloadCancelled = false;
            
            // Start download with progress tracking
            chrome.runtime.sendMessage({
                type: 'download_images_with_progress',
                images: images,
                settings: settings
            });
            
        } catch (error) {
            console.error('Error starting download:', error);
            showStatus(`❌ Erro: ${error.message}`, 'error');
        }
    }

    function openProgressModal(totalImages, folderPath) {
        progressTotal.textContent = totalImages;
        progressCurrent.textContent = '0';
        progressBar.style.width = '0%';
        progressText.textContent = 'Iniciando download...';
        progressFolderPath.textContent = `Downloads/${folderPath}/`;
        progressSuccess.classList.add('hidden');
        cancelDownloadBtn.classList.remove('hidden');
        closeProgressBtn.classList.add('hidden');
        
        progressModal.classList.remove('hidden');
        
        // Listen for progress updates
        listenForProgressUpdates();
    }

    function listenForProgressUpdates() {
        // Remove qualquer listener anterior para evitar múltiplos listeners
        if (window._progressListener) {
            chrome.runtime.onMessage.removeListener(window._progressListener);
        }
        window._progressListener = function progressListener(message) {
            console.log('[Popup] Mensagem recebida:', message);
            if (message.type === 'download_progress') {
                updateProgress(message.current, message.total, message.filename);
            } else if (message.type === 'download_complete') {
                showDownloadComplete(message.downloaded, message.errors);
                chrome.runtime.onMessage.removeListener(window._progressListener);
            } else if (message.type === 'download_error') {
                showDownloadError(message.error);
                chrome.runtime.onMessage.removeListener(window._progressListener);
            }
        };
        chrome.runtime.onMessage.addListener(window._progressListener);
    }

    function updateProgress(current, total, filename) {
        if (downloadCancelled) return;
        
        const percentage = Math.round((current / total) * 100);
        
        progressCurrent.textContent = current;
        progressTotal.textContent = total;
        progressBar.style.width = `${percentage}%`;
        progressText.textContent = `Baixando ${filename || 'imagem'}...`;
        progressDetails.textContent = `${current} de ${total} imagens`;
    }

    function showDownloadComplete(downloaded, errors) {
        progressText.textContent = 'Download concluído!';
        progressBar.style.width = '100%';
        successCount.textContent = downloaded;
        
        progressSuccess.classList.remove('hidden');
        cancelDownloadBtn.classList.add('hidden');
        closeProgressBtn.classList.remove('hidden');
        
        if (errors && errors.length > 0) {
            progressText.textContent = `Download concluído com ${errors.length} erro(s)`;
        }
    }

    function showDownloadError(error) {
        progressText.textContent = 'Erro no download';
        progressDetails.textContent = error;
        cancelDownloadBtn.classList.add('hidden');
        closeProgressBtn.classList.remove('hidden');
    }

    function cancelDownload() {
        downloadCancelled = true;
        chrome.runtime.sendMessage({ type: 'cancel_download' });
        closeProgressModal();
    }

    function closeProgressModal() {
        progressModal.classList.add('hidden');
        downloadCancelled = false;
    }

    // Manual Selection Functions
    async function openManualSelection(tabId) {
        manualModal.classList.remove('hidden');
        manualLoading.classList.remove('hidden');
        manualControls.classList.add('hidden');
        imagesList.innerHTML = '';
        
        // Show loading message with steps
        manualLoading.innerHTML = `
            <div class="loading-spinner"></div>
            <div id="loading-steps">
                <div>1. Fazendo scroll para carregar todas as imagens...</div>
                <div id="step-2" style="opacity: 0.5;">2. Coletando metadados das imagens...</div>
                <div id="step-3" style="opacity: 0.5;">3. Organizando lista para seleção...</div>
            </div>
        `;
        
        try {
            // Step 1: Load all images by scrolling
            const scrollResults = await chrome.scripting.executeScript({
                target: { tabId },
                function: loadAllImagesWithScroll
            });

            if (!scrollResults || !scrollResults[0] || !scrollResults[0].result) {
                throw new Error('Erro ao carregar as imagens da página');
            }

            const { totalImagesFound } = scrollResults[0].result;
            
            // Update loading message
            document.getElementById('step-2').style.opacity = '1';
            
            // Step 2: Collect all images with metadata
            const collectResults = await chrome.scripting.executeScript({
                target: { tabId },
                function: collectAllImagesWithMetadata,
                args: [0] // 0 = no limit, get all images
            });

            if (collectResults && collectResults[0] && collectResults[0].result) {
                allImages = collectResults[0].result;
                
                // Update loading message
                document.getElementById('step-3').style.opacity = '1';
                
                // Small delay to show final step
                setTimeout(() => {
                    displayImagesForSelection();
                }, 500);
            } else {
                throw new Error('Não foi possível coletar as imagens');
            }
        } catch (error) {
            console.error('Error loading images:', error);
            manualLoading.innerHTML = `<div style="color: #ef4444; text-align: center; padding: 20px;">
                <div style="font-weight: 600; margin-bottom: 8px;">Erro ao carregar imagens</div>
                <div style="font-size: 14px;">${error.message}</div>
                <div style="font-size: 12px; margin-top: 8px; opacity: 0.8;">
                    Certifique-se de estar na página chatgpt.com/library
                </div>
            </div>`;
        }
    }

    function displayImagesForSelection() {
        manualLoading.classList.add('hidden');
        manualControls.classList.remove('hidden');
        
        totalImagesCount.textContent = allImages.length;
        updateSelectionCount();
        
        imagesList.innerHTML = '';
        
        // Add summary header
        if (allImages.length > 0) {
            const summary = document.createElement('div');
            summary.className = 'images-summary';
            summary.innerHTML = `
                <div style="background: #f8fafc; padding: 12px; border-radius: 8px; margin-bottom: 16px; border-left: 4px solid #10b981;">
                    <div style="font-weight: 600; color: #065f46; margin-bottom: 4px;">
                        ✅ ${allImages.length} imagens encontradas na biblioteca
                    </div>
                    <div style="font-size: 14px; color: #6b7280;">
                        Selecione as imagens que deseja baixar usando os checkboxes abaixo
                    </div>
                </div>
            `;
            imagesList.appendChild(summary);
        }
        
        allImages.forEach((image, index) => {
            const item = document.createElement('div');
            item.className = 'image-item';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'image-checkbox';
            checkbox.id = `img-${index}`;
            checkbox.addEventListener('change', () => toggleImageSelection(index));
            
            const info = document.createElement('div');
            info.className = 'image-info';
            
            const title = document.createElement('div');
            title.className = 'image-title';
            title.textContent = image.title || `Imagem ${index + 1}`;
            title.title = image.title || `Imagem ${index + 1}`; // Tooltip
            
            const date = document.createElement('div');
            date.className = 'image-date';
            if (image.timestamp) {
                try {
                    const imgDate = new Date(image.timestamp);
                    date.textContent = imgDate.toLocaleString('pt-BR');
                } catch (e) {
                    date.textContent = 'Data não disponível';
                }
            } else {
                date.textContent = 'Data não disponível';
            }
            
            // Add image index for easier identification
            const indexLabel = document.createElement('div');
            indexLabel.className = 'image-index';
            indexLabel.textContent = `#${index + 1}`;
            
            info.appendChild(indexLabel);
            info.appendChild(title);
            info.appendChild(date);
            
            // Add preview if possible
            const preview = document.createElement('img');
            preview.className = 'image-preview';
            preview.src = image.url;
            preview.loading = 'lazy'; // Lazy load for better performance
            preview.onerror = () => {
                preview.style.display = 'none';
                // Add a placeholder when image fails to load
                const placeholder = document.createElement('div');
                placeholder.className = 'image-placeholder';
                placeholder.innerHTML = '🖼️';
                item.appendChild(placeholder);
            };
            
            item.appendChild(checkbox);
            item.appendChild(info);
            item.appendChild(preview);
            
            imagesList.appendChild(item);
        });
        
        // If no images found, show helpful message
        if (allImages.length === 0) {
            const noImages = document.createElement('div');
            noImages.innerHTML = `
                <div style="text-align: center; padding: 40px 20px; color: #6b7280;">
                    <div style="font-size: 48px; margin-bottom: 16px;">🖼️</div>
                    <div style="font-weight: 600; margin-bottom: 8px;">Nenhuma imagem encontrada</div>
                    <div style="font-size: 14px; line-height: 1.5;">
                        Certifique-se de estar na página <strong>chatgpt.com/library</strong><br>
                        e que existem imagens geradas em suas conversas.
                    </div>
                </div>
            `;
            imagesList.appendChild(noImages);
        }
    }

    function toggleImageSelection(index) {
        const checkbox = document.getElementById(`img-${index}`);
        const item = checkbox.closest('.image-item');
        
        if (checkbox.checked) {
            selectedImages.push(allImages[index]);
            item.classList.add('selected');
        } else {
            selectedImages = selectedImages.filter(img => img !== allImages[index]);
            item.classList.remove('selected');
        }
        
        updateSelectionCount();
    }

    function updateSelectionCount() {
        selectionCount.textContent = selectedImages.length;
        downloadSelectedBtn.disabled = selectedImages.length === 0;
    }

    function selectAllImages() {
        selectedImages = [...allImages];
        document.querySelectorAll('.image-checkbox').forEach((checkbox, index) => {
            checkbox.checked = true;
            checkbox.closest('.image-item').classList.add('selected');
        });
        updateSelectionCount();
    }

    function deselectAllImages() {
        selectedImages = [];
        document.querySelectorAll('.image-checkbox').forEach(checkbox => {
            checkbox.checked = false;
            checkbox.closest('.image-item').classList.remove('selected');
        });
        updateSelectionCount();
    }

    async function downloadSelectedImages() {
        if (selectedImages.length === 0) return;
        
        closeManualModal();
        await startDownloadWithProgress(selectedImages);
    }

    function closeManualModal() {
        manualModal.classList.add('hidden');
        selectedImages = [];
        allImages = [];
    }

    // Update estimateImages to handle manual selection
    const originalEstimateImages = estimateImages;
    estimateImages = async function() {
        const formData = new FormData(form);
        const filter = formData.get('filter');
        
        if (filter === 'manual') {
            imageEstimate.classList.add('hidden');
            return;
        }
        
        return originalEstimateImages();
    };
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

// Function to load all images by scrolling (injected into page)
function loadAllImagesWithScroll() {
    return new Promise((resolve) => {
        let previousImageCount = 0;
        let stableCount = 0;
        let scrollAttempts = 0;
        const maxScrollAttempts = 50; // Maximum scroll attempts to prevent infinite loops
        const scrollDelay = 1000; // Wait time between scrolls
        
        function countCurrentImages() {
            const selectors = [
                '.group\\/imagegen-image img',
                '[data-testid*="image"] img',
                '.image-container img',
                'img[src*="oaiusercontent.com"]',
                '[data-testid="conversation-turn"] img',
                '.flex.flex-col img'
            ];
            
            const seenUrls = new Set();
            let totalCount = 0;
            
            selectors.forEach(selector => {
                const images = document.querySelectorAll(selector);
                images.forEach(img => {
                    if (img.src && img.src.includes('oaiusercontent.com') && !seenUrls.has(img.src)) {
                        seenUrls.add(img.src);
                        totalCount++;
                    }
                });
            });
            
            return totalCount;
        }
        
        function performScroll() {
            // Scroll to bottom of page
            window.scrollTo(0, document.body.scrollHeight);
            
            // Also try scrolling within any scrollable containers
            const scrollableContainers = document.querySelectorAll('[data-testid="conversation-turn"], .overflow-y-auto, .scroll-container');
            scrollableContainers.forEach(container => {
                if (container.scrollHeight > container.clientHeight) {
                    container.scrollTop = container.scrollHeight;
                }
            });
            
            scrollAttempts++;
            
            setTimeout(() => {
                const currentImageCount = countCurrentImages();
                
                console.log(`Scroll attempt ${scrollAttempts}: Found ${currentImageCount} images`);
                
                if (currentImageCount === previousImageCount) {
                    stableCount++;
                } else {
                    stableCount = 0;
                    previousImageCount = currentImageCount;
                }
                
                // Stop if no new images found after 3 attempts or max attempts reached
                if (stableCount >= 3 || scrollAttempts >= maxScrollAttempts) {
                    console.log(`Finished loading images. Total found: ${currentImageCount}`);
                    resolve({ 
                        totalImagesFound: currentImageCount,
                        scrollAttempts: scrollAttempts
                    });
                } else {
                    performScroll();
                }
            }, scrollDelay);
        }
        
        // Start the scrolling process
        const initialCount = countCurrentImages();
        console.log(`Starting with ${initialCount} images visible`);
        previousImageCount = initialCount;
        
        if (initialCount === 0) {
            resolve({ totalImagesFound: 0, scrollAttempts: 0 });
        } else {
            performScroll();
        }
    });
}

// Function to collect all images with metadata (injected into page)
function collectAllImagesWithMetadata(maxImages = 0) {
    try {
        const images = [];
        
        // Enhanced selectors to catch different image types
        const selectors = [
            '.group\\/imagegen-image img',
            '[data-testid*="image"] img',
            '.image-container img',
            'img[src*="oaiusercontent.com"]',
            '[data-testid="conversation-turn"] img',
            '.flex.flex-col img'
        ];
        
        // Collect all unique images
        const seenUrls = new Set();
        
        selectors.forEach(selector => {
            const foundImages = document.querySelectorAll(selector);
            foundImages.forEach(img => {
                if (img.src && img.src.includes('oaiusercontent.com') && !seenUrls.has(img.src)) {
                    seenUrls.add(img.src);
                    
                    // Extract title and timestamp
                    const title = extractImageTitleFromImg(img);
                    const timestamp = extractImageTimestamp(img);
                    
                    const imageData = {
                        url: img.src,
                        title: title,
                        timestamp: timestamp,
                        element: img
                    };
                    
                    images.push(imageData);
                }
            });
        });
        
        // Sort by timestamp (newest first) or by position if no timestamp
        images.sort((a, b) => {
            if (a.timestamp && b.timestamp) {
                return new Date(b.timestamp) - new Date(a.timestamp);
            }
            // If no timestamps, keep original order (which should be newest first)
            return 0;
        });
        
        // Limit to maxImages if specified (0 means no limit)
        if (maxImages > 0) {
            return images.slice(0, maxImages);
        } else {
            return images;
        }
        
    } catch (error) {
        console.error('Error collecting images:', error);
        return [];
    }
}

// Helper function to extract timestamp from image context
function extractImageTimestamp(img) {
    try {
        // Look for time elements in parent containers
        let current = img.closest('[data-testid], .group\\/imagegen-image, .image-container, .relative, .flex');
        let depth = 0;
        
        while (current && depth < 8) {
            // Look for time elements
            const timeEl = current.querySelector('time[datetime], [data-time], .timestamp');
            if (timeEl) {
                const datetime = timeEl.getAttribute('datetime') || 
                               timeEl.getAttribute('data-time') || 
                               timeEl.getAttribute('title') || 
                               timeEl.textContent;
                if (datetime) return datetime;
            }
            
            // Look for relative time indicators
            const relativeTime = current.querySelector('[title*="AM"], [title*="PM"], [title*="ago"]');
            if (relativeTime) {
                const title = relativeTime.getAttribute('title') || relativeTime.textContent;
                if (title) return title;
            }
            
            current = current.parentElement;
            depth++;
        }
        
        return null;
    } catch (e) {
        return null;
    }
}
