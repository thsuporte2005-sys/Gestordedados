import React, { useState } from 'react';
import Quiz from './components/Quiz';
import VSL from './components/VSL';

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

export default App;
