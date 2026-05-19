// pixel.js - Gestor de Dados | Rastreio Automático "Zero-Code"
(function() {
    if (window.GestorPixelLoaded) return;
    window.GestorPixelLoaded = true;

    // 1. Setup & Config
    const STORAGE_QUEUE = 'gestor_pixel_queue';
    const MAX_QUEUE_SIZE = 80;
    const DEFAULT_HEARTBEAT_INTERVAL = 30000;
    let scriptTag = document.currentScript;
    if (!scriptTag) {
        const scripts = document.getElementsByTagName('script');
        for (let i = 0; i < scripts.length; i++) {
            if (scripts[i].src.includes('pixel.js')) scriptTag = scripts[i];
        }
    }

    const pixelId = scriptTag?.getAttribute('data-pixel-id') || scriptTag?.getAttribute('data-funnel-id') || 'unknown';
    const quizId = scriptTag?.getAttribute('data-quiz-id') || scriptTag?.getAttribute('data-funnel-id') || pixelId;
    const configuredHeartbeat = Number(scriptTag?.getAttribute('data-heartbeat-interval') || DEFAULT_HEARTBEAT_INTERVAL);

    const config = {
        pixelId: pixelId,
        quizId: quizId,
        funnelId: pixelId,
        publicKey: scriptTag?.getAttribute('data-public-key') || '',
        endpoint: scriptTag?.getAttribute('data-endpoint') || '/api/track',
        heartbeatInterval: Number.isFinite(configuredHeartbeat) ? Math.max(15000, configuredHeartbeat) : DEFAULT_HEARTBEAT_INTERVAL,
        supabaseUrl: scriptTag?.getAttribute('data-supabase-url') || '',
        supabaseKey: scriptTag?.getAttribute('data-supabase-key') || ''
    };

    if (config.pixelId === 'unknown') console.warn('[GestorPixel] Aviso: Pixel ID não encontrado no script.');

    // 2. Identificadores & Estado Local
    function getLeadId() {
        const key = `gestor_pixel_lead_id_${config.funnelId}`;
        let leadId = localStorage.getItem(key);
        if (!leadId) {
            leadId = 'L-' + Math.random().toString(36).substring(2, 12).toUpperCase();
            localStorage.setItem(key, leadId);
        }
        return leadId;
    }

    function getSessionId() {
        const key = `gestor_pixel_session`;
        let sid = sessionStorage.getItem(key);
        if (!sid) {
            sid = 'S-' + Math.random().toString(36).substring(2, 12).toUpperCase();
            sessionStorage.setItem(key, sid);
        }
        return sid;
    }

    function incrementStep() {
        const key = `gestor_pixel_step_${config.funnelId}`;
        let step = parseInt(localStorage.getItem(key) || '0', 10);
        localStorage.setItem(key, step + 1);
        return step + 1;
    }

    function getCurrentStep() {
        // Tenta achar progresso na tela "3 de 10" ou "3/10"
        try {
            const allEls = document.querySelectorAll('span, div, p, h1, h2, h3, h4');
            for (let el of allEls) {
                if (el.childNodes.length === 1 && el.innerText.trim().match(/^\d+\s*(de|\/)\s*\d+$/i)) {
                    return el.innerText.trim();
                }
            }
        } catch(e) {}
        // Retorna step do localStorage
        return localStorage.getItem(`gestor_pixel_step_${config.funnelId}`) || '0';
    }

    // 3. Captura Automática de Dados do Visitante
    function getVisitorData() {
        const params = new URLSearchParams(window.location.search);
        let countryGuess = '';
        try { countryGuess = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch(e) {}
        
        const ua = navigator.userAgent;
        let deviceType = 'desktop';
        if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) deviceType = 'tablet';
        else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) deviceType = 'mobile';

        return {
            utm_source: params.get('utm_source') || '',
            utm_medium: params.get('utm_medium') || '',
            utm_campaign: params.get('utm_campaign') || '',
            utm_content: params.get('utm_content') || '',
            utm_term: params.get('utm_term') || '',
            fbclid: params.get('fbclid') || '',
            gclid: params.get('gclid') || '',
            country: countryGuess,
            page_url: window.location.href,
            referrer: document.referrer,
            user_agent: navigator.userAgent,
            browser_language: navigator.language || navigator.userLanguage || '',
            device_type: deviceType,
            created_at: new Date().toISOString()
        };
    }

    // 4. Mecanismo Seguro de Envio API / Fila (Queue)
    function queueEvent(payload) {
        try {
            let pending = JSON.parse(localStorage.getItem(STORAGE_QUEUE) || '[]');
            pending.push(payload);
            if (pending.length > MAX_QUEUE_SIZE) pending = pending.slice(pending.length - MAX_QUEUE_SIZE);
            localStorage.setItem(STORAGE_QUEUE, JSON.stringify(pending));
        } catch(e) {}
    }

    async function flushQueue() {
        if (!navigator.onLine) return;
        try {
            let pending = JSON.parse(localStorage.getItem(STORAGE_QUEUE) || '[]');
            if (pending.length === 0) return;
            let remaining = [];
            
            for (let event of pending) {
                try {
                    await sendEventDirectly(event);
                } catch(e) {
                    remaining.push(event);
                }
            }
            localStorage.setItem(STORAGE_QUEUE, JSON.stringify(remaining));
        } catch(e) {}
    }

    async function sendEventDirectly(payload) {
        // Envia para o Proxy Principal
        if (config.endpoint) {
            const headers = { 'Content-Type': 'application/json' };
            if (config.publicKey) headers['Authorization'] = `Bearer ${config.publicKey}`;
            
            const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
            const timeout = controller ? setTimeout(() => controller.abort(), 7000) : null;

            let response;
            try {
                response = await fetch(config.endpoint, {
                    method: 'POST',
                    keepalive: true,
                    headers: headers,
                    signal: controller ? controller.signal : undefined,
                    body: JSON.stringify(payload)
                });
            } finally {
                if (timeout) clearTimeout(timeout);
            }
            if (!response.ok) throw new Error('Proxy API Error');
            return;
        }

        // Alternativa Avançada Direta
        if (config.supabaseUrl && config.supabaseKey) {
            const trackObj = {
                funnel_id: payload.funnel_id,
                lead_id: payload.lead_id,
                event_name: payload.event_name,
                event_data: payload.event_data || {},
                created_at: payload.created_at,
                page_url: payload.page_url,
                utm_source: payload.utm_source,
                country: payload.country,
                device_type: payload.device_type
            };
            const headers = { 'apikey': config.supabaseKey, 'Authorization': `Bearer ${config.supabaseKey}`, 'Content-Type': 'application/json' };
            const req = await fetch(`${config.supabaseUrl}/rest/v1/tracking_events`, { method:'POST', headers, keepalive:true, body: JSON.stringify(trackObj) });
            if (!req.ok) throw new Error('Supa API Error');
            return;
        }
    }

    async function track(eventName, customData = {}) {
        // Anti-Duplicação
        if (eventName === 'page_view') {
            const pvKey = `gestor_pv_${config.funnelId}`;
            if (sessionStorage.getItem(pvKey)) return;
            sessionStorage.setItem(pvKey, '1');
        }
        if (eventName === 'quiz_completed') {
            const qcKey = `gestor_qc_${config.funnelId}`;
            if (localStorage.getItem(qcKey)) return;
            localStorage.setItem(qcKey, '1');
        }
        if (eventName === 'lead_created') {
            const lcKey = `gestor_lc_${config.funnelId}`;
            if (localStorage.getItem(lcKey)) return;
            localStorage.setItem(lcKey, '1');
        }

        const payload = {
            pixel_id: config.pixelId,
            quiz_id: config.quizId,
            funnel_id: config.pixelId,
            public_key: config.publicKey,
            lead_id: getLeadId(),
            visitor_id: getLeadId(),
            session_id: getSessionId(),
            event_name: eventName,
            event_type: customData.event_type || eventName,
            event_data: customData,
            ...getVisitorData()
        };

        try {
            if (navigator.onLine) {
                sendEventDirectly(payload).catch(() => queueEvent(payload));
            } else {
                queueEvent(payload);
            }
        } catch(e) {
            // O pixel nunca deve quebrar o quiz
        }
    }

    // 5. Motor de Buscas Inteligentes de Componente HTML
    function findNearestQuestion(startElement) {
        try {
            let current = startElement.parentElement;
            let checks = 0;
            while(current && checks < 4) {
                // Procurar headings (h1,h2,h3)
                const h = current.querySelector('h1, h2, h3');
                if (h && h.innerText.trim().length > 5) return h.innerText.trim();

                // Procurar parágrafo anterior à nossa div (muito comum)
                if (current.previousElementSibling && current.previousElementSibling.innerText && current.previousElementSibling.innerText.trim().length > 5) {
                    let txt = current.previousElementSibling.innerText.trim();
                    if (txt.includes('?') || txt.split(' ').length > 3) return txt; // É uma frase
                }

                current = current.parentElement;
                checks++;
            }
        } catch(e) {}
        return 'Pergunta detectada automaticamente';
    }

    const CHECKOUT_DOMAINS = ['hotmart.com', 'pay.', 'checkout', 'cartpanda.com', 'kiwify.com.br', 'perfectpay.com.br', 'whatsapp.com', 'wa.me'];
    function isCheckoutUrl(url) {
        if(!url) return false;
        url = url.toLowerCase();
        return CHECKOUT_DOMAINS.some(d => url.includes(d));
    }

    function isExternalUrl(url) {
        try {
            const target = new URL(url, window.location.href);
            return target.hostname && target.hostname !== window.location.hostname;
        } catch(e) {
            return false;
        }
    }

    function getContactFieldType(input) {
        const hint = [
            input.name,
            input.id,
            input.placeholder,
            input.getAttribute('aria-label'),
            input.getAttribute('autocomplete'),
            input.type
        ].filter(Boolean).join(' ').toLowerCase();

        if (hint.includes('email')) return 'email';
        if (hint.includes('whatsapp') || hint.includes('zap')) return 'whatsapp';
        if (hint.includes('phone') || hint.includes('telefone') || hint.includes('celular') || hint.includes('tel')) return 'phone';
        if (hint.includes('name') || hint.includes('nome')) return 'name';
        return null;
    }

    // 6. Listeners Globais Interativos (Sem onclick manual!)
    document.addEventListener('click', (e) => {
        try {
            const target = e.target;
            const interactiveEl = target.closest('button, a, [role="button"], input[type="button"], input[type="submit"]');
            
            if (interactiveEl) {
                // Checa marcações manuais forçadas (Data-Tracks opcionais)
                const dataTrack = interactiveEl.getAttribute('data-track');
                
                // Trato Click em Âncora / Link
                if (interactiveEl.tagName === 'A') {
                    const href = interactiveEl.getAttribute('href') || interactiveEl.href;
                    if (dataTrack === 'checkout-click' || isCheckoutUrl(href) || isExternalUrl(href)) {
                        track('checkout_click', { link_url: href, button_text: interactiveEl.innerText.trim() });
                    } else if (href && !href.startsWith('#')) {
                        track('link_click', { link_url: href, button_text: interactiveEl.innerText.trim() });
                    }
                }
                
                // Trato Botões em Geral e Respostas de Quiz
                if (interactiveEl.tagName === 'BUTTON' || interactiveEl.tagName === 'INPUT' || interactiveEl.getAttribute('role') === 'button') {
                    // É um formulário ou envio nativo? Deixa o submit lidar (apenas marca button_click)
                    track('button_click', { button_text: interactiveEl.innerText.trim() || interactiveEl.value || '' });

                    // Se for clique em respostas de Quiz (Não é form submit)
                    if (interactiveEl.type !== 'submit') {
                        const answerText = dataTrack === 'answer' ? interactiveEl.getAttribute('data-answer') : interactiveEl.innerText.trim();
                        if (answerText && answerText.length < 50) { // Para não pegar textos errados enormes
                            incrementStep();
                            let questionText = interactiveEl.getAttribute('data-question');
                            if (!questionText && dataTrack !== 'answer') questionText = findNearestQuestion(interactiveEl);
                            
                            track('answer_click', {
                                step_id: getCurrentStep(),
                                question: questionText,
                                answer: answerText
                            });
                        }
                    }
                }

                // Disparo de botão marcado
                if (dataTrack === 'start') track('start', { button_text: interactiveEl.innerText.trim() });
            }
        } catch(e) {}
    });

    // 7. Auto Formulários
    document.addEventListener('submit', (e) => {
        try {
            const form = e.target;
            track('form_submit', { form_id: form.id || form.className || 'Auto Form' });

            // Vasculhar inputs (name, email, phone)
            const inputs = form.querySelectorAll('input, select');
            let leadData = { name:'', email:'', phone:'' };
            let hasLeadFields = false;

            inputs.forEach(i => {
                const n = i.name.toLowerCase();
                const v = i.value.trim();
                if(!v) return;

                if (n.includes('name') || n.includes('nome')) { leadData.name = v; hasLeadFields = true; }
                else if (n.includes('email')) { leadData.email = v; hasLeadFields = true; }
                else if (n.includes('phone') || n.includes('telefone') || n.includes('whatsapp') || n.includes('tel')) { leadData.phone = v; hasLeadFields = true; }
            });

            if (hasLeadFields) {
                track('lead_created', leadData);
            }
        } catch(e) {}
    });

    document.addEventListener('change', (e) => {
        try {
            const input = e.target;
            if (!input || !input.matches || !input.matches('input, textarea')) return;
            const fieldType = getContactFieldType(input);
            const value = String(input.value || '').trim();
            if (!fieldType || !value) return;

            const leadData = {};
            leadData[fieldType === 'whatsapp' ? 'phone' : fieldType] = value;
            track('lead_created', leadData);
        } catch(e) {}
    }, true);

    // 8. Auto Reconhecimento de Conclusão / Oferta
    function setupCompletionObserver() {
        const TRIGGER_WORDS = ['felicidades', 'análisis está listo', 'tu análisis', 'oferta', 'método', 'comprar', 'quiero asegurar', 'checkout', 'vsl', 'resultado final', 'seu perfil'];
        
        const isTriggerHit = (text) => {
            text = text.toLowerCase();
            return TRIGGER_WORDS.some(w => text.includes(w));
        };

        const completionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const el = entry.target;
                    // Forçado via data-track
                    if (el.getAttribute('data-track') === 'complete') {
                        track('quiz_completed', { result: el.getAttribute('data-result') || 'Detectado Automático' });
                        completionObserver.unobserve(el);
                    // Baseado em ID mágico ou Classe
                    } else if (el.id === 'offer' || el.className.includes('checkout') || el.className.includes('oferta')) {
                        track('quiz_completed', { result: 'Oferta / Checkout Alcançado' });
                        completionObserver.unobserve(el);
                    // Baseado em Leitura de Texto
                    } else if (el.tagName === 'H1' || el.tagName === 'H2' || el.tagName === 'H3' || el.tagName === 'STRONG') {
                        if (isTriggerHit(el.innerText)) {
                            track('quiz_completed', { result: 'Termo disparador: ' + el.innerText.trim().substring(0, 30) });
                            completionObserver.unobserve(el);
                        }
                    }
                }
            });
        }, { threshold: 0.1 });

        // Observa Headings Grandes
        document.querySelectorAll('h1, h2, h3, h4, strong, [data-track="complete"]').forEach(el => completionObserver.observe(el));
        
        // Cobre elementos renderizados tardiamente pelo React
        const domMutObserver = new MutationObserver((mutations) => {
            mutations.forEach(mut => {
                mut.addedNodes.forEach(node => {
                    if (node.nodeType === 1) {
                        try {
                            // Varre a node adicionada
                            node.querySelectorAll('h1, h2, h3, h4, strong, [data-track="complete"]').forEach(el => completionObserver.observe(el));
                            if (node.tagName.match(/^H[1-4]|STRONG$/) || node.hasAttribute('data-track')) completionObserver.observe(node);
                        } catch(e) {}
                    }
                });
            });
        });
        domMutObserver.observe(document.body, { childList: true, subtree: true });
    }

    // --- Startups Automáticos ---
    let heartbeatTimer = null;
    function sendHeartbeat() {
        track('pixel_heartbeat', {
            heartbeat_interval: config.heartbeatInterval,
            visibility_state: document.visibilityState || 'visible'
        });
    }

    function startHeartbeat() {
        if (heartbeatTimer) clearInterval(heartbeatTimer);
        sendHeartbeat();
        heartbeatTimer = setInterval(sendHeartbeat, config.heartbeatInterval);
    }

    window.addEventListener('online', flushQueue);
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            flushQueue();
            sendHeartbeat();
        }
    });
    
    // Bootstrap DOM
    function init() {
        flushQueue();
        setTimeout(() => {
            track('page_view');
        }, 300);
        startHeartbeat();
        setupCompletionObserver();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
