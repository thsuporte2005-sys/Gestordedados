// tracking.js - Funções de registro de eventos e respostas

function getUTMs() {
    const params = new URLSearchParams(window.location.search);
    return {
        utm_source: params.get('utm_source') || '',
        utm_medium: params.get('utm_medium') || '',
        utm_campaign: params.get('utm_campaign') || '',
        utm_content: params.get('utm_content') || '',
        utm_term: params.get('utm_term') || '',
        utm_id: params.get('utm_id') || '',
        xcod: params.get('xcod') || '',
        fbclid: params.get('fbclid') || '',
        gclid: params.get('gclid') || '',
        screen: window.screen ? `${window.screen.width}x${window.screen.height}` : '',
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        platform: navigator.platform || '',
        ip: '', // Requer API externa ou backend, será salvo vazio
        userAgent: navigator.userAgent || '',
        language: navigator.language || '',
        _1: params.get('_1') || '',
        _2: params.get('_2') || '',
        _3: params.get('_3') || '',
        _4: params.get('_4') || '',
        _5: params.get('_5') || '',
        _6: params.get('_6') || '',
        _7: params.get('_7') || '',
        _8: params.get('_8') || '',
        _9: params.get('_9') || '',
        _10: params.get('_10') || '',
        _11: params.get('_11') || '',
        _12: params.get('_12') || '',
        _13: params.get('_13') || '',
        _14: params.get('_14') || '',
        _15: params.get('_15') || '',
        _16: params.get('_16') || ''
    };
}

function generateLeadId() {
    return 'L-' + Math.random().toString(36).substring(2, 10).toUpperCase();
}

async function saveEvent(eventName, stepNumber, eventValue = null) {
    const leadId = localStorage.getItem('lf_lead_id');
    const utms = getUTMs();
    const eventObj = {
        lead_id: leadId,
        event_name: eventName,
        step_number: stepNumber,
        event_value: eventValue,
        utm_source: utms.utm_source,
        utm_campaign: utms.utm_campaign,
        utm_content: utms.utm_content,
        page_url: window.location.href,
        user_agent: navigator.userAgent
    };

    console.log('[Tracking] Evento Registrado:', eventObj);

    if (window.supabaseClient) {
        try {
            const { error } = await window.supabaseClient.from('events').insert([eventObj]);
            if (error) console.error('Erro ao salvar evento no Supabase:', error);
        } catch (e) {
            console.error('Falha na comunicação com Supabase (Eventos):', e);
        }
    } else {
        // Fallback local
        const events = JSON.parse(localStorage.getItem('lf_events') || '[]');
        events.push({...eventObj, created_at: new Date().toISOString()});
        localStorage.setItem('lf_events', JSON.stringify(events));
    }
}

async function saveAnswer(stepNumber, question, answer) {
    const leadId = localStorage.getItem('lf_lead_id');
    const answerObj = {
        lead_id: leadId,
        step_number: stepNumber,
        question: question,
        answer: answer
    };

    console.log('[Tracking] Resposta Salva:', answerObj);

    if (window.supabaseClient) {
        try {
            const { error } = await window.supabaseClient.from('lead_answers').insert([answerObj]);
            if (error) console.error('Erro ao salvar resposta no Supabase:', error);
        } catch (e) {
            console.error('Falha na comunicação com Supabase (Respostas):', e);
        }
    } else {
        // Fallback local
        const answers = JSON.parse(localStorage.getItem('lf_answers') || '[]');
        answers.push({...answerObj, created_at: new Date().toISOString()});
        localStorage.setItem('lf_answers', JSON.stringify(answers));
    }
}

function trackPageView() {
    saveEvent('page_view', 0);
}

function trackFunnelStart() {
    saveEvent('funnel_start', 0);
}

function trackStepView(stepNumber) {
    saveEvent('step_view', stepNumber);
}

function trackOptionSelected(stepNumber, optionValue) {
    saveEvent('option_selected', stepNumber, optionValue);
}

function trackLeadCreated() {
    saveEvent('lead_created', 99);
}

function trackFunnelCompleted(stepNumber) {
    saveEvent('funnel_completed', stepNumber);
}

function trackCheckoutClick() {
    saveEvent('checkout_click', 99);
}

window.Tracking = {
    getUTMs,
    generateLeadId,
    saveEvent,
    saveAnswer,
    trackPageView,
    trackFunnelStart,
    trackStepView,
    trackOptionSelected,
    trackLeadCreated,
    trackFunnelCompleted,
    trackCheckoutClick
};

// Carrega a tela nova de Pixel depois do dashboard principal.
function loadPixelIntegrationPanel() {
    if (document.querySelector('script[src="pixel-integration.js"]')) return;
    const script = document.createElement('script');
    script.src = 'pixel-integration.js';
    script.defer = true;
    document.body.appendChild(script);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadPixelIntegrationPanel);
} else {
    loadPixelIntegrationPanel();
}
