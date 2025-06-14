// Content script que roda na página da biblioteca do ChatGPT
console.log('ChatGPT Image Downloader: Content script carregado');

// Aguarda a página carregar completamente
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeExtension);
} else {
    initializeExtension();
}

function initializeExtension() {
    console.log('ChatGPT Image Downloader: Inicializando na página da biblioteca');
    
    // Adiciona um pequeno indicador visual (opcional)
    addExtensionIndicator();
    
    // Monitora mudanças na página (para quando novas imagens carregam)
    observePageChanges();
    
    // Aguarda um pouco e tenta fazer scroll para carregar mais imagens
    setTimeout(loadMoreImages, 2000);
}

function addExtensionIndicator() {
    // Cria um pequeno indicador que mostra que a extensão está ativa
    if (document.querySelector('#chatgpt-downloader-indicator')) return;
    
    const indicator = document.createElement('div');
    indicator.id = 'chatgpt-downloader-indicator';
    indicator.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #000000;
        color: white;
        padding: 8px 16px;
        border-radius: 12px;
        font-size: 13px;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        font-weight: 500;
        z-index: 10000;
        opacity: 0.9;
        pointer-events: none;
        transition: opacity 0.3s ease;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    `;
    indicator.textContent = '📷 Image Downloader Ready';
    
    document.body.appendChild(indicator);
    
    // Remove o indicador após 3 segundos
    setTimeout(() => {
        if (indicator.parentNode) {
            indicator.style.opacity = '0';
            setTimeout(() => {
                if (indicator.parentNode) {
                    indicator.parentNode.removeChild(indicator);
                }
            }, 300);
        }
    }, 3000);
}

function observePageChanges() {
    // Observer para detectar quando novas imagens são carregadas
    const observer = new MutationObserver((mutations) => {
        let newImagesAdded = false;
        
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // Verifica se foram adicionadas novas imagens
                        const selectors = [
                            '.group\\/imagegen-image img',
                            '[data-testid*="image"] img',
                            '.image-container img',
                            'img[src*="oaiusercontent.com"]'
                        ];
                        
                        selectors.forEach(selector => {
                            const newImages = node.querySelectorAll ? node.querySelectorAll(selector) : [];
                            if (newImages.length > 0) {
                                newImagesAdded = true;
                            }
                        });
                    }
                });
            }
        });
        
        if (newImagesAdded) {
            console.log('ChatGPT Image Downloader: Novas imagens detectadas na página');
        }
    });
    
    // Observa mudanças no corpo da página
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

function loadMoreImages() {
    // Tenta fazer scroll para carregar mais imagens
    const currentImages = getAllImages().length;
    console.log(`ChatGPT Image Downloader: ${currentImages} imagens encontradas inicialmente`);
    
    // Sempre tenta carregar mais imagens, sem limite de quantidade
    console.log('ChatGPT Image Downloader: Carregando todas as imagens disponíveis...');
    
    // Função para scroll progressivo
    function progressiveScroll(scrollCount = 0, maxScrolls = 20) {
        if (scrollCount >= maxScrolls) {
            console.log('ChatGPT Image Downloader: Carregamento completo');
            return;
        }
        
        // Scroll para carregar mais conteúdo
        window.scrollBy({
            top: window.innerHeight,
            behavior: 'smooth'
        });
        
        // Aguarda um pouco e continua scrolling se necessário
        setTimeout(() => {
            const newCount = getAllImages().length;
            console.log(`ChatGPT Image Downloader: ${newCount} imagens encontradas após scroll ${scrollCount + 1}`);
            
            // Continua scrolling se ainda há mais conteúdo ou se carregou novas imagens
            if (document.body.scrollHeight > window.innerHeight + window.scrollY + 200 || 
                newCount > currentImages + scrollCount * 5) {
                progressiveScroll(scrollCount + 1, maxScrolls);
            }
        }, 2000);
    }
    
    // Inicia o scroll progressivo
    progressiveScroll();
}

function getAllImages() {
    const selectors = [
        '.group\\/imagegen-image img',
        '[data-testid*="image"] img',
        '.image-container img',
        'img[src*="oaiusercontent.com"]',
        'img[src*="files.oaiusercontent.com"]'
    ];
    
    const allImages = [];
    const seenUrls = new Set();
    
    selectors.forEach(selector => {
        const images = document.querySelectorAll(selector);
        images.forEach(img => {
            if (img.src && img.src.startsWith('https://') && 
                (img.src.includes('oaiusercontent.com') || img.src.includes('openai.com')) &&
                !seenUrls.has(img.src)) {
                seenUrls.add(img.src);
                
                // Try to extract title information
                const imageData = {
                    element: img,
                    src: img.src,
                    title: extractImageTitle(img)
                };
                
                allImages.push(imageData);
            }
        });
    });
    
    return allImages;
}

function extractImageTitle(img) {
    try {
        // Expanded search for parent containers with better selectors
        const parentElement = img.closest('[data-testid], .group\\/imagegen-image, .image-container, .relative, .flex, .overflow-hidden, .rounded, .cursor-pointer');
        
        if (parentElement) {
            // First try: look for specific title classes (most reliable)
            const titleSelectors = [
                '.line-clamp-2',
                '.line-clamp-1', 
                '.text-sm.font-medium',
                '.font-medium',
                '.text-token-text-primary',
                '.whitespace-nowrap.overflow-hidden.text-ellipsis'
            ];
            
            for (let selector of titleSelectors) {
                const titleElement = parentElement.querySelector(selector);
                if (titleElement && titleElement.textContent && titleElement.textContent.trim()) {
                    const text = titleElement.textContent.trim();
                    if (isValidTitle(text)) {
                        return text;
                    }
                }
            }
            
            // Second try: look for meaningful spans with better filtering
            const spans = parentElement.querySelectorAll('span, div, p');
            for (let element of spans) {
                const text = element.textContent ? element.textContent.trim() : '';
                if (isValidTitle(text) && !isTimeOrDate(text)) {
                    // Additional check: make sure it's not a child of a time element
                    if (!element.closest('time')) {
                        return text;
                    }
                }
            }
            
            // Third try: check parent chain for conversation titles
            let current = parentElement;
            let depth = 0;
            while (current && depth < 8) {
                // Look for conversation or chat titles in parent elements
                const conversationTitle = current.querySelector('[data-testid*="conversation"] .font-medium, .conversation-title, .chat-title');
                if (conversationTitle && conversationTitle.textContent) {
                    const text = conversationTitle.textContent.trim();
                    if (isValidTitle(text)) {
                        return text;
                    }
                }
                current = current.parentElement;
                depth++;
            }
            
            // Fourth try: check for aria-label or title attributes
            const labelElement = parentElement.querySelector('[aria-label], [title], [alt]');
            if (labelElement) {
                const label = labelElement.getAttribute('aria-label') || 
                            labelElement.getAttribute('title') || 
                            labelElement.getAttribute('alt');
                if (label && isValidTitle(label.trim())) {
                    return label.trim();
                }
            }
        }
        
        // Final fallback: use img attributes
        const imgTitle = img.getAttribute('alt') || img.getAttribute('title') || img.getAttribute('aria-label');
        if (imgTitle && isValidTitle(imgTitle.trim())) {
            return imgTitle.trim();
        }
        
        return null;
    } catch (e) {
        console.log('Error extracting image title:', e);
        return null;
    }
}

function isValidTitle(text) {
    if (!text || typeof text !== 'string') return false;
    
    const trimmed = text.trim();
    
    // Length checks
    if (trimmed.length < 3 || trimmed.length > 120) return false;
    
    // Exclude common non-title patterns
    const excludePatterns = [
        /^\d+$/, // Just numbers
        /^[\d\s\-:\.\/]+$/, // Just dates/times
        /^(image|photo|picture|img)$/i, // Generic image terms
        /^(click|tap|view|see|show)$/i, // Action words
        /^(loading|error|failed)$/i, // Status messages
        /^\d+\s*(x|by|×)\s*\d+$/i, // Dimensions like "1024x768"
        /^(png|jpg|jpeg|gif|webp|svg)$/i, // File extensions
        /^https?:\/\//i, // URLs
        /^[•\-_=\+\*#]+$/, // Just symbols
        /^(undefined|null|none)$/i, // Technical terms
        /^(am|pm)$/i, // Time indicators
        /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i, // Month abbreviations at start
    ];
    
    for (let pattern of excludePatterns) {
        if (pattern.test(trimmed)) return false;
    }
    
    // Must contain at least one letter
    if (!/[a-zA-ZÀ-ÿ]/.test(trimmed)) return false;
    
    // Exclude if it's mostly numbers with little text
    const numberRatio = (trimmed.match(/\d/g) || []).length / trimmed.length;
    if (numberRatio > 0.7) return false;
    
    return true;
}

function isTimeOrDate(text) {
    if (!text) return false;
    
    const timePatterns = [
        /^\d{1,2}:\d{2}(\s*(am|pm))?$/i,
        /^\d{1,2}\/\d{1,2}\/\d{2,4}$/,
        /^\d{4}-\d{2}-\d{2}$/,
        /^(yesterday|today|tomorrow)$/i,
        /^\d+\s*(second|minute|hour|day|week|month|year)s?\s*ago$/i,
        /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{1,2}/i
    ];
    
    return timePatterns.some(pattern => pattern.test(text.trim()));
}

// Função auxiliar para coletar estatísticas da página (para debug)
function getPageStats() {
    const allImages = getAllImages();
    const totalImages = allImages.length;
    
    return {
        totalImages,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        selectors: [
            '.group\\/imagegen-image img',
            '[data-testid*="image"] img',
            '.image-container img',
            'img[src*="oaiusercontent.com"]'
        ]
    };
}

// Escuta mensagens do popup (se necessário)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'get_page_stats') {
        sendResponse(getPageStats());
    }
    
    if (request.type === 'scroll_to_load_more') {
        loadMoreImages();
        sendResponse({ success: true });
    }
    
    if (request.type === 'get_image_count') {
        const count = getAllImages().length;
        sendResponse({ count });
    }
});

// Periodic scroll para carregar mais imagens (se necessário)
setInterval(() => {
    const currentImages = getAllImages().length;
    // Sempre tenta carregar mais imagens se há mais conteúdo disponível
    if (document.body.scrollHeight > window.innerHeight + window.scrollY + 100) {
        // Se ainda há mais conteúdo para carregar, scroll um pouco
        window.scrollBy({
            top: window.innerHeight * 0.5,
            behavior: 'smooth'
        });
    }
}, 10000); // A cada 10 segundos
