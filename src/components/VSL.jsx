import React, { useState, useEffect } from 'react';
import { 
  PlayCircle, CheckCircle2, XCircle, Clock, Wallet, 
  Calendar, ShieldCheck, Star, ChevronDown, ChevronUp, Lock
} from 'lucide-react';

export default function VSL() {
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
    { q: '¿Necesito tener experiencia?', a: 'No, el método está diseñado para empezar desde cero absoluto, incluso si nunca has cocinado.' },
    { q: '¿Cuánto necesito invertir para empezar?', a: 'Muy poco. Con RD$ 1,575 pesos ya puedes comprar los ingredientes iniciales y empezar a vender.' },
    { q: '¿Cuánto tiempo toma hacer los bolis?', a: 'Las recetas son súper rápidas. En menos de 15 a 30 minutos tendrás tus primeros lotes listos para congelar.' },
    { q: '¿Puedo trabajar desde casa?', a: '¡Totalmente! Es 100% home office, solo necesitas tu refrigerador y dedicación.' },
    { q: '¿Cómo hacer para que no se derrita rápido?', a: 'Dentro del curso enseñamos la "Técnica Secreta" para que duren mucho más sin perder textura ni sabor.' },
    { q: '¿Y si no me gusta?', a: 'Tienes 7 días de garantía incondicional. Si no te gusta, te devolvemos tu dinero.' }
  ];

  return (
    <div className="w-full bg-transparent pb-20 font-sans text-gray-800 animate-fade-in-up mt-10 md:mt-16">
      
      {/* Etapa 23 / Video Placeholder */}
      <div className="w-full max-w-4xl mx-auto px-4 text-center mb-16">
        <h1 className="text-3xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-cyan-500 mb-4 leading-tight">
          ¡Felicidades por llegar hasta aquí!
        </h1>
        <p className="text-lg md:text-xl text-gray-600 mb-10 font-bold max-w-2xl mx-auto">
          Tienes las características y la persistencia de una emprendedora exitosa.
        </p>
        
        {/* Vídeo VSL Placeholder (Vturb) ajustado às regras do usuário */}
        <div className="w-full aspect-video bg-gray-900 rounded-xl shadow-md drop-shadow-xl overflow-hidden relative flex flex-col items-center justify-center cursor-pointer group border-4 border-white">
          {/* Deixando lacuna para adicionar imagem de thumb do vídeo ou iframe do Vturb embed */}
          <img src="https://images.unsplash.com/photo-1543362906-acfc16c67564?auto=format&fit=crop&w=1200&q=80" alt="Video Thumbnail Placeholder" className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" />
          <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-all z-10 block"></div>
          <PlayCircle className="text-white w-24 h-24 opacity-95 group-hover:scale-110 transition-transform z-20 drop-shadow-2xl" fill="rgba(0,0,0,0.6)" />
          <p className="text-white mt-6 z-20 font-bold tracking-wider text-sm md:text-lg bg-black/50 px-4 py-2 rounded-full">► HAZ CLIC PARA ESCUCHAR</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 space-y-12">
        
        {/* Seção 1: Análise e Potencial */}
        <section className="text-center bg-white rounded-3xl shadow-2xl p-8 md:p-12 border border-gray-100">
          <h2 className="text-2xl font-black text-gray-800 mb-6 uppercase tracking-tight flex items-center justify-center gap-2">
            <span className="text-3xl">🎯</span> ¡TU ANÁLISIS ESTÁ LISTO!
          </h2>
          <div className="inline-block bg-[#28a745]/10 border-2 border-[#28a745]/20 text-gray-700 px-6 py-6 rounded-2xl font-medium shadow-sm w-full md:w-3/4 mx-auto">
            Basado en tus respuestas, tienes el potencial de facturar <br/>
            <strong className="text-2xl md:text-3xl text-[#28a745] mt-4 block font-black">RD$ 37,800 - 56,700 pesos</strong>
            <span className="text-gray-500 font-bold block mt-1">en el primer mes.</span>
          </div>
        </section>

        {/* Seção 2: Perfil Empreendedor */}
        <section className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 border border-gray-100">
          <h3 className="text-2xl font-black mb-8 flex items-center gap-3 border-b-2 border-gray-100 pb-4 text-gray-800">
            <span className="text-3xl">📊</span> TU PERFIL EMPRENDEDOR
          </h3>
          <ul className="space-y-6 mb-8 text-gray-700 text-lg">
            <li className="flex items-start gap-4">
              <CheckCircle2 className="text-[#28a745] shrink-0 w-8 h-8 drop-shadow-sm" />
              <span><strong className="text-gray-900 block mb-1">SITUACIÓN ACTUAL:</strong> Tener más dinero y libertad.</span>
            </li>
            <li className="flex items-start gap-4">
              <CheckCircle2 className="text-[#28a745] shrink-0 w-8 h-8 drop-shadow-sm" />
              <span><strong className="text-gray-900 block mb-1">OBJETIVOS:</strong> Tener más dinero y libertad.</span>
            </li>
            <li className="flex items-start gap-4">
              <CheckCircle2 className="text-[#28a745] shrink-0 w-8 h-8 drop-shadow-sm" />
              <span><strong className="text-gray-900 block mb-1">PRINCIPAL PREOCUPACIÓN:</strong> Falta de tiempo.</span>
            </li>
          </ul>
          <div className="bg-gradient-to-r from-pink-500 to-pink-600 p-5 rounded-xl text-center font-black text-white shadow-lg text-lg transform hover:scale-[1.02] transition-transform">
            ANÁLISIS: ¡El Método Bolis Rentables es PERFECTO para ti!
          </div>
        </section>

        {/* Seção 3: Plano Personalizado */}
        <section className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 border border-gray-100">
          <h3 className="text-2xl font-black mb-10 flex items-center gap-3 border-b-2 border-gray-100 pb-4 text-gray-800">
            <span className="text-3xl">🔥</span> TU PLAN PERSONALIZADO (30 días)
          </h3>
          <div className="space-y-8 relative before:absolute before:inset-0 before:ml-6 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-1 before:bg-gray-200">
            
            {/* Week 1 */}
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-12 h-12 rounded-full border-4 border-white bg-[#28a745] text-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-lg z-10 font-bold text-lg drop-shadow-md">1</div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] p-6 rounded-2xl border border-gray-100 bg-gray-50 shadow-md ml-6 md:ml-0 hover:shadow-lg transition-shadow">
                <h4 className="font-extrabold text-xl text-[#28a745] mb-2 uppercase">SEMANA 1</h4>
                <p className="font-black text-gray-900 mb-3 text-lg">RD$ 6,300 - 9,450 pesos</p>
                <ul className="text-base text-gray-600 space-y-2 list-disc list-inside font-medium border-t border-gray-200 pt-3">
                  <li>Primera venta en 48h</li>
                  <li>Prueba 3 sabores más vendidos</li>
                  <li>Primeros 8-10 clientes</li>
                </ul>
              </div>
            </div>

            {/* Week 2 */}
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-12 h-12 rounded-full border-4 border-white bg-[#28a745] text-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-lg z-10 font-bold text-lg drop-shadow-md">2</div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] p-6 rounded-2xl border border-gray-100 bg-gray-50 shadow-md ml-6 md:ml-0 hover:shadow-lg transition-shadow">
                <h4 className="font-extrabold text-xl text-[#28a745] mb-2 uppercase">SEMANA 2</h4>
                <p className="font-black text-gray-900 mb-3 text-lg">RD$ 9,450 - 13,860 pesos</p>
                <ul className="text-base text-gray-600 space-y-2 list-disc list-inside font-medium border-t border-gray-200 pt-3">
                  <li>Clientes vuelven a comprar</li>
                  <li>El boca a boca comienza</li>
                  <li>Las ventas se estabilizan</li>
                </ul>
              </div>
            </div>

            {/* Week 3-4 */}
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-12 h-12 rounded-full border-4 border-white bg-[#28a745] text-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-lg z-10 font-bold text-sm drop-shadow-md leading-none text-center">3<br/>4</div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] p-6 rounded-2xl border border-gray-100 bg-gray-50 shadow-md ml-6 md:ml-0 hover:shadow-lg transition-shadow">
                <h4 className="font-extrabold text-xl text-[#28a745] mb-2 uppercase">SEMANA 3-4</h4>
                <p className="font-black text-gray-900 mb-3 text-lg">RD$ 22,050 - 33,390 pesos</p>
                <ul className="text-base text-gray-600 space-y-2 list-disc list-inside font-medium border-t border-gray-200 pt-3">
                  <li>70% clientes recurrentes</li>
                  <li>40-60 bolis/día</li>
                  <li>RD$ 1,575 netos/día</li>
                </ul>
              </div>
            </div>

          </div>
          <div className="mt-12 bg-gray-900 text-white text-center p-6 rounded-2xl font-black text-2xl shadow-xl flex items-center justify-center gap-3">
            <Wallet className="w-8 h-8 text-[#28a745]" />
            TOTAL MES 1: RD$ 37,800 - 56,700 pesos
          </div>
        </section>

        {/* Seção 4: Investimento Inicial */}
        <section className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 border border-gray-100">
           <h3 className="text-2xl font-black mb-6 flex items-center gap-3 border-b-2 border-gray-100 pb-4 text-gray-800">
            <span className="text-3xl">🏁</span> PARA COMENZAR HOY NECESITAS:
          </h3>
          <div className="bg-blue-50 border border-blue-100 p-5 rounded-xl text-center mb-8">
            <p className="text-xl font-bold text-blue-900">Inversión inicial Total: <span className="text-black font-black">RD$ 1,575 - 2,205 pesos</span></p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gray-50 border border-gray-200 p-6 rounded-2xl text-center shadow-sm hover:shadow-md transition-shadow">
              <div className="w-16 h-16 mx-auto bg-white rounded-full flex items-center justify-center mb-3 shadow-sm border border-gray-100 text-3xl">🍓</div>
              <span className="block text-sm text-gray-500 font-bold uppercase mb-1">Ingredientes</span>
              <strong className="text-2xl font-black text-gray-900">RD$ 1,134</strong>
            </div>
            <div className="bg-gray-50 border border-gray-200 p-6 rounded-2xl text-center shadow-sm hover:shadow-md transition-shadow">
              <div className="w-16 h-16 mx-auto bg-white rounded-full flex items-center justify-center mb-3 shadow-sm border border-gray-100 text-3xl">🛍️</div>
              <span className="block text-sm text-gray-500 font-bold uppercase mb-1">Bolsitas</span>
              <strong className="text-2xl font-black text-gray-900">RD$ 315</strong>
            </div>
            <div className="bg-gray-50 border border-gray-200 p-6 rounded-2xl text-center shadow-sm hover:shadow-md transition-shadow">
              <div className="w-16 h-16 mx-auto bg-white rounded-full flex items-center justify-center mb-3 shadow-sm border border-gray-100 text-3xl">🏷️</div>
              <span className="block text-sm text-gray-500 font-bold uppercase mb-1">Etiquetas</span>
              <strong className="text-2xl font-black text-gray-900">RD$ 189</strong>
            </div>
          </div>
          
          <div className="bg-[#28a745]/10 border-2 border-[#28a745]/30 text-green-900 p-6 rounded-2xl text-center font-black text-lg mb-4">
            💡 ¡Con solo 15 VENTAS ya recuperas la inversión y tienes ganancia!
          </div>
          <p className="text-center text-gray-500 font-bold uppercase tracking-widest text-sm">🎯 ¡Después de eso, es solo GANANCIA pura!</p>
        </section>

        {/* Seção 5: Escassez e Urgência */}
        <section className="bg-red-50 border-4 border-red-200 rounded-3xl p-8 md:p-12 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-red-500 animate-pulse"></div>
          <h3 className="text-2xl md:text-3xl font-black text-red-600 mb-4 flex items-center justify-center gap-3">
            ⚠️ ¡ÚLTIMOS CUPOS DE ESTE GRUPO!
          </h3>
          <p className="text-gray-800 text-lg mb-8 font-medium max-w-xl mx-auto">Para garantizar soporte de calidad, abrimos solo <strong className="bg-red-200 px-2 py-1 rounded">12 CUPOS</strong> en este grupo.</p>
          
          <div className="mb-8 max-w-md mx-auto">
            <div className="flex justify-between text-sm font-bold text-gray-700 mb-2">
              <span>Quedan solo:</span>
              <span className="text-red-600 font-black text-lg">12 cupos disponibles</span>
            </div>
            <div className="w-full bg-red-200 rounded-full h-4 shadow-inner">
              <div className="bg-red-600 h-4 rounded-full" style={{ width: '15%' }}></div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border-2 border-red-100 shadow-lg inline-block w-full sm:w-auto transform hover:scale-105 transition-transform">
            <p className="text-sm font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center justify-center gap-2"><Clock className="w-4 h-4"/> Este grupo cierra en:</p>
            <div className="text-5xl font-black text-red-600 font-mono tracking-widest drop-shadow-sm">{formatTime(timeLeft)}</div>
          </div>
          <p className="text-sm font-bold text-gray-500 mt-6 flex items-center justify-center gap-2">
            <Calendar className="w-4 h-4" /> 📅 Próximo grupo: Solo en 45 días (Y más caro)
          </p>
        </section>

        {/* Seção 6: Comparativo */}
        <section className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 border border-gray-100">
          <h3 className="text-3xl font-black text-center mb-10 text-gray-800">📊 COMPARATIVO</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-gray-200 rounded-2xl bg-gray-50 shadow-sm overflow-hidden">
              <div className="bg-gray-200 text-gray-500 font-black p-5 text-center text-lg flex items-center justify-center gap-2">
                <XCircle className="w-6 h-6"/> SIN EL METODO
              </div>
              <ul className="p-6 space-y-4">
                <li className="flex items-center gap-3 text-gray-500 font-semibold"><XCircle className="text-gray-400 w-5 h-5 shrink-0" /> Prueba y error</li>
                <li className="flex items-center gap-3 text-gray-500 font-semibold"><XCircle className="text-gray-400 w-5 h-5 shrink-0" /> Perder dinero en ingredientes</li>
                <li className="flex items-center gap-3 text-gray-500 font-semibold"><XCircle className="text-gray-400 w-5 h-5 shrink-0" /> No sabes cómo vender</li>
                <li className="flex items-center gap-3 text-gray-500 font-semibold"><XCircle className="text-gray-400 w-5 h-5 shrink-0" /> Bolis aguados que se derriten</li>
              </ul>
            </div>
            
            <div className="border-4 border-[#28a745] rounded-2xl bg-white shadow-xl overflow-hidden relative transform md:-translate-y-2">
              <div className="absolute top-0 right-0 bg-[#28a745] text-white text-[10px] font-black px-4 py-1 rounded-bl-xl uppercase tracking-widest shadow-md">Recomendado</div>
              <div className="bg-[#28a745]/10 text-[#28a745] font-black p-5 text-center text-lg flex items-center justify-center gap-2 border-b border-[#28a745]/20">
                <CheckCircle2 className="w-6 h-6" /> CON EL METODO
              </div>
              <ul className="p-6 space-y-4">
                <li className="flex items-center gap-3 text-gray-900 font-bold"><CheckCircle2 className="text-[#28a745] w-6 h-6 shrink-0" /> Sistema validado paso a paso</li>
                <li className="flex items-center gap-3 text-gray-900 font-bold"><CheckCircle2 className="text-[#28a745] w-6 h-6 shrink-0" /> Ganancia desde el día 1</li>
                <li className="flex items-center gap-3 text-gray-900 font-bold"><CheckCircle2 className="text-[#28a745] w-6 h-6 shrink-0" /> Scripts probados para vender</li>
                <li className="flex items-center gap-3 text-gray-900 font-bold"><CheckCircle2 className="text-[#28a745] w-6 h-6 shrink-0" /> Técnica anti-derretimiento</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Seção 7: Depoimento Criadora */}
        <section className="bg-gray-900 text-white rounded-3xl shadow-2xl p-8 md:p-12 flex flex-col md:flex-row items-center gap-8 md:gap-12 border-4 border-gray-800">
           <div className="w-40 h-40 md:w-48 md:h-48 rounded-xl overflow-hidden shrink-0 border-4 border-pink-500 shadow-md drop-shadow-xl bg-white">
             {/* Lacuna Imagem M. Soares */}
             <img src="https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&h=400&q=80" alt="Maria Soares - Bolis Rentables" className="w-full h-full object-cover"/>
           </div>
           <div className="text-center md:text-left">
             <h3 className="text-3xl font-black mb-2 flex items-center justify-center md:justify-start gap-2">Maria Soares <ShieldCheck className="text-blue-400 w-6 h-6"/></h3>
             <p className="text-sm text-gray-400 mb-6 font-bold uppercase tracking-widest">Creadora - Bolis Rentables</p>
             <p className="text-gray-200 italic leading-relaxed text-lg md:text-xl font-medium border-l-4 border-pink-500 pl-4 md:pl-6 text-left">
               "¡Hola! Soy María Soares. Creé el Método Primera Venta en 48h después de ver a muchas mujeres como tú atrapadas en trabajos que no aman. Hoy ayudo a + de 1.500 alumnas a facturar hasta RD$ 56,700 pesos/mes vendiendo desde casa."
             </p>
           </div>
        </section>

        {/* CÓDIGO DA OFERTA (Sections 8 a 12) */}
        <div className="rounded-3xl overflow-hidden shadow-2xl bg-white mt-16 border-2 border-[#28a745]" id="offer">
          
          <div className="bg-gradient-to-r from-[#218838] to-[#28a745] text-white text-center py-6 font-black text-2xl uppercase tracking-widest shadow-inner">
             MÉTODO BOLIS RENTABLES
          </div>

          <div className="p-8 md:p-12">
             
             {/* Preços Header */}
             <div className="text-center mb-12">
               <p className="text-gray-400 font-bold text-xl mb-2 uppercase tracking-wide">Valor Original <span className="line-through">RD$ 1,999 pesos</span></p>
               <p className="text-gray-800 font-black mb-2 text-2xl">SOLO POR HOY:</p>
               <div className="text-7xl font-black text-[#28a745] mb-4 drop-shadow-sm">RD$ 679</div>
               <div className="inline-block bg-yellow-400 text-yellow-900 font-black px-6 py-2 rounded-full text-base shadow-md transform -rotate-2">
                 ⚡ Descuento Seguro del 66% ⚡
               </div>
             </div>

             {/* Seção 9: Conteúdo */}
             <div className="mb-12 bg-gray-50 p-8 rounded-3xl border border-gray-200">
               <h4 className="font-black text-gray-900 mb-6 text-xl">✅ Lo que exactamente vas a recibir:</h4>
               <ul className="space-y-4">
                 {[
                   'Módulo 1: Cómo empezar desde cero',
                   'Módulo 2: 30+ recetas que más venden (cremosos, frutas, exóticos)',
                   'Módulo 3: Lista completa de ingredientes',
                   'Módulo 4: Modo de preparación detallado paso a paso',
                   'Módulo 5: Método Primera Venta en 48h',
                   'Módulo 6: Cómo transformar clientes ocasionales',
                   'Módulo 7: Cómo vender en Instagram',
                   'Acceso vitalicio a todo el contenido'
                 ].map((item, i) => (
                   <li key={i} className="flex items-start gap-4 text-base md:text-lg text-gray-700 font-semibold border-b border-gray-200 pb-3">
                     <CheckCircle2 className="w-6 h-6 text-[#28a745] shrink-0" /> {item}
                   </li>
                 ))}
               </ul>
             </div>

             {/* Seção 10: Bonus */}
             <div className="bg-gradient-to-br from-orange-50 to-pink-50 border border-orange-100 rounded-3xl p-8 mb-12 shadow-inner">
               <h4 className="font-black text-orange-900 mb-2 text-2xl">🎁 4 BONOS EXCLUSIVOS</h4>
               <p className="text-base text-orange-800 mb-8 font-bold">Si aseguras tu acceso HOY, llevarás GRATIS bonos evaluados en RD$ 2,961 pesos:</p>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* Bônus Itens usando Lacunas de Imagens (rounded-xl, shadow-md, drop-shadow) */}
                 {[
                   { t: 'Menú Editable Profesional', p: 'VALE RD$ 756', desc: 'Template Canva 100% personalizable.', img: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=300&h=200&fit=crop' },
                   { t: 'Planilla Precios Inteligente', p: 'VALE RD$ 630', desc: 'Calcula gasto y ganancia exactos.', img: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=300&h=200&fit=crop' },
                   { t: 'Certificado de Vendedora', p: 'VALE RD$ 945', desc: 'Reconoce tu esfuerzo profesional.', img: 'https://images.unsplash.com/photo-1589330694653-efa64f84d62b?w=300&h=200&fit=crop' },
                   { t: 'Scripts WhatsApp', p: 'VALE RD$ 630', desc: 'Mensajes probados que venden.', img: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=300&h=200&fit=crop' },
                 ].map((b,i) => (
                   <div key={i} className="bg-white p-5 rounded-2xl border border-orange-100 shadow-md flex flex-col gap-4">
                     <div className="w-full text-center">
                        <span className="inline-block bg-orange-500 text-white font-black px-3 py-1 rounded-full text-xs mb-3 shadow-sm transform -translate-y-2">BONO #{i+1} GRATIS</span>
                     </div>
                     <img src={b.img} alt={b.t} className="w-full h-32 object-cover rounded-xl shadow-md drop-shadow max-w-[200px] mx-auto border border-gray-100" />
                     <div className="text-center">
                       <p className="font-extrabold text-gray-900 text-lg mb-1 leading-tight">{b.t}</p>
                       <p className="text-sm text-gray-500 mb-2 font-medium">{b.desc}</p>
                       <p className="text-xs text-orange-600 font-bold bg-orange-50 inline-block px-2 py-1 rounded line-through">{b.p}</p>
                     </div>
                   </div>
                 ))}
               </div>
             </div>

             {/* Seção 11: Resumo Oferta */}
             <div className="text-center bg-gray-50 rounded-3xl p-8 md:p-12 mb-8 border-2 border-dashed border-gray-300">
               <h4 className="font-black text-gray-900 mb-4 text-2xl uppercase">💰 RESUMEN DE LA OFERTA HOY</h4>
               <p className="text-base md:text-lg text-gray-600 mb-6 font-bold">Valor Total Real: <span className="line-through text-red-500">RD$ 2,961 pesos</span><br/>Pero nosotros te lo rebajamos a 👇</p>
               
               <div className="text-6xl font-black text-[#28a745] mb-2 drop-shadow-md">RD$ 679</div>
               <p className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6">pago único · al contado</p>

               <div className="bg-red-100 border border-red-200 text-red-700 text-base font-bold p-4 rounded-xl mb-4 max-w-sm mx-auto shadow-inner">
                 ⚠️ Atención: Quedan solo 12 cupos para finalizar
               </div>
               <p className="text-sm font-black text-red-600 flex items-center justify-center gap-2"><Clock className="w-4 h-4"/> Descuento válido por: {formatTime(timeLeft)}</p>
             </div>

             {/* Seção 12: CTA Final */}
             <button className="w-full py-6 rounded-xl border-none font-black text-white text-xl sm:text-2xl bg-[#28a745] hover:scale-[1.02] hover:shadow-2xl active:scale-95 active:shadow-md transition-all duration-300 flex flex-col items-center justify-center shadow-[0_15px_40px_rgba(40,167,69,0.4)] relative overflow-hidden group">
               <span className="relative z-10 flex items-center gap-3">🔥 SÍ, QUIERO ASEGURAR MI CUPO</span>
               <div className="absolute top-0 -inset-full h-full w-1/2 z-0 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 group-hover:animate-shine"></div>
             </button>
             <p className="text-center text-sm font-bold text-gray-500 mt-6 flex items-center justify-center gap-2"><Lock className="w-4 h-4"/> Compra 100% Segura. Acceso Inmediato en tu Email.</p>
          </div>
        </div>

        {/* Seção 13: Garantia */}
        <section className="bg-white rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center md:items-start gap-8 shadow-2xl border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-yellow-400"></div>
          <div className="w-24 h-24 md:w-32 md:h-32 bg-yellow-50 rounded-full flex items-center justify-center shrink-0 border-4 border-yellow-100 shadow-inner">
             <ShieldCheck className="w-12 h-12 md:w-16 md:h-16 text-yellow-500" />
          </div>
          <div className="text-center md:text-left">
            <h3 className="text-2xl md:text-3xl font-black text-gray-900 mb-4 uppercase tracking-tight">🛡️ GARANTÍA BLINDADA 7 DÍAS</h3>
            <p className="text-base md:text-lg text-gray-600 leading-relaxed font-semibold">
              Confío tanto en este entrenamiento que asumo todos los riesgos por ti. Tienes 7 días para probar y ver los resultados por ti misma. Si por cualquier motivo no te gusta el curso, mi didáctica o incluso mi voz, devolveré el 100% del valor invertido. Sin preguntas. Sin burocracia. El riesgo es todo mío. La decisión es tuya.
            </p>
          </div>
        </section>

        {/* Seção 14: Social Proof */}
        <section className="text-center">
          <h3 className="text-2xl md:text-3xl font-black text-gray-900 mb-4 px-4">
            ⭐ 94% de Alumnas Recomiendan la Guía
          </h3>
          <p className="text-base md:text-lg font-bold text-gray-500 mb-10 max-w-sm mx-auto flex items-center justify-center gap-2">
            <Star className="text-yellow-400 w-6 h-6 fill-current drop-shadow"/> 4.9/5 estrellas (523 evaluaciones)
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            {/* Depoimento 1 */}
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl hover:shadow-2xl transition-shadow">
              <div className="flex items-center gap-4 mb-4 border-b border-gray-50 pb-4">
                <div className="w-14 h-14 bg-pink-100 rounded-full shadow-md flex items-center justify-center font-black text-xl text-pink-600 overflow-hidden">
                  <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop" alt="Carla" className="w-full h-full object-cover"/>
                </div>
                <div>
                  <p className="font-black text-lg text-gray-900 leading-none mb-1">Carla Méndez</p>
                  <p className="text-sm font-bold text-[#28a745]">@carlita.bolis</p>
                </div>
              </div>
              <div className="flex text-yellow-400 mb-4 shrink-0"><Star className="w-4 h-4 fill-current"/><Star className="w-4 h-4 fill-current"/><Star className="w-4 h-4 fill-current"/><Star className="w-4 h-4 fill-current"/><Star className="w-4 h-4 fill-current"/></div>
              <p className="text-base text-gray-700 italic font-medium leading-relaxed">"Gente, no lo creía, pero hice mi primera venta el segundo día a mis vecinas. ¡Las recetas del Módulo 2 son un éxito brutal!"</p>
            </div>
            
            {/* Depoimento 2 */}
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl hover:shadow-2xl transition-shadow">
              <div className="flex items-center gap-4 mb-4 border-b border-gray-50 pb-4">
                <div className="w-14 h-14 bg-purple-100 rounded-full shadow-md flex items-center justify-center font-black text-xl text-purple-600 overflow-hidden">
                  <img src="https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=100&h=100&fit=crop" alt="Roberta" className="w-full h-full object-cover"/>
                </div>
                <div>
                  <p className="font-black text-lg text-gray-900 leading-none mb-1">Roberta Álvarez</p>
                  <p className="text-sm font-bold text-[#28a745]">@ro_gourmet_</p>
                </div>
              </div>
              <div className="flex text-yellow-400 mb-4 shrink-0"><Star className="w-4 h-4 fill-current"/><Star className="w-4 h-4 fill-current"/><Star className="w-4 h-4 fill-current"/><Star className="w-4 h-4 fill-current"/><Star className="w-4 h-4 fill-current"/></div>
              <p className="text-base text-gray-700 italic font-medium leading-relaxed">"Los tips para que no se derritan rápido me salvaron la vida. Ahora vendo incluso en el parque y las ganancias son constantes."</p>
            </div>
          </div>
        </section>

        {/* Seção 15: FAQ */}
        <section className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 border border-gray-100">
           <h3 className="text-3xl font-black mb-8 text-center text-gray-900">❓ PREGUNTAS FRECUENTES</h3>
           <div className="space-y-4">
             {faqs.map((faq, idx) => (
               <div key={idx} className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                 <button 
                   onClick={() => setOpenFaq(openFaq === idx ? null : idx)} 
                   className="w-full text-left p-6 bg-gray-50 hover:bg-gray-100 flex justify-between items-center transition-colors font-bold text-gray-900 text-base md:text-lg"
                 >
                   {faq.q}
                   {openFaq === idx ? <ChevronUp className="w-6 h-6 text-[#28a745]" /> : <ChevronDown className="w-6 h-6 text-gray-400" />}
                 </button>
                 {openFaq === idx && (
                   <div className="p-6 bg-white border-t border-gray-100 text-gray-600 text-base font-medium leading-relaxed">
                     {faq.a}
                   </div>
                 )}
               </div>
             ))}
           </div>
        </section>

        {/* Seção 16: Chamada Final Repetida */}
        <div className="text-center pb-8 pt-8 max-w-xl mx-auto">
           <button 
             onClick={() => document.getElementById('offer').scrollIntoView({behavior: 'smooth'})}
             className="w-full py-6 rounded-xl border-none font-black text-white text-xl md:text-2xl bg-[#28a745] hover:scale-[1.02] hover:shadow-2xl active:scale-95 active:shadow-md transition-all duration-300 flex justify-center uppercase shadow-[0_15px_40px_rgba(40,167,69,0.4)]"
           >
             🔥 ¡SÍ, QUIERO COMENZAR HOY!
           </button>
        </div>

        {/* Seção 17: Rodapé */}
        <footer className="text-center text-sm font-bold text-gray-400 border-t border-gray-200 pt-10 pb-6">
           © 2025 Método Bolis Rentables - Todos los derechos reservados
           <div className="mt-4 flex justify-center gap-6">
             <a href="#" className="hover:text-gray-600 hover:underline transition-all">Términos de Uso</a>
             <a href="#" className="hover:text-gray-600 hover:underline transition-all">Privacidad</a>
           </div>
        </footer>
      </div>
    </div>
  );
}
