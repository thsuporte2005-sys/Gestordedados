export const quizSteps = [
  {
    id: 1,
    type: 'start',
    copy: '¿Te gustaría aprender a preparar bolis gourmet deliciosos?\nListos en menos de 15 minutos y con ingredientes simples.',
    btn: '¡Comenzar ahora!'
  },
  {
    id: 2,
    type: 'question',
    copy: '¿Tienes experiencia haciendo bolis gourmet?',
    options: [
      { icon: '😃', text: 'No, quiero empezar desde cero.' },
      { icon: '😎', text: 'Sí, ya sé algunas cosas.' }
    ]
  },
  {
    id: 3,
    type: 'question',
    copy: '¿Qué prefieres: vender bolis y ganar un ingreso extra o solo hacer para tu familia y amigos?',
    options: [
      { icon: '💰', text: 'Quiero ganar dinero.' },
      { icon: '👨‍👩‍👧', text: 'Solo quiero para uso personal' }
    ]
  },
  {
    id: 4,
    type: 'question',
    copy: '¿Sabías que hoy en día hay muchas personas que ganan dinero vendiendo bolis sin salir de casa?',
    options: [
      { icon: '😁', text: 'Sí' },
      { icon: '☹️', text: 'No' }
    ]
  },
  {
    id: 5,
    type: 'question',
    copy: '¿Alguna vez has sentido que trabajas mucho y el dinero nunca es suficiente?',
    options: [
      { icon: '😣', text: 'Sí, todo el tiempo…' },
      { icon: '😐', text: 'A veces...' },
      { icon: '😁', text: 'No, por suerte me va bien.' }
    ]
  },
  {
    id: 6,
    type: 'transition',
    image: '/imagens/maria_teresa.jpg',
    copyBold: 'Mucho gusto, soy María Teresa...',
    copy: 'Por mucho tiempo, mi vida fue una lucha constante: trabajaba duro, pero el dinero se me escapaba de las manos. Sé lo que es sentir ese nudo en el estómago cuando se acerca el fin de mes y las cuentas no esperan. Mi cocina era el lugar donde solo cocinaba para mi familia, hasta que decidí transformarla en mi propio negocio de Bolis Lucrativos. Hoy, la paz mental volvió a mi hogar: estoy generando cerca de RD$ 194,540 pesos mensuales. Y lo mejor es que no fue suerte, fue un método. ¡Ahora quiero tomarte de la mano y enseñarte exactamente cómo tú también puedes lograrlo!',
    btn: 'Continuar'
  },
  {
    id: 7,
    type: 'question',
    copy: '¿Ya hiciste algún entrenamiento sobre bolis gourmet? ¿O algo relacionado...?',
    options: [
      { icon: '☹️', text: 'Nunca hice.' },
      { icon: '🤩', text: 'Sí, ya hice.' },
      { icon: '😎', text: 'Me gustaría hacer.' }
    ]
  },
  {
    id: 8,
    type: 'question',
    copy: '¿Ya habías escuchado hablar de esta técnica de preparar bolis gourmet?',
    options: [
      { icon: '😍', text: 'Sí' },
      { icon: '👎', text: 'No' }
    ]
  },
  {
    id: 9,
    type: 'question',
    copy: '¿Qué tal aprender a hacerlos en casa y con ingredientes simples?',
    options: [
      { icon: '😫', text: 'Sería mi sueño, pero tengo dificultad…' },
      { icon: '😐', text: 'Sí, pero no sé por dónde empezar.' },
      { icon: '😃', text: 'No sé si esto sería posible.' }
    ]
  },
  {
    id: 10,
    type: 'question',
    copy: '¿Si pudieras ganar dinero haciendo bolis, lo intentarías? ¿Ya imaginaste ganar dinero sin tener que salir de casa?',
    options: [
      { icon: '😃', text: '¡Sí! Quiero mucho.' },
      { icon: '😬', text: 'Tal vez, tengo miedo.' },
      { icon: '👎', text: 'No, solo quiero mejorar mis técnicas.' }
    ]
  },
  {
    id: 11,
    type: 'question',
    copy: '¿Qué es lo que más te impide comenzar un negocio o aprender algo nuevo?',
    options: [
      { icon: '😫', text: 'Falta de tiempo.' },
      { icon: '💰', text: 'Falta de dinero.' },
      { icon: '😥', text: 'Miedo de fracasar.' }
    ]
  },
  {
    id: 12,
    type: 'transition',
    image: '/imagens/bolis_morango.jpg',
    imageAlt: 'Proyecto Bolis Gourmet',
    copy: 'Conoce el "Proyecto Bolis Gourmet"\n\nResponsable de que mujeres de toda la República Dominicana estén generando ingresos desde sus casas. Ana Silva, la creadora, garantiza que cualquier mujer, incluso sin ningún conocimiento previo, puede ganar entre RD$ 1,575 y RD$ 6,300 pesos por día trabajando desde casa. Todo lo que necesitas es menos de RD$ 1,890 pesos para comenzar hoy mismo.',
    btn: 'Continuar'
  },
  {
    id: 13,
    type: 'question',
    copy: 'Si pudieras cambiar algo en tu vida ahora mismo, ¿qué sería?\nSé sincera, es muy importante...',
    options: [
      { icon: '💵', text: 'Tener más dinero y libertad.' },
      { icon: '🕒', text: 'Más tiempo para mí.' },
      { icon: '💖', text: 'Hacer algo que me apasione.' }
    ]
  },
  {
    id: 14,
    type: 'question',
    copy: '¿Cómo evalúas tu conocimiento en bolis gourmet?\nSigue siendo sincera...',
    options: [
      { icon: '🌱', text: 'Cero, quiero empezar.' },
      { icon: '📚', text: 'Intermedio, quiero aprender más.' },
      { icon: '🏆', text: 'Avanzado, ya realizo ventas.' }
    ]
  },
  {
    id: 15,
    type: 'question',
    copy: '¿Cuánto quieres ganar vendiendo bolis?\nEsto es muy importante...',
    options: [
      { icon: '💵', text: 'RD$ 31,500 pesos por mes' },
      { icon: '💰', text: 'Entre RD$ 31,500 y RD$ 94,500' },
      { icon: '💸', text: 'Más de RD$ 94,500 pesos' }
    ]
  },
  {
    id: 16,
    type: 'analysis',
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
    id: 17,
    type: 'question',
    copy: '¿Si existiera un entrenamiento paso a paso para aprender a hacer y vender bolis gourmet, lo harías?',
    options: [
      { icon: '🙌', text: '¡Sí, inmediatamente!' },
      { icon: '🤔', text: 'Me gustaría saber más.' },
      { icon: '😐', text: 'No' }
    ]
  },
  {
    id: 18,
    type: 'question',
    copy: '¿Estarías dispuesta a invertir algunas horas por semana para aprender y practicar en casa?',
    options: [
      { icon: '✅', text: 'Sí, puedo hacerlo.' },
      { icon: '🕐', text: 'Tal vez, si tengo tiempo.' },
      { icon: '🚫', text: 'No, estoy muy ocupada.' }
    ]
  },
  {
    id: 19,
    type: 'question',
    copy: '¿Te gustaría tener un acompañamiento directo en tu WhatsApp para crear tu propio negocio? Sé sincera...',
    options: [
      { icon: '😀', text: '¡Sí, lo necesito!' },
      { icon: '🙂', text: 'No, solo quiero hacer por diversión.' },
      { icon: '🤔', text: 'Tal vez más adelante.' }
    ]
  },
  {
    id: 20,
    type: 'question',
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
    id: 21,
    type: 'question',
    copy: '¿Cuál es la primera cosa que vas a hacer cuando empieces a ganar dinero con tus bolis?',
    options: [
      { icon: '💸', text: 'Pagar mis deudas.' },
      { icon: '🏠', text: 'Ayudar en casa.' },
      { icon: '🎉', text: 'Ahorrar y darme un regalo' }
    ]
  },
  {
    id: 22,
    type: 'question',
    copy: '¿Estás lista para recibir tu plan personalizado que te enseñará a hacer, vender y crear tu propio negocio de bolis gourmet?',
    options: [
      { icon: '🔥', text: '¡Sí, estoy lista!' },
      { icon: '👎', text: 'No estoy lista.' }
    ]
  }
];
