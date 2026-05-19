// quiz.js - Renderizador Dinâmico do Funil
document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('quiz-container');
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    const progressWrapper = document.getElementById('progress-wrapper');
    
    // 1. Tentar puxar dados do Construtor
    let rawData = localStorage.getItem('builder_funnel_data');
    let funnelData = null;

    if (rawData) {
        try {
            funnelData = JSON.parse(rawData);
        } catch(e) { console.error('Erro ao ler funnelData', e); }
    }

    if (!funnelData || !funnelData.steps || funnelData.steps.length === 0) {
        container.innerHTML = `<div class="p-8 text-center"><h2 class="text-xl font-bold mb-2">Funil não configurado.</h2><p class="text-gray-400">Acesse o Dashboard > Construtor e crie seu funil.</p></div>`;
        return;
    }

    // 2. Aplicar Design Global
    const design = funnelData.design;
    document.body.style.backgroundColor = design.bgColor;
    document.body.style.color = design.textColor;
    document.body.style.fontFamily = `'${design.font}', sans-serif`;
    
    const isRounded = design.borderRadius === 'Arredondado total';
    container.style.borderRadius = isRounded ? '24px' : '8px';
    container.style.backgroundColor = design.cardColor;

    let currentStepIndex = 0;
    
    // Captura campos do lead globalmente para enviar quando Form submeter
    let leadCapture = { name: '', email: '', phone: '' };

    function updateProgress() {
        if (funnelData.steps.length <= 1) {
            progressWrapper.classList.add('hidden');
            return;
        }
        progressWrapper.classList.remove('hidden');
        const pct = Math.round(((currentStepIndex) / (funnelData.steps.length - 1)) * 100);
        progressBar.style.width = `${pct}%`;
        progressText.innerText = `${pct}%`;
        progressBar.style.backgroundColor = design.primaryColor;
    }

    function executeAction(actionType, url) {
        if (actionType === 'next_step') {
            nextStep();
        } else if (actionType === 'finish') {
            if (window.LeadTrack) {
                window.LeadTrack.complete({ result: 'Avaliado pelo Funil Dinâmico' });
            }
            container.innerHTML = `
                <div class="p-8 text-center animate-fade-in flex flex-col items-center">
                    <i class="ph-fill ph-check-circle text-6xl text-green-500 mb-4 animate-bounce"></i>
                    <h2 class="text-2xl font-bold mb-2" style="color:${design.textColor}">Obrigado!</h2>
                    <p class="text-gray-500">Respondido e salvo com sucesso.</p>
                </div>
            `;
        } else if (actionType === 'checkout' && url) {
            if (window.LeadTrack) window.LeadTrack.checkoutClick();
            window.location.href = url;
        } else if (actionType === 'submit_form') {
            const stepId = funnelData.steps[currentStepIndex].id;
            const containerEl = document.getElementById(`step-${stepId}`);
            
            // Validar Obrigatórios
            const reqs = containerEl.querySelectorAll('.required-field input');
            let hasErr = false;
            reqs.forEach(r => {
                if(!r.value) { r.classList.add('border-red-500'); hasErr = true; }
                else { r.classList.remove('border-red-500'); }
            });
            if (hasErr) return alert('Preencha os campos obrigatórios.');

            // Coletar Dados
            const inputs = containerEl.querySelectorAll('input[data-lead-field]');
            inputs.forEach(inp => leadCapture[inp.getAttribute('data-lead-field')] = inp.value);

            if (window.LeadTrack) window.LeadTrack.lead(leadCapture);
            
            nextStep();
        }
    }

    window.selectOption = function(stepId, question, answer, autoAdvance) {
        if (window.LeadTrack) window.LeadTrack.answer(stepId, question, answer);
        if (autoAdvance) nextStep();
    }

    window.triggerAction = function(actionType, url) {
        executeAction(actionType, url);
    }

    function renderComponent(comp, stepId) {
        const c = comp.config;
        const color = design.primaryColor;
        let cId = comp.id;

        switch(comp.type) {
            case 'text':
                const sizes = { small:'text-sm', default:'text-base', large:'text-2xl', h1:'text-4xl' };
                const weights = { normal:'font-normal', bold:'font-bold' };
                const aligns = { left:'text-left', center:'text-center', right:'text-right' };
                return `<div class="${sizes[c.size] || 'text-base'} ${weights[c.weight] || 'font-normal'} ${aligns[c.align] || 'text-center'} mb-4" style="color: ${design.textColor}">${c.content}</div>`;
            
            case 'input':
            case 'email':
            case 'phone':
                const typeMap = { input:'text', email:'email', phone:'tel' };
                const fieldMap = { input:'name', email:'email', phone:'phone' };
                return `
                    <div class="w-full mb-4 ${c.required ? 'required-field' : ''}">
                        <label class="block text-sm font-medium mb-1" style="color: ${design.textColor}">${c.label} ${c.required ? '<span class="text-red-500">*</span>' : ''}</label>
                        <input type="${typeMap[comp.type]}" data-lead-field="${fieldMap[comp.type]}" placeholder="${c.placeholder}" class="w-full border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 bg-white text-gray-900 transition" style="border-color:#e5e7eb; --tw-ring-color: ${color}">
                    </div>
                `;

            case 'button':
                return `
                    <button onclick="triggerAction('${c.action}', '${c.url || ''}')" class="w-full py-4 px-6 mb-4 rounded-lg font-bold text-white shadow-lg focus:outline-none focus:ring-4 hover:-translate-y-1 transition transform" style="background-color: ${color}; --tw-ring-color: ${color}80">
                        ${c.text}
                    </button>
                `;

            case 'options':
                return `
                    <div class="w-full space-y-3 mb-6">
                        <h3 class="text-lg font-bold text-center mb-4 leading-tight" style="color: ${design.textColor}">${c.question}</h3>
                        ${c.options.map(opt => `
                            <button onclick="selectOption('${stepId}', '${c.question.replace(/'/g,"")}', '${opt.replace(/'/g,"")}', ${c.autoAdvance})" class="w-full text-left p-4 border border-gray-200 rounded-xl hover:border-gray-400 transition shadow-sm font-medium focus:ring-2 focus:outline-none" style="background-color: ${design.cardColor === '#1e293b' ? '#334155' : '#ffffff'}; color: ${design.textColor}">
                                ${opt}
                            </button>
                        `).join('')}
                    </div>
                `;

            case 'yesno':
                return `
                    <div class="w-full space-y-3 text-center mb-6">
                        <h3 class="text-lg font-bold text-center mb-4 leading-tight" style="color: ${design.textColor}">${c.question}</h3>
                        <div class="grid grid-cols-2 gap-3 mt-4">
                            <button onclick="selectOption('${stepId}', '${c.question.replace(/'/g,"")}', '${c.yesText.replace(/'/g,"")}', true)" class="w-full p-4 border border-gray-200 rounded-xl transition shadow-sm font-bold hover:-translate-y-1" style="background-color: ${design.cardColor === '#1e293b' ? '#334155' : '#ffffff'}; color: ${design.textColor}">${c.yesText}</button>
                            <button onclick="selectOption('${stepId}', '${c.question.replace(/'/g,"")}', '${c.noText.replace(/'/g,"")}', true)" class="w-full p-4 border border-gray-200 rounded-xl transition shadow-sm font-bold hover:-translate-y-1" style="background-color: ${design.cardColor === '#1e293b' ? '#334155' : '#ffffff'}; color: ${design.textColor}">${c.noText}</button>
                        </div>
                    </div>
                `;

            case 'image':
                return `<img src="${c.url}" alt="${c.alt}" style="width: ${c.width}" class="rounded-lg shadow-sm mx-auto object-cover h-auto mb-4">`;
            
            case 'video':
                return `<div class="aspect-video w-full rounded-lg overflow-hidden shadow-lg mb-4 bg-black">
                    <iframe src="${c.url}" frameborder="0" allowfullscreen class="w-full h-full"></iframe>
                </div>`;
            
            case 'arguments':
                return `
                    <div class="w-full bg-white/5 p-6 border border-gray-200/50 rounded-xl shadow-sm text-left mb-4">
                        <h4 class="font-bold text-lg mb-4 text-center" style="color: ${design.textColor}">${c.title}</h4>
                        <ul class="space-y-3">
                            ${c.items.map(it => `<li class="flex items-start gap-3"><i class="ph-fill ph-check-circle mt-1 text-lg" style="color: ${color}"></i> <span style="color: ${design.textColor}" class="leading-relaxed">${it}</span></li>`).join('')}
                        </ul>
                    </div>
                `;

            case 'price':
                return `
                    <div class="w-full text-center p-6 border-2 rounded-2xl relative bg-white/5 shadow-xl mb-6" style="border-color: ${color}">
                        <div class="absolute -top-3 left-1/2 -translate-x-1/2 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm" style="background-color: ${color}">Oferta Exclusiva</div>
                        <p class="text-gray-400 line-through text-sm mt-3">${c.currency} ${(parseFloat(c.price.replace(',','.')) * 2).toFixed(2).replace('.',',')}</p>
                        <h2 class="text-4xl font-black mb-4" style="color: ${design.textColor}"><span class="text-xl inline-block -translate-y-2 opacity-70">${c.currency}</span> ${c.price}</h2>
                        <button onclick="triggerAction('checkout', '${c.url}')" class="w-full py-4 px-6 rounded-lg font-bold text-white shadow-lg mx-auto block transition hover:-translate-y-1" style="background-color: ${color};">${c.buttonText}</button>
                    </div>
                `;

            case 'testimonial':
                return `
                    <div class="w-full p-5 bg-white/5 border border-gray-200/50 rounded-xl text-left shadow-sm mb-4">
                        <div class="flex gap-1 text-yellow-500 text-sm mb-3">${'★'.repeat(c.stars)}${'☆'.repeat(5-c.stars)}</div>
                        <p class="text-sm italic mb-4 leading-relaxed" style="color: ${design.textColor}">"${c.text}"</p>
                        <div class="font-bold text-sm tracking-wide" style="color: ${color}">– ${c.name}</div>
                    </div>
                `;

            default: return '';
        }
    }

    function renderStep() {
        const step = funnelData.steps[currentStepIndex];
        if (!step) return;

        updateProgress();

        if (window.LeadTrack) {
            if (currentStepIndex === 0) window.LeadTrack.start();
            window.LeadTrack.stepView(step.id);
        }

        let html = `
            <div id="step-${step.id}" class="w-full animate-fade-in step-container flex flex-col justify-center min-h-[400px]">
                ${step.components.map(c => renderComponent(c, step.id)).join('')}
            </div>
        `;
        
        container.innerHTML = html;
        window.scrollTo({top:0, behavior:'smooth'});
    }

    function nextStep() {
        if (currentStepIndex < funnelData.steps.length - 1) {
            currentStepIndex++;
            renderStep();
        } else {
            if (window.LeadTrack) window.LeadTrack.complete({ result: 'Avaliado' });
        }
    }

    // Inicializando o Quiz!
    renderStep();
});
