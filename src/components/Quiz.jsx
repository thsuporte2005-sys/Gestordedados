import React, { useState, useEffect } from 'react';
import { quizSteps } from '../data/quizSteps';
import { PlayCircle } from 'lucide-react';

export default function Quiz({ onComplete }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [stats, setStats] = useState([0, 0, 0]);
  const [showAnalysisBtn, setShowAnalysisBtn] = useState(false);

  const step = quizSteps[currentIndex];
  // Calculate percentage: we have 22 steps total, plus step 23 which is VSL
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
    <div className="w-full max-w-2xl mx-auto p-4 flex flex-col items-center mt-10 md:mt-20">
      {/* Progress Bar Header */}
      {stepNumber > 1 && (
        <div className="w-full mb-10 animate-fade-in-up">
          <div className="text-center text-sm text-gray-500 font-bold uppercase tracking-wider mb-3">
            {stepNumber} de 23 ({percentage}%)
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
            <div 
              className="bg-gradient-to-r from-pink-500 to-cyan-400 h-3 rounded-full transition-all duration-500 ease-out" 
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Main Content Container / Card */}
      <div 
        className={`w-full bg-white rounded-3xl shadow-2xl p-8 md:p-12 border border-gray-50 transition-opacity duration-300 ${animating ? 'opacity-0 scale-95' : 'opacity-100 scale-100 animate-fade-in-up'}`}
      >
        {step.type === 'start' && (
          <div className="text-center flex flex-col items-center">
            {/* Imagem Placeholder */}
            <div className="w-full max-w-md bg-gray-100 rounded-xl mb-8 flex items-center justify-center relative overflow-hidden shadow-md drop-shadow-lg p-2 bg-white">
               {/* Deixando lacuna para adicionar imagem real: Substitua o src pela URL da imagem */}
               <img src="https://images.unsplash.com/photo-1570341775730-a175f782f0ca?auto=format&fit=crop&w=600&q=80" alt="Bolis Gourmet Placeholder" className="w-full h-auto object-cover rounded-lg" />
            </div>
            
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-800 mb-6 leading-tight">
              {step.copy}
            </h1>
            
            <button 
              onClick={handleNext}
              className="mt-4 w-full md:w-3/4 py-4 px-6 rounded-xl font-bold border-none text-white text-lg bg-[#28a745] hover:scale-105 hover:shadow-lg active:scale-95 active:shadow-md transition-all duration-300 flex items-center justify-center gap-2"
            >
              🚀 {step.btn}
            </button>
          </div>
        )}

        {step.type === 'question' && (
          <div className="text-center">
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-8 leading-snug">
              {step.copy}
            </h2>
            <div className={`grid gap-4 w-full ${step.options.length > 3 ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {step.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={handleNext}
                  className="flex items-center gap-4 text-left p-5 rounded-2xl border-2 border-gray-100 bg-gray-50 hover:border-[#28a745] hover:bg-[#28a745]/5 hover:scale-[1.02] active:scale-95 transition-all duration-300 shadow-sm"
                >
                  <span className="text-3xl shrink-0">{opt.icon}</span>
                  <span className="font-bold text-gray-700 text-lg">{opt.text}</span>
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
            <h2 className="text-xl md:text-2xl font-semibold text-gray-700 mb-10 whitespace-pre-line leading-relaxed">
              {step.copyBold && (
                <span className="font-extrabold block mb-4 text-gray-900">{step.copyBold}</span>
              )}
              <span className="font-medium text-gray-600">{step.copy}</span>
            </h2>
            <button 
              onClick={handleNext}
              className="w-full md:w-2/3 py-4 rounded-xl font-bold border-none text-white text-lg bg-[#28a745] hover:scale-105 hover:shadow-lg active:scale-95 active:shadow-md transition-all duration-300"
            >
              {step.btn}
            </button>
          </div>
        )}

        {step.type === 'analysis' && (
          <div className="text-left w-full flex flex-col items-center">
            <h2 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-cyan-500 mb-3 text-center">
              {step.title}
            </h2>
            <p className="text-gray-500 mb-8 font-medium text-center text-lg">{step.subtitle}</p>
            
            <div className="bg-white border border-gray-100 p-8 rounded-3xl mb-8 shadow-xl w-full">
              <p className="font-extrabold text-gray-800 mb-8 text-xl text-center">{step.copy.split('\n')[0]}</p>
              
              <div className="space-y-6 md:space-y-8 px-2 md:px-8">
                {step.stats.map((stat, i) => (
                  <div key={i}>
                    <div className="flex justify-between font-bold text-gray-700 text-base mb-2">
                      <span>{stat.label}</span>
                      <span className="text-[#28a745]">{stats[i]}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-4 shadow-inner overflow-hidden border border-gray-200">
                      <div 
                        className="bg-gradient-to-r from-[#28a745] to-[#218838] h-4 rounded-full transition-all duration-300 ease-out"
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
                className="w-full md:w-2/3 py-4 rounded-xl border-none font-bold text-white text-xl bg-[#28a745] hover:scale-105 hover:shadow-lg active:scale-95 active:shadow-md transition-all duration-300 animate-fade-in-up uppercase tracking-wide"
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
