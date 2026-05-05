// script.js - Lógica Principal do Dashboard Integrado ao Supabase

let currentTab = 'leads';
let currentSubTab = 'respostas';
let currentFilter = 'todos';
const appContent = document.getElementById('app-content');

function setFilter(filter) {
    currentFilter = filter;
    renderLeads();
}

// Default funnel para o construtor/visualização
const defaultFunnel = [
    { id: 's1', type: 'button', title: 'Descubre si puedes comenzar tu negocio de bolis gourmet' },
    { id: 's2', type: 'options', title: '¿Ya sabes preparar bolis gourmet?', options: ['Sí', 'No'] },
    { id: 's3', type: 'capture', fields: ['name', 'whatsapp', 'email'] },
    { id: 's4', type: 'result', text: 'Perfil Empreendedora Dulce' }
];

function navigate(tab) {
    currentTab = tab;
    ['builder', 'flow', 'design', 'leads', 'integrate'].forEach(t => {
        document.getElementById(`nav-${t}`).classList.remove('tab-active');
    });
    document.getElementById(`nav-${tab}`).classList.add('tab-active');
    render();
}

function navigateSub(subtab) {
    currentSubTab = subtab;
    renderLeads();
}

async function render() {
    if (currentTab === 'leads') await renderLeads();
    if (currentTab === 'builder') renderBuilder();
    if (currentTab === 'flow') renderFlow();
    if (currentTab === 'design') renderDesign();
    if (currentTab === 'integrate') renderIntegrate();
}

async function renderLeads() {
    // Show some loading state
    appContent.innerHTML = `<div class="p-10 text-center text-gray-500"><div class="animate-spin inline-block w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full mb-4"></div><p>Buscando dados no Supabase...</p></div>`;
    
    // Obter dados reais
    let answers = [];
    let events = [];
    
    try {
        const rawLeads = await window.Leads.getLeads();
        answers = await window.Leads.getLeadAnswers();
        events = await window.Leads.getEvents();

        const now = new Date();
        let leadsToRender = rawLeads;
        let filteredEvents = events;

        if (currentFilter === '24h') {
            leadsToRender = rawLeads.filter(l => (now - new Date(l.created_at)) <= 24*60*60*1000);
            filteredEvents = events.filter(e => (now - new Date(e.created_at)) <= 24*60*60*1000);
        } else if (currentFilter === '7d') {
            leadsToRender = rawLeads.filter(l => (now - new Date(l.created_at)) <= 7*24*60*60*1000);
            filteredEvents = events.filter(e => (now - new Date(e.created_at)) <= 7*24*60*60*1000);
        } else if (currentFilter === '30d') {
            leadsToRender = rawLeads.filter(l => (now - new Date(l.created_at)) <= 30*24*60*60*1000);
            filteredEvents = events.filter(e => (now - new Date(e.created_at)) <= 30*24*60*60*1000);
        }
        
        leadsToRender.sort((a,b) => new Date(b.created_at) - new Date(a.created_at));

        const pageViews = filteredEvents.filter(e => e.event_name === 'page_view').length;
        const leadsCriados = leadsToRender.length;
        const completos = leadsToRender.filter(l => l.status === 'Completo').length;
        const qualificados = leadsToRender.filter(l => (l.current_step / (l.total_steps || 1)) >= 0.5).length;
        
        metrics = {
            visitas: pageViews,
            adquiridos: leadsCriados,
            taxaInteracao: pageViews > 0 ? ((leadsCriados / pageViews) * 100).toFixed(1) : 0,
            qualificados: qualificados,
            completos: completos,
            leads: leadsToRender,
            events: filteredEvents
        };
    } catch (e) {
        console.error(e);
        appContent.innerHTML = `<div class="p-10 text-center text-red-500">Erro de comunicação com o Supabase. Verifique as configurações.</div>`;
        return;
    }

    const leads = metrics.leads;

    let subTabsHtml = `
        <div class="flex gap-4 border-b border-gray-200 mb-6">
            <button onclick="navigateSub('respostas')" class="pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${currentSubTab === 'respostas' ? 'border-brand-500 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}">Respostas</button>
            <button onclick="navigateSub('resultados')" class="pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${currentSubTab === 'resultados' ? 'border-brand-500 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}">Resultados</button>
            <button onclick="navigateSub('performance')" class="pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${currentSubTab === 'performance' ? 'border-brand-500 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}">Performance</button>
        </div>
    `;

    let filtersHtml = `
        <div class="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div class="flex gap-1 bg-white border border-gray-200 rounded-lg p-1 shadow-sm overflow-x-auto">
                <button onclick="setFilter('todos')" class="px-3 py-1.5 rounded-md text-xs font-semibold transition ${currentFilter === 'todos' ? 'bg-gray-100 text-gray-900 shadow-sm border border-gray-200' : 'text-gray-500 hover:bg-gray-50'}">Todos</button>
                <button onclick="setFilter('24h')" class="px-3 py-1.5 rounded-md text-xs font-semibold transition ${currentFilter === '24h' ? 'bg-gray-100 text-gray-900 shadow-sm border border-gray-200' : 'text-gray-500 hover:bg-gray-50'}">24 horas</button>
                <button onclick="setFilter('7d')" class="px-3 py-1.5 rounded-md text-xs font-semibold transition ${currentFilter === '7d' ? 'bg-gray-100 text-gray-900 shadow-sm border border-gray-200' : 'text-gray-500 hover:bg-gray-50'}">7 dias</button>
                <button onclick="setFilter('30d')" class="px-3 py-1.5 rounded-md text-xs font-semibold transition ${currentFilter === '30d' ? 'bg-gray-100 text-gray-900 shadow-sm border border-gray-200' : 'text-gray-500 hover:bg-gray-50'}">30 dias</button>
                <button onclick="setFilter('recent')" class="px-3 py-1.5 rounded-md text-xs font-semibold transition ${currentFilter === 'recent' ? 'bg-gray-100 text-gray-900 shadow-sm border border-gray-200' : 'text-gray-500 hover:bg-gray-50'}">Mais recente</button>
            </div>
            <div class="flex items-center gap-3">
                <button onclick="render()" class="bg-white border border-gray-200 rounded-lg p-2 text-gray-500 hover:text-gray-900 shadow-sm transition"><i class="ph ph-arrows-clockwise text-lg"></i></button>
                <button onclick="window.Leads.exportLeadsToCSV()" class="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 flex items-center gap-2"><i class="ph ph-download-simple"></i> Exportar leads</button>
                <button onclick="window.Leads.resetData()" class="bg-white border border-red-200 rounded-lg px-3 py-2 text-sm font-medium text-red-600 shadow-sm hover:bg-red-50 flex items-center gap-2 transition"><i class="ph ph-trash"></i> Resetar dados</button>
            </div>
        </div>
    `;

    let metricsHtml = `
        <div class="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div class="glass-panel p-5 rounded-xl shadow-sm border-t-2 border-t-gray-400">
                <div class="text-gray-400 mb-1"><i class="ph ph-eye text-xl"></i></div>
                <div class="text-2xl font-bold">${metrics.visitas}</div>
                <div class="text-xs text-gray-500 mt-1">Visitas e Acessos</div>
            </div>
            <div class="glass-panel p-5 rounded-xl shadow-sm border-t-2 border-t-blue-500">
                <div class="text-blue-500 mb-1"><i class="ph ph-user-plus text-xl"></i></div>
                <div class="text-2xl font-bold">${metrics.adquiridos}</div>
                <div class="text-xs text-gray-500 mt-1">Leads adquiridos</div>
            </div>
            <div class="glass-panel p-5 rounded-xl shadow-sm border-t-2 border-t-purple-500">
                <div class="text-purple-500 mb-1"><i class="ph ph-mouse-left-click text-xl"></i></div>
                <div class="text-2xl font-bold">${metrics.taxaInteracao}%</div>
                <div class="text-xs text-gray-500 mt-1">Taxa de interação</div>
            </div>
            <div class="glass-panel p-5 rounded-xl shadow-sm border-t-2 border-t-yellow-500">
                <div class="text-yellow-500 mb-1"><i class="ph ph-star text-xl"></i></div>
                <div class="text-2xl font-bold">${metrics.qualificados}</div>
                <div class="text-xs text-gray-500 mt-1">Leads qualificados</div>
            </div>
            <div class="glass-panel p-5 rounded-xl shadow-sm border-t-2 border-t-green-500">
                <div class="text-green-500 mb-1"><i class="ph ph-check-circle text-xl"></i></div>
                <div class="text-2xl font-bold">${metrics.completos}</div>
                <div class="text-xs text-gray-500 mt-1">Fluxos completos</div>
            </div>
        </div>
    `;

    // Leads were already filtered and sorted dynamically inside the metrics block above.
    let leadsToRender = leads;
    
    let contentHtml = '';

    if (currentSubTab === 'respostas') {
        // Agora que temos um construtor versátil, vamos puxar os cabeçalhos de etapas dinamicamente
        const uniqueQuestions = [...new Set(answers.map(a => a.question || `Etapa ${a.step_number}`))].filter(Boolean);
        
        const extraColumns = [
            "utm_source", "utm_campaign", "utm_medium", "utm_content", "utm_term",
            "xcod", "fbclid", "utm_id", "screen", "viewport", "platform", "ip", 
            "userAgent", "language", "country"
        ];

        const stepsHeaders = uniqueQuestions.map(q => `<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50 whitespace-nowrap table-divider-left">${q}</th>`).join('');
        const extraHeaders = extraColumns.map(s => `<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50 whitespace-nowrap table-divider-left">${s}</th>`).join('');

        const tbody = leadsToRender.map(l => {
            const statusBadge = l.status === 'Completo' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-yellow-50 text-yellow-800 border-yellow-200';
            const leadAns = answers.filter(a => a.lead_id === l.lead_id);
            
            const stepsTds = uniqueQuestions.map(q => {
                const ans = leadAns.find(a => a.question === q || `Etapa ${a.step_number}` === q);
                const txt = ans ? ans.answer : '-';
                return `<td class="px-4 py-3 table-divider-left"><div class="text-xs text-gray-700 truncate max-w-[120px]" title="${txt}">${txt}</div></td>`;
            }).join('');

            const extraTds = extraColumns.map(col => {
                const txt = l.utms ? l.utms[col] : (l[col] || '-');
                return `<td class="px-4 py-3 table-divider-left"><div class="text-xs text-gray-700 truncate max-w-[120px]" title="${txt}">${txt}</div></td>`;
            }).join('');

            return `
            <tr class="border-t border-gray-100 hover:bg-gray-50 transition">
                <td class="px-4 py-3 text-sm font-mono text-gray-600">${l.lead_id.slice(-6)}</td>
                <td class="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">${new Date(l.created_at).toLocaleDateString()}</td>
                <td class="px-4 py-3 text-sm font-medium text-gray-900">${l.name || '-'}</td>
                <td class="px-4 py-3 text-xs text-gray-500">${l.phone || '-'}</td>
                <td class="px-4 py-3 text-xs text-gray-500">${l.email || '-'}</td>
                <td class="px-4 py-3"><span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${statusBadge}">${l.status}</span></td>
                <td class="px-4 py-3 text-xs font-medium text-brand-600">${l.result || '-'}</td>
                ${stepsTds}
                ${extraTds}
            </tr>
            `;
        }).join('');

        contentHtml = `
            <div class="glass-panel rounded-xl shadow-sm overflow-hidden flex flex-col hide-scrollbar border border-gray-200 w-full overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead>
                        <tr>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50">ID Lead</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50">Data</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50">Nome</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50">WhatsApp</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50">E-mail</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50">Status</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50">Resultado</th>
                            ${stepsHeaders}
                            ${extraHeaders}
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-100">
                        ${tbody || '<tr><td colspan="100%" class="text-center py-6 text-gray-400">Nenhum dado encontrado</td></tr>'}
                    </tbody>
                </table>
            </div>
        `;
    } else if (currentSubTab === 'resultados') {
        const counts = {};
        leadsToRender.forEach(l => {
            if(l.result) counts[l.result] = (counts[l.result] || 0) + 1;
        });

        let barHtml = Object.keys(counts).map(res => {
            const perc = Math.round((counts[res] / leadsToRender.length) * 100);
            return `
                <div class="mb-4">
                    <div class="flex justify-between text-sm font-medium mb-1">
                        <span>${res}</span>
                        <span>${counts[res]} leads (${perc}%)</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2">
                        <div class="bg-brand-500 h-2 rounded-full" style="width: ${perc}%"></div>
                    </div>
                </div>
            `;
        }).join('');

        contentHtml = `<div class="glass-panel p-6 rounded-xl">${barHtml || '<p>Sem dados.</p>'}</div>`;
    } else if (currentSubTab === 'performance') {
        const filteredEvents = metrics.events || [];
        const pageViews = filteredEvents.filter(e => e.event_name === 'page_view').length;
        const totalStarts = filteredEvents.filter(e => e.event_name === 'start' || e.event_name === 'step_view').map(e => e.lead_id || e.session_id);
        const uniqueStarts = new Set(totalStarts).size;

        const stageViews = {};
        filteredEvents.filter(e => e.event_name === 'step_view').forEach(e => {
            let sName = e.event_data?.step_id || 'Etapa Desconhecida';
            stageViews[sName] = (stageViews[sName] || 0) + 1;
        });

        // Drop-off Calculation: Total Views per stage
        const stageListHtml = Object.keys(stageViews).map(stage => {
            const pct = uniqueStarts > 0 ? Math.round((stageViews[stage] / uniqueStarts) * 100) : 0;
            return `
                <div class="mb-4">
                    <div class="flex justify-between text-sm font-medium mb-1">
                        <span>Etapa Visualizada: ${stage}</span>
                        <span>${stageViews[stage]} visualizações (${pct}% do total de inícios)</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2">
                        <div class="bg-indigo-500 h-2 rounded-full" style="width: ${pct}%"></div>
                    </div>
                </div>
            `;
        }).join('');

        contentHtml = `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="glass-panel p-6 rounded-xl flex flex-col justify-center text-center">
                    <h3 class="font-bold text-gray-800 text-lg mb-2">Engajamento Inicial</h3>
                    <div class="text-4xl font-black text-brand-600 mb-2">${uniqueStarts > 0 ? Math.round((uniqueStarts/pageViews)*100) : 0}%</div>
                    <p class="text-sm text-gray-500">das pessoas que visitaram iniciaram o quiz (${uniqueStarts} de ${pageViews})</p>
                </div>
                <div class="glass-panel p-6 rounded-xl flex flex-col justify-center text-center">
                    <h3 class="font-bold text-gray-800 text-lg mb-2">Taxa de Conclusão</h3>
                    <div class="text-4xl font-black text-green-600 mb-2">${uniqueStarts > 0 ? Math.round((leadsToRender.length/uniqueStarts)*100) : 0}%</div>
                    <p class="text-sm text-gray-500">das pessoas que iniciaram chegaram até o fim (${leadsToRender.length} leads de ${uniqueStarts} inícios)</p>
                </div>
                <div class="glass-panel p-6 rounded-xl md:col-span-2">
                    <h3 class="font-bold text-gray-800 text-lg mb-4">Retenção por Etapa / Visitas</h2>
                    ${stageListHtml || '<p class="text-sm text-gray-500">Sem eventos de etapas para analisar.</p>'}
                </div>
            </div>
        `;
    }

    appContent.innerHTML = `<div class="fade-in">${metricsHtml}${subTabsHtml}${filtersHtml}${contentHtml}</div>`;
}

// Outras views mockadas (Mantém a lógica que construímos antes para design/builder)
function renderBuilder() {
    if (window.BuilderApp) {
        window.BuilderApp.render();
    } else {
        appContent.innerHTML = '<div class="glass-panel p-8 text-center text-gray-500 rounded-xl">Carregando Construtor...</div>';
    }
}
function renderFlow() {
    appContent.innerHTML = '<div class="glass-panel p-8 text-center text-gray-500 rounded-xl">Fluxograma em breve. O Mapeamento Lógico já pode ser configurado dentro das Opções da aba Construtor!</div>';
}
function renderDesign() {
    appContent.innerHTML = '<div class="glass-panel p-8 text-center text-gray-500 rounded-xl">Configurações de Design centralizadas! Acesse o <b>Construtor</b> e clique na área livre do canvas para acessar o Painel Global de Design!</div>';
}

function generateNewIntegration() {
    const funnel_id = 'quiz_' + Math.random().toString(36).substring(2, 10);
    const public_key = 'pk_live_' + Math.random().toString(36).substring(2, 16);
    localStorage.setItem('integrate_funnel_id', funnel_id);
    localStorage.setItem('integrate_public_key', public_key);
    renderIntegrate();
    setTimeout(() => {
        if(window.showToast) window.showToast('Nova chave gerada com sucesso. Atualize o código no HTML do seu quiz.', 'success');
    }, 100);
}

async function renderIntegrate() {
    let funnel_id = localStorage.getItem('integrate_funnel_id');
    let public_key = localStorage.getItem('integrate_public_key');
    
    if (!funnel_id || !public_key) {
        funnel_id = 'quiz_bolis_8f72a9';
        public_key = 'pk_live_7x92ksla0293';
        localStorage.setItem('integrate_funnel_id', funnel_id);
        localStorage.setItem('integrate_public_key', public_key);
    }

    // Carregar stats (se der erro segue com zero)
    let totalEventsToday = 0;
    let totalLeadsToday = 0;
    let lastDomain = 'Nenhum';
    let lastEventTime = 'Aguardando...';
    let isActive = false;

    try {
        const events = await window.Leads.getEvents() || [];
        
        const funnelEvents = events.filter(e => e.funnel_id === funnel_id);

        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        
        funnelEvents.forEach(e => {
            const eTime = new Date(e.created_at).getTime();
            if(eTime >= todayStart) totalEventsToday++;
            if(eTime > (now.getTime() - 24*60*60*1000)) isActive = true;
        });

        let leadsHojeUnicos = new Set();
        funnelEvents.forEach(e => {
            const eTime = new Date(e.created_at).getTime();
            if(eTime >= todayStart && e.event_name === 'lead_created') {
                leadsHojeUnicos.add(e.lead_id);
            }
        });
        totalLeadsToday = leadsHojeUnicos.size > 0 ? leadsHojeUnicos.size : 0;

        if(funnelEvents.length > 0) {
            funnelEvents.sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
            lastEventTime = funnelEvents[0].event_name;
            lastDomain = funnelEvents[0].page_url ? new URL(funnelEvents[0].page_url).hostname : (funnelEvents[0].event_data?.page_url ? new URL(funnelEvents[0].event_data.page_url).hostname : 'Desconhecido');
        }
    } catch(e) { console.warn('Erro ao carregar stats da integração', e); }

    const baseUrl = window.location.origin && window.location.origin !== "null" && !window.location.origin.includes("file://") 
        ? window.location.origin 
        : "https://gestordedados.vercel.app";

    const tagSource = `<script \n  async\n  src="${baseUrl}/pixel.js"\n  data-funnel-id="${funnel_id}"\n  data-public-key="${public_key}"\n  data-endpoint="${baseUrl}/api/track">\n</script>`;

    const statusBadgeHtml = isActive 
        ? `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"><span class="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> Ativo</span>`
        : `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><span class="w-1.5 h-1.5 bg-yellow-500 rounded-full"></span> Aguardando</span>`;

    const statusBadgeFinal = `<span id="int-status-badge">${statusBadgeHtml}</span>`;

    // Para quem quiser usar o modo direto Supabase (avançado)
    const supabaseUrl = localStorage.getItem('SUPABASE_URL') || 'URL_AQUI';
    const supabaseKey = localStorage.getItem('SUPABASE_ANON_KEY') || 'KEY_AQUI';
    const tagSourceSupa = `<script \n  async\n  src="${baseUrl}/pixel.js"\n  data-funnel-id="${funnel_id}"\n  data-public-key="${public_key}"\n  data-supabase-url="${supabaseUrl}"\n  data-supabase-key="${supabaseKey}">\n</script>`;

    appContent.innerHTML = `
        <div class="fade-in max-w-5xl mx-auto space-y-6">
            <div class="text-center mb-8">
                <h2 class="text-3xl font-bold text-gray-900 mb-2">Integrar Pixel Universal</h2>
                <p class="text-gray-500 max-w-2xl mx-auto">Um modelo simples: rastreio inteligente! Instale este pixel sem mexer em nenhuma lógica interna do seu quiz.</p>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- Status Panel -->
                <div class="glass-panel p-6 rounded-2xl flex flex-col justify-between">
                    <div>
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="font-bold text-gray-800">Status da Integração</h3>
                            ${statusBadgeFinal}
                        </div>
                        <ul class="text-sm space-y-3 text-gray-600 mb-6">
                            <li class="flex justify-between"><span>ID do Funil:</span> <span class="font-mono text-xs font-semibold text-brand-600">${funnel_id}</span></li>
                            <li class="flex justify-between"><span>Chave Pública:</span> <span class="font-mono text-xs truncate max-w-[100px] text-gray-500">${public_key}</span></li>
                            <li class="flex justify-between"><span>Último evento:</span> <span id="int-last-event" class="font-medium text-gray-800">${lastEventTime}</span></li>
                            <li class="flex justify-between"><span>Eventos Hoje:</span> <span id="int-events-today" class="font-medium text-gray-800">${totalEventsToday}</span></li>
                            <li class="flex justify-between"><span>Leads Hoje:</span> <span class="font-medium text-gray-800">${totalLeadsToday}</span></li>
                            <li class="flex justify-between"><span>Domínio:</span> <span class="font-medium text-gray-800 truncate max-w-[100px]" title="${lastDomain}">${lastDomain}</span></li>
                        </ul>
                    </div>
                    
                    <div class="bg-gray-50 p-3 rounded-lg border border-gray-100 mb-4 text-xs text-gray-600">
                        <strong class="text-gray-800 block mb-1">Diagnóstico Rápido:</strong>
                        <div class="flex justify-between mt-1"><span>Pixel Script:</span> <span id="diag-px" class="text-gray-500 font-medium">Testando...</span></div>
                        <div class="flex justify-between mt-1"><span>Endpoint API:</span> <span id="diag-api" class="text-gray-500 font-medium">Testando...</span></div>
                        <div class="flex justify-between mt-1"><span>Banco/Supabase:</span> <span id="diag-db" class="${totalEventsToday > 0 ? 'text-green-600' : 'text-yellow-600'} font-medium">${totalEventsToday > 0 ? 'OK (Recebeu evento)' : 'Aguardando dados'}</span></div>
                    </div>

                    <div class="flex flex-col gap-2">
                        <button onclick="generateNewIntegration()" class="px-4 py-2 border border-gray-200 text-gray-600 font-medium rounded-lg hover:bg-gray-50 transition w-full text-sm flex justify-center items-center gap-2"><i class="ph ph-arrows-clockwise"></i> Gerar nova chave</button>
                        <button onclick="testIntegration()" class="px-4 py-2 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition shadow-sm w-full text-sm flex justify-center items-center gap-2"><i class="ph ph-flask"></i> Testar Integração</button>
                    </div>
                    <div id="integration-feedback-container" class="mt-3"></div>
                </div>

                <!-- Setup Snippet -->
                <div class="glass-panel p-6 rounded-2xl lg:col-span-2">
                    <h3 class="font-bold text-gray-800 mb-2">Código de Instalação</h3>
                    <p class="text-sm text-gray-600 mb-4 bg-yellow-50 p-3 rounded-lg border border-yellow-200 text-yellow-800 font-medium whitespace-normal leading-relaxed">
                        Instale este pixel antes do fechamento da tag <code>&lt;/body&gt;</code> no seu quiz.<br><br> 
                        <strong class="text-red-700">Aviso Crítico:</strong> Instale apenas um código de pixel por quiz. Se você gerar nova chave, remova o código antigo do HTML e cole o novo. Se o ID do Funil do HTML for diferente do ID mostrado aqui, os eventos não aparecerão neste painel.
                    </p>
                    
                    <div class="bg-gray-900 rounded-xl p-4 relative group">
                        <code class="text-sm text-brand-100 font-mono whitespace-pre-wrap">${tagSource.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code>
                        <button onclick="copyInstallCode('default')" class="absolute top-3 right-3 bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg transition"><i class="ph ph-copy"></i> Copiar código</button>
                    </div>

                    <div class="mt-6 border-t border-gray-100 pt-4">
                        <details class="group cursor-pointer">
                            <summary class="text-sm font-medium text-gray-700 select-none pb-2 hover:text-brand-600 transition">⚙️ Alternativa: Modo Direto Supabase</summary>
                            <p class="text-xs text-gray-500 mb-3 ml-4 mt-2">Use se quiser pular o proxy da Vercel e gravar direto no Supabase.</p>
                            <div class="bg-gray-900 rounded-xl p-4 relative ml-4">
                                <code class="text-xs text-brand-100 font-mono whitespace-pre-wrap">${tagSourceSupa.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code>
                                <button onclick="copyInstallCode('supa')" class="absolute top-2 right-2 bg-white/10 hover:bg-white/20 text-white p-1.5 rounded-lg transition text-xs"><i class="ph ph-copy"></i></button>
                            </div>
                        </details>
                    </div>
                </div>
            </div>

            <!-- Docs -->
            <div class="glass-panel p-8 rounded-2xl space-y-6">
                <div>
                    <h3 class="font-bold text-gray-800 mb-2 text-xl border-b pb-2">Como o Rastreio Automático Funciona?</h3>
                    <p class="text-sm text-gray-600 mb-4 leading-relaxed">
                        Não quebre a cabeça configurando cliques! O <strong>pixel.js</strong> intercepta todos os cliques do seu projeto sem quebrar as rotas e funções do React. Ele detecta:
                    </p>
                    <ul class="text-sm text-gray-600 space-y-2 list-disc pl-5 mb-4">
                        <li><code>page_view</code>: Automático ao carregar;</li>
                        <li><code>button_click</code> / <code>answer_click</code>: Todo botão. Ele acha a pergunta mais próxima automaticamente;</li>
                        <li><code>lead_created</code>: Assim que algum formulário submete seus inputs (nome, telefone/whatsapp e email);</li>
                        <li><code>checkout_click</code>: Vasculha as âncoras (tags &lt;a&gt;) com Hotmart, Kiwify, etc.</li>
                        <li><code>quiz_completed</code>: Um leitor escaneia palavras chave e marca a conclusão automaticamente.</li>
                    </ul>
                </div>

                <div class="pt-6 border-t border-gray-100">
                    <details class="group">
                        <summary class="text-sm font-bold text-gray-700 cursor-pointer select-none pb-2 hover:text-brand-600 transition">📌 (Opcional) Data-Attributes para Extrema Precisão</summary>
                        <p class="text-sm text-gray-500 mb-4 ml-4 mt-2">Mesmo sendo 100% autônomo, o Pixel respeita caso você queira forçar a marcação.</p>
                        
                        <div class="ml-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                <h4 class="font-semibold text-sm mb-2 text-brand-600">Forçar Opções & Respostas</h4>
                                <code class="text-xs text-gray-800 font-mono block p-2 bg-white rounded border border-gray-200">
&lt;button<br>
  data-track="answer"<br>
  data-step="1"<br>
  data-question="Qual objetivo?"<br>
  data-answer="Dinheiro"&gt;<br>
  Quero...<br>
&lt;/button&gt;
                                </code>
                            </div>

                            <div class="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                <h4 class="font-semibold text-sm mb-2 text-brand-600">Forçar Formulários / Checkouts</h4>
                                <code class="text-xs text-gray-800 font-mono block p-2 bg-white rounded border border-gray-200">
&lt;form data-track="lead-form"&gt;...&lt;/form&gt;<br><br>
&lt;a href="#" data-track="checkout-click"&gt;Comprar&lt;/a&gt;
                                </code>
                            </div>
                        </div>
                    </details>
                </div>
            </div>
        </div>
    `;

    // Injeta funções pra UI no escopo global deste container
    window.showToast = function(msg, type = 'success') {
        const color = type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200';
        const container = document.getElementById('integration-feedback-container');
        if (!container) return;
        container.innerHTML = `<div class="p-3 rounded-lg border text-sm font-medium fade-in ${color}">${msg}</div>`;
        setTimeout(() => { if (container.innerHTML.includes(msg)) container.innerHTML = ''; }, 5000);
    };

    window.copyInstallCode = function(type) {
        if(type === 'default') navigator.clipboard.writeText(tagSource);
        else navigator.clipboard.writeText(tagSourceSupa);
        window.showToast('Código copiado limpo!', 'success');
    };

    window.testIntegration = async function() {
        window.showToast('<div class="flex items-center gap-2"><div class="animate-spin w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full"></div> Testando integração...</div>', 'success');

        const payload = {
            funnel_id: "${funnel_id}",
            public_key: "${public_key}",
            lead_id: "test_lead_" + Date.now(),
            event_name: "integration_test",
            event_value: "Teste manual feito pelo dashboard",
            page_url: window.location.href,
            referrer: document.referrer,
            user_agent: navigator.userAgent,
            browser_language: navigator.language || '',
            device_type: "desktop",
            created_at: new Date().toISOString()
        };

        try {
            const req = await fetch(`${baseUrl}/api/track`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!req.ok) {
                let errDetails = '';
                try {
                    const j = await req.json();
                    errDetails = (j.message || '') + (j.details ? ' - ' + j.details : '');
                } catch(e) {}
                throw new Error(`Status: ${req.status}. ${errDetails}`);
            }

            window.showToast('✅ Integração funcionando corretamente. Evento de teste recebido.', 'success');

            // Atualiza Interface (Status card)
            const lastEventEl = document.getElementById('int-last-event');
            if (lastEventEl) lastEventEl.innerText = "integration_test";

            const eventsTodayEl = document.getElementById('int-events-today');
            if (eventsTodayEl) eventsTodayEl.innerText = parseInt(eventsTodayEl.innerText || 0) + 1;

            const statusBadgeEl = document.getElementById('int-status-badge');
            if (statusBadgeEl) {
                statusBadgeEl.innerHTML = `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"><span class="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> Ativo</span>`;
            }
            
            const dbDiagEl = document.getElementById('diag-db');
            if(dbDiagEl) dbDiagEl.innerHTML = '<span class="text-green-600 font-medium">OK (Salvo)</span>';

        } catch (e) {
            window.showToast(`❌ Não foi possível testar a integração. Verifique /api/track, Supabase e variáveis de ambiente da Vercel. Detalhes: ${e.message}`, 'error');
        }
    };

    // Roda diagnóstico automático em background
    setTimeout(async () => {
        try {
            const rPx = await fetch(baseUrl + '/pixel.js', { method: 'HEAD' });
            const pxEl = document.getElementById('diag-px');
            if(pxEl) pxEl.innerHTML = rPx.ok ? '<span class="text-green-600 font-medium">OK (200)</span>' : `<span class="text-red-600 font-medium">Erro (${rPx.status})</span>`;
        } catch(e) {
            const pxEl = document.getElementById('diag-px');
            if(pxEl) pxEl.innerHTML = '<span class="text-red-600 font-medium">Falha na Rede</span>';
        }
        
        try {
            const rApi = await fetch(baseUrl + '/api/track', { method: 'OPTIONS' });
            const apiEl = document.getElementById('diag-api');
            if(apiEl) apiEl.innerHTML = rApi.ok ? '<span class="text-green-600 font-medium">OK</span>' : `<span class="text-red-600 font-medium">Erro 404/(${rApi.status})</span>`;
        } catch(e) {
            const apiEl = document.getElementById('diag-api');
            if(apiEl) apiEl.innerHTML = '<span class="text-red-600 font-medium">Erro 404/Rede</span>';
        }
    }, 800);
}

function openSettings() {
    document.getElementById('set-supa-url').value = localStorage.getItem('SUPABASE_URL') || '';
    document.getElementById('set-supa-key').value = localStorage.getItem('SUPABASE_ANON_KEY') || '';
    document.getElementById('settings-modal').classList.remove('hidden');
}

function closeSettings() {
    document.getElementById('settings-modal').classList.add('hidden');
}

function saveSettings() {
    const url = document.getElementById('set-supa-url').value;
    const key = document.getElementById('set-supa-key').value;
    localStorage.setItem('SUPABASE_URL', url);
    localStorage.setItem('SUPABASE_ANON_KEY', key);
    closeSettings();
    alert('Configurações do Supabase salvas! A página será recarregada.');
    location.reload();
}

function publish() {
    window.BuilderApp.publish();
}

// Iniciar app
document.addEventListener('DOMContentLoaded', () => {
    if (window.BuilderApp) window.BuilderApp.init();
    // Verifica Supabase Config
    if (!localStorage.getItem('SUPABASE_URL')) {
        appContent.innerHTML = `
            <div class="p-8 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-xl max-w-2xl mx-auto mt-10 text-center">
                <i class="ph ph-warning-circle text-4xl mb-3 block"></i>
                <h2 class="font-bold text-lg mb-2">Supabase Não Configurado</h2>
                <p class="mb-4 text-sm">O Dashboard precisa se conectar ao Supabase para puxar os leads e métricas reais. Você precisa adicionar sua URL e ANON KEY nas Configurações.</p>
                <button onclick="openSettings()" class="bg-yellow-500 hover:bg-yellow-600 shadow text-white px-4 py-2 rounded font-medium">Configurar Supabase Agora</button>
            </div>
        `;
    } else {
        render();
    }
});
