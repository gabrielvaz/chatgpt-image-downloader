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
}

function addExtensionIndicator() {
    // Cria um pequeno indicador que mostra que a extensão está ativa
    if (document.querySelector('#chatgpt-downloader-indicator')) return;
    
    const indicator = document.createElement('div');
    indicator.id = 'chatgpt-downloader-indicator';
    indicator.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background: #667eea;
        color: white;
        padding: 5px 10px;
        border-radius: 15px;
        font-size: 12px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        z-index: 10000;
        opacity: 0.8;
        pointer-events: none;
        transition: opacity 0.3s ease;
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
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // Verifica se foram adicionadas novas imagens
                        const newImages = node.querySelectorAll ? 
                            node.querySelectorAll('.group\\/imagegen-image img') : [];
                        
                        if (newImages.length > 0) {
                            console.log(`ChatGPT Image Downloader: ${newImages.length} novas imagens detectadas`);
                        }
                    }
                });
            }
        });
    });
    
    // Observa mudanças no corpo da página
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

// Função auxiliar para coletar estatísticas da página (para debug)
function getPageStats() {
    const images = document.querySelectorAll('.group\\/imagegen-image img');
    const totalImages = images.length;
    const validImages = Array.from(images).filter(img => 
        img.src && img.src.startsWith('https://')
    ).length;
    
    return {
        totalImages,
        validImages,
        url: window.location.href,
        timestamp: new Date().toISOString()
    };
}

// Escuta mensagens do popup (se necessário)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'get_page_stats') {
        sendResponse(getPageStats());
    }
    
    if (request.type === 'scroll_to_load_more') {
        // Scroll para carregar mais imagens (se aplicável)
        window.scrollTo({
            top: document.body.scrollHeight,
            behavior: 'smooth'
        });
        sendResponse({ success: true });
    }
});

// Auto-scroll para carregar mais imagens quando a página carrega
setTimeout(() => {
    const currentImages = document.querySelectorAll('.group\\/imagegen-image img').length;
    if (currentImages < 10) {
        // Se há poucas imagens, tenta scroll para carregar mais
        window.scrollTo({
            top: document.body.scrollHeight,
            behavior: 'smooth'
        });
    }
}, 2000);
