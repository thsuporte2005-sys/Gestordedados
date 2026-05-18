// script.js - Lógica Principal do Dashboard Integrado ao Supabase

let currentTab = 'dashboard';
let currentSubTab = 'respostas';
let currentFilter = 'todos';
window.pixelPollingInterval = null;
const appContent = document.getElementById('app-content');
const DASHBOARD_LAYOUT_KEY = 'gestor_dashboard_widget_order';
const NOTIFICATIONS_KEY = 'gestor_notifications';
const AI_REQUESTS_KEY = 'gestor_ai_requests';
let activeProfileTab = 'profile';

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function readLocalJSON(key, fallback) {
    try {
        return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
    } catch(e) {
        return fallback;
    }
}

function writeLocalJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function getInitials(name) {
    const parts = String(name || 'Usuario').trim().split(/\s+/).slice(0, 2);
    return parts.map(part => part[0]?.toUpperCase() || '').join('') || 'U';
}

function relativeTime(dateValue) {
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return 'agora';
    const diff = Math.max(0, Date.now() - date.getTime());
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'agora';
    if (minutes < 60) return `ha ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `ha ${hours} h`;
    return `ha ${Math.floor(hours / 24)} d`;
}

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
    if(window.pixelPollingInterval) {
        clearInterval(window.pixelPollingInterval);
        window.pixelPollingInterval = null;
    }
    currentTab = tab;
    ['dashboard', 'builder', 'flow', 'design', 'leads', 'integrate', 'ai'].forEach(t => {
        const el = document.getElementById(`nav-${t}`);
        if(el) {
            el.classList.remove('bg-emerald-50', 'text-[#10b981]');
            el.classList.add('text-gray-600');
        }
    });
    const activeEl = document.getElementById(`nav-${tab}`);
    if(activeEl) {
        activeEl.classList.remove('text-gray-600');
        activeEl.classList.add('bg-emerald-50', 'text-[#10b981]');
    }

    const titleMap = {
        'dashboard': 'Dashboard Inteligente',
        'leads': 'Analytics Estratégico',
        'builder': 'Projetos & Funis',
        'flow': 'Automação Visual',
        'design': 'Campanhas',
        'integrate': 'Integração Universal',
        'ai': 'AI Studio'
    };
    if(document.getElementById('header-title')) {
        document.getElementById('header-title').innerText = titleMap[tab] || 'SaaS';
    }

    render();
}

function navigateSub(subtab) {
    currentSubTab = subtab;
    renderLeads();
}

async function render() {
    if (currentTab === 'dashboard') await renderDashboard();
    if (currentTab === 'leads') await renderLeads();
    if (currentTab === 'builder') renderBuilder();
    if (currentTab === 'flow') renderFlow();
    if (currentTab === 'design') renderDesign();
    if (currentTab === 'integrate') renderIntegrate();
    if (currentTab === 'ai') await renderAIStudio();
}

// Skeletons Templates
const skeletonMetrics = `
<div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
    ${Array(4).fill().map(() => `
        <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-100 animate-pulse">
            <div class="h-6 w-6 bg-gray-200 rounded-md mb-3"></div>
            <div class="h-8 w-24 bg-gray-200 rounded-md mb-2"></div>
            <div class="h-4 w-32 bg-gray-100 rounded-md"></div>
        </div>
    `).join('')}
</div>
`;

const skeletonAI = `
<div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 animate-pulse mb-6">
    <div class="h-6 w-48 bg-gray-200 rounded-md mb-4"></div>
    <div class="space-y-3">
        <div class="h-4 w-full bg-gray-100 rounded-md"></div>
        <div class="h-4 w-5/6 bg-gray-100 rounded-md"></div>
        <div class="h-4 w-4/6 bg-gray-100 rounded-md"></div>
    </div>
</div>
`;

const skeletonTable = `
<div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse">
    <div class="h-6 w-40 bg-gray-200 rounded-md mb-6"></div>
    <div class="space-y-4">
        ${Array(5).fill().map(() => `
            <div class="flex items-center gap-4 border-b border-gray-50 pb-4">
                <div class="h-10 w-10 bg-gray-200 rounded-full"></div>
                <div class="flex-1 space-y-2">
                    <div class="h-4 w-1/4 bg-gray-200 rounded-md"></div>
                    <div class="h-3 w-1/3 bg-gray-100 rounded-md"></div>
                </div>
            </div>
        `).join('')}
    </div>
</div>
`;

async function renderDashboard() {
    appContent.innerHTML = `
        <div class="fade-in">
            ${skeletonMetrics}
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div class="lg:col-span-2">${skeletonTable}</div>
                <div class="lg:col-span-1">${skeletonAI}</div>
            </div>
        </div>
    `;

    let rawLeads = [];
    let events = [];
    try {
        rawLeads = await window.Leads.getLeads() || [];
        events = await window.Leads.getEvents() || [];
    } catch(e) { console.error(e); }

    const leadsCriados = rawLeads.length;
    const completos = rawLeads.filter(l => l.status === 'Completo').length;
    const pageViews = events.filter(e => e.event_name === 'page_view').length;
    const conversion = pageViews > 0 ? ((leadsCriados / pageViews) * 100).toFixed(1) : 0;
    hydrateNotificationsFromData(rawLeads, events, conversion);
    updateNotificationBadge();

    let aiSuggestions = `
        <div class="bg-gradient-to-br from-[#10b981]/10 to-emerald-50 p-6 rounded-xl border border-emerald-100">
            <h3 class="font-bold text-gray-900 flex items-center gap-2 mb-4"><i class="ph ph-sparkle text-[#10b981]"></i> Inteligência Contextual</h3>
            <ul class="space-y-4">
                <li class="flex gap-3">
                    <div class="bg-white p-2 rounded-lg shadow-sm text-yellow-600 h-min"><i class="ph ph-warning-circle"></i></div>
                    <div>
                        <p class="text-sm font-semibold text-gray-800">Queda na conversão</p>
                        <p class="text-xs text-gray-600 mt-1">A taxa de conversão caiu 12% nas últimas 48h. Sugerimos testar uma nova Headline focada em urgência no passo 1.</p>
                        <button onclick="queueAISuggestion('Melhorar taxa de conversão do funil principal com headline de urgência')" class="mt-2 text-[11px] font-semibold text-[#10b981] hover:underline">Gerar plano assistido</button>
                    </div>
                </li>
                <li class="flex gap-3">
                    <div class="bg-white p-2 rounded-lg shadow-sm text-blue-600 h-min"><i class="ph ph-trend-up"></i></div>
                    <div>
                        <p class="text-sm font-semibold text-gray-800">Pico de tráfego detectado</p>
                        <p class="text-xs text-gray-600 mt-1">A fonte de tráfego 'Facebook' está gerando 3x mais acessos hoje. O servidor está escalando bem.</p>
                    </div>
                </li>
                <li class="flex gap-3">
                    <div class="bg-white p-2 rounded-lg shadow-sm text-purple-600 h-min"><i class="ph ph-magic-wand"></i></div>
                    <div>
                        <p class="text-sm font-semibold text-gray-800">Otimização de Copy</p>
                        <p class="text-xs text-gray-600 mt-1">Nossa IA analisou os textos e identificou oportunidades de persuasão baseadas no perfil predominante de leads.</p>
                        <button onclick="navigate('ai')" class="mt-2 text-[11px] font-semibold text-[#10b981] hover:underline">Abrir AI Studio</button>
                    </div>
                </li>
            </ul>
        </div>
    `;

    const metricCards = {
        visits: { icon: 'ph-eye', color: 'text-gray-400', value: pageViews, label: 'Visitas Únicas' },
        leads: { icon: 'ph-user-plus', color: 'text-[#10b981]', value: leadsCriados, label: 'Leads Adquiridos' },
        conversion: { icon: 'ph-chart-line-up', color: 'text-blue-500', value: `${conversion}%`, label: 'Taxa de Conversão' },
        completed: { icon: 'ph-check-circle', color: 'text-purple-500', value: completos, label: 'Jornadas Completas' }
    };
    const metricOrder = getDashboardWidgetOrder();
    let metricsHtml = `
        <div class="flex flex-wrap justify-between items-center gap-3 mb-4 fade-in">
            <div>
                <h2 class="text-sm font-bold text-gray-900">Layout de widgets</h2>
                <p class="text-xs text-gray-500">Reordene os indicadores e salve sua visão operacional.</p>
            </div>
            <div class="flex gap-2">
                <button onclick="resetDashboardLayout()" class="px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50 transition">Resetar</button>
                <button onclick="showToast('Layout salvo neste navegador.', 'success')" class="px-3 py-2 bg-gray-900 text-white rounded-lg text-xs font-semibold hover:bg-gray-800 transition">Salvar layout</button>
            </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 fade-in">
            ${metricOrder.map((key, index) => {
                const card = metricCards[key];
                return `
                    <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:border-emerald-200 transition-colors group">
                        <div class="flex items-start justify-between gap-3">
                            <div>
                                <div class="${card.color} mb-2 group-hover:scale-110 transition-transform origin-left"><i class="ph ${card.icon} text-xl"></i></div>
                                <div class="text-2xl font-bold text-gray-900">${card.value}</div>
                                <div class="text-xs text-gray-500 mt-1 font-medium">${card.label}</div>
                            </div>
                            <div class="flex gap-1 opacity-70 group-hover:opacity-100 transition">
                                <button onclick="moveDashboardWidget(${index}, -1)" class="h-7 w-7 rounded-lg border border-gray-200 text-gray-400 hover:text-gray-700 hover:bg-gray-50" title="Mover para esquerda"><i class="ph ph-caret-left text-xs"></i></button>
                                <button onclick="moveDashboardWidget(${index}, 1)" class="h-7 w-7 rounded-lg border border-gray-200 text-gray-400 hover:text-gray-700 hover:bg-gray-50" title="Mover para direita"><i class="ph ph-caret-right text-xs"></i></button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;

    let recentLeadsHtml = `
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden fade-in">
            <div class="px-6 py-5 border-b border-gray-50 flex justify-between items-center">
                <h3 class="font-bold text-gray-900">Leads Recentes</h3>
                <button onclick="navigate('leads')" class="text-sm font-medium text-[#10b981] hover:underline">Ver todos os leads</button>
            </div>
            <div class="divide-y divide-gray-50">
                ${rawLeads.slice(0, 5).map(l => `
                    <div class="p-4 sm:px-6 hover:bg-gray-50 transition-colors flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <div class="h-10 w-10 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm border border-emerald-100">
                                ${escapeHtml((l.name || l.email || '?')[0].toUpperCase())}
                            </div>
                            <div>
                                <p class="text-sm font-semibold text-gray-900">${escapeHtml(l.name || 'Anônimo')}</p>
                                <p class="text-xs text-gray-500">${escapeHtml(l.email || l.phone || l.whatsapp || 'Contato oculto')}</p>
                            </div>
                        </div>
                        <div class="text-right">
                            <span class="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-medium bg-gray-50 text-gray-600 border border-gray-100">
                                ${new Date(l.created_at).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                `).join('') || '<div class="p-8 text-center text-gray-400 text-sm">Nenhum lead capturado ainda. O funil está aguardando tráfego.</div>'}
            </div>
        </div>
    `;

    appContent.innerHTML = `
        <div class="fade-in pb-10">
            ${metricsHtml}
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div class="lg:col-span-2">${recentLeadsHtml}</div>
                <div class="lg:col-span-1">${aiSuggestions}</div>
            </div>
        </div>
    `;
}

async function renderLeads() {
    appContent.innerHTML = `<div class="fade-in">${skeletonTable}</div>`;
    
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
        <div class="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6 fade-in">
            <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:border-emerald-200 transition-colors cursor-pointer group">
                <div class="text-gray-400 mb-2 group-hover:scale-110 transition-transform origin-left"><i class="ph ph-eye text-xl"></i></div>
                <div class="text-2xl font-bold text-gray-900">${metrics.visitas}</div>
                <div class="text-xs text-gray-500 mt-1 font-medium">Visitas Únicas</div>
            </div>
            <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:border-emerald-200 transition-colors cursor-pointer group">
                <div class="text-[#10b981] mb-2 group-hover:scale-110 transition-transform origin-left"><i class="ph ph-user-plus text-xl"></i></div>
                <div class="text-2xl font-bold text-gray-900">${metrics.adquiridos}</div>
                <div class="text-xs text-gray-500 mt-1 font-medium">Leads Adquiridos</div>
            </div>
            <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:border-emerald-200 transition-colors cursor-pointer group">
                <div class="text-blue-500 mb-2 group-hover:scale-110 transition-transform origin-left"><i class="ph ph-chart-line-up text-xl"></i></div>
                <div class="text-2xl font-bold text-gray-900">${metrics.taxaInteracao}%</div>
                <div class="text-xs text-gray-500 mt-1 font-medium">Taxa de Conversão</div>
            </div>
            <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:border-emerald-200 transition-colors cursor-pointer group">
                <div class="text-yellow-500 mb-2 group-hover:scale-110 transition-transform origin-left"><i class="ph ph-star text-xl"></i></div>
                <div class="text-2xl font-bold text-gray-900">${metrics.qualificados}</div>
                <div class="text-xs text-gray-500 mt-1 font-medium">Leads Qualificados</div>
            </div>
            <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:border-emerald-200 transition-colors cursor-pointer group">
                <div class="text-purple-500 mb-2 group-hover:scale-110 transition-transform origin-left"><i class="ph ph-check-circle text-xl"></i></div>
                <div class="text-2xl font-bold text-gray-900">${metrics.completos}</div>
                <div class="text-xs text-gray-500 mt-1 font-medium">Fluxos Completos</div>
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
    appContent.innerHTML = `
    <div class="flex flex-col h-[calc(100vh-8rem)] fade-in">
        <div class="mb-4">
            <h2 class="text-2xl font-bold text-gray-900">Automação Visual</h2>
            <p class="text-sm text-gray-500">Crie fluxos complexos arrastando blocos inteligentes para o canvas.</p>
        </div>
        <div class="flex flex-1 gap-6 min-h-0">
           <!-- Sidebar with draggable nodes -->
           <div class="w-72 bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col gap-6 overflow-y-auto z-10 relative">
              <h3 class="font-bold text-gray-900 border-b border-gray-100 pb-2">Blocos de Automação</h3>
              
              <div>
                  <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Gatilhos</p>
                  <div draggable="true" class="bg-blue-50 border border-blue-200 p-3 rounded-lg flex items-center gap-3 cursor-grab text-blue-700 font-medium text-sm hover:shadow hover:-translate-y-0.5 transition-all mb-2"><div class="bg-white p-1.5 rounded text-blue-600"><i class="ph ph-lightning text-lg"></i></div> Lead Cadastrado</div>
                  <div draggable="true" class="bg-blue-50 border border-blue-200 p-3 rounded-lg flex items-center gap-3 cursor-grab text-blue-700 font-medium text-sm hover:shadow hover:-translate-y-0.5 transition-all"><div class="bg-white p-1.5 rounded text-blue-600"><i class="ph ph-check-square-offset text-lg"></i></div> Quiz Finalizado</div>
              </div>

              <div>
                  <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Condições</p>
                  <div draggable="true" class="bg-yellow-50 border border-yellow-200 p-3 rounded-lg flex items-center gap-3 cursor-grab text-yellow-700 font-medium text-sm hover:shadow hover:-translate-y-0.5 transition-all mb-2"><div class="bg-white p-1.5 rounded text-yellow-600"><i class="ph ph-git-branch text-lg"></i></div> Se Perfil = A</div>
                  <div draggable="true" class="bg-yellow-50 border border-yellow-200 p-3 rounded-lg flex items-center gap-3 cursor-grab text-yellow-700 font-medium text-sm hover:shadow hover:-translate-y-0.5 transition-all"><div class="bg-white p-1.5 rounded text-yellow-600"><i class="ph ph-eye text-lg"></i></div> Se Abriu E-mail</div>
              </div>

              <div>
                  <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Ações</p>
                  <div draggable="true" class="bg-emerald-50 border border-emerald-200 p-3 rounded-lg flex items-center gap-3 cursor-grab text-[#10b981] font-medium text-sm hover:shadow hover:-translate-y-0.5 transition-all mb-2"><div class="bg-white p-1.5 rounded text-[#10b981]"><i class="ph ph-envelope-simple text-lg"></i></div> Enviar E-mail</div>
                  <div draggable="true" class="bg-emerald-50 border border-emerald-200 p-3 rounded-lg flex items-center gap-3 cursor-grab text-[#10b981] font-medium text-sm hover:shadow hover:-translate-y-0.5 transition-all mb-2"><div class="bg-white p-1.5 rounded text-[#10b981]"><i class="ph ph-whatsapp-logo text-lg"></i></div> Mensagem WhatsApp</div>
                  <div draggable="true" class="bg-purple-50 border border-purple-200 p-3 rounded-lg flex items-center gap-3 cursor-grab text-purple-700 font-medium text-sm hover:shadow hover:-translate-y-0.5 transition-all"><div class="bg-white p-1.5 rounded text-purple-600"><i class="ph ph-tag text-lg"></i></div> Adicionar Tag</div>
              </div>
           </div>

           <!-- Canvas Area -->
           <div class="flex-1 bg-white rounded-xl shadow-inner border border-gray-200 overflow-hidden relative" style="background-image: radial-gradient(#e5e7eb 1.5px, transparent 1.5px); background-size: 24px 24px; cursor: grab;">
               
               <div class="absolute top-4 left-4 bg-white/90 backdrop-blur px-4 py-2.5 rounded-lg shadow-sm border border-gray-200 text-sm font-medium text-gray-700 flex items-center gap-2 z-10"><i class="ph ph-cursor-click text-brand-500"></i> Arraste os blocos para o canvas</div>
               
               <div class="absolute top-4 right-4 flex gap-2 z-10">
                   <button class="bg-white p-2 rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 transition text-gray-600"><i class="ph ph-minus"></i></button>
                   <button class="bg-white px-3 py-2 rounded-lg shadow-sm border border-gray-200 text-sm font-bold text-gray-600">100%</button>
                   <button class="bg-white p-2 rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 transition text-gray-600"><i class="ph ph-plus"></i></button>
               </div>

               <!-- Example Node 1 -->
               <div class="absolute top-24 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-md border border-gray-200 w-64 overflow-visible hover:ring-2 hover:ring-blue-200 transition-all cursor-pointer">
                   <div class="bg-blue-600 text-white p-2 rounded-t-xl text-xs font-bold uppercase tracking-widest text-center flex items-center justify-center gap-1.5 shadow-sm"><i class="ph ph-lightning text-sm"></i> Gatilho de Entrada</div>
                   <div class="p-4 text-center">
                       <p class="font-bold text-gray-900 text-sm">Lead Cadastrado</p>
                       <p class="text-xs text-gray-500 mt-1">Quando lead finaliza captura</p>
                   </div>
                   <div class="h-3.5 w-3.5 bg-white rounded-full absolute -bottom-2 left-1/2 -translate-x-1/2 border-[3px] border-gray-300 hover:border-blue-500 hover:scale-125 transition-transform cursor-crosshair z-10"></div>
               </div>

               <!-- Example Connection Line -->
               <svg class="absolute inset-0 w-full h-full pointer-events-none z-0">
                   <path d="M 50% 200 C 50% 250, 50% 250, 50% 300" stroke="#94a3b8" stroke-width="2.5" fill="none" stroke-dasharray="6,4" class="animate-[dash_1s_linear_infinite]" />
                   <!-- Down Arrow -->
                   <polygon points="49.5%,300 50.5%,300 50%,305" fill="#94a3b8" />
               </svg>
               <style>@keyframes dash { to { stroke-dashoffset: -10; } }</style>

               <!-- Example Node 2 -->
               <div class="absolute top-[300px] left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-lg border border-emerald-300 w-64 overflow-visible ring-4 ring-emerald-50 hover:-translate-y-1 transition-all cursor-pointer z-10">
                   <div class="h-3.5 w-3.5 bg-white rounded-full absolute -top-2 left-1/2 -translate-x-1/2 border-[3px] border-emerald-500 z-10"></div>
                   <div class="bg-emerald-500 text-white p-2 rounded-t-xl text-xs font-bold uppercase tracking-widest text-center flex items-center justify-center gap-1.5 shadow-sm"><i class="ph ph-whatsapp-logo text-sm"></i> Ação Imediata</div>
                   <div class="p-4 text-center">
                       <p class="font-bold text-gray-900 text-sm">Mensagem WhatsApp</p>
                       <p class="text-xs text-gray-500 mt-1 line-clamp-2">"Olá! Vi que você finalizou o Quiz. Aqui está seu acesso exclusivo!"</p>
                   </div>
                   <div class="absolute -right-3 -top-3 bg-red-500 text-white h-6 w-6 rounded-full flex items-center justify-center shadow font-bold text-xs cursor-pointer hover:scale-110 transition"><i class="ph ph-x"></i></div>
                   <div class="h-3.5 w-3.5 bg-white rounded-full absolute -bottom-2 left-1/2 -translate-x-1/2 border-[3px] border-gray-300 hover:border-emerald-500 hover:scale-125 transition-transform cursor-crosshair z-10"></div>
               </div>
           </div>
        </div>
    </div>
    `;
}
function renderDesign() {
    appContent.innerHTML = '<div class="glass-panel p-8 text-center text-gray-500 rounded-xl">Configurações de Design centralizadas! Acesse o <b>Construtor</b> e clique na área livre do canvas para acessar o Painel Global de Design!</div>';
}

async function buildSystemSnapshot() {
    let leads = [];
    let events = [];
    try {
        leads = await window.Leads.getLeads() || [];
        events = await window.Leads.getEvents() || [];
    } catch(e) {
        console.warn('AI snapshot fallback', e);
    }
    const pageViews = events.filter(e => e.event_name === 'page_view').length;
    const leadsCount = leads.length;
    const completed = leads.filter(l => l.status === 'Completo').length;
    const conversion = pageViews > 0 ? Number(((leadsCount / pageViews) * 100).toFixed(1)) : 0;
    const lastEvent = [...events].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
    return {
        pageViews,
        leadsCount,
        completed,
        conversion,
        lastEventName: lastEvent?.event_name || 'nenhum',
        lastEventAt: lastEvent?.created_at || null,
        funnelId: localStorage.getItem('integrate_funnel_id') || 'quiz_bolis_8f72a9',
        publicKey: localStorage.getItem('integrate_public_key') || 'pk_live_7x92ksla0293'
    };
}

function getAIRequests() {
    return readLocalJSON(AI_REQUESTS_KEY, []);
}

function saveAIRequests(requests) {
    writeLocalJSON(AI_REQUESTS_KEY, requests);
}

function generateAIPlan(command, snapshot) {
    const lower = command.toLowerCase();
    const actions = [];
    const risks = [];

    if (lower.includes('convers') || lower.includes('copy') || lower.includes('headline')) {
        actions.push({
            type: 'copy_optimization',
            title: 'Otimizar primeira dobra do funil',
            description: 'Criar uma headline mais direta, reforçar prova e reduzir atrito no primeiro clique.'
        });
    }
    if (lower.includes('telefone') || lower.includes('whatsapp') || lower.includes('campo')) {
        actions.push({
            type: 'enable_phone_capture',
            title: 'Ativar captura de telefone/WhatsApp',
            description: 'Registrar a preferencia para adicionar telefone como campo obrigatorio nos proximos formularios de cadastro.'
        });
    }
    if (lower.includes('pixel') || lower.includes('rastrei') || lower.includes('evento')) {
        actions.push({
            type: 'pixel_audit',
            title: 'Executar auditoria do Pixel Universal',
            description: 'Revalidar script, endpoint, ultimo evento e checklist de instalacao.'
        });
    }
    if (actions.length === 0) {
        actions.push({
            type: 'guided_task',
            title: 'Gerar plano assistido',
            description: 'Transformar o pedido em etapas pequenas, revisaveis e aprovadas antes de aplicar.'
        });
    }

    if (snapshot.conversion < 5 && snapshot.pageViews > 20) {
        risks.push('Conversao abaixo de 5% com volume suficiente para investigar copy, oferta e formularios.');
    }
    if (!snapshot.lastEventAt) {
        risks.push('Nenhum evento recente encontrado. A IA recomenda validar o pixel antes de otimizar campanha.');
    }
    risks.push('Mudancas automaticas ficam em modo assistido: nada sensivel e aplicado sem aprovacao.');

    return { actions, risks };
}

async function renderAIStudio(prefill = '') {
    const snapshot = await buildSystemSnapshot();
    const requests = getAIRequests();
    appContent.innerHTML = `
        <div class="fade-in max-w-6xl mx-auto space-y-6">
            <div class="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-6">
                <section class="bg-white border border-gray-100 shadow-sm rounded-xl p-6">
                    <div class="flex items-start justify-between gap-4 mb-5">
                        <div>
                            <h2 class="text-2xl font-bold text-gray-900 flex items-center gap-2"><i class="ph ph-sparkle text-[#10b981]"></i> AI Studio</h2>
                            <p class="text-sm text-gray-500 mt-1">Nucleo de evolucao assistida para analisar, propor e aplicar mudancas aprovadas.</p>
                        </div>
                        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                            <span class="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                            Modo seguro
                        </span>
                    </div>

                    <label for="ai-command" class="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Comando em linguagem natural</label>
                    <textarea id="ai-command" rows="5" class="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#10b981] focus:ring-4 focus:ring-emerald-50 transition resize-none" placeholder="Ex: Melhore a taxa de conversao do funil principal e sugira ajustes no pixel.">${escapeHtml(prefill)}</textarea>
                    <div class="flex flex-wrap gap-2 mt-4">
                        <button onclick="runAIStudioCommand()" class="px-4 py-2.5 bg-[#10b981] hover:bg-[#059669] text-white rounded-lg text-sm font-bold shadow-sm transition flex items-center gap-2"><i class="ph ph-lightning"></i> Analisar e propor</button>
                        <button onclick="document.getElementById('ai-command').value='Adicione um novo campo de telefone no formulario de cadastro e valide a jornada.'" class="px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">Campo telefone</button>
                        <button onclick="document.getElementById('ai-command').value='Teste o Pixel Universal e explique por que os eventos nao aparecem.'" class="px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">Diagnosticar pixel</button>
                    </div>
                    <div id="ai-output" class="mt-5"></div>
                </section>

                <aside class="space-y-4">
                    <div class="bg-gray-900 text-white rounded-xl p-5 shadow-sm">
                        <h3 class="font-bold mb-4 flex items-center gap-2"><i class="ph ph-database"></i> Contexto lido</h3>
                        <dl class="grid grid-cols-2 gap-3 text-sm">
                            <div class="bg-white/10 rounded-lg p-3"><dt class="text-white/60 text-xs">Visitas</dt><dd class="font-bold text-lg">${snapshot.pageViews}</dd></div>
                            <div class="bg-white/10 rounded-lg p-3"><dt class="text-white/60 text-xs">Leads</dt><dd class="font-bold text-lg">${snapshot.leadsCount}</dd></div>
                            <div class="bg-white/10 rounded-lg p-3"><dt class="text-white/60 text-xs">Conversao</dt><dd class="font-bold text-lg">${snapshot.conversion}%</dd></div>
                            <div class="bg-white/10 rounded-lg p-3"><dt class="text-white/60 text-xs">Ultimo evento</dt><dd class="font-bold text-sm truncate">${escapeHtml(snapshot.lastEventName)}</dd></div>
                        </dl>
                    </div>

                    <div class="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
                        <h3 class="font-bold text-gray-900 mb-3">Fila de aprovacao</h3>
                        <div id="ai-queue">${renderAIQueueHtml(requests)}</div>
                    </div>
                </aside>
            </div>
        </div>
    `;
}

function renderAIQueueHtml(requests) {
    const list = requests.slice().reverse();
    if (!list.length) {
        return '<div class="text-sm text-gray-400 text-center py-6 border border-dashed border-gray-200 rounded-xl">Nenhuma proposta aguardando aprovacao.</div>';
    }
    return list.map(item => `
        <div class="border border-gray-100 rounded-xl p-4 mb-3 bg-gray-50/70">
            <div class="flex items-start justify-between gap-3">
                <div>
                    <p class="text-sm font-bold text-gray-900">${escapeHtml(item.title)}</p>
                    <p class="text-xs text-gray-500 mt-1">${escapeHtml(item.description)}</p>
                    <p class="text-[10px] text-gray-400 mt-2">${relativeTime(item.createdAt)} • ${escapeHtml(item.status)}</p>
                </div>
                <span class="text-[10px] px-2 py-1 rounded-full ${item.status === 'aprovado' ? 'bg-green-100 text-green-700' : item.status === 'rejeitado' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}">${escapeHtml(item.status)}</span>
            </div>
            ${item.status === 'pendente' ? `
                <div class="flex gap-2 mt-3">
                    <button onclick="approveAIRequest('${item.id}')" class="flex-1 px-3 py-2 bg-[#10b981] text-white rounded-lg text-xs font-bold hover:bg-[#059669] transition">Aprovar</button>
                    <button onclick="rejectAIRequest('${item.id}')" class="px-3 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-50 transition">Rejeitar</button>
                </div>
            ` : ''}
        </div>
    `).join('');
}

window.queueAISuggestion = function(command) {
    navigate('ai');
    setTimeout(() => {
        const input = document.getElementById('ai-command');
        if (input) input.value = command;
        runAIStudioCommand();
    }, 80);
};

window.runAIStudioCommand = async function() {
    const input = document.getElementById('ai-command');
    const output = document.getElementById('ai-output');
    const command = input?.value.trim();
    if (!command) {
        showToast('Digite um comando para a IA analisar.', 'error');
        return;
    }
    const snapshot = await buildSystemSnapshot();
    const plan = generateAIPlan(command, snapshot);
    const requests = getAIRequests();
    const now = new Date().toISOString();
    const newRequests = plan.actions.map(action => ({
        id: 'ai_' + Math.random().toString(36).slice(2, 10),
        command,
        ...action,
        status: 'pendente',
        createdAt: now
    }));
    saveAIRequests([...requests, ...newRequests].slice(-20));
    hydrateNotificationsFromData([], [], snapshot.conversion, 'Nova proposta da IA aguardando aprovacao.');
    updateNotificationBadge();

    output.innerHTML = `
        <div class="border border-emerald-100 bg-emerald-50 rounded-xl p-4 fade-in">
            <h3 class="font-bold text-gray-900 mb-2">Plano proposto</h3>
            <div class="space-y-2">
                ${plan.actions.map(action => `
                    <div class="bg-white border border-emerald-100 rounded-lg p-3">
                        <p class="text-sm font-bold text-gray-900">${escapeHtml(action.title)}</p>
                        <p class="text-xs text-gray-600 mt-1">${escapeHtml(action.description)}</p>
                    </div>
                `).join('')}
            </div>
            <h4 class="font-bold text-xs text-gray-500 uppercase tracking-widest mt-4 mb-2">Validacoes e seguranca</h4>
            <ul class="space-y-1 text-xs text-gray-600 list-disc pl-4">
                ${plan.risks.map(risk => `<li>${escapeHtml(risk)}</li>`).join('')}
            </ul>
        </div>
    `;
    const queue = document.getElementById('ai-queue');
    if (queue) queue.innerHTML = renderAIQueueHtml(getAIRequests());
    showToast('Plano criado e enviado para aprovacao.', 'success');
};

window.approveAIRequest = function(id) {
    const requests = getAIRequests();
    const idx = requests.findIndex(item => item.id === id);
    if (idx === -1) return;
    const request = requests[idx];

    if (request.type === 'enable_phone_capture') {
        localStorage.setItem('auth_extra_phone_enabled', 'true');
    }
    if (request.type === 'copy_optimization') {
        localStorage.setItem('ai_latest_copy_recommendation', 'Headline recomendada: Transforme seus dados em uma maquina de conversao em menos de 7 dias.');
    }
    if (request.type === 'pixel_audit') {
        localStorage.setItem('ai_pixel_audit_requested_at', new Date().toISOString());
    }

    requests[idx] = { ...request, status: 'aprovado', appliedAt: new Date().toISOString() };
    saveAIRequests(requests);
    const queue = document.getElementById('ai-queue');
    if (queue) queue.innerHTML = renderAIQueueHtml(requests);
    showToast('Mudanca aprovada e aplicada no modo assistido.', 'success');
};

window.rejectAIRequest = function(id) {
    const requests = getAIRequests();
    const idx = requests.findIndex(item => item.id === id);
    if (idx === -1) return;
    requests[idx] = { ...requests[idx], status: 'rejeitado' };
    saveAIRequests(requests);
    const queue = document.getElementById('ai-queue');
    if (queue) queue.innerHTML = renderAIQueueHtml(requests);
    showToast('Proposta rejeitada.', 'success');
};

async function generateNewIntegration() {
    const funnel_id = 'quiz_' + Math.random().toString(36).substring(2, 10);
    const public_key = 'pk_live_' + Math.random().toString(36).substring(2, 16);
    localStorage.setItem('integrate_funnel_id', funnel_id);
    localStorage.setItem('integrate_public_key', public_key);
    
    try {
        if(window.supabaseClient) {
            await window.supabaseClient.from('funnels').upsert({
                funnel_id: funnel_id,
                public_key: public_key,
                name: funnel_id,
                status: 'Aguardando',
                updated_at: new Date().toISOString(),
                created_at: new Date().toISOString()
            });
        }
    } catch(e) {}
    
    renderIntegrate();
    setTimeout(() => {
        if(window.showToast) window.showToast('Nova chave gerada. Atualize o código instalado no HTML do seu quiz.', 'success');
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
    let quizUrl = '';

    try {
        if (window.supabaseClient) {
            const { data: fData } = await window.supabaseClient.from('funnels').select('quiz_url, last_page_url').eq('funnel_id', funnel_id).maybeSingle();
            if (fData) quizUrl = fData.quiz_url || fData.last_page_url || '';
        }
    } catch(e) {}

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
        ? `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200 shadow-sm"><span class="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> Conectado</span>`
        : `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200 shadow-sm"><span class="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse"></span> Aguardando dados</span>`;

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

                <!-- Publish Panel -->
                <div class="glass-panel p-6 rounded-2xl lg:col-span-2">
                    <h3 class="font-bold text-gray-800 mb-4">Publicar e Visualizar Quiz</h3>
                    <p class="text-sm text-gray-600 mb-4 leading-relaxed">
                        A URL do quiz será detectada automaticamente no primeiro acesso. Você também pode colar o link manualmente.
                    </p>
                    <div class="flex flex-col gap-4">
                        <div class="w-full">
                            <label class="block text-xs font-semibold text-gray-500 uppercase mb-1">URL do Quiz Integrado</label>
                            <input type="url" id="int-quiz-url" value="${quizUrl}" placeholder="Ex: https://meu-quiz.com" class="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition bg-white text-gray-800" />
                        </div>
                        <div class="flex gap-2 w-full">
                            <button onclick="publishQuiz()" class="flex-1 px-4 py-2 bg-brand-600 text-white font-medium rounded-lg hover:bg-brand-700 transition shadow-sm text-sm flex justify-center items-center gap-2"><i class="ph ph-rocket-launch"></i> Publicar</button>
                            <button onclick="viewQuiz()" class="flex-1 px-4 py-2 border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition text-sm flex justify-center items-center gap-2"><i class="ph ph-eye"></i> Visualizar</button>
                        </div>
                    </div>
                </div>

                <!-- Setup Snippet -->
                <div class="glass-panel p-6 rounded-2xl lg:col-span-3">
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
    window.showIntegrationFeedback = function(msg, type = 'success') {
        const color = type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200';
        const container = document.getElementById('integration-feedback-container');
        if (!container) return;
        container.innerHTML = `<div class="p-3 rounded-lg border text-sm font-medium fade-in ${color}">${msg}</div>`;
        setTimeout(() => { if (container.innerHTML.includes(msg)) container.innerHTML = ''; }, 5000);
    };

    window.copyInstallCode = function(type) {
        if(type === 'default') navigator.clipboard.writeText(tagSource);
        else navigator.clipboard.writeText(tagSourceSupa);
        window.showIntegrationFeedback('Código copiado limpo.', 'success');
    };

    window.publishQuiz = async function() {
        const urlInput = document.getElementById('int-quiz-url');
        if(!urlInput || !urlInput.value) {
            window.showIntegrationFeedback('Insira uma URL válida ou instale o pixel e abra seu quiz uma vez.', 'error');
            return;
        }
        window.showIntegrationFeedback('<div class="flex items-center gap-2"><div class="animate-spin w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full"></div> Publicando...</div>', 'success');
        try {
            if (!window.supabaseClient) throw new Error('Supabase nao configurado.');
            await window.supabaseClient.from('funnels').upsert({
                funnel_id: "${funnel_id}",
                public_key: "${public_key}",
                quiz_url: urlInput.value,
                published: true,
                published_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }, { onConflict: 'funnel_id' });
            window.showIntegrationFeedback('Quiz publicado com sucesso.', 'success');
        } catch(e) {
            window.showIntegrationFeedback('Erro ao publicar quiz.', 'error');
        }
    };

    window.viewQuiz = async function() {
        const urlInput = document.getElementById('int-quiz-url');
        if(urlInput && urlInput.value) {
            window.open(urlInput.value, '_blank');
        } else {
            window.showIntegrationFeedback('Instale o pixel no quiz e abra a página do quiz uma vez para capturar a URL.', 'error');
        }
    };

    window.testIntegration = async function() {
        window.showIntegrationFeedback('<div class="flex items-center gap-2"><div class="animate-spin w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full"></div> Testando integração...</div>', 'success');

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

            window.showIntegrationFeedback('Integração funcionando corretamente. Evento de teste recebido.', 'success');

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
            window.showIntegrationFeedback(`Não foi possível testar a integração. Verifique /api/track, Supabase e variáveis de ambiente da Vercel. Detalhes: ${escapeHtml(e.message)}`, 'error');
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

    // Set up Pixel Polling to check status every 10 seconds
    if (!window.pixelPollingInterval) {
        window.pixelPollingInterval = setInterval(async () => {
            if (currentTab !== 'integrate') {
                clearInterval(window.pixelPollingInterval);
                window.pixelPollingInterval = null;
                return;
            }
            try {
                let pid = localStorage.getItem('integrate_funnel_id');
                const eData = await window.Leads.getEvents() || [];
                const ptData = eData.filter(e => e.funnel_id === pid);
                let polAct = false;
                const nTime = new Date().getTime();
                ptData.forEach(e => {
                    const eT = new Date(e.created_at).getTime();
                    if(eT > (nTime - 24*60*60*1000)) polAct = true;
                });
                const bEl = document.getElementById('int-status-badge');
                if(bEl) {
                    bEl.innerHTML = polAct 
                        ? `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200 shadow-sm"><span class="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> Conectado</span>`
                        : `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200 shadow-sm"><span class="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse"></span> Aguardando dados</span>`;
                }
            } catch(e) {}
        }, 10000);
    }
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
    showToast('Configurações salvas. Recarregando...', 'success');
    setTimeout(() => location.reload(), 1000);
}

function publish() {
    window.BuilderApp.publish();
}

// Iniciar app
document.addEventListener('DOMContentLoaded', async () => {
    const session = await window.AuthManager?.requireAuth?.();
    if (!session) return;
    if (window.BuilderApp) window.BuilderApp.init();
    applyProfileToHeader();
    seedNotifications();
    updateNotificationBadge();
    if (!localStorage.getItem('SUPABASE_URL')) {
        showToast('Rodando em modo local. Configure o Supabase para dados em tempo real na nuvem.', 'success');
    }
    render();
});

// Global UI Systems

window.showToast = function(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if(!container) return;
    
    const toast = document.createElement('div');
    const isError = type === 'error';
    toast.className = `transform transition-all duration-300 ease-out translate-y-10 opacity-0 bg-white border-l-4 ${isError ? 'border-red-500' : 'border-[#10b981]'} p-4 rounded-xl shadow-lg flex items-center gap-3 w-80 pointer-events-auto`;
    
    toast.innerHTML = `
        <div class="h-8 w-8 rounded-full ${isError ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-[#10b981]'} flex items-center justify-center flex-shrink-0">
            <i class="ph ${isError ? 'ph-x' : 'ph-check-circle'} text-lg"></i>
        </div>
        <div class="flex-1">
            <p class="text-sm font-semibold text-gray-800">${isError ? 'Atenção' : 'Sucesso'}</p>
            <p class="text-xs text-gray-600">${message}</p>
        </div>
        <button class="text-gray-400 hover:text-gray-700" onclick="this.parentElement.remove()"><i class="ph ph-x"></i></button>
    `;
    
    container.appendChild(toast);
    
    requestAnimationFrame(() => {
        toast.classList.remove('translate-y-10', 'opacity-0');
        toast.classList.add('translate-y-0', 'opacity-100');
    });
    
    setTimeout(() => {
        toast.classList.remove('translate-y-0', 'opacity-100');
        toast.classList.add('translate-y-2', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// Profile Modal Actions
window.openProfileModal = function(tab) {
    document.getElementById('profile-dropdown').classList.add('hidden');
    document.getElementById('profile-modal').classList.remove('hidden');
    switchProfileTab(tab || 'profile');
}

window.closeProfileModal = function() {
    document.getElementById('profile-modal').classList.add('hidden');
}

window.switchProfileTab = function(tab) {
    // Reset active states
    ['profile', 'security', 'devices', 'notifications'].forEach(t => {
        const btn = document.getElementById(`ptab-${t}`);
        if(btn) {
            btn.className = 'w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors text-gray-600 hover:bg-gray-100 border border-transparent';
        }
    });

    // Set active state
    const activeBtn = document.getElementById(`ptab-${tab}`);
    if(activeBtn) {
        activeBtn.className = 'w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors bg-white shadow-sm border border-gray-200 text-[#10b981]';
    }

    const content = document.getElementById('profile-modal-content');
    const title = document.getElementById('profile-modal-title');

    if (tab === 'profile') {
        title.innerText = 'Perfil Geral';
        content.innerHTML = `
            <div class="space-y-6 fade-in">
                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-3">Foto de Perfil</label>
                    <div class="flex items-center gap-6">
                        <div class="h-20 w-20 rounded-full bg-gradient-to-br from-[#10b981] to-emerald-700 flex items-center justify-center text-white font-bold text-3xl shadow-inner">TS</div>
                        <div class="space-y-2">
                            <div class="flex gap-2">
                                <button class="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 flex items-center gap-2 transition"><i class="ph ph-upload-simple"></i> Fazer Upload</button>
                                <button class="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 flex items-center gap-2 transition"><i class="ph ph-trash"></i> Remover</button>
                            </div>
                            <p class="text-xs text-gray-500">JPG, GIF ou PNG. Tamanho máximo de 2MB.</p>
                        </div>
                    </div>
                </div>
                <div class="border-t border-gray-100 pt-6 space-y-4">
                    <div>
                        <label class="block text-sm font-bold text-gray-700 mb-1">Nome de Exibição</label>
                        <input type="text" value="Tiago Silva" class="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-[#10b981] focus:border-[#10b981] outline-none transition shadow-sm">
                    </div>
                    <div>
                        <label class="block text-sm font-bold text-gray-700 mb-1">Papel no Sistema</label>
                        <input type="text" value="Admin do Ecossistema" disabled class="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-gray-500 cursor-not-allowed">
                    </div>
                </div>
            </div>
        `;
    } else if (tab === 'security') {
        title.innerText = 'Segurança & Acesso';
        content.innerHTML = `
            <div class="space-y-6 fade-in">
                <div>
                    <h4 class="text-sm font-bold text-gray-700 mb-2">Atualizar E-mail</h4>
                    <div class="flex gap-3">
                        <input type="email" value="admin@gestor.com" class="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-[#10b981] focus:border-[#10b981] outline-none transition shadow-sm">
                        <button class="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition" onclick="showToast('Código de verificação enviado.', 'success')">Verificar</button>
                    </div>
                    <p class="text-xs text-gray-500 mt-2">Nós enviaremos um código de confirmação para o novo endereço.</p>
                </div>
                <div class="border-t border-gray-100 pt-6">
                    <h4 class="text-sm font-bold text-gray-700 mb-4">Alterar Senha</h4>
                    <div class="space-y-4">
                        <div>
                            <input type="password" placeholder="Senha Atual" class="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-[#10b981] focus:border-[#10b981] outline-none transition shadow-sm">
                        </div>
                        <div>
                            <input type="password" placeholder="Nova Senha" class="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-[#10b981] focus:border-[#10b981] outline-none transition shadow-sm">
                        </div>
                        <div>
                            <input type="password" placeholder="Confirmar Nova Senha" class="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-[#10b981] focus:border-[#10b981] outline-none transition shadow-sm">
                        </div>
                    </div>
                </div>
            </div>
        `;
    } else if (tab === 'devices') {
        title.innerText = 'Dispositivos Conectados';
        content.innerHTML = `
            <div class="space-y-4 fade-in">
                <p class="text-sm text-gray-600 mb-6">Aqui você pode visualizar e gerenciar todos os dispositivos que estão logados na sua conta.</p>
                
                <div class="border border-emerald-200 rounded-xl p-4 flex items-center justify-between bg-emerald-50/50 shadow-sm">
                    <div class="flex items-center gap-4">
                        <div class="h-10 w-10 bg-white rounded-lg border border-emerald-200 flex items-center justify-center text-[#10b981]"><i class="ph ph-laptop text-xl"></i></div>
                        <div>
                            <p class="text-sm font-bold text-gray-900">MacBook Pro (Este dispositivo)</p>
                            <p class="text-xs text-[#10b981] font-medium">São Paulo, Brasil • Ativo agora</p>
                        </div>
                    </div>
                </div>

                <div class="border border-gray-200 rounded-xl p-4 flex items-center justify-between bg-white shadow-sm hover:border-gray-300 transition-colors" id="device-iphone">
                    <div class="flex items-center gap-4">
                        <div class="h-10 w-10 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600"><i class="ph ph-device-mobile text-xl"></i></div>
                        <div>
                            <p class="text-sm font-bold text-gray-900">iPhone 14 Pro</p>
                            <p class="text-xs text-gray-500">São Paulo, Brasil • Visto há 2 horas</p>
                        </div>
                    </div>
                    <button class="text-sm font-medium text-red-600 hover:text-red-700 hover:underline px-3 py-1.5 rounded bg-red-50" onclick="showToast('Sessão do iPhone desconectada', 'success'); document.getElementById('device-iphone').remove()">Desconectar</button>
                </div>
                
                <div class="pt-4 text-center">
                    <button class="text-sm font-medium text-red-600 hover:text-red-700 hover:underline" onclick="showToast('Todas as outras sessões foram encerradas.', 'success'); document.getElementById('device-iphone')?.remove()">Desconectar todas as outras sessões</button>
                </div>
            </div>
        `;
    } else if (tab === 'notifications') {
        title.innerText = 'Configurações de Notificação';
        content.innerHTML = `
            <div class="space-y-6 fade-in">
                <p class="text-sm text-gray-600 mb-2">Controle como e onde você deseja receber alertas da plataforma.</p>
                
                <div class="space-y-4 border-t border-gray-100 pt-4">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-bold text-gray-800">Alertas de Vendas (Leads & Conversões)</p>
                            <p class="text-xs text-gray-500">Receba um alerta sempre que um novo funil converter.</p>
                        </div>
                        <label class="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" value="" class="sr-only peer" checked>
                          <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#10b981]"></div>
                        </label>
                    </div>

                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-bold text-gray-800">Saúde do Pixel e Integração</p>
                            <p class="text-xs text-gray-500">Avisos urgentes se o rastreio for interrompido.</p>
                        </div>
                        <label class="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" value="" class="sr-only peer" checked>
                          <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#10b981]"></div>
                        </label>
                    </div>

                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-bold text-gray-800">Sugestões de IA Contextual</p>
                            <p class="text-xs text-gray-500">Dicas semanais para otimizar suas campanhas.</p>
                        </div>
                        <label class="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" value="" class="sr-only peer">
                          <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#10b981]"></div>
                        </label>
                    </div>
                </div>
            </div>
        `;
    }
}

window.saveProfileSettings = function() {
    closeProfileModal();
    showToast('Alterações salvas com sucesso no banco de dados.', 'success');
}

// Overrides evoluidos: UI nativa, perfil persistente, notificacoes e layout.
function getDashboardWidgetOrder() {
    const allowed = ['visits', 'leads', 'conversion', 'completed'];
    const stored = readLocalJSON(DASHBOARD_LAYOUT_KEY, allowed);
    const clean = stored.filter(item => allowed.includes(item));
    allowed.forEach(item => {
        if (!clean.includes(item)) clean.push(item);
    });
    return clean;
}

window.moveDashboardWidget = function(index, direction) {
    const order = getDashboardWidgetOrder();
    const target = index + direction;
    if (target < 0 || target >= order.length) return;
    const temp = order[index];
    order[index] = order[target];
    order[target] = temp;
    writeLocalJSON(DASHBOARD_LAYOUT_KEY, order);
    renderDashboard();
};

window.resetDashboardLayout = function() {
    localStorage.removeItem(DASHBOARD_LAYOUT_KEY);
    renderDashboard();
};

function getNotifications() {
    return readLocalJSON(NOTIFICATIONS_KEY, []);
}

function saveNotifications(items) {
    writeLocalJSON(NOTIFICATIONS_KEY, items.slice(0, 30));
}

function pushNotification(notification) {
    const items = getNotifications();
    const exists = items.some(item => item.fingerprint === notification.fingerprint);
    if (exists) return;
    items.unshift({
        id: 'ntf_' + Math.random().toString(36).slice(2, 10),
        read: false,
        createdAt: new Date().toISOString(),
        ...notification
    });
    saveNotifications(items);
}

function seedNotifications() {
    if (getNotifications().length > 0) return;
    pushNotification({
        fingerprint: 'welcome-ai',
        type: 'ai',
        icon: 'ph-sparkle',
        title: 'IA Contextual pronta',
        message: 'O AI Studio pode analisar funis, pixel e copy antes de aplicar mudancas aprovadas.'
    });
    pushNotification({
        fingerprint: 'pixel-watch',
        type: 'pixel',
        icon: 'ph-broadcast',
        title: 'Monitor do Pixel ativo',
        message: 'A central atualiza o status do pixel por polling eficiente quando a aba de integracao esta aberta.'
    });
}

function hydrateNotificationsFromData(leads = [], events = [], conversion = 0, extraMessage = '') {
    if (extraMessage) {
        pushNotification({
            fingerprint: `ai-${Date.now()}`,
            type: 'ai',
            icon: 'ph-sparkle',
            title: 'Aprovacao pendente',
            message: extraMessage
        });
    }

    const latestLead = [...leads].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
    if (latestLead?.lead_id) {
        pushNotification({
            fingerprint: `lead-${latestLead.lead_id}`,
            type: 'sale',
            icon: 'ph-user-plus',
            title: 'Novo lead capturado',
            message: `${latestLead.name || latestLead.email || 'Lead anonimo'} entrou no funil.`
        });
    }

    const lastPixelEvent = [...events].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
    if (lastPixelEvent?.created_at) {
        const isOld = Date.now() - new Date(lastPixelEvent.created_at).getTime() > 60 * 60 * 1000;
        if (isOld) {
            pushNotification({
                fingerprint: `pixel-old-${new Date(lastPixelEvent.created_at).toDateString()}`,
                type: 'warning',
                icon: 'ph-warning-circle',
                title: 'Pixel sem eventos recentes',
                message: 'Nao recebemos eventos na ultima hora. Rode o diagnostico de integracao.'
            });
        }
    }

    if (Number(conversion) > 0 && Number(conversion) < 5) {
        pushNotification({
            fingerprint: `conversion-low-${new Date().toDateString()}`,
            type: 'ai',
            icon: 'ph-chart-line-down',
            title: 'Conversao abaixo do ideal',
            message: 'A IA recomenda revisar promessa, formulario e primeiro CTA.'
        });
    }
}

function notificationTone(type) {
    const tones = {
        sale: 'bg-emerald-100 text-emerald-600',
        warning: 'bg-yellow-100 text-yellow-700',
        pixel: 'bg-blue-100 text-blue-600',
        ai: 'bg-violet-100 text-violet-600'
    };
    return tones[type] || 'bg-gray-100 text-gray-600';
}

function updateNotificationBadge() {
    const unread = getNotifications().filter(item => !item.read).length;
    const count = document.getElementById('notif-count');
    const pulse = document.getElementById('notif-pulse');
    if (count) {
        count.textContent = unread > 9 ? '9+' : unread;
        count.classList.toggle('hidden', unread === 0);
    }
    if (pulse) pulse.classList.toggle('hidden', unread === 0);
}

window.renderNotificationDropdown = function() {
    const list = document.getElementById('notif-list');
    if (!list) return;
    const items = getNotifications();
    if (!items.length) {
        list.innerHTML = '<div class="p-6 text-center text-sm text-gray-400">Nenhuma notificacao por enquanto.</div>';
        updateNotificationBadge();
        return;
    }
    list.innerHTML = items.map(item => `
        <button onclick="openNotification('${item.id}')" class="w-full text-left p-4 hover:bg-gray-50 transition flex gap-3 ${item.read ? 'opacity-75' : ''}">
            <div class="mt-0.5 h-8 w-8 rounded-full ${notificationTone(item.type)} flex items-center justify-center flex-shrink-0">
                <i class="ph ${escapeHtml(item.icon || 'ph-bell')} text-lg"></i>
            </div>
            <div class="min-w-0">
                <p class="text-sm font-semibold text-gray-800 leading-tight mb-1">${escapeHtml(item.title)}</p>
                <p class="text-xs text-gray-600">${escapeHtml(item.message)}</p>
                <p class="text-[10px] text-gray-400 mt-1 font-medium">${relativeTime(item.createdAt)}</p>
            </div>
        </button>
    `).join('');
    updateNotificationBadge();
};

window.openNotification = function(id) {
    const items = getNotifications();
    const item = items.find(notification => notification.id === id);
    if (!item) return;
    item.read = true;
    saveNotifications(items);
    renderNotificationDropdown();
    if (item.type === 'pixel') navigate('integrate');
    if (item.type === 'ai') navigate('ai');
};

window.markNotificationsRead = function(event) {
    if (event) event.stopPropagation();
    saveNotifications(getNotifications().map(item => ({ ...item, read: true })));
    renderNotificationDropdown();
    showToast('Notificacoes marcadas como lidas.', 'success');
};

window.showToast = function(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if(!container) return;
    const toast = document.createElement('div');
    const isError = type === 'error';
    toast.className = `transform transition-all duration-300 ease-out translate-y-10 opacity-0 bg-white border-l-4 ${isError ? 'border-red-500' : 'border-[#10b981]'} p-4 rounded-xl shadow-lg flex items-center gap-3 w-80 pointer-events-auto`;
    toast.innerHTML = `
        <div class="h-8 w-8 rounded-full ${isError ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-[#10b981]'} flex items-center justify-center flex-shrink-0">
            <i class="ph ${isError ? 'ph-x' : 'ph-check-circle'} text-lg"></i>
        </div>
        <div class="flex-1">
            <p class="text-sm font-semibold text-gray-800">${isError ? 'Atencao' : 'Sucesso'}</p>
            <p class="text-xs text-gray-600">${escapeHtml(message)}</p>
        </div>
        <button class="text-gray-400 hover:text-gray-700" onclick="this.parentElement.remove()"><i class="ph ph-x"></i></button>
    `;
    container.appendChild(toast);
    requestAnimationFrame(() => {
        toast.classList.remove('translate-y-10', 'opacity-0');
        toast.classList.add('translate-y-0', 'opacity-100');
    });
    setTimeout(() => {
        toast.classList.remove('translate-y-0', 'opacity-100');
        toast.classList.add('translate-y-2', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
};

window.openConfirmDialog = function({ title, message, confirmText = 'Confirmar', cancelText = 'Cancelar', tone = 'danger', onConfirm }) {
    const modal = document.getElementById('confirm-modal');
    if (!modal) return;
    const accept = document.getElementById('confirm-accept');
    const cancel = document.getElementById('confirm-cancel');
    document.getElementById('confirm-title').textContent = title || 'Confirmar acao';
    document.getElementById('confirm-message').textContent = message || 'Revise antes de continuar.';
    accept.textContent = confirmText;
    cancel.textContent = cancelText;
    accept.className = `px-4 py-2 text-white rounded-lg text-sm font-semibold transition ${tone === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-[#10b981] hover:bg-[#059669]'}`;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.body.classList.add('modal-open');

    const close = () => {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        document.body.classList.remove('modal-open');
        accept.onclick = null;
        cancel.onclick = null;
    };
    cancel.onclick = close;
    accept.onclick = async () => {
        accept.disabled = true;
        try {
            if (onConfirm) await onConfirm();
        } finally {
            accept.disabled = false;
            close();
        }
    };
};

function applyAvatarBackground(element, profile) {
    if (!element) return;
    element.textContent = '';
    element.style.backgroundImage = '';
    element.style.backgroundSize = '';
    element.style.backgroundPosition = '';
    if (profile.avatarData) {
        element.style.backgroundImage = `url(${profile.avatarData})`;
        element.style.backgroundSize = `${profile.avatarZoom || 100}%`;
        element.style.backgroundPosition = `${profile.avatarX || 50}% ${profile.avatarY || 50}%`;
        element.classList.add('profile-avatar-preview');
    } else {
        element.textContent = getInitials(profile.displayName);
    }
}

function applyProfileToHeader() {
    const profile = window.AuthManager?.getProfile?.() || {};
    applyAvatarBackground(document.getElementById('header-avatar'), profile);
    applyAvatarBackground(document.getElementById('profile-menu-avatar'), profile);
    const name = document.getElementById('profile-menu-name');
    const role = document.getElementById('profile-menu-role');
    if (name) name.textContent = profile.displayName || 'Usuario';
    if (role) role.textContent = profile.role || 'Admin do Ecossistema';
}

window.openProfileModal = function(tab) {
    document.getElementById('profile-dropdown')?.classList.add('hidden');
    document.getElementById('profile-modal')?.classList.remove('hidden');
    document.body.classList.add('modal-open');
    switchProfileTab(tab || 'profile');
};

window.closeProfileModal = function() {
    document.getElementById('profile-modal')?.classList.add('hidden');
    document.body.classList.remove('modal-open');
};

window.switchProfileTab = function(tab) {
    activeProfileTab = tab;
    ['profile', 'security', 'devices', 'notifications'].forEach(t => {
        const btn = document.getElementById(`ptab-${t}`);
        if(btn) {
            btn.className = 'w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors text-gray-600 hover:bg-gray-100 border border-transparent';
        }
    });
    const activeBtn = document.getElementById(`ptab-${tab}`);
    if(activeBtn) {
        activeBtn.className = 'w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors bg-white shadow-sm border border-gray-200 text-[#10b981]';
    }

    const content = document.getElementById('profile-modal-content');
    const title = document.getElementById('profile-modal-title');
    const profile = window.AuthManager.getProfile();
    if (!content || !title) return;

    if (tab === 'profile') {
        title.textContent = 'Perfil Geral';
        content.innerHTML = `
            <div class="space-y-6 fade-in">
                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-3">Foto de Perfil</label>
                    <div class="flex flex-col sm:flex-row sm:items-center gap-6">
                        <div id="profile-avatar-preview" class="h-24 w-24 rounded-full bg-gradient-to-br from-[#10b981] to-emerald-700 flex items-center justify-center text-white font-bold text-3xl shadow-inner overflow-hidden">${escapeHtml(getInitials(profile.displayName))}</div>
                        <div class="space-y-3 flex-1">
                            <div class="flex flex-wrap gap-2">
                                <label class="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 flex items-center gap-2 transition cursor-pointer">
                                    <i class="ph ph-upload-simple"></i> Fazer Upload
                                    <input id="profile-photo-input" type="file" accept="image/*" class="hidden" onchange="handleProfileImageUpload(event)">
                                </label>
                                <button onclick="removeProfileImage()" class="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 flex items-center gap-2 transition"><i class="ph ph-trash"></i> Remover</button>
                            </div>
                            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <label class="text-xs font-semibold text-gray-500">Zoom <input id="avatar-zoom" type="range" min="80" max="180" value="${profile.avatarZoom || 100}" oninput="previewAvatarCrop()" class="w-full"></label>
                                <label class="text-xs font-semibold text-gray-500">Horizontal <input id="avatar-x" type="range" min="0" max="100" value="${profile.avatarX || 50}" oninput="previewAvatarCrop()" class="w-full"></label>
                                <label class="text-xs font-semibold text-gray-500">Vertical <input id="avatar-y" type="range" min="0" max="100" value="${profile.avatarY || 50}" oninput="previewAvatarCrop()" class="w-full"></label>
                            </div>
                            <p class="text-xs text-gray-500">Upload com pre-visualizacao e corte visual salvo no perfil.</p>
                        </div>
                    </div>
                </div>
                <div class="border-t border-gray-100 pt-6 space-y-4">
                    <div>
                        <label class="block text-sm font-bold text-gray-700 mb-1">Nome de Exibição</label>
                        <input id="profile-display-name" type="text" value="${escapeHtml(profile.displayName)}" class="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-[#10b981] focus:border-[#10b981] outline-none transition shadow-sm">
                    </div>
                    <div>
                        <label class="block text-sm font-bold text-gray-700 mb-1">Papel no Sistema</label>
                        <input type="text" value="${escapeHtml(profile.role)}" disabled class="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-gray-500 cursor-not-allowed">
                    </div>
                </div>
            </div>
        `;
        applyAvatarBackground(document.getElementById('profile-avatar-preview'), profile);
    } else if (tab === 'security') {
        title.textContent = 'Segurança & Acesso';
        content.innerHTML = `
            <div class="space-y-6 fade-in">
                <div>
                    <h4 class="text-sm font-bold text-gray-700 mb-2">Atualizar E-mail</h4>
                    <div class="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3">
                        <input id="profile-email" type="email" value="${escapeHtml(profile.email)}" class="border border-gray-200 rounded-lg px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-[#10b981] focus:border-[#10b981] outline-none transition shadow-sm">
                        <button onclick="sendProfileEmailCode()" class="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition">Enviar codigo</button>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 mt-3">
                        <input id="profile-email-code" type="text" inputmode="numeric" placeholder="Codigo recebido" class="border border-gray-200 rounded-lg px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-[#10b981] focus:border-[#10b981] outline-none transition shadow-sm">
                        <button onclick="confirmProfileEmailCode()" class="px-4 py-2.5 bg-[#10b981] hover:bg-[#059669] text-white rounded-lg text-sm font-medium transition">Confirmar e-mail</button>
                    </div>
                    <p id="profile-email-help" class="text-xs text-gray-500 mt-2">Enviaremos um codigo de confirmacao para o novo endereco.</p>
                </div>
                <div class="border-t border-gray-100 pt-6">
                    <h4 class="text-sm font-bold text-gray-700 mb-4">Alterar Senha</h4>
                    <div class="space-y-4">
                        <input id="current-password" type="password" placeholder="Senha Atual" class="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-[#10b981] focus:border-[#10b981] outline-none transition shadow-sm">
                        <input id="new-password" type="password" placeholder="Nova Senha" class="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-[#10b981] focus:border-[#10b981] outline-none transition shadow-sm">
                        <input id="confirm-password" type="password" placeholder="Confirmar Nova Senha" class="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-[#10b981] focus:border-[#10b981] outline-none transition shadow-sm">
                    </div>
                    <p class="text-xs text-gray-500 mt-2">Use 8+ caracteres com letra maiuscula e numero.</p>
                </div>
            </div>
        `;
    } else if (tab === 'devices') {
        title.textContent = 'Dispositivos Conectados';
        const devices = window.AuthManager.getDevices();
        content.innerHTML = `
            <div class="space-y-4 fade-in">
                <p class="text-sm text-gray-600 mb-6">Gerencie sessoes ativas por dispositivo, localizacao e ultimo acesso.</p>
                ${devices.map(device => `
                    <div class="border ${device.current ? 'border-emerald-200 bg-emerald-50/50' : 'border-gray-200 bg-white'} rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                        <div class="flex items-center gap-4">
                            <div class="h-10 w-10 bg-white rounded-lg border border-gray-200 flex items-center justify-center ${device.current ? 'text-[#10b981]' : 'text-gray-600'}"><i class="ph ${device.type === 'mobile' ? 'ph-device-mobile' : 'ph-laptop'} text-xl"></i></div>
                            <div>
                                <p class="text-sm font-bold text-gray-900">${escapeHtml(device.name)} ${device.current ? '(Este dispositivo)' : ''}</p>
                                <p class="text-xs ${device.current ? 'text-[#10b981]' : 'text-gray-500'} font-medium">${escapeHtml(device.location)} • ${device.current ? 'Ativo agora' : relativeTime(device.lastAccess)}</p>
                            </div>
                        </div>
                        ${device.current ? '' : `<button onclick="disconnectProfileDevice('${device.id}')" class="text-sm font-medium text-red-600 hover:text-red-700 px-3 py-1.5 rounded bg-red-50">Desconectar</button>`}
                    </div>
                `).join('') || '<div class="text-sm text-gray-400 text-center py-6">Nenhum dispositivo ativo.</div>'}
                <div class="pt-4 text-center">
                    <button onclick="disconnectOtherProfileDevices()" class="text-sm font-medium text-red-600 hover:text-red-700 hover:underline">Desconectar todas as outras sessoes</button>
                </div>
            </div>
        `;
    } else if (tab === 'notifications') {
        title.textContent = 'Configurações de Notificação';
        const prefs = window.AuthManager.getNotificationPrefs();
        content.innerHTML = `
            <div class="space-y-6 fade-in">
                <p class="text-sm text-gray-600 mb-2">Controle tipos de alerta e canais de entrega.</p>
                ${[
                    ['sales', 'Alertas de Vendas e Leads', 'Receba um alerta sempre que um novo funil converter.'],
                    ['pixel', 'Saúde do Pixel e Integração', 'Avisos urgentes se o rastreio for interrompido.'],
                    ['ai', 'Sugestões de IA Contextual', 'Dicas e propostas para otimizar campanhas.']
                ].map(([key, label, desc]) => `
                    <div class="flex items-center justify-between border-t border-gray-100 pt-4">
                        <div>
                            <p class="text-sm font-bold text-gray-800">${label}</p>
                            <p class="text-xs text-gray-500">${desc}</p>
                        </div>
                        <label class="relative inline-flex items-center cursor-pointer">
                          <input id="notif-${key}" type="checkbox" class="sr-only peer" ${prefs[key] ? 'checked' : ''}>
                          <div class="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#10b981]"></div>
                        </label>
                    </div>
                `).join('')}
                <div class="border-t border-gray-100 pt-4">
                    <p class="text-sm font-bold text-gray-800 mb-3">Canais</p>
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        ${[
                            ['central', 'Central interna'],
                            ['email', 'E-mail'],
                            ['push', 'Push']
                        ].map(([key, label]) => `
                            <label class="flex items-center gap-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg px-3 py-2">
                                <input id="channel-${key}" type="checkbox" ${prefs.channels[key] ? 'checked' : ''} class="rounded text-[#10b981]">
                                ${label}
                            </label>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }
};

window.handleProfileImageUpload = function(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
        showToast('Envie um arquivo de imagem valido.', 'error');
        return;
    }
    if (file.size > 2 * 1024 * 1024) {
        showToast('A imagem precisa ter ate 2MB.', 'error');
        return;
    }
    const reader = new FileReader();
    reader.onload = () => {
        const profile = window.AuthManager.saveProfile({ avatarData: reader.result });
        applyAvatarBackground(document.getElementById('profile-avatar-preview'), profile);
        previewAvatarCrop();
    };
    reader.readAsDataURL(file);
};

window.previewAvatarCrop = function() {
    const preview = document.getElementById('profile-avatar-preview');
    if (!preview) return;
    const profile = window.AuthManager.getProfile();
    const zoom = Number(document.getElementById('avatar-zoom')?.value || profile.avatarZoom || 100);
    const x = Number(document.getElementById('avatar-x')?.value || profile.avatarX || 50);
    const y = Number(document.getElementById('avatar-y')?.value || profile.avatarY || 50);
    const next = window.AuthManager.saveProfile({ avatarZoom: zoom, avatarX: x, avatarY: y });
    applyAvatarBackground(preview, next);
};

window.removeProfileImage = function() {
    const profile = window.AuthManager.saveProfile({ avatarData: '', avatarZoom: 100, avatarX: 50, avatarY: 50 });
    applyAvatarBackground(document.getElementById('profile-avatar-preview'), profile);
};

window.sendProfileEmailCode = function() {
    const email = document.getElementById('profile-email')?.value;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '')) {
        showToast('Informe um e-mail valido.', 'error');
        return;
    }
    const code = window.AuthManager.startEmailUpdate(email);
    const help = document.getElementById('profile-email-help');
    if (help) help.textContent = `Modo demo: codigo ${code}. Em Supabase Auth, confirme pelo e-mail enviado.`;
    showToast('Codigo de confirmacao enviado.', 'success');
};

window.confirmProfileEmailCode = async function() {
    try {
        const email = await window.AuthManager.confirmEmailUpdate(document.getElementById('profile-email-code')?.value.trim());
        showToast(`E-mail atualizado para ${email}.`, 'success');
        applyProfileToHeader();
    } catch(error) {
        showToast(error.message || 'Nao foi possivel confirmar o e-mail.', 'error');
    }
};

window.disconnectProfileDevice = function(deviceId) {
    window.AuthManager.disconnectDevice(deviceId);
    switchProfileTab('devices');
    showToast('Sessao desconectada.', 'success');
};

window.disconnectOtherProfileDevices = function() {
    window.AuthManager.disconnectOtherDevices();
    switchProfileTab('devices');
    showToast('Outras sessoes encerradas.', 'success');
};

window.saveProfileSettings = async function() {
    try {
        if (activeProfileTab === 'profile') {
            const displayName = document.getElementById('profile-display-name')?.value.trim();
            if (!displayName || displayName.length < 3) {
                showToast('Use um nome com pelo menos 3 caracteres.', 'error');
                return;
            }
            window.AuthManager.saveProfile({ displayName });
            applyProfileToHeader();
        }

        if (activeProfileTab === 'security') {
            const currentPassword = document.getElementById('current-password')?.value || '';
            const newPassword = document.getElementById('new-password')?.value || '';
            const confirmPassword = document.getElementById('confirm-password')?.value || '';
            if (newPassword || confirmPassword || currentPassword) {
                if (newPassword !== confirmPassword) throw new Error('A confirmacao de senha nao confere.');
                if (!window.AuthManager.validatePassword(newPassword)) throw new Error('A nova senha precisa ter 8 caracteres, uma maiuscula e um numero.');
                await window.AuthManager.updatePassword(currentPassword, newPassword);
            }
        }

        if (activeProfileTab === 'notifications') {
            window.AuthManager.saveNotificationPrefs({
                sales: document.getElementById('notif-sales')?.checked,
                pixel: document.getElementById('notif-pixel')?.checked,
                ai: document.getElementById('notif-ai')?.checked,
                channels: {
                    central: document.getElementById('channel-central')?.checked,
                    email: document.getElementById('channel-email')?.checked,
                    push: document.getElementById('channel-push')?.checked
                }
            });
        }

        closeProfileModal();
        showToast('Alteracoes salvas com sucesso.', 'success');
    } catch(error) {
        showToast(error.message || 'Nao foi possivel salvar.', 'error');
    }
};
