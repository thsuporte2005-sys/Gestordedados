// leads.js - Centraliza as funções de criar, atualizar e buscar leads

async function createLead(leadData) {
    const leadObj = {
        lead_id: leadData.lead_id,
        name: leadData.name || null,
        email: leadData.email || null,
        phone: leadData.phone || null,
        status: leadData.status || 'Iniciado',
        result: leadData.result || null,
        current_step: leadData.current_step || 0,
        total_steps: leadData.total_steps || 0,
        utm_source: leadData.utms?.utm_source || null,
        utm_medium: leadData.utms?.utm_medium || null,
        utm_campaign: leadData.utms?.utm_campaign || null,
        utm_content: leadData.utms?.utm_content || null,
        utm_term: leadData.utms?.utm_term || null,
        fbclid: leadData.utms?.fbclid || null,
        gclid: leadData.utms?.gclid || null,
        country: leadData.country || null,
        user_agent: navigator.userAgent,
        page_url: window.location.href,
        created_at: new Date().toISOString()
    };

    if (window.supabaseClient) {
        try {
            const { error } = await window.supabaseClient.from('leads').insert([leadObj]);
            if (error) console.error('Erro ao criar lead no Supabase:', error);
        } catch (e) {
            console.error('Falha na comunicação com Supabase (Criar Lead):', e);
        }
    } else {
        // Fallback local
        const leads = JSON.parse(localStorage.getItem('lf_leads_db') || '[]');
        leads.push(leadObj);
        localStorage.setItem('lf_leads_db', JSON.stringify(leads));
    }
}

async function updateLead(leadId, updates) {
    if (window.supabaseClient) {
        try {
            const { error } = await window.supabaseClient
                .from('leads')
                .update(updates)
                .eq('lead_id', leadId);
            if (error) console.error('Erro ao atualizar lead no Supabase:', error);
        } catch (e) {
            console.error('Falha na comunicação com Supabase (Atualizar Lead):', e);
        }
    } else {
        // Fallback local
        const leads = JSON.parse(localStorage.getItem('lf_leads_db') || '[]');
        const idx = leads.findIndex(l => l.lead_id === leadId);
        if (idx !== -1) {
            leads[idx] = { ...leads[idx], ...updates };
            localStorage.setItem('lf_leads_db', JSON.stringify(leads));
        }
    }
}

async function getLeads() {
    if (window.supabaseClient) {
        try {
            const { data, error } = await window.supabaseClient.from('leads').select('*').order('created_at', { ascending: false });
            if (error) throw error;
            return data || [];
        } catch (e) {
            console.error('Erro ao buscar leads do Supabase, usando fallback:', e);
        }
    }
    return JSON.parse(localStorage.getItem('lf_leads_db') || '[]');
}

async function getLeadAnswers() {
    if (window.supabaseClient) {
        try {
            const { data, error } = await window.supabaseClient.from('lead_answers').select('*');
            if (error) throw error;
            return data || [];
        } catch (e) {
             console.error('Erro ao buscar respostas do Supabase, usando fallback:', e);
        }
    }
    return JSON.parse(localStorage.getItem('lf_answers') || '[]');
}

async function getEvents() {
    if (window.supabaseClient) {
        try {
            const { data, error } = await window.supabaseClient.from('tracking_events').select('*');
            if (error) throw error;
            return data || [];
        } catch (e) {
            console.error('Erro ao buscar eventos do Supabase, usando fallback:', e);
        }
    }
    return JSON.parse(localStorage.getItem('lf_events') || '[]');
}

async function calculateDashboardMetrics() {
    const leads = await getLeads();
    const events = await getEvents();
    
    const pageViews = events.filter(e => e.event_name === 'page_view').length;
    const leadsCriados = leads.length;
    const completos = leads.filter(l => l.status === 'Completo').length;
    const qualificados = leads.filter(l => (l.current_step / (l.total_steps || 1)) >= 0.5).length;
    
    return {
        visitas: pageViews,
        adquiridos: leadsCriados,
        taxaInteracao: pageViews > 0 ? ((leadsCriados / pageViews) * 100).toFixed(1) : 0,
        qualificados: qualificados,
        completos: completos,
        leads: leads
    };
}

async function exportLeadsToCSV() {
    const leads = await getLeads();
    const answers = await getLeadAnswers();
    
    if(leads.length === 0) {
        if (window.showToast) window.showToast('Nenhum lead para exportar.', 'error');
        return;
    }
    
    const uniqueQuestions = [...new Set(answers.map(a => a.question || `Etapa ${a.step_number}`))].filter(Boolean);
    
    const extraColumns = [
        "utm_source", "utm_campaign", "utm_medium", "utm_content", "utm_term",
        "xcod", "fbclid", "utm_id", "screen", "viewport", "platform", "ip", 
        "userAgent", "language", "country"
    ];

    let csv = 'ID Lead,Data,Nome,WhatsApp,E-mail,Status,Resultado,';
    csv += uniqueQuestions.join(',') + ',' + extraColumns.join(',') + '\\n';

    leads.forEach(l => {
        const leadAnswers = answers.filter(a => a.lead_id === l.lead_id);
        
        let row = [
            l.lead_id,
            new Date(l.created_at).toLocaleDateString(),
            l.name || '',
            l.phone || '',
            l.email || '',
            l.status || '',
            l.result || ''
        ];
        
        uniqueQuestions.forEach(q => {
            const ans = leadAnswers.find(a => a.question === q || `Etapa ${a.step_number}` === q);
            row.push(ans ? `"${ans.answer.replace(/"/g, '""')}"` : '');
        });

        extraColumns.forEach(col => {
            const val = l.utms ? l.utms[col] : (l[col] || '');
            row.push(`"${String(val).replace(/"/g, '""')}"`);
        });

        csv += row.join(',') + '\\n';
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', 'gestor-dados-leads.csv');
    a.click();
}

async function resetData() {
    if (window.openConfirmDialog) {
        window.openConfirmDialog({
            title: 'Resetar todos os dados?',
            message: 'Leads, respostas e eventos serao apagados. Essa acao nao pode ser desfeita.',
            confirmText: 'Resetar dados',
            tone: 'danger',
            onConfirm: performResetData
        });
        return;
    }

    await performResetData();
}

async function performResetData() {
    try {
        if (window.supabaseClient) {
            // No Supabase, precisamos deletar os itens. Dependendo da configuração RLS, pode ser negado caso o front-end não tenha role admin.
            // Tentaremos deletar tudo enviando filtros fakes onde id não é nulo.
            await window.supabaseClient.from('lead_answers').delete().not('id', 'is', 'null');
            await window.supabaseClient.from('tracking_events').delete().not('id', 'is', 'null');
            await window.supabaseClient.from('leads').delete().not('id', 'is', 'null');
        }
        
        // Limpar LocalStorage Mock
        localStorage.removeItem('lf_leads_db');
        localStorage.removeItem('lf_answers');
        localStorage.removeItem('lf_events');
        
        if (window.showToast) window.showToast('Dados resetados com sucesso.', 'success');
        // Se a função 'render' do script existir, recarrega a view
        if(typeof render === 'function') render();
        else location.reload();
    } catch(e) {
        console.error("Erro ao resetar dados:", e);
        if (window.showToast) window.showToast('Erro ao resetar no Supabase. O banco local foi limpo.', 'error');
        localStorage.removeItem('lf_leads_db');
        localStorage.removeItem('lf_answers');
        localStorage.removeItem('lf_events');
        location.reload();
    }
}

window.Leads = {
    createLead,
    updateLead,
    getLeads,
    getLeadAnswers,
    getEvents,
    calculateDashboardMetrics,
    exportLeadsToCSV,
    resetData
};
