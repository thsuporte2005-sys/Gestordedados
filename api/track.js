// /api/track.js - Endpoint Serverless com CORS

export default async function handler(req, res) {
    // 1. CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, apikey');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method Not Allowed' });
    }

    const eventData = req.body;
    
    // Validar Chaves Básicas
    if (!eventData.funnel_id || !eventData.public_key) {
        return res.status(400).json({ success: false, message: 'Missing Funnel ID ou Public Key' });
    }

    // Configuração Supabase Backend
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
        return res.status(500).json({ success: false, message: 'Supabase credentials missing on server.' });
    }

    const headers = {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
    };

    try {
        const promises = [];

        // 1. Inserir Tracking Event genérico
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
            country: eventData.country || null,
            page_url: eventData.page_url,
            referrer: eventData.referrer,
            user_agent: eventData.user_agent,
            device_type: eventData.device_type,
            browser_language: eventData.browser_language,
            created_at: eventData.created_at || new Date().toISOString(),
            event_data: eventData.event_data || {}
        };

        promises.push(
            fetch(`${SUPABASE_URL}/rest/v1/tracking_events`, { method: 'POST', headers, body: JSON.stringify(trackObj) })
            .then(r => r.ok ? null : Promise.reject('Erro no tracking events'))
        );

        // 2. Atualizar ou Criar Lead Central
        const leadUpdates = {
            funnel_id: eventData.funnel_id,
            lead_id: eventData.lead_id,
            page_url: eventData.page_url,
            user_agent: eventData.user_agent
        };

        // Captura dados do lead (lead_created ou legado)
        if (eventData.event_name === 'lead_created') {
            if(eventData.event_data?.name) leadUpdates.name = eventData.event_data.name;
            if(eventData.event_data?.phone) leadUpdates.phone = eventData.event_data.phone;
            if(eventData.event_data?.email) leadUpdates.email = eventData.event_data.email;
        } else {
            if(eventData.name) leadUpdates.name = eventData.name;
            if(eventData.phone) leadUpdates.phone = eventData.phone;
            if(eventData.email) leadUpdates.email = eventData.email;
        }

        if(eventData.event_data?.result || eventData.result) leadUpdates.result = eventData.event_data?.result || eventData.result; 
        if((eventData.event_data?.step_id || eventData.step_number) && eventData.event_name !== 'answer_click') leadUpdates.current_step = eventData.event_data?.step_id || eventData.step_number; 
        if(eventData.utm_source) leadUpdates.utm_source = eventData.utm_source; 
        if(eventData.utm_campaign) leadUpdates.utm_campaign = eventData.utm_campaign; 
        
        if (eventData.event_name === 'quiz_completed' || eventData.event_name === 'funnel_completed') {
            leadUpdates.status = 'Completo';
            leadUpdates.completed_at = eventData.created_at || new Date().toISOString();
        }

        promises.push(
            fetch(`${SUPABASE_URL}/rest/v1/leads?on_conflict=lead_id`, {
                method: 'POST',
                headers: { ...headers, 'Prefer': 'resolution=merge-duplicates' },
                body: JSON.stringify(leadUpdates)
            }).then(r => r.ok ? null : Promise.reject('Erro ao atualizar lead'))
        );

        // 3. Inserir Resposta
        if ((eventData.event_name === 'answer_click' || eventData.event_name === 'option_selected') && (eventData.event_data?.answer || eventData.answer)) {
            promises.push(
                fetch(`${SUPABASE_URL}/rest/v1/lead_answers`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        funnel_id: eventData.funnel_id,
                        lead_id: eventData.lead_id,
                        step_number: eventData.event_data?.step_id || eventData.step_number,
                        question: eventData.event_data?.question || eventData.question,
                        answer: eventData.event_data?.answer || eventData.answer
                    })
                }).then(r => r.ok ? null : Promise.reject('Erro ao inserir resposta'))
            );
        }

        await Promise.all(promises);

        return res.status(200).json({ success: true, message: 'Evento recebido com sucesso' });

    } catch (error) {
        console.error('Erro na API Track:', error);
        return res.status(500).json({ success: false, message: 'Erro ao processar evento backend' });
    }
}
