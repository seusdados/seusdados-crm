import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PresentationSlide from './components/PresentationSlide';
import DiagnosticForm from './components/DiagnosticForm';
import DiagnosticResult from './components/DiagnosticResult';
import pptxContent from '../public/pptx_content.json';
import './App.css';

function App() {
  const [currentSlide, setCurrentSlide] = useState(1);
  const [totalSlides, setTotalSlides] = useState(0);
  
  // Determinar o número total de slides quando o componente montar
  useEffect(() => {
    if (pptxContent && Array.isArray(pptxContent)) {
      setTotalSlides(pptxContent.length);
    }
  }, []);
  
  // Navegar para o próximo slide
  const goToNextSlide = () => {
    if (currentSlide < totalSlides) {
      setCurrentSlide(currentSlide + 1);
    }
  };
  
  // Navegar para o slide anterior
  const goToPrevSlide = () => {
    if (currentSlide > 1) {
      setCurrentSlide(currentSlide - 1);
    }
  };
  
  // Navegar para um slide específico
  const goToSlide = (slideNumber: number) => {
    if (slideNumber >= 1 && slideNumber <= totalSlides) {
      setCurrentSlide(slideNumber);
    }
  };
  
  // Navegar para o formulário de diagnóstico
  const goToDiagnosticForm = () => {
    window.location.href = '/diagnostico';
  };
  
  return (
    <Router>
      <Routes>
        <Route path="/" element={
          <div className="presentation-container">
            <PresentationSlide 
              slideData={pptxContent.find(slide => slide.slide === currentSlide)} 
              currentSlide={currentSlide}
              totalSlides={totalSlides}
              onNextSlide={goToNextSlide}
              onPrevSlide={goToPrevSlide}
              onGoToSlide={goToSlide}
              onStartDiagnostic={goToDiagnosticForm}
            />
          </div>
        } />
        <Route path="/diagnostico" element={<DiagnosticForm />} />
        <Route path="/resultado" element={<DiagnosticResult />} />
      </Routes>
    </Router>
  );
}

export default App;