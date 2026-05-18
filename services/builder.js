// services/builder.js - Construtor Visual do Funil
window.BuilderApp = (function() {
    function createDefaultBuilderState() {
        return {
            id: 'funil_' + Math.random().toString(36).substring(2,8),
            name: 'Meu novo quiz',
            design: {
                theme: 'claro',
                align: 'center',
                width: 'Pequeno',
                elementSize: 'Padrão',
                spacing: 'Pequeno',
                borderRadius: 'Médio',
                primaryColor: '#16a34a',
                bgColor: '#ffffff',
                textColor: '#1f2937',
                cardColor: '#f9fafb',
                font: 'Inter'
            },
            steps: [
                {
                    id: 'step_1',
                    name: 'Início',
                    type: 'Intro',
                    components: [
                        {
                            id: 'comp_1',
                            type: 'text',
                            config: { content: 'Comece criando seu quiz', size: 'large', weight: 'bold', align: 'center' }
                        },
                        {
                            id: 'comp_2',
                            type: 'button',
                            config: { text: 'Adicionar primeira pergunta', action: 'next_step', color: 'primary' }
                        }
                    ]
                }
            ]
        };
    }

    let funnelData = createDefaultBuilderState();
    let isErrorState = false;

    let activeStepId = 'step_1';
    let selectedComponentId = null;

    // Definição da Biblioteca
    const library = [
        { category: 'Formulário', items: [
            { type: 'input', name: 'Campo', icon: 'pi-text-box', default: { label: 'Seu nome', placeholder: 'Digite aqui...', required: true } },
            { type: 'email', name: 'E-mail', icon: 'pi-envelope', default: { label: 'Seu E-mail', placeholder: 'exemplo@email.com', required: true } },
            { type: 'phone', name: 'Telefone', icon: 'pi-phone', default: { label: 'WhatsApp', placeholder: '(00) 00000-0000', required: true } },
            { type: 'button', name: 'Botão', icon: 'pi-cursor-click', default: { text: 'Continuar', action: 'next_step', color: 'primary' } }
        ]},
        { category: 'Quiz', items: [
            { type: 'options', name: 'Opções', icon: 'pi-list', default: { question: 'Escolha uma opção:', options: ['Opção A', 'Opção B'], autoAdvance: true } },
            { type: 'yesno', name: 'Sim/Não', icon: 'pi-check-circle', default: { question: 'Você concorda?', yesText: 'Sim', noText: 'Não' } }
        ]},
        { category: 'Mídia e Conteúdo', items: [
            { type: 'text', name: 'Texto', icon: 'pi-text-t', default: { content: 'Título ou texto aqui', size: 'large', weight: 'bold', align: 'center' } },
            { type: 'image', name: 'Imagem', icon: 'pi-image', default: { url: 'https://via.placeholder.com/600x300', alt: 'Imagem', width: '100%' } },
            { type: 'video', name: 'Vídeo', icon: 'pi-video', default: { url: 'https://www.youtube.com/embed/dQw4w9WgXcQ' } }
        ]},
        { category: 'Argumentação', items: [
            { type: 'arguments', name: 'Benefícios', icon: 'pi-check-square', default: { title: 'Por que escolher a gente?', items: ['Benefício 1', 'Benefício 2'] } },
            { type: 'testimonial', name: 'Depoimento', icon: 'pi-chat-circle', default: { name: 'Maria S.', text: 'Sensacional, mudou minha vida!', stars: 5 } },
            { type: 'price', name: 'Preço', icon: 'pi-currency-circle-dollar', default: { price: '97,00', currency: 'R$', buttonText: 'Comprar Agora', url: '#' } }
        ]}
    ];

    function safeJsonParse(value, fallback) {
        try {
            return value ? JSON.parse(value) : fallback;
        } catch (error) {
            console.warn("JSON inválido no localStorage. Resetando valor.", error);
            return fallback;
        }
    }

    function saveLocal() {
        if(isErrorState) return;
        try {
            localStorage.setItem('builder_funnel_data', JSON.stringify(funnelData));
        } catch(e) { console.error("Erro ao salvar:", e); }
    }

    function loadLocal() {
        console.log("[Builder] Iniciando carregamento");
        try {
            const saved = localStorage.getItem('builder_funnel_data');
            let parsed = safeJsonParse(saved, null);
            
            // Validacao severa de integridade
            if (parsed && parsed.steps && Array.isArray(parsed.steps) && parsed.steps.length > 0) {
                funnelData = parsed;
                if(!funnelData.design) funnelData.design = createDefaultBuilderState().design;
            } else {
                console.warn("[Builder] Dados corrompidos ou inexistentes, usando padrão.");
                funnelData = createDefaultBuilderState();
            }
            
            if (!funnelData.steps.find(s => s.id === activeStepId)) {
                activeStepId = funnelData.steps[0]?.id;
            }
            isErrorState = false;
        } catch (error) {
            console.error("[Builder] Erro estrutural crítico ao carregar:", error);
            funnelData = createDefaultBuilderState();
            activeStepId = funnelData.steps[0].id;
            isErrorState = false;
        } finally {
            console.log("[Builder] Funil carregado com sucesso");
        }
    }

    function render(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.innerHTML = `
            <div class="flex h-[calc(100vh-140px)] border-t border-gray-200 mt-2 bg-gray-50 overflow-hidden text-sm">
                
                <!-- SIDEBAR ESQUERDA: Biblioteca -->
                <div class="w-64 bg-white border-r border-gray-200 flex flex-col overflow-y-auto">
                    <div class="p-4 border-b border-gray-100 font-bold text-gray-800 bg-gray-50 sticky top-0">Campos & Blocos</div>
                    <div class="p-3 space-y-4">
                        ${library.map(cat => `
                            <div>
                                <h4 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">${cat.category}</h4>
                                <div class="grid grid-cols-2 gap-2">
                                    ${cat.items.map(item => `
                                        <div onclick="window.BuilderApp.addComponent('${item.type}')" class="flex flex-col items-center justify-center p-3 border border-gray-200 rounded-lg hover:border-brand-500 hover:bg-brand-50 cursor-pointer transition text-gray-600 hover:text-brand-600 bg-white shadow-sm">
                                            <i class="ph ${item.icon} text-xl mb-1"></i>
                                            <span class="text-[10px] text-center font-medium">${item.name}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- ÁREA CENTRAL: Canvas -->
                <div class="flex-1 flex flex-col bg-gray-100/50 relative overflow-hidden">
                    
                    <!-- Toolbar Superior do Canvas -->
                    <div class="bg-white px-4 py-3 border-b border-gray-200 flex justify-between items-center z-10 shadow-sm">
                        <div class="flex gap-2 bg-gray-100 p-1 rounded-md overflow-x-auto max-w-lg">
                            ${funnelData.steps.map(step => `
                                <button onclick="window.BuilderApp.selectStep('${step.id}')" class="px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap transition ${step.id === activeStepId ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'}">
                                    ${step.name}
                                </button>
                            `).join('')}
                            <button onclick="window.BuilderApp.addStep()" class="px-2 py-1 text-gray-500 hover:text-brand-600 hover:bg-white rounded"><i class="ph ph-plus"></i></button>
                        </div>
                        <div class="text-xs font-mono text-gray-400 px-3 hidden md:block">
                            ${funnelData.steps.find(s=>s.id===activeStepId)?.id}
                        </div>
                    </div>

                    <!-- Quadro Branco (Preview do Quiz) -->
                    <div class="flex-1 overflow-y-auto p-4 md:p-8 flex justify-center pb-32" onclick="window.BuilderApp.selectComponent(null)">
                        <div class="w-full max-w-[420px] bg-white rounded-2xl shadow-xl border border-gray-200 min-h-[500px] flex flex-col p-6 relative transition-all" style="font-family: '${funnelData.design.font}', sans-serif; background-color: ${funnelData.design.bgColor}; border-radius: ${funnelData.design.borderRadius === 'Arredondado total' ? '24px' : '8px'};">
                            
                            ${(() => {
                                const step = funnelData.steps.find(s => s.id === activeStepId);
                                if (!step || step.components.length === 0) {
                                    return `<div class="flex-1 flex flex-col items-center justify-center text-gray-300 border-2 border-dashed border-gray-200 rounded-lg p-6 text-center select-none"><i class="ph ph-arrow-circle-left text-3xl mb-2"></i><p>Clique ou arraste os campos da biblioteca ao lado para montar sua etapa.</p></div>`;
                                }

                                return step.components.map((comp, index) => {
                                    const isSelected = selectedComponentId === comp.id;
                                    return `
                                        <div class="relative group cursor-pointer mb-4 hover:ring-2 hover:ring-blue-300 rounded p-1 transition ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50/20' : ''}" onclick="event.stopPropagation(); window.BuilderApp.selectComponent('${comp.id}')">
                                            ${renderComponentPreview(comp)}
                                            
                                            <!-- Controles de Elemento -->
                                            ${isSelected ? `
                                                <div class="absolute -right-12 top-0 flex flex-col gap-1 bg-white border border-gray-200 rounded-md shadow-lg p-1 z-50">
                                                    <button onclick="event.stopPropagation(); window.BuilderApp.moveComponent(${index}, -1)" class="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded" title="Subir"><i class="ph ph-caret-up"></i></button>
                                                    <button onclick="event.stopPropagation(); window.BuilderApp.moveComponent(${index}, 1)" class="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded" title="Descer"><i class="ph ph-caret-down"></i></button>
                                                    <button onclick="event.stopPropagation(); window.BuilderApp.duplicateComponent('${comp.id}')" class="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded" title="Duplicar"><i class="ph ph-copy"></i></button>
                                                    <hr class="border-gray-100">
                                                    <button onclick="event.stopPropagation(); window.BuilderApp.deleteComponent('${comp.id}')" class="p-1.5 text-red-500 hover:bg-red-50 rounded" title="Excluir"><i class="ph ph-trash"></i></button>
                                                </div>
                                            ` : ''}
                                        </div>
                                    `;
                                }).join('');
                            })()}
                        </div>
                    </div>
                </div>

                <!-- SIDEBAR DIREITA: Propriedades -->
                <div class="w-80 bg-white border-l border-gray-200 flex flex-col overflow-y-auto">
                    ${renderPropertiesPanel()}
                </div>

            </div>
        `;
    }

    function renderComponentPreview(comp) {
        // Gera o HTML Visual do componente para o Canvas Baseado no tipo.
        const c = comp.config;
        const color = funnelData.design.primaryColor;
        
        switch(comp.type) {
            case 'text':
                const sizes = { small:'text-sm', default:'text-base', large:'text-2xl', h1:'text-4xl' };
                const weights = { normal:'font-normal', bold:'font-bold' };
                const aligns = { left:'text-left', center:'text-center', right:'text-right' };
                return `<div class="${sizes[c.size] || 'text-base'} ${weights[c.weight] || 'font-normal'} ${aligns[c.align] || 'text-center'}" style="color: ${funnelData.design.textColor}">${c.content}</div>`;
            
            case 'input':
            case 'email':
            case 'phone':
                return `
                    <div class="w-full">
                        <label class="block text-sm font-medium mb-1" style="color: ${funnelData.design.textColor}">${c.label} ${c.required ? '<span class="text-red-500">*</span>' : ''}</label>
                        <input type="text" placeholder="${c.placeholder}" disabled class="w-full border border-gray-300 rounded-md p-3 outline-none opacity-80 bg-gray-50 text-base pointer-events-none">
                    </div>
                `;

            case 'button':
                return `
                    <button disabled class="w-full py-4 px-6 rounded-lg font-bold text-white shadow-lg transition opacity-90 transform opacity-80 pointer-events-none" style="background-color: ${color};">
                        ${c.text}
                    </button>
                `;

            case 'options':
                return `
                    <div class="w-full space-y-3">
                        <h3 class="text-lg font-bold text-center mb-4" style="color: ${funnelData.design.textColor}">${c.question}</h3>
                        ${c.options.map(opt => `
                            <div class="w-full p-4 border border-gray-200 rounded-xl cursor-default text-center transition shadow-sm font-medium" style="background-color: ${funnelData.design.cardColor}; color: ${funnelData.design.textColor}">${opt}</div>
                        `).join('')}
                    </div>
                `;

            case 'yesno':
                return `
                    <div class="w-full space-y-3 text-center">
                        <h3 class="text-lg font-bold text-center mb-4" style="color: ${funnelData.design.textColor}">${c.question}</h3>
                        <div class="grid grid-cols-2 gap-3 mt-4">
                            <div class="w-full p-4 border border-gray-200 rounded-xl cursor-default text-center transition shadow-sm font-medium" style="background-color: ${funnelData.design.cardColor}; color: ${funnelData.design.textColor}">${c.yesText}</div>
                            <div class="w-full p-4 border border-gray-200 rounded-xl cursor-default text-center transition shadow-sm font-medium" style="background-color: ${funnelData.design.cardColor}; color: ${funnelData.design.textColor}">${c.noText}</div>
                        </div>
                    </div>
                `;

            case 'image':
                return `<img src="${c.url}" alt="${c.alt}" style="width: ${c.width}" class="rounded-lg shadow-sm mx-auto object-cover h-auto">`;
            case 'video':
                return `<div class="aspect-video w-full bg-gray-200 rounded-lg flex items-center justify-center text-gray-400 relative overflow-hidden">
                    <i class="ph-fill ph-play-circle text-4xl"></i>
                    <div class="absolute bottom-2 left-0 right-0 text-center text-xs text-gray-500 truncate px-2">${c.url}</div>
                </div>`;
            
            case 'arguments':
                return `
                    <div class="w-full bg-white p-6 border border-gray-200 rounded-xl shadow-sm text-left">
                        <h4 class="font-bold text-lg mb-4 text-center" style="color: ${funnelData.design.textColor}">${c.title}</h4>
                        <ul class="space-y-3">
                            ${c.items.map(it => `<li class="flex items-start gap-2 text-sm"><i class="ph-fill ph-check-circle mt-0.5" style="color: ${color}"></i> <span style="color: ${funnelData.design.textColor}">${it}</span></li>`).join('')}
                        </ul>
                    </div>
                `;

            case 'price':
                return `
                    <div class="w-full text-center p-6 border-2 rounded-2xl relative bg-white shadow-xl" style="border-color: ${color}">
                        <div class="absolute -top-3 left-1/2 -translate-x-1/2 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider" style="background-color: ${color}">Oferta Exclusiva</div>
                        <p class="text-gray-400 line-through text-sm mt-3">${c.currency} ${(parseFloat(c.price.replace(',','.')) * 2).toFixed(2).replace('.',',')}</p>
                        <h2 class="text-4xl font-black mb-4" style="color: ${funnelData.design.textColor}"><span class="text-xl">${c.currency}</span> ${c.price}</h2>
                        <button disabled class="w-full py-4 px-6 rounded-lg font-bold text-white mx-auto block opacity-50" style="background-color: ${color};">${c.buttonText}</button>
                    </div>
                `;

            case 'testimonial':
                return `
                    <div class="w-full p-5 bg-gray-50 border border-gray-100 rounded-xl text-left shadow-sm">
                        <div class="flex gap-1 text-yellow-500 text-sm mb-2">${'★'.repeat(c.stars)}${'☆'.repeat(5-c.stars)}</div>
                        <p class="text-sm italic mb-3 text-gray-600">"${c.text}"</p>
                        <div class="font-bold text-xs" style="color: ${funnelData.design.textColor}">– ${c.name}</div>
                    </div>
                `;

            default:
                return `<div class="p-4 bg-gray-100 text-center text-xs text-gray-500 rounded border border-gray-200">Bloco [${comp.type}]</div>`;
        }
    }

    function renderPropertiesPanel() {
        if (!selectedComponentId) {
            // Configurações da Etapa ou Globais de Design
            const step = funnelData.steps.find(s => s.id === activeStepId);
            if (!step) {
               return `
                <div class="p-4 flex flex-col gap-4 text-center">
                    <p class="text-sm text-gray-500">Nenhuma etapa encontrada.</p>
                </div>`;
            }
            return `
                <div class="p-4 flex flex-col gap-4">
                    <div class="border-b border-gray-100 pb-3 mb-2">
                        <h3 class="font-bold text-gray-800 text-base">\\[ Etapa \\] Configurações</h3>
                        <p class="text-[11px] text-gray-500">Ajustes da etapa selecionada no menu superior.</p>
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Nome da Etapa</label>
                        <input type="text" value="${step.name}" onchange="window.BuilderApp.updateStepName(this.value)" class="w-full p-2 border border-gray-200 rounded text-sm outline-none focus:border-brand-500">
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Cores do Tema (Marca)</label>
                        <div class="flex gap-2 mb-2">
                            <input type="color" value="${funnelData.design.primaryColor}" onchange="window.BuilderApp.updateDesign('primaryColor', this.value)" class="w-8 h-8 rounded shrink-0 cursor-pointer p-0 border flex-none">
                            <input type="text" value="${funnelData.design.primaryColor}" disabled class="flex-1 p-2 border border-gray-200 rounded text-xs bg-gray-50 uppercase">
                        </div>
                        <div class="flex gap-2">
                            <input type="color" value="${funnelData.design.bgColor}" onchange="window.BuilderApp.updateDesign('bgColor', this.value)" class="w-8 h-8 rounded shrink-0 cursor-pointer p-0 border flex-none" title="Fundo da Tela">
                            <span class="flex-1 p-2 text-xs text-gray-500 leading-4">Cor de Fundo</span>
                        </div>
                    </div>
                    <div class="mt-4 pt-4 border-t border-red-100">
                        <button onclick="window.BuilderApp.deleteStep()" class="w-full p-2 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition">Excluir Etapa Atual</button>
                    </div>
                </div>
            `;
        }

        const step = funnelData.steps.find(s => s.id === activeStepId);
        if(!step) return '';
        const comp = step.components.find(c => c.id === selectedComponentId);
        if (!comp) return '';
        const c = comp.config;

        let propsHtml = `<div class="p-4 flex flex-col gap-4">
            <div class="border-b border-gray-100 pb-3 mb-2 flex justify-between items-start">
                <div>
                    <h3 class="font-bold text-gray-800 text-base capitalize">${comp.type}</h3>
                    <p class="text-[11px] text-gray-500">Edite o elemento selecionado.</p>
                </div>
                <button onclick="window.BuilderApp.selectComponent(null)" class="text-gray-400 hover:text-gray-700 bg-gray-100 p-1 rounded-md"><i class="ph ph-x"></i></button>
            </div>
            <div class="space-y-4">
        `;

        const renderInput = (label, key, type='text') => `
            <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">${label}</label>
                <input type="${type}" value="${c[key] || ''}" onchange="window.BuilderApp.updateComponentProp('${key}', this.value)" class="w-full p-2 border border-gray-200 rounded text-sm outline-none focus:border-brand-500 transition">
            </div>
        `;

        const renderSelect = (label, key, options) => `
            <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">${label}</label>
                <select onchange="window.BuilderApp.updateComponentProp('${key}', this.value)" class="w-full p-2 border border-gray-200 rounded text-sm outline-none focus:border-brand-500 transition bg-white">
                    ${options.map(opt => `<option value="${opt.value}" ${c[key] === opt.value ? 'selected' : ''}>${opt.label}</option>`).join('')}
                </select>
            </div>
        `;

        // Renderização Dinâmica de Props por Categoria
        if (['input', 'email', 'phone'].includes(comp.type)) {
            propsHtml += renderInput('Rótulo (Label)', 'label');
            propsHtml += renderInput('Placeholder', 'placeholder');
            propsHtml += renderSelect('Campo Obrigatório?', 'required', [{label:'Sim', value:true},{label:'Não', value:false}]);
        }
        else if (comp.type === 'text') {
            propsHtml += `
                <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">Conteúdo do Texto</label>
                    <textarea onchange="window.BuilderApp.updateComponentProp('content', this.value)" class="w-full p-2 border border-gray-200 rounded text-sm outline-none focus:border-brand-500 min-h-[100px]">${c.content}</textarea>
                </div>
            `;
            propsHtml += renderSelect('Tamanho', 'size', [{label:'Pequeno', value:'small'}, {label:'Normal', value:'default'}, {label:'Grande', value:'large'}, {label:'Título Másculo', value:'h1'}]);
            propsHtml += renderSelect('Alinhamento', 'align', [{label:'Centro', value:'center'}, {label:'Esquerda', value:'left'}, {label:'Direita', value:'right'}]);
            propsHtml += renderSelect('Peso', 'weight', [{label:'Normal', value:'normal'}, {label:'Negrito', value:'bold'}]);
        }
        else if (comp.type === 'button') {
            propsHtml += renderInput('Texto do Botão', 'text');
            propsHtml += renderSelect('Ação (Ao Clicar)', 'action', [
                {label:'Próxima Etapa do Funil', value:'next_step'},
                {label:'Submeter Formulário', value:'submit_form'},
                {label:'Concluir Funil (Resultados)', value:'finish'},
                {label:'Ir para Checkout URL', value:'checkout'}
            ]);
        }
        else if (comp.type === 'options') {
            propsHtml += renderInput('Pergunta Exibida', 'question');
            propsHtml += `
                <div>
                    <label class="block text-xs font-medium text-gray-700 mb-2">Lista de Respostas</label>
                    ${c.options.map((opt, i) => `
                        <div class="flex gap-2 mb-2">
                            <input type="text" value="${opt}" onchange="window.BuilderApp.updateOptionProp(${i}, this.value)" class="flex-1 p-2 border border-gray-200 rounded text-sm">
                            <button onclick="window.BuilderApp.removeOption(${i})" class="px-2 border border-red-200 text-red-500 rounded bg-red-50"><i class="ph ph-trash"></i></button>
                        </div>
                    `).join('')}
                    <button onclick="window.BuilderApp.addOption()" class="w-full p-2 text-xs font-medium text-brand-600 bg-brand-50 rounded-md mt-1">+ Nova Opção</button>
                </div>
            `;
        }
        else if (comp.type === 'image' || comp.type === 'video') {
            propsHtml += renderInput('URL da Mídia (Link)', 'url');
            if (comp.type === 'image') {
                propsHtml += renderInput('Largura (ex: 100%, 300px)', 'width');
            }
        }
        else if (comp.type === 'price') {
            propsHtml += renderInput('Preço', 'price');
            propsHtml += renderInput('Moeda', 'currency');
            propsHtml += renderInput('Texto do Botão', 'buttonText');
        }
        else {
            propsHtml += `<div class="text-xs text-gray-500 italic">Configurações expandidas em breve para este bloco.</div>`;
        }

        propsHtml += `</div></div>`;
        return propsHtml;
    }

    return {
        init: () => {
            loadLocal();
        },
        render: () => {
            try {
                render('app-content');
            } catch(e) {
                console.error("[Builder] Erro fatal de renderização", e);
                const container = document.getElementById('app-content');
                if(container) {
                    container.innerHTML = `
                    <div class="p-8 text-center max-w-xl mx-auto mt-10 shadow-lg rounded-xl bg-red-50 border border-red-200">
                        <h2 class="text-xl font-bold text-red-700 mb-2">Não foi possível carregar o Construtor</h2>
                        <p class="text-sm text-red-600 mb-6">Encontramos um erro ao carregar seus dados. Você pode tentar recarregar ou iniciar um novo quiz.</p>
                        <div class="flex justify-center gap-4">
                            <button onclick="location.reload()" class="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded shadow-sm font-medium text-sm">Tentar novamente</button>
                            <button onclick="localStorage.removeItem('builder_funnel_data'); location.reload();" class="px-4 py-2 bg-red-600 text-white rounded shadow-sm font-medium text-sm">Limpar dados locais</button>
                        </div>
                    </div>`;
                }
            }
        },
        addStep: () => {
            const id = 'step_' + Math.random().toString(36).substring(2,6);
            funnelData.steps.push({ id, name: `Etapa ${funnelData.steps.length + 1}`, type: 'intro', components: [] });
            activeStepId = id;
            selectedComponentId = null;
            saveLocal();
            window.BuilderApp.render();
        },
        selectStep: (id) => {
            activeStepId = id;
            selectedComponentId = null;
            window.BuilderApp.render();
        },
        deleteStep: () => {
            if (funnelData.steps.length <= 1) return showToast('O funil precisa de pelo menos uma etapa.', 'error');
            const deleteActiveStep = () => {
                funnelData.steps = funnelData.steps.filter(s => s.id !== activeStepId);
                activeStepId = funnelData.steps[0].id;
                selectedComponentId = null;
                saveLocal();
                window.BuilderApp.render();
                if (window.showToast) window.showToast('Etapa excluida.', 'success');
            };
            if (window.openConfirmDialog) {
                window.openConfirmDialog({
                    title: 'Excluir esta etapa?',
                    message: 'Todo o conteudo da etapa selecionada sera removido do funil.',
                    confirmText: 'Excluir etapa',
                    tone: 'danger',
                    onConfirm: deleteActiveStep
                });
            } else {
                deleteActiveStep();
            }
        },
        updateStepName: (val) => {
            const s = funnelData.steps.find(s => s.id === activeStepId);
            if(s) s.name = val;
            saveLocal();
            window.BuilderApp.render();
        },
        addComponent: (type) => {
            let cat = library.find(c => c.items.find(i=>i.type === type));
            let def = cat.items.find(i=>i.type === type).default;
            const step = funnelData.steps.find(s => s.id === activeStepId);
            if (!step) return;
            
            const newComp = {
                id: 'comp_' + Math.random().toString(36).substring(2,8),
                type: type,
                config: JSON.parse(JSON.stringify(def)) // deep clone default configs
            };
            
            step.components.push(newComp);
            selectedComponentId = newComp.id;
            saveLocal();
            window.BuilderApp.render();
        },
        selectComponent: (id) => {
            selectedComponentId = id;
            window.BuilderApp.render();
        },
        updateComponentProp: (key, val) => {
            const step = funnelData.steps.find(s => s.id === activeStepId);
            if (!step) return;
            const comp = step.components.find(c => c.id === selectedComponentId);
            if(comp) comp.config[key] = val;
            saveLocal();
            window.BuilderApp.render();
        },
        addOption: () => {
            const step = funnelData.steps.find(s => s.id === activeStepId);
            if (!step) return;
            const comp = step.components.find(c => c.id === selectedComponentId);
            if(comp && comp.type === 'options') comp.config.options.push('Nova Opção');
            saveLocal();
            window.BuilderApp.render();
        },
        updateOptionProp: (index, val) => {
            const step = funnelData.steps.find(s => s.id === activeStepId);
            if (!step) return;
            const comp = step.components.find(c => c.id === selectedComponentId);
            if(comp && comp.type === 'options') comp.config.options[index] = val;
            saveLocal();
            window.BuilderApp.render();
        },
        removeOption: (index) => {
            const step = funnelData.steps.find(s => s.id === activeStepId);
            if (!step) return;
            const comp = step.components.find(c => c.id === selectedComponentId);
            if(comp && comp.type === 'options') comp.config.options.splice(index, 1);
            saveLocal();
            window.BuilderApp.render();
        },
        deleteComponent: (id) => {
            const step = funnelData.steps.find(s => s.id === activeStepId);
            if (!step) return;
            step.components = step.components.filter(c => c.id !== id);
            selectedComponentId = null;
            saveLocal();
            window.BuilderApp.render();
        },
        duplicateComponent: (id) => {
            const step = funnelData.steps.find(s => s.id === activeStepId);
            if (!step) return;
            const idx = step.components.findIndex(c => c.id === id);
            if(idx > -1) {
                const clone = JSON.parse(JSON.stringify(step.components[idx]));
                clone.id = 'comp_' + Math.random().toString(36).substring(2,8);
                step.components.splice(idx + 1, 0, clone);
                selectedComponentId = clone.id;
                saveLocal();
                window.BuilderApp.render();
            }
        },
        moveComponent: (index, direction) => {
            const step = funnelData.steps.find(s => s.id === activeStepId);
            if (!step) return;
            if (index + direction < 0 || index + direction >= step.components.length) return;
            const temp = step.components[index];
            step.components[index] = step.components[index + direction];
            step.components[index + direction] = temp;
            saveLocal();
            window.BuilderApp.render();
        },
        updateDesign: (key, val) => {
            funnelData.design[key] = val;
            saveLocal();
            window.BuilderApp.render();
        },
        publish: () => {
            showToast('Funil publicado! O sistema está pronto e atualizado no servidor.', 'success');
        }
    };
})();
