// tracker.js - Tracker Autônomo e Robusto
(function() {
    if (window.LeadTrack) return; // Evitar dupla execução

    const STORAGE_KEY = 'leadtrack_pending_events';
    let scriptTag = document.currentScript;
    if (!scriptTag) {
        const scripts = document.getElementsByTagName('script');
        for (let i = 0; i < scripts.length; i++) {
            if (scripts[i].src.includes('tracker.js')) scriptTag = scripts[i];
        }
    }

    const config = {
        funnelId: scriptTag?.getAttribute('data-funnel-id') || '',
        publicKey: scriptTag?.getAttribute('data-public-key') || '',
        supabaseUrl: scriptTag?.getAttribute('data-supabase-url') || '',
        supabaseAnonKey: scriptTag?.getAttribute('data-supabase-key') || '',
        endpoint: scriptTag?.getAttribute('data-endpoint') || '/api/track',
        useDirectSupabase: !!scriptTag?.getAttribute('data-supabase-url')
    };

    if (!config.funnelId) console.warn('[LeadTrack] Aviso: funnel_id não configurado no script.');

    function getLeadId() {
        const key = `leadtrack_lead_id_${config.funnelId}`;
        let leadId = localStorage.getItem(key);
        if (!leadId) {
            leadId = 'L-' + Math.random().toString(36).substring(2, 12).toUpperCase();
            localStorage.setItem(key, leadId);
        }
        return leadId;
    }

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
            device_type: deviceType
        };
    }

    function savePendingEvent(eventData) {
        try {
            let pending = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
            pending.push(eventData);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(pending));
        } catch(e) {}
    }

    function sendPendingEvents() {
        if (!navigator.onLine) return;
        try {
            let pending = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
            if (pending.length === 0) return;
            
            let remaining = [];
            pending.forEach(event => {
                sendToAPI(event).catch(() => remaining.push(event));
            });
            localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
        } catch(e) {}
    }

    async function sendToAPI(eventData) {
        if (config.useDirectSupabase && config.supabaseAnonKey) {
            return sendDirectToSupabase(eventData);
        }

        if (!config.endpoint) return;

        const headers = { 'Content-Type': 'application/json' };
        if (config.publicKey) headers['Authorization'] = `Bearer ${config.publicKey}`;
        
        try {
            const response = await fetch(config.endpoint, {
                method: 'POST',
                keepalive: true,
                headers: headers,
                body: JSON.stringify(eventData)
            });
            if (!response.ok) throw new Error('API Reject');
            return response.json();
        } catch(e) {
            throw e; // Triggers saving to pending
        }
    }

    async function sendDirectToSupabase(eventData) {
        const headers = {
            'apikey': config.supabaseAnonKey,
            'Authorization': `Bearer ${config.supabaseAnonKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
        };

        const promises = [];

        // Insert Tracking Event
        const trackObj = {
            funnel_id: eventData.funnel_id,
            lead_id: eventData.lead_id,
            event_name: eventData.event_name,
            step_number: eventData.event_data?.step_id || eventData.step_number || null,
            question: eventData.event_data?.question || eventData.question || null,
            answer: eventData.event_data?.answer || eventData.answer || null,
            utm_source: eventData.utm_source,
            utm_medium: eventData.utm_medium,
            utm_campaign: eventData.utm_campaign,
            utm_content: eventData.utm_content,
            utm_term: eventData.utm_term,
            fbclid: eventData.fbclid,
            gclid: eventData.gclid,
            country: eventData.country,
            page_url: eventData.page_url,
            referrer: eventData.referrer,
            user_agent: eventData.user_agent,
            device_type: eventData.device_type,
            browser_language: eventData.browser_language,
            created_at: eventData.created_at,
            event_data: eventData.event_data || {}
        };
        promises.push(fetch(`${config.supabaseUrl}/rest/v1/tracking_events`, { method: 'POST', keepalive: true, headers, body: JSON.stringify(trackObj) }).catch(()=>{}));

        // Upsert Lead central
        const leadUpdates = {
            funnel_id: eventData.funnel_id,
            lead_id: eventData.lead_id,
            page_url: eventData.page_url,
            user_agent: eventData.user_agent,
            utm_source: eventData.utm_source || null,
            utm_medium: eventData.utm_medium || null,
            utm_campaign: eventData.utm_campaign || null
        };
        
        if(eventData.event_name === 'lead') {
            if(eventData.event_data.name) leadUpdates.name = eventData.event_data.name;
            if(eventData.event_data.phone) leadUpdates.phone = eventData.event_data.phone;
            if(eventData.event_data.email) leadUpdates.email = eventData.event_data.email;
        }
        if(eventData.event_name === 'complete') {
            if(eventData.event_data.result) leadUpdates.result = eventData.event_data.result;
            leadUpdates.status = 'Completo';
            leadUpdates.completed_at = eventData.created_at;
        }
        if(eventData.event_name === 'step_view' || eventData.event_name === 'answer') {
            leadUpdates.current_step = eventData.event_data?.step_id || null;
        }

        promises.push(fetch(`${config.supabaseUrl}/rest/v1/leads?on_conflict=lead_id`, {
            method: 'POST', 
            keepalive: true, 
            headers: { ...headers, 'Prefer': 'resolution=merge-duplicates' },
            body: JSON.stringify(leadUpdates)
        }).catch(()=>{}));

        // Upsert Lead Answer se for 'answer'
        if (eventData.event_name === 'answer' && eventData.event_data?.answer) {
            promises.push(fetch(`${config.supabaseUrl}/rest/v1/lead_answers`, {
                method: 'POST',
                keepalive: true,
                headers,
                body: JSON.stringify({
                    funnel_id: eventData.funnel_id,
                    lead_id: eventData.lead_id,
                    step_number: eventData.event_data.step_id,
                    question: eventData.event_data.question,
                    answer: eventData.event_data.answer
                })
            }).catch(()=>{}));
        }

        return Promise.all(promises);
    }

    function triggerEvent(eventName, params = {}) {
        try {
            const visitorProps = getVisitorData();
            const payload = {
                funnel_id: config.funnelId,
                public_key: config.publicKey,
                lead_id: getLeadId(),
                event_name: eventName,
                created_at: new Date().toISOString(),
                event_data: params,
                ...visitorProps
            };

            if (navigator.onLine) {
                sendToAPI(payload).catch(err => {
                    savePendingEvent(payload);
                });
            } else {
                savePendingEvent(payload);
            }
        } catch (e) {
            // Failsafe absoluto
            console.warn("[LeadTrack] Erro ao engatilhar evento", e);
        }
    }

    // Public API Object
    window.LeadTrack = {
        pageView: () => triggerEvent('page_view'),
        start: () => triggerEvent('start'),
        stepView: (step) => triggerEvent('step_view', { step_id: step }),
        answer: (step, question, answer) => triggerEvent('answer', { step_id: step, question: question, answer: answer }),
        lead: (data) => triggerEvent('lead', { name: data.name, phone: data.phone, email: data.email }),
        complete: (data) => triggerEvent('complete', { result: data.result }),
        checkoutClick: () => triggerEvent('checkout_click'),
        custom: (eventName, data) => triggerEvent(eventName, data)
    };

    // Auto listeners initialization
    function initAutoTrackers() {
        // IntersectionObserver for elements appearing
        const visibilityObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const target = entry.target;
                    const type = target.getAttribute('data-track');
                    
                    if (type === 'complete' && !target.dataset.completedTriggered) {
                        target.dataset.completedTriggered = 'true';
                        window.LeadTrack.complete({ result: target.getAttribute('data-result') || 'Finalizado' });
                    }
                    if (type === 'step-view' && !target.dataset.viewTriggered) {
                        target.dataset.viewTriggered = 'true';
                        window.LeadTrack.stepView(target.getAttribute('data-step') || 'Desconhecido');
                    }
                }
            });
        }, { threshold: 0.1 });

        function observeNewNodes(rootParams) {
            rootParams.querySelectorAll('[data-track="complete"], [data-track="step-view"]').forEach(el => visibilityObserver.observe(el));
        }

        // Global click observer
        document.addEventListener('click', (e) => {
            const target = e.target.closest('[data-track]');
            if (!target) return;
            
            const type = target.getAttribute('data-track');
            if (type === 'start') window.LeadTrack.start();
            if (type === 'answer') {
                const step = target.getAttribute('data-step') || 'Unknown';
                const question = target.getAttribute('data-question') || document.querySelector(`[data-step="${step}"] h2, [data-step="${step}"] h3`)?.innerText || 'Pergunta';
                const answer = target.getAttribute('data-answer') || target.innerText || 'Opção selecionada';
                window.LeadTrack.answer(step, question, answer);
            }
            if (type === 'checkout-click') window.LeadTrack.checkoutClick();
        });

        // Global submit observer
        document.addEventListener('submit', (e) => {
            const form = e.target.closest('form[data-track="lead-form"]');
            if (form) {
                // Prevenir que quebre algo no quiz se for preventDefault
                window.LeadTrack.lead({
                    name: form.querySelector('[name="name"]')?.value || '',
                    phone: form.querySelector('[name="whatsapp"]')?.value || form.querySelector('[name="phone"]')?.value || '',
                    email: form.querySelector('[name="email"]')?.value || ''
                });
            }
        });

        // Mutation observer to capture newly added nodes (e.g., dynamically rendered quiz steps)
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mut => {
                mut.addedNodes.forEach(node => {
                    if (node.nodeType === 1) { // is Element Node
                        if (node.hasAttribute('data-track')) observeNewNodes(document); // safe fallback
                        observeNewNodes(node);
                    }
                });
            });
        });
        observer.observe(document.body, { childList: true, subtree: true });

        // Observe initial DOM
        observeNewNodes(document);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAutoTrackers);
    } else {
        initAutoTrackers();
    }

    // On Load offline retries
    window.addEventListener('online', sendPendingEvents);
    sendPendingEvents();
    
    // Auto initiate Page View
    setTimeout(() => {
        window.LeadTrack.pageView();
    }, 100);

})();
