(() => {
  const HEARTBEAT_MS = 30000;
  const POLL_MS = 8000;
  const LOCAL_KEY = 'gestor_quiz_pixels';
  const SELECTED_KEY = 'gestor_selected_pixel_id';
  let pixels = [];
  let diagnostics = {};
  let pollTimer = null;

  const $ = (id) => document.getElementById(id);
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[char]));
  const baseUrl = () => window.location.origin && window.location.origin !== 'null'
    ? window.location.origin
    : 'https://gestordedados.vercel.app';

  async function api(path, options = {}) {
    const response = await fetch(`${baseUrl()}${path}`, {
      ...options,
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...(options.headers || {}) }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || `HTTP ${response.status}`);
    return data;
  }

  function localPixels(next) {
    if (next) localStorage.setItem(LOCAL_KEY, JSON.stringify(next));
    try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]') || []; } catch (error) { return []; }
  }

  function randomId(prefix, size = 12) {
    return `${prefix}_${Math.random().toString(36).slice(2, 2 + size)}${Date.now().toString(36).slice(-4)}`;
  }

  function statusOf(pixel) {
    if (!pixel) return 'none';
    if (pixel.status === 'erro_dominio') return 'erro_dominio';
    if (!pixel.last_event_at && !pixel.last_heartbeat_at) return 'aguardando_instalacao';
    if (!pixel.last_heartbeat_at) return 'offline';
    const age = Date.now() - new Date(pixel.last_heartbeat_at).getTime();
    if (!Number.isFinite(age)) return 'offline';
    if (age <= 60000) return 'conectado';
    if (age <= 180000) return 'instavel';
    return 'offline';
  }

  function statusText(status) {
    return {
      none: 'Nenhum quiz selecionado',
      conectado: 'Pixel conectado',
      instavel: 'Instavel',
      offline: 'Pixel offline',
      aguardando_instalacao: 'Aguardando instalacao',
      erro_dominio: 'Erro de dominio'
    }[status] || 'Aguardando instalacao';
  }

  function tone(status) {
    return {
      conectado: ['bg-green-100 text-green-800 border-green-200', 'bg-green-500'],
      instavel: ['bg-yellow-100 text-yellow-800 border-yellow-200', 'bg-yellow-500'],
      aguardando_instalacao: ['bg-yellow-100 text-yellow-800 border-yellow-200', 'bg-yellow-500'],
      offline: ['bg-red-100 text-red-800 border-red-200', 'bg-red-500'],
      erro_dominio: ['bg-red-100 text-red-800 border-red-200', 'bg-red-500'],
      none: ['bg-gray-100 text-gray-700 border-gray-200', 'bg-gray-400']
    }[status] || ['bg-gray-100 text-gray-700 border-gray-200', 'bg-gray-400'];
  }

  function normalize(pixel) {
    const status = statusOf(pixel);
    return { ...pixel, status, status_label: statusText(status), events_today: Number(pixel.events_today || 0), leads_today: Number(pixel.leads_today || 0) };
  }

  function selectedPixel() {
    const selected = localStorage.getItem(SELECTED_KEY);
    return pixels.find((pixel) => pixel.pixel_id === selected) || pixels[0] || null;
  }

  function badge(pixel) {
    const status = statusOf(pixel);
    const [classes, dot] = tone(status);
    return `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${classes}">
      <span class="w-1.5 h-1.5 rounded-full ${dot} ${status === 'conectado' ? 'animate-pulse' : ''}"></span>${statusText(status)}
    </span>`;
  }

  function installCode(pixel) {
    return `<script 
  async
  src="${baseUrl()}/pixel.js"
  data-funnel-id="${pixel.pixel_id}"
  data-public-key="${pixel.public_key}"
  data-endpoint="${baseUrl()}/api/track"
  data-heartbeat-interval="${HEARTBEAT_MS}">
</script>`;
  }

  function toast(message, type = 'success') {
    if (window.showToast) return window.showToast(message, type);
    const box = $('integration-feedback-container');
    if (!box) return;
    box.innerHTML = `<div class="p-3 rounded-lg border text-sm font-medium bg-white ${type === 'error' ? 'border-red-200 text-red-700' : 'border-green-200 text-green-700'}">${esc(message)}</div>`;
    setTimeout(() => { if (box) box.innerHTML = ''; }, 4200);
  }

  async function loadPixels() {
    try {
      const data = await api('/api/pixel/list');
      pixels = (data.pixels || []).map(normalize);
      diagnostics = data.diagnostics || {};
      localPixels(pixels);
    } catch (error) {
      pixels = localPixels().map(normalize);
      diagnostics = { database: { ok: false, label: 'API indisponivel' } };
    }
    const selected = selectedPixel();
    if (selected) localStorage.setItem(SELECTED_KEY, selected.pixel_id);
  }

  function floating(pixel) {
    const target = $('pixel-floating-status');
    if (!target) return;
    const status = statusOf(pixel);
    const [classes, dot] = tone(status);
    target.className = `fixed top-20 right-4 z-[80] hidden lg:flex items-center gap-2 px-3 py-2 rounded-xl border shadow-sm bg-white ${classes}`;
    target.innerHTML = `<span class="w-2 h-2 rounded-full ${dot} ${status === 'conectado' ? 'animate-pulse' : ''}"></span><span class="text-xs font-bold">${statusText(status)}</span>`;
  }

  async function refresh(renderAfter = false) {
    const pixel = selectedPixel();
    if (!pixel) return floating(null);
    try {
      const data = await api(`/api/pixel/status?pixel_id=${encodeURIComponent(pixel.pixel_id)}&public_key=${encodeURIComponent(pixel.public_key)}`);
      if (data.pixel) pixels = pixels.map((item) => item.pixel_id === pixel.pixel_id ? normalize(data.pixel) : item);
      diagnostics = data.diagnostics || {};
      localPixels(pixels);
    } catch (error) {
      pixels = pixels.map((item) => item.pixel_id === pixel.pixel_id ? normalize(item) : item);
      diagnostics = { database: { ok: false, label: 'API indisponivel' } };
    }
    floating(selectedPixel());
    if (renderAfter) renderPixelsPage();
  }

  function rows(selected) {
    if (!pixels.length) return `<tr><td colspan="8" class="px-4 py-10 text-center text-sm text-gray-400">Nenhum pixel criado ainda. Crie um Pixel para cada quiz integrado.</td></tr>`;
    return pixels.map((pixel) => {
      const active = selected?.pixel_id === pixel.pixel_id ? 'bg-emerald-50/60' : 'hover:bg-gray-50';
      return `<tr class="${active} cursor-pointer" onclick="selectPixel('${esc(pixel.pixel_id)}')">
        <td class="px-4 py-3"><p class="text-sm font-bold text-gray-900">${esc(pixel.quiz_name || 'Quiz sem nome')}</p><p class="text-[11px] text-gray-400">${esc(pixel.quiz_id)}</p></td>
        <td class="px-4 py-3 font-mono text-xs text-gray-700">${esc(pixel.pixel_id)}</td>
        <td class="px-4 py-3 text-xs text-gray-600 max-w-[220px] truncate" title="${esc(pixel.integrated_url || '')}">${esc(pixel.integrated_url || 'Nao definida')}</td>
        <td class="px-4 py-3">${badge(pixel)}</td>
        <td class="px-4 py-3 text-xs text-gray-600">${esc(pixel.last_event_name || 'Nenhum')}</td>
        <td class="px-4 py-3 text-sm font-semibold">${pixel.events_today}</td>
        <td class="px-4 py-3 text-sm font-semibold">${pixel.leads_today}</td>
        <td class="px-4 py-3" onclick="event.stopPropagation()"><div class="flex flex-wrap gap-1.5 justify-end">
          ${iconButton('ph-copy', 'Copiar codigo', `copyPixelCode('${esc(pixel.pixel_id)}')`)}
          ${iconButton('ph-flask', 'Testar', `testPixel('${esc(pixel.pixel_id)}')`)}
          ${iconButton('ph-pulse', 'Diagnostico', `runPixelDiagnostic('${esc(pixel.pixel_id)}')`)}
          ${iconButton('ph-pencil-simple', 'Editar', `openPixelEdit('${esc(pixel.pixel_id)}')`)}
          ${iconButton('ph-trash', 'Excluir', `deletePixel('${esc(pixel.pixel_id)}')`, 'text-red-500 border-red-100 hover:bg-red-50')}
        </div></td>
      </tr>`;
    }).join('');
  }

  function iconButton(icon, title, action, extra = 'text-gray-600 border-gray-200 hover:bg-gray-50') {
    return `<button title="${title}" onclick="${action}" class="h-8 w-8 rounded-lg border bg-white ${extra}"><i class="ph ${icon}"></i></button>`;
  }

  function selectedPanel(pixel) {
    if (!pixel) return `<section class="glass-panel p-6 rounded-2xl lg:col-span-3 text-center"><div class="py-10"><div class="h-12 w-12 rounded-xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-3"><i class="ph ph-selection text-2xl"></i></div><h3 class="font-bold text-gray-900">Nenhum quiz selecionado</h3><p class="text-sm text-gray-500 mt-1">Crie um novo Pixel para gerar o codigo individual.</p></div></section>`;
    const dbOk = diagnostics.database?.ok !== false;
    const dbText = diagnostics.database?.label || (pixel.persisted === false ? 'Aguardando dados' : 'OK');
    const domainOk = diagnostics.domain?.ok !== false && pixel.status !== 'erro_dominio';
    const domainText = diagnostics.domain?.label || (domainOk ? (pixel.domain ? 'OK' : 'Aguardando dominio') : 'Erro dominio');
    return `<section class="glass-panel p-6 rounded-2xl lg:col-span-3">
      <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-5">
        <div><p class="text-xs font-bold uppercase tracking-widest text-emerald-600">Quiz selecionado</p><h3 class="text-xl font-bold text-gray-900 mt-1">${esc(pixel.quiz_name || 'Quiz sem nome')}</h3><p class="text-xs text-gray-500 mt-1 font-mono">${esc(pixel.pixel_id)} · ${esc(pixel.public_key)}</p></div>
        <div class="flex flex-wrap gap-2">
          <button onclick="copyPixelCode('${esc(pixel.pixel_id)}')" class="px-3 py-2 bg-gray-900 text-white rounded-lg text-xs font-semibold flex items-center gap-2"><i class="ph ph-copy"></i> Copiar codigo</button>
          <button onclick="regeneratePixelKey('${esc(pixel.pixel_id)}')" class="px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-xs font-semibold flex items-center gap-2"><i class="ph ph-key"></i> Gerar nova chave</button>
          <button onclick="testPixel('${esc(pixel.pixel_id)}')" class="px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-xs font-semibold flex items-center gap-2"><i class="ph ph-flask"></i> Testar</button>
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-4 gap-3 mb-5">
        ${metric('Status', badge(pixel))}
        ${metric('Ultimo evento', esc(pixel.last_event_name || 'Nenhum'))}
        ${metric('Ultimo heartbeat', pixel.last_heartbeat_at ? new Date(pixel.last_heartbeat_at).toLocaleTimeString() : 'Sem heartbeat')}
        ${metric('Dominio autorizado', esc(pixel.domain || 'Livre'))}
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5">
        <div><h4 class="font-bold text-gray-800">Codigo de instalacao individual</h4><p class="text-xs text-gray-500 mb-2">Cole antes de <code>&lt;/body&gt;</code> no HTML deste quiz.</p>
          <textarea id="install-code" readonly class="w-full min-h-[150px] bg-gray-900 text-brand-100 text-sm font-mono rounded-xl p-4 outline-none border border-gray-800 resize-y">${esc(installCode(pixel))}</textarea>
          <div class="text-sm text-yellow-800 mt-3 bg-yellow-50 p-4 rounded-lg border border-yellow-200 font-medium"><strong class="text-red-700">Aviso critico:</strong> cada quiz deve usar seu proprio Pixel ID. Se gerar nova chave, substitua o codigo antigo.</div>
        </div>
        <div class="bg-gray-50 border border-gray-100 rounded-xl p-4 text-xs text-gray-600 h-fit">
          <strong class="text-gray-900 block mb-2">Diagnostico rapido</strong>
          ${diag('Pixel Script', 'diag-px', 'Aguardando', true)}
          ${diag('Endpoint API', 'diag-api', 'Aguardando', true)}
          ${diag('Banco/Supabase', 'diag-db', esc(dbText), dbOk)}
          ${diag('Dominio', 'diag-domain', esc(domainText), domainOk)}
          <p class="text-[11px] text-gray-400 mt-3">Conectado ate 60s, instavel ate 180s, offline depois disso.</p>
        </div>
      </div>
    </section>`;
  }

  function metric(label, value) {
    return `<div class="bg-white border border-gray-100 rounded-xl p-4"><p class="text-xs text-gray-500">${label}</p><div class="text-sm font-bold text-gray-900 mt-2 truncate">${value}</div></div>`;
  }

  function diag(label, id, value, ok) {
    return `<div class="flex justify-between py-1"><span>${label}:</span><span id="${id}" class="${ok ? 'text-green-600' : 'text-red-600'} font-medium">${value}</span></div>`;
  }

  function renderPixelsPage() {
    const root = $('app-content');
    if (!root) return;
    const selected = selectedPixel();
    root.innerHTML = `<div id="pixel-manager-root" class="fade-in max-w-7xl mx-auto space-y-6 pb-10">
      <div id="pixel-floating-status"></div>
      <div class="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div><h2 class="text-3xl font-bold text-gray-900 mb-2">Integracao Universal</h2><p class="text-gray-500 max-w-2xl">Gerencie Pixels individuais por quiz, copie codigos e acompanhe status em tempo real.</p></div>
        <button onclick="openPixelModal()" class="px-4 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-bold shadow-sm hover:bg-brand-700 transition flex items-center gap-2 w-fit"><i class="ph ph-plus"></i> Novo Pixel / Novo Quiz</button>
      </div>
      <section class="glass-panel rounded-2xl overflow-hidden"><div class="px-5 py-4 border-b border-gray-100 flex justify-between gap-2"><div><h3 class="font-bold text-gray-900">Pixels dos Quizzes</h3><p class="text-xs text-gray-500">Um Pixel ID unico para cada quiz integrado.</p></div><span class="text-xs font-semibold text-gray-500">${pixels.length} pixel${pixels.length === 1 ? '' : 's'}</span></div>
        <div class="overflow-x-auto"><table class="w-full min-w-[980px] text-left"><thead class="bg-gray-50 border-b border-gray-100"><tr class="text-[11px] uppercase tracking-wider text-gray-500"><th class="px-4 py-3">Nome do quiz</th><th class="px-4 py-3">Pixel ID</th><th class="px-4 py-3">URL integrada</th><th class="px-4 py-3">Status</th><th class="px-4 py-3">Ultimo evento</th><th class="px-4 py-3">Eventos hoje</th><th class="px-4 py-3">Leads hoje</th><th class="px-4 py-3 text-right">Acoes</th></tr></thead><tbody class="divide-y divide-gray-100">${rows(selected)}</tbody></table></div>
      </section>
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">${selectedPanel(selected)}</div>
      <section class="glass-panel p-6 rounded-2xl"><h3 class="font-bold text-gray-800 mb-3">Eventos automaticos do Pixel Universal</h3><div class="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-gray-600">${['page_view','pixel_heartbeat','button_click / answer_click','lead_created','checkout_click','quiz_completed'].map((event) => `<div class="bg-white border border-gray-100 rounded-xl p-4"><code>${event}</code></div>`).join('')}</div></section>
      <div id="integration-feedback-container" class="fixed bottom-5 right-5 z-[210] w-80"></div>${modal('create')}${modal('edit', selected)}
    </div>`;
    floating(selected);
  }

  function modal(kind, pixel = {}) {
    const create = kind === 'create';
    return `<div id="pixel-${kind}-modal" class="hidden fixed inset-0 bg-black/40 z-[200] items-center justify-center px-4 backdrop-blur-sm"><div class="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-lg w-full overflow-hidden fade-in">
      <div class="px-6 py-4 border-b border-gray-100 flex justify-between items-center"><h3 class="font-bold text-gray-900">${create ? 'Novo Pixel / Novo Quiz' : 'Editar Pixel'}</h3><button onclick="${create ? 'closePixelModal' : 'closeEditModal'}()" class="text-gray-400 hover:text-gray-700"><i class="ph ph-x"></i></button></div>
      <div class="p-6 space-y-4">
        ${input(`pixel-${create ? 'form' : 'edit'}-name`, 'Nome do quiz', pixel?.quiz_name || '', 'Ex: Quiz Bolis Gourmet')}
        ${input(`pixel-${create ? 'form' : 'edit'}-url`, 'URL integrada', pixel?.integrated_url || '', 'https://meuquiz.com', 'url')}
        ${input(`pixel-${create ? 'form' : 'edit'}-domain`, 'Dominio autorizado', pixel?.domain || '', 'meuquiz.com')}
      </div>
      <div class="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-2"><button onclick="${create ? 'closePixelModal' : 'closeEditModal'}()" class="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-600">Cancelar</button><button onclick="${create ? 'createPixelFromForm' : 'savePixelEdit'}()" class="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-bold">${create ? 'Criar Pixel' : 'Salvar'}</button></div>
    </div></div>`;
  }

  function input(id, label, value, placeholder, type = 'text') {
    return `<label class="block text-sm font-semibold text-gray-700">${label}<input id="${id}" type="${type}" value="${esc(value)}" class="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-100 focus:border-brand-500" placeholder="${placeholder}"></label>`;
  }

  async function createPixelFromForm() {
    const payload = {
      quiz_name: $('pixel-form-name')?.value.trim() || 'Novo Quiz',
      integrated_url: $('pixel-form-url')?.value.trim() || '',
      domain: $('pixel-form-domain')?.value.trim() || ''
    };
    try {
      const data = await api('/api/pixel/create', { method: 'POST', body: JSON.stringify(payload) });
      const pixel = normalize({ ...data.pixel, persisted: data.persisted });
      pixels = [pixel, ...pixels.filter((item) => item.pixel_id !== pixel.pixel_id)];
      toast(data.persisted === false ? 'Supabase indisponivel. Pixel criado localmente.' : 'Pixel criado. Copie o codigo e instale no quiz.', data.persisted === false ? 'error' : 'success');
      selectPixel(pixel.pixel_id);
    } catch (error) {
      const now = new Date().toISOString();
      const pixel = normalize({ quiz_id: randomId('quiz'), quiz_name: payload.quiz_name, pixel_id: randomId('px', 14), public_key: `pk_live_${Math.random().toString(36).slice(2, 18)}${Date.now().toString(36).slice(-4)}`, domain: payload.domain, integrated_url: payload.integrated_url, status: 'aguardando_instalacao', events_today: 0, leads_today: 0, persisted: false, created_at: now, updated_at: now });
      pixels = [pixel, ...pixels];
      toast('API indisponivel. Pixel criado localmente.', 'error');
      selectPixel(pixel.pixel_id);
    }
    localPixels(pixels);
    closePixelModal();
  }

  async function savePixelEdit() {
    const pixel = selectedPixel();
    if (!pixel) return;
    const payload = { pixel_id: pixel.pixel_id, public_key: pixel.public_key, quiz_name: $('pixel-edit-name')?.value.trim(), integrated_url: $('pixel-edit-url')?.value.trim(), domain: $('pixel-edit-domain')?.value.trim() };
    try {
      const data = await api('/api/pixel/update', { method: 'PATCH', body: JSON.stringify(payload) });
      pixels = pixels.map((item) => item.pixel_id === pixel.pixel_id ? normalize(data.pixel) : item);
      toast('Pixel atualizado.', 'success');
    } catch (error) {
      pixels = pixels.map((item) => item.pixel_id === pixel.pixel_id ? normalize({ ...item, ...payload, updated_at: new Date().toISOString() }) : item);
      toast('Atualizacao salva localmente. API indisponivel.', 'error');
    }
    localPixels(pixels);
    closeEditModal();
    renderPixelsPage();
  }

  async function copyInstallCode(pixelId) {
    const pixel = pixels.find((item) => item.pixel_id === pixelId) || selectedPixel();
    if (!pixel) return toast('Selecione um pixel primeiro.', 'error');
    try { await navigator.clipboard.writeText(installCode(pixel)); toast('Codigo copiado.', 'success'); }
    catch (error) { const code = $('install-code'); if (code) { code.select(); } toast('Selecione o codigo e copie manualmente.', 'error'); }
  }

  async function testPixel(pixelId) {
    const pixel = pixels.find((item) => item.pixel_id === pixelId) || selectedPixel();
    if (!pixel) return toast('Selecione um pixel primeiro.', 'error');
    try {
      await api('/api/pixel/test', { method: 'POST', body: JSON.stringify({ pixel_id: pixel.pixel_id, quiz_id: pixel.quiz_id, public_key: pixel.public_key, page_url: pixel.integrated_url || window.location.href, domain: pixel.domain }) });
      toast('Teste enviado para o pixel selecionado.', 'success');
      setTimeout(() => refresh(true), 900);
    } catch (error) { toast(`Falha no teste: ${error.message}`, 'error'); }
  }

  async function runDiagnostic(pixelId) {
    const pixel = pixels.find((item) => item.pixel_id === pixelId) || selectedPixel();
    if (!pixel) return toast('Selecione um pixel primeiro.', 'error');
    for (const [id, path] of [['diag-px', '/pixel.js'], ['diag-api', '/api/track']]) {
      const el = $(id);
      try { const response = await fetch(`${baseUrl()}${path}`, { method: id === 'diag-px' ? 'HEAD' : 'GET', cache: 'no-store' }); if (el) { el.className = `${response.ok ? 'text-green-600' : 'text-red-600'} font-medium`; el.textContent = response.ok ? 'OK' : `Erro ${response.status}`; } }
      catch (error) { if (el) { el.className = 'text-red-600 font-medium'; el.textContent = 'Falha na rede'; } }
    }
    await refresh(false);
    toast('Diagnostico atualizado.', 'success');
  }

  async function regeneratePixelKey(pixelId) {
    const pixel = pixels.find((item) => item.pixel_id === pixelId) || selectedPixel();
    if (!pixel) return;
    try {
      const data = await api('/api/pixel/update', { method: 'PATCH', body: JSON.stringify({ pixel_id: pixel.pixel_id, public_key: pixel.public_key, regenerate_key: true }) });
      pixels = pixels.map((item) => item.pixel_id === pixel.pixel_id ? normalize(data.pixel) : item);
      toast('Nova chave gerada. Atualize o codigo instalado.', 'success');
    } catch (error) {
      pixels = pixels.map((item) => item.pixel_id === pixel.pixel_id ? normalize({ ...item, public_key: `pk_live_${Math.random().toString(36).slice(2, 18)}${Date.now().toString(36).slice(-4)}`, status: 'aguardando_instalacao', last_event_at: null, last_heartbeat_at: null }) : item);
      toast('Nova chave gerada localmente. API indisponivel.', 'error');
    }
    localPixels(pixels);
    renderPixelsPage();
  }

  async function deletePixel(pixelId) {
    const pixel = pixels.find((item) => item.pixel_id === pixelId);
    if (!pixel) return;
    const run = async () => {
      try { await api('/api/pixel/delete', { method: 'POST', body: JSON.stringify({ pixel_id: pixel.pixel_id, public_key: pixel.public_key }) }); } catch (error) {}
      pixels = pixels.filter((item) => item.pixel_id !== pixel.pixel_id);
      if (localStorage.getItem(SELECTED_KEY) === pixel.pixel_id) localStorage.removeItem(SELECTED_KEY);
      localPixels(pixels);
      renderPixelsPage();
      toast('Pixel removido da lista.', 'success');
    };
    if (window.openConfirmDialog) window.openConfirmDialog({ title: 'Excluir pixel?', message: `O pixel ${pixel.pixel_id} sera removido.`, confirmText: 'Excluir', tone: 'danger', onConfirm: run });
    else run();
  }

  function selectPixel(pixelId) {
    localStorage.setItem(SELECTED_KEY, pixelId);
    renderPixelsPage();
    refresh(true);
  }

  function openPixelModal() { $('pixel-create-modal')?.classList.remove('hidden'); $('pixel-create-modal')?.classList.add('flex'); }
  function closePixelModal() { $('pixel-create-modal')?.classList.add('hidden'); $('pixel-create-modal')?.classList.remove('flex'); }
  function openPixelEdit(pixelId) { selectPixel(pixelId); $('pixel-edit-modal')?.classList.remove('hidden'); $('pixel-edit-modal')?.classList.add('flex'); }
  function closeEditModal() { $('pixel-edit-modal')?.classList.add('hidden'); $('pixel-edit-modal')?.classList.remove('flex'); }

  function startPolling() {
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = setInterval(() => {
      if (!$('pixel-manager-root')) { clearInterval(pollTimer); pollTimer = null; window.pixelManagerPollingInterval = null; return; }
      const modalOpen = !$('pixel-create-modal')?.classList.contains('hidden') || !$('pixel-edit-modal')?.classList.contains('hidden');
      refresh(!modalOpen);
    }, POLL_MS);
    window.pixelManagerPollingInterval = pollTimer;
  }

  window.renderIntegrate = async function renderIntegrate() {
    if (pollTimer) clearInterval(pollTimer);
    if (window.pixelManagerPollingInterval) clearInterval(window.pixelManagerPollingInterval);
    await loadPixels();
    renderPixelsPage();
    await refresh(true);
    startPolling();
  };

  Object.assign(window, {
    selectPixel, openPixelModal, closePixelModal, openPixelEdit, closeEditModal,
    createPixelFromForm, savePixelEdit, copyPixelCode: copyInstallCode,
    testPixel, runPixelDiagnostic: runDiagnostic, regeneratePixelKey, deletePixel
  });
})();
