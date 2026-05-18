const { useState, useEffect } = React;

const quizSteps = [
  {
    id: 1, type: 'start',
    copy: '¿Te gustaría aprender a preparar bolis gourmet deliciosos?\nListos en menos de 15 minutos y con ingredientes simples.',
    btn: '¡Comenzar ahora!'
  },
  {
    id: 2, type: 'question',
    copy: '¿Tienes experiencia haciendo bolis gourmet?',
    options: [
      { icon: '😃', text: 'No, quiero empezar desde cero.' },
      { icon: '😎', text: 'Sí, ya sé algunas cosas.' }
    ]
  },
  {
    id: 3, type: 'question',
    copy: '¿Qué prefieres: vender bolis y ganar un ingreso extra o solo hacer para tu familia y amigos?',
    options: [
      { icon: '💰', text: 'Quiero ganar dinero.' },
      { icon: '👨‍👩‍👧', text: 'Solo quiero para uso personal' }
    ]
  },
  {
    id: 4, type: 'question',
    copy: '¿Sabías que hoy en día hay muchas personas que ganan dinero vendiendo bolis sin salir de casa?',
    options: [
      { icon: '😁', text: 'Sí' },
      { icon: '☹️', text: 'No' }
    ]
  },
  {
    id: 5, type: 'question',
    copy: '¿Alguna vez has sentido que trabajas mucho y el dinero nunca es suficiente?',
    options: [
      { icon: '😣', text: 'Sí, todo el tiempo…' },
      { icon: '😐', text: 'A veces...' },
      { icon: '😁', text: 'No, por suerte me va bien.' }
    ]
  },
  {
    id: 6, type: 'transition',
    image: '/imagens/maria_teresa.jpg',
    copyBold: 'Mucho gusto, soy María Teresa...',
    copy: 'Por mucho tiempo, mi vida fue una lucha constante: trabajaba duro, pero el dinero se me escapaba de las manos. Sé lo que es sentir ese nudo en el estómago cuando se acerca el fin de mes y las cuentas no esperan. Mi cocina era el lugar donde solo cocinaba para mi familia, hasta que decidí transformarla en mi propio negocio de Bolis Lucrativos. Hoy, la paz mental volvió a mi hogar: estoy generando cerca de RD$ 194,540 pesos mensuales. Y lo mejor es que no fue suerte, fue un método. ¡Ahora quiero tomarte de la mano y enseñarte exactamente cómo tú también puedes lograrlo!',
    btn: 'Continuar'
  },
  {
    id: 7, type: 'question',
    copy: '¿Ya hiciste algún entrenamiento sobre bolis gourmet? ¿O algo relacionado...?',
    options: [
      { icon: '☹️', text: 'Nunca hice.' },
      { icon: '🤩', text: 'Sí, ya hice.' },
      { icon: '😎', text: 'Me gustaría hacer.' }
    ]
  },
  {
    id: 8, type: 'question',
    copy: '¿Ya habías escuchado hablar de esta técnica de preparar bolis gourmet?',
    options: [
      { icon: '😍', text: 'Sí' },
      { icon: '👎', text: 'No' }
    ]
  },
  {
    id: 9, type: 'question',
    copy: '¿Qué tal aprender a hacerlos en casa y con ingredientes simples?',
    options: [
      { icon: '😫', text: 'Sería mi sueño, pero tengo dificultad…' },
      { icon: '😐', text: 'Sí, pero no sé por dónde empezar.' },
      { icon: '😃', text: 'No sé si esto sería posible.' }
    ]
  },
  {
    id: 10, type: 'question',
    copy: '¿Si pudieras ganar dinero haciendo bolis, lo intentarías? ¿Ya imaginaste ganar dinero sin tener que salir de casa?',
    options: [
      { icon: '😃', text: '¡Sí! Quiero mucho.' },
      { icon: '😬', text: 'Tal vez, tengo miedo.' },
      { icon: '👎', text: 'No, solo quiero mejorar mis técnicas.' }
    ]
  },
  {
    id: 11, type: 'question',
    copy: '¿Qué es lo que más te impide comenzar un negocio o aprender algo nuevo?',
    options: [
      { icon: '😫', text: 'Falta de tiempo.' },
      { icon: '💰', text: 'Falta de dinero.' },
      { icon: '😥', text: 'Miedo de fracasar.' }
    ]
  },
  {
    id: 12, type: 'transition',
    image: '/imagens/bolis_morango.jpg',
    imageAlt: 'Proyecto Bolis Gourmet',
    copy: 'Conoce el "Proyecto Bolis Gourmet"\n\nResponsable de que mujeres de toda la República Dominicana estén generando ingresos desde sus casas. Ana Silva, la creadora, garantiza que cualquier mujer, incluso sin ningún conocimiento previo, puede ganar entre RD$ 1,575 y RD$ 6,300 pesos por día trabajando desde casa. Todo lo que necesitas es menos de RD$ 1,890 pesos para comenzar hoy mismo.',
    btn: 'Continuar'
  },
  {
    id: 13, type: 'question',
    copy: 'Si pudieras cambiar algo en tu vida ahora mismo, ¿qué sería?\nSé sincera, es muy importante...',
    options: [
      { icon: '💵', text: 'Tener más dinero y libertad.' },
      { icon: '🕒', text: 'Más tiempo para mí.' },
      { icon: '💖', text: 'Hacer algo que me apasione.' }
    ]
  },
  {
    id: 14, type: 'question',
    copy: '¿Cómo evalúas tu conocimiento en bolis gourmet?\nSigue siendo sincera...',
    options: [
      { icon: '🌱', text: 'Cero, quiero empezar.' },
      { icon: '📚', text: 'Intermedio, quiero aprender más.' },
      { icon: '🏆', text: 'Avanzado, ya realizo ventas.' }
    ]
  },
  {
    id: 15, type: 'question',
    copy: '¿Cuánto quieres ganar vendiendo bolis?\nEsto es muy importante...',
    options: [
      { icon: '💵', text: 'RD$ 31,500 pesos por mes' },
      { icon: '💰', text: 'Entre RD$ 31,500 y RD$ 94,500' },
      { icon: '💸', text: 'Más de RD$ 94,500 pesos' }
    ]
  },
  {
    id: 16, type: 'analysis',
    copy: 'Análisis inicial de tu perfil\nBasado en tus respuestas...',
    title: '¿Vamos a armar un plan?',
    subtitle: 'Un plan exclusivo hecho para vos de acuerdo con tus necesidades y objetivos, sé sincera en las próximas 5 preguntas.',
    stats: [
      { label: 'Mentalidad y Motivación', value: 91 },
      { label: 'Ingresos', value: 55 },
      { label: 'Conocimiento general', value: 18 }
    ],
    btn: 'Continuar'
  },
  {
    id: 17, type: 'question',
    copy: '¿Si existiera un entrenamiento paso a paso para aprender a hacer y vender bolis gourmet, lo harías?',
    options: [
      { icon: '🙌', text: '¡Sí, inmediatamente!' },
      { icon: '🤔', text: 'Me gustaría saber más.' },
      { icon: '😐', text: 'No' }
    ]
  },
  {
    id: 18, type: 'question',
    copy: '¿Estarías dispuesta a invertir algunas horas por semana para aprender y practicar en casa?',
    options: [
      { icon: '✅', text: 'Sí, puedo hacerlo.' },
      { icon: '🕐', text: 'Tal vez, si tengo tiempo.' },
      { icon: '🚫', text: 'No, estoy muy ocupada.' }
    ]
  },
  {
    id: 19, type: 'question',
    copy: '¿Te gustaría tener un acompañamiento directo en tu WhatsApp para crear tu propio negocio? Sé sincera...',
    options: [
      { icon: '😀', text: '¡Sí, lo necesito!' },
      { icon: '🙂', text: 'No, solo quiero hacer por diversión.' },
      { icon: '🤔', text: 'Tal vez más adelante.' }
    ]
  },
  {
    id: 20, type: 'question',
    copy: '¿Qué te gustaría más aprender a preparar?',
    options: [
      { icon: '🍓', text: 'Bolis de Frutas' },
      { icon: '🍦', text: 'Bolis Cremosos' },
      { icon: '🍫', text: 'Bolis con Chocolate' },
      { icon: '🥛', text: 'Bolis de Leche' },
      { icon: '🌴', text: 'Bolis Exóticos' },
      { icon: '🍫', text: 'Bolis de Nutella' }
    ]
  },
  {
    id: 21, type: 'question',
    copy: '¿Cuál es la primera cosa que vas a hacer cuando empieces a ganar dinero con tus bolis?',
    options: [
      { icon: '💸', text: 'Pagar mis deudas.' },
      { icon: '🏠', text: 'Ayudar en casa.' },
      { icon: '🎉', text: 'Ahorrar y darme un regalo' }
    ]
  },
  {
    id: 22, type: 'question',
    copy: '¿Estás lista para recibir tu plan personalizado que te enseñará a hacer, vender y crear tu propio negocio de bolis gourmet?',
    options: [
      { icon: '🔥', text: '¡Sí, estoy lista!' },
      { icon: '👎', text: 'No estoy lista.' }
    ]
  }
];

// COMPONENTE: QUIZ
function Quiz({ onComplete }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [stats, setStats] = useState([0, 0, 0]);
  const [showAnalysisBtn, setShowAnalysisBtn] = useState(false);

  const step = quizSteps[currentIndex];
  const stepNumber = currentIndex + 1;
  const percentage = Math.round((stepNumber / 23) * 100);

  const handleNext = () => {
    if (currentIndex < quizSteps.length - 1) {
      setAnimating(true);
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
        setAnimating(false);
      }, 300);
    } else {
      onComplete();
    }
  };

  useEffect(() => {
    if (step.type === 'analysis') {
      const targets = step.stats.map(s => s.value);
      setTimeout(() => {
        const interval = setInterval(() => {
          setStats(prev => {
            const next = prev.map((val, i) => {
              if (val < targets[i]) return val + 1;
              return val;
            });
            if (next.every((val, i) => val >= targets[i])) {
              clearInterval(interval);
              setShowAnalysisBtn(true);
            }
            return next;
          });
        }, 30);
      }, 500);
    } else {
      setStats([0, 0, 0]);
      setShowAnalysisBtn(false);
    }
  }, [step]);

  return (
    <div className="w-full max-w-xl mx-auto p-4 flex flex-col items-center mt-10">
      {stepNumber > 1 && (
        <div className="w-full mb-8 animate-fade-in-up">
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2 overflow-hidden shadow-inner">
            <div 
              className="bg-gradient-to-r from-pink-500 to-cyan-400 h-2.5 rounded-full transition-all duration-500" 
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
          <div className="text-center text-sm text-gray-500 font-bold uppercase tracking-wider">
            {stepNumber} de 23 ({percentage}%)
          </div>
        </div>
      )}

      <div className={`w-full bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] p-8 border border-gray-100 transition-opacity duration-300 ${animating ? 'opacity-0' : 'opacity-100 animate-fade-in-up'}`}>
        
        {step.type === 'start' && (
          <div className="text-center">
            <div className="w-full aspect-video bg-gray-100 rounded-xl mb-6 flex items-center justify-center border border-gray-200 shadow-sm relative overflow-hidden group cursor-pointer">
               <div className="absolute inset-0 bg-gradient-to-tr from-pink-100 to-orange-50 opacity-50"></div>
               <img src="https://images.unsplash.com/photo-1570341775730-a175f782f0ca?auto=format&fit=crop&w=600&q=80" alt="Bolis Gourmet" className="w-full h-full object-cover rounded-xl" />
            </div>
            <h1 className="text-2xl font-extrabold text-gray-800 mb-4 whitespace-pre-line leading-tight">
              {step.copy}
            </h1>
            <button 
              onClick={handleNext}
              className="mt-6 w-full py-4 px-6 rounded-full font-bold text-white text-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 active:scale-95 transition-all shadow-[0_4px_15px_rgba(40,167,69,0.3)] hover:shadow-[0_6px_20px_rgba(40,167,69,0.5)]"
            >
              {step.btn}
            </button>
          </div>
        )}

        {step.type === 'question' && (
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-800 mb-8 leading-snug">
              {step.copy}
            </h2>
            <div className={`grid gap-4 w-full ${step.options.length > 3 ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {step.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={handleNext}
                  className="flex items-center gap-4 text-left p-4 rounded-xl border border-gray-200 bg-white hover:border-green-500 hover:bg-green-50 hover:-translate-y-1 transition-all shadow-sm group"
                >
                  <span className="text-2xl min-w-[40px] h-[40px] flex items-center justify-center bg-gray-50 rounded-full group-hover:bg-white">{opt.icon}</span>
                  <span className="font-semibold text-gray-700">{opt.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step.type === 'transition' && (
          <div className="text-center flex flex-col items-center">
            {step.image && (
              <img 
                src={step.image} 
                alt={step.imageAlt || "Imagem ilustrativa"} 
                className="w-full max-w-sm rounded-[30px] border-4 border-gray-100 shadow-2xl mb-8 object-cover transform hover:scale-[1.02] transition-transform duration-500 will-change-transform"
              />
            )}
            <h2 className="text-xl font-medium text-gray-700 mb-8 whitespace-pre-line leading-relaxed">
              {step.copyBold && (
                <span className="font-extrabold block mb-4 text-gray-900">{step.copyBold}</span>
              )}
              <span className="font-medium text-gray-600">{step.copy}</span>
            </h2>
            <button 
              onClick={handleNext}
              className="w-full max-w-[250px] py-4 rounded-full font-bold text-white text-lg bg-green-500 hover:bg-green-600 active:scale-95 transition-all shadow-lg"
            >
              {step.btn}
            </button>
          </div>
        )}

        {step.type === 'analysis' && (
          <div className="text-left w-full">
            <h2 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600 mb-2">
              {step.title}
            </h2>
            <p className="text-gray-500 mb-6 font-medium">{step.subtitle}</p>
            
            <div className="bg-gray-50 border border-gray-100 p-6 rounded-2xl mb-6 shadow-sm">
              <p className="font-bold text-gray-800 mb-6">{step.copy.split('\n')[0]}</p>
              
              <div className="space-y-5">
                {step.stats.map((stat, i) => (
                  <div key={i}>
                    <div className="flex justify-between font-semibold text-gray-700 text-sm mb-1">
                      <span>{stat.label}</span>
                      <span className="text-green-600">{stats[i]}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-green-400 to-cyan-500 h-3 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${stats[i]}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {showAnalysisBtn && (
              <button 
                onClick={handleNext}
                className="w-full py-4 rounded-full font-bold text-white text-lg bg-gradient-to-r from-green-500 to-emerald-600 hover:scale-[1.02] active:scale-95 transition-all shadow-md animate-fade-in-up"
              >
                {step.btn}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// COMPONENTE: VSL
function VSL() {
  const [timeLeft, setTimeLeft] = useState(15 * 60);
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `00:${m}:${s}`;
  };

  const faqs = [
    { q: '¿Necesito tener experiencia?', a: 'No, el método está diseñado para empezar desde cero absoluto.' },
    { q: '¿Cuánto necesito invertir para empezar?', a: 'Muy poco. Con RD$ 1,575 pesos.' },
    { q: '¿Cuánto tiempo toma hacer los bolis?', a: 'Las recetas son súper rápidas, de 15 a 30 minutos.' },
    { q: '¿Puedo trabajar desde casa?', a: '¡Totalmente! Es 100% home office.' },
    { q: '¿Cómo hacer para que no se derrita rápido?', a: 'Dentro del curso enseñamos la "Técnica Secreta".' },
    { q: '¿Y si no me gusta?', a: 'Tienes 7 días de garantía incondicional.' }
  ];

  return (
    <div className="w-full bg-white pb-20 font-sans text-gray-800 animate-fade-in-up">
      {/* Etapa 23 / Video Placeholder */}
      <div className="w-full bg-gray-50 pt-10 pb-8 px-4 text-center border-b border-gray-200">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-orange-400 mb-2">
            ¡Felicidades por llegar hasta aquí!
          </h1>
          <p className="text-lg text-gray-600 mb-8 font-medium">
            Tienes las características y la persistencia de una emprendedora exitosa.
          </p>
          
          <div className="w-full aspect-video bg-gray-900 rounded-2xl shadow-2xl overflow-hidden relative flex flex-col items-center justify-center cursor-pointer group">
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all z-10"></div>
            <i className="fa-solid fa-circle-play text-white text-6xl opacity-90 group-hover:scale-110 transition-transform z-20 shadow-lg rounded-full" style={{textShadow: "0 0 20px rgba(0,0,0,0.5)"}}></i>
            <p className="text-white mt-4 z-20 font-semibold tracking-wide">Haz clic para activar el sonido y ver el video</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 mt-10 space-y-12">
        {/* Seção 1 */}
        <section className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 uppercase tracking-tight">
            🎯 ¡TU ANÁLISIS ESTÁ LISTO!
          </h2>
          <div className="inline-block bg-green-50 border border-green-200 text-green-800 px-6 py-4 rounded-xl font-medium shadow-sm">
            Basado en tus respuestas, tienes el potencial de facturar <br/>
            <strong className="text-xl text-green-600 mt-2 block">RD$ 37,800 - 56,700 pesos en el primer mes.</strong>
          </div>
        </section>

        {/* Seção 2 */}
        <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-xl font-bold mb-5 flex items-center gap-2 border-b pb-3">
            <span className="text-2xl">📊</span> TU PERFIL EMPRENDEDOR
          </h3>
          <ul className="space-y-4 mb-6 text-gray-700">
            <li className="flex items-start gap-3">
              <i className="fa-solid fa-circle-check text-green-500 mt-1"></i>
              <span><strong>SITUACIÓN ACTUAL:</strong> Tener más dinero y libertad.</span>
            </li>
            <li className="flex items-start gap-3">
              <i className="fa-solid fa-circle-check text-green-500 mt-1"></i>
              <span><strong>OBJETIVOS:</strong> Tener más dinero y libertad.</span>
            </li>
            <li className="flex items-start gap-3">
              <i className="fa-solid fa-circle-check text-green-500 mt-1"></i>
              <span><strong>PRINCIPAL PREOCUPACIÓN:</strong> Falta de tiempo.</span>
            </li>
          </ul>
          <div className="bg-gradient-to-r from-pink-50 to-orange-50 p-4 rounded-xl text-center font-bold text-pink-700 border border-pink-100">
            ANÁLISIS: ¡El Método Bolis Rentables es PERFECTO para ti!
          </div>
        </section>

        {/* Seção 3 */}
        <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2 border-b pb-3">
            <span className="text-2xl">🔥</span> TU PLAN PERSONALIZADO (Próximos 30 días)
          </h3>
          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-green-200 before:to-green-500">
            
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-green-500 text-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-md z-10 font-bold text-sm">1</div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-gray-200 bg-gray-50 shadow-sm ml-4 md:ml-0">
                <h4 className="font-bold text-lg text-green-600 mb-1">SEMANA 1</h4>
                <p className="font-bold text-gray-800 mb-2">RD$ 6,300 - 9,450 pesos</p>
                <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                  <li>Primera venta en 48h</li>
                  <li>Prueba 3 sabores más vendidos</li>
                  <li>Primeros 8-10 clientes</li>
                </ul>
              </div>
            </div>

            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-green-500 text-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-md z-10 font-bold text-sm">2</div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-gray-200 bg-gray-50 shadow-sm ml-4 md:ml-0">
                <h4 className="font-bold text-lg text-green-600 mb-1">SEMANA 2</h4>
                <p className="font-bold text-gray-800 mb-2">RD$ 9,450 - 13,860 pesos</p>
                <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                  <li>Clientes vuelven a comprar</li>
                  <li>El boca a boca comienza</li>
                  <li>Las ventas se estabilizan</li>
                </ul>
              </div>
            </div>

            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-green-500 text-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-md z-10 font-bold text-sm">34</div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-gray-200 bg-gray-50 shadow-sm ml-4 md:ml-0">
                <h4 className="font-bold text-lg text-green-600 mb-1">SEMANA 3-4</h4>
                <p className="font-bold text-gray-800 mb-2">RD$ 22,050 - 33,390 pesos</p>
                <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                  <li>70% clientes recurrentes</li>
                  <li>40-60 bolis/día</li>
                  <li>RD$ 1,575 netos/día</li>
                </ul>
              </div>
            </div>

          </div>
          <div className="mt-8 bg-green-600 text-white text-center p-4 rounded-xl font-bold text-xl shadow-lg">
            TOTAL MES 1: RD$ 37,800 - 56,700 pesos
          </div>
        </section>

        {/* Seção 4 */}
        <section className="bg-gray-800 text-white rounded-2xl p-6 shadow-md">
           <h3 className="text-xl font-bold mb-4 flex items-center gap-2 border-b border-gray-700 pb-3">
            <span className="text-2xl">🏁</span> PARA COMENZAR HOY NECESITAS:
          </h3>
          <p className="text-lg font-medium text-green-400 mb-4">Inversión inicial: RD$ 1,575 - 2,205 pesos</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-700 p-3 rounded-xl text-center">
              <span className="block text-sm text-gray-300">Ingredientes</span>
              <strong className="text-lg">RD$ 1,134</strong>
            </div>
            <div className="bg-gray-700 p-3 rounded-xl text-center">
              <span className="block text-sm text-gray-300">Bolsitas</span>
              <strong className="text-lg">RD$ 315</strong>
            </div>
            <div className="bg-gray-700 p-3 rounded-xl text-center">
              <span className="block text-sm text-gray-300">Etiquetas</span>
              <strong className="text-lg">RD$ 189</strong>
            </div>
          </div>
          <div className="bg-yellow-500/20 border border-yellow-500/50 text-yellow-300 p-4 rounded-xl text-center font-bold mb-3 shadow-[0_0_15px_rgba(234,179,8,0.2)]">
            💡 ¡Con solo 15 VENTAS ya recuperas la inversión y tienes ganancia!
          </div>
          <p className="text-center text-gray-400 font-medium">🎯 ¡Después de eso, es solo GANANCIA pura!</p>
        </section>

        {/* Seção 5 */}
        <section className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 text-center">
          <h3 className="text-xl font-bold text-red-600 mb-2 flex items-center justify-center gap-2">
            ⚠️ ¡ATENCIÓN: ÚLTIMOS CUPOS DE ESTE GRUPO!
          </h3>
          <p className="text-gray-700 mb-6">Para garantizar soporte de calidad, abrimos solo <strong>12 CUPOS</strong> en este grupo.</p>
          <div className="mb-6">
            <div className="flex justify-between text-sm font-bold text-gray-700 mb-2">
              <span>Quedan solo:</span>
              <span className="text-red-600 animate-pulse">12 cupos disponibles</span>
            </div>
            <div className="w-full bg-red-100 rounded-full h-3">
              <div className="bg-red-500 h-3 rounded-full" style={{ width: '15%' }}></div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-red-100 shadow-sm inline-block w-full sm:w-auto">
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Este grupo cierra en:</p>
            <div className="text-3xl font-black text-gray-800 font-mono tracking-widest">{formatTime(timeLeft)}</div>
          </div>
        </section>

        {/* Seção 6 */}
        <section>
          <h3 className="text-2xl font-bold text-center mb-6">📊 COMPARATIVO</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-red-200 rounded-2xl bg-white shadow-sm overflow-hidden">
              <div className="bg-red-50 text-red-600 font-bold p-4 text-center border-b border-red-100 flex items-center justify-center gap-2">
                <i className="fa-solid fa-circle-xmark"></i> SIN EL METODO
              </div>
              <ul className="p-5 space-y-3">
                <li className="flex items-center gap-2 text-gray-600 text-sm"><i className="fa-solid fa-circle-xmark text-red-400"></i> Prueba y error</li>
                <li className="flex items-center gap-2 text-gray-600 text-sm"><i className="fa-solid fa-circle-xmark text-red-400"></i> Perder dinero</li>
                <li className="flex items-center gap-2 text-gray-600 text-sm"><i className="fa-solid fa-circle-xmark text-red-400"></i> Bolis aguados</li>
              </ul>
            </div>
            <div className="border-2 border-green-500 rounded-2xl bg-white shadow-lg overflow-hidden relative">
              <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase">Recomendado</div>
              <div className="bg-gradient-to-r from-green-50 to-green-100 text-green-700 font-bold p-4 text-center border-b border-green-200 flex items-center justify-center gap-2">
                <i className="fa-solid fa-circle-check"></i> CON EL METODO
              </div>
              <ul className="p-5 space-y-3">
                <li className="flex items-center gap-2 text-gray-800 font-medium text-sm"><i className="fa-solid fa-circle-check text-green-500"></i> Sistema validado</li>
                <li className="flex items-center gap-2 text-gray-800 font-medium text-sm"><i className="fa-solid fa-circle-check text-green-500"></i> Ganancia desde el día 1</li>
                <li className="flex items-center gap-2 text-gray-800 font-medium text-sm"><i className="fa-solid fa-circle-check text-green-500"></i> Técnica secreta</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Seção 7 */}
        <section className="bg-slate-800 text-white rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 shadow-xl">
           <div className="w-32 h-32 rounded-full overflow-hidden shrink-0 border-4 border-slate-600">
             <img src="https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&h=200&q=80" alt="Maria Soares" className="w-full h-full object-cover"/>
           </div>
           <div>
             <h3 className="text-xl font-bold mb-1">Maria Soares</h3>
             <p className="text-sm text-slate-400 mb-4">Creadora del Método</p>
             <p className="text-slate-200 italic leading-relaxed text-sm">
               "¡Hola! Soy María Soares. Creé el Método Primera Venta en 48h después de ver a muchas mujeres como tú atrapadas en trabajos que no aman."
             </p>
           </div>
        </section>

        {/* CÓDIGO DA OFERTA */}
        <div className="border border-green-500 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(40,167,69,0.15)] bg-white mt-12" id="offer">
          <div className="bg-green-500 text-white text-center py-4 font-black text-xl uppercase tracking-widest">
             MÉTODO BOLIS RENTABLES
          </div>
          <div className="p-6 sm:p-8">
             <div className="text-center mb-8 border-b pb-8">
               <p className="text-gray-400 font-medium text-lg mb-1">De <span className="line-through">RD$ 1,999 pesos</span></p>
               <p className="text-gray-500 font-bold mb-2">por solo</p>
               <div className="text-6xl font-black text-gray-900 mb-2">RD$ 679</div>
               <div className="inline-block bg-green-100 text-green-700 font-bold px-4 py-1 rounded-full text-sm">
                 (Descuento del 66%)
               </div>
             </div>

             <div className="mb-8">
               <h4 className="font-bold text-gray-800 mb-4">✅ Lo que vas a recibir hoy:</h4>
               <ul className="space-y-3">
                 {[
                   'Módulo 1: Cómo empezar desde cero',
                   'Módulo 2: 30+ recetas que más venden',
                   'Módulo 3: Lista de ingredientes',
                   'Acesso vitalício a todo el contenido'
                 ].map((item, i) => (
                   <li key={i} className="flex items-start gap-2 text-sm text-gray-700 border-b border-gray-50 pb-2">
                     <i className="fa-solid fa-check text-green-500 mt-1"></i> {item}
                   </li>
                 ))}
               </ul>
             </div>

             <div className="bg-orange-50 border border-orange-200 rounded-xl p-5 mb-8">
               <h4 className="font-bold text-orange-800 mb-1">🎁 BONOS EXCLUSIVOS</h4>
               <p className="text-sm text-orange-700 mb-4">Lleva GRATIS 4 bonos extras por asegurar tu acceso.</p>
               <div className="space-y-4">
                 {[
                   { t: 'Menú Editable Profesional', p: 'GRATIS, RD$ 756 pesos' },
                   { t: 'Planilla de Precios Inteligente', p: 'GRATIS, RD$ 630 pesos' },
                   { t: 'Certificado Vendedora', p: 'GRATIS, RD$ 945 pesos' },
                   { t: 'Scripts para WhatsApp', p: 'GRATIS, RD$ 630 pesos' },
                 ].map((b,i) => (
                   <div key={i} className="bg-white p-3 rounded-lg border border-orange-100 flex gap-3 shadow-sm">
                     <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center shrink-0 font-bold text-orange-500">#{i+1}</div>
                     <div>
                       <p className="font-bold text-gray-800 text-sm leading-tight mb-1">{b.t}</p>
                       <p className="text-xs text-green-600 font-bold">{b.p}</p>
                     </div>
                   </div>
                 ))}
               </div>
             </div>

             <button className="w-full py-5 rounded-full font-black text-white text-lg sm:text-xl bg-green-500 hover:bg-green-600 transition-all shadow-[0_10px_30px_rgba(40,167,69,0.4)]">
               🔥 QUIERO ASEGURAR MI CUPO AHORA
             </button>
             <p className="text-center text-xs text-gray-400 mt-4 flex items-center justify-center gap-1"><i className="fa-solid fa-lock"></i> Pago Seguro. Acceso Inmediato.</p>
          </div>
        </div>

        {/* Seção 13: Garantia */}
        <section className="bg-white border-2 border-yellow-400 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6 shadow-sm">
          <i className="fa-solid fa-shield-halved text-6xl text-yellow-500"></i>
          <div className="text-center sm:text-left">
            <h3 className="text-xl font-black text-gray-800 mb-2 uppercase tracking-wide">🛡️ GARANTÍA DE 7 DÍAS</h3>
            <p className="text-sm text-gray-600 leading-relaxed font-medium">
              Si por cualquier motivo no te gusta el curso devolveré el 100% del valor invertido. Sin preguntas.
            </p>
          </div>
        </section>

        {/* Seção 14: Social Proof */}
        <section className="text-center">
          <h3 className="text-lg font-bold text-gray-800 mb-2 px-4">
            ⭐ 94% de las Alumnas Recomiendan el Método
          </h3>
          <p className="text-sm font-medium text-gray-500 mb-8 max-w-sm mx-auto flex items-center justify-center gap-2">
            <i className="fa-solid fa-star text-yellow-400"></i> 4.9/5 estrellas (523 evaluaciones)
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center font-bold text-pink-600">CM</div>
                <div>
                  <p className="font-bold text-sm text-gray-800">Carla Méndez</p>
                  <p className="text-xs text-gray-400">@carlita.bolis</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 italic">"Hice mi primera venta el segundo día a mis vecinas. ¡Las recetas son un éxito!"</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center font-bold text-purple-600">RA</div>
                <div>
                  <p className="font-bold text-sm text-gray-800">Roberta Álvarez</p>
                  <p className="text-xs text-gray-400">@ro.alvarez</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 italic">"Los tips para que no se derritan me salvaron. Vendo en mi trabajo sin problemas."</p>
            </div>
          </div>
        </section>

        {/* Seção 15: FAQ */}
        <section className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm">
           <h3 className="text-xl font-bold mb-6 text-center">❓ PREGUNTAS FRECUENTES</h3>
           <div className="space-y-3">
             {faqs.map((faq, idx) => (
               <div key={idx} className="border border-gray-200 rounded-xl overflow-hidden">
                 <button 
                   onClick={() => setOpenFaq(openFaq === idx ? null : idx)} 
                   className="w-full text-left p-4 bg-gray-50 hover:bg-gray-100 flex justify-between items-center transition-colors font-medium text-gray-800 text-sm sm:text-base"
                 >
                   {faq.q}
                   <i className={`fa-solid ${openFaq === idx ? 'fa-chevron-up' : 'fa-chevron-down'} text-gray-500`}></i>
                 </button>
                 {openFaq === idx && (
                   <div className="p-4 bg-white border-t border-gray-200 text-gray-600 text-sm">
                     {faq.a}
                   </div>
                 )}
               </div>
             ))}
           </div>
        </section>

        <div className="text-center pb-8 pt-4">
           <button 
             onClick={() => document.getElementById('offer').scrollIntoView({behavior: 'smooth'})}
             className="w-full py-5 rounded-full font-black text-white text-lg bg-green-500 hover:bg-green-600 transition-all shadow-[0_10px_30px_rgba(40,167,69,0.4)] active:scale-95 flex justify-center uppercase"
           >
             🔥 ¡SÍ, QUIERO COMENZAR HOY!
           </button>
        </div>

        {/* Footer */}
        <footer className="text-center text-xs text-gray-400 border-t border-gray-200 pt-8 pb-4">
           © 2025 Método Bolis Rentables - Todos los derechos reservados
        </footer>
      </div>
    </div>
  );
}

// COMPONENTE PRINCIPAL
function App() {
  const [isQuizComplete, setIsQuizComplete] = useState(false);

  return (
    <div className="w-full flex justify-center items-start min-h-screen">
      {isQuizComplete ? (
        <VSL />
      ) : (
        <Quiz onComplete={() => setIsQuizComplete(true)} />
      )}
    </div>
  );
}

const rootElement = document.getElementById('root');
const root = ReactDOM.createRoot(rootElement);
root.render(<App />);
