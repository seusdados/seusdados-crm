import { useState } from 'react';

interface SlideData {
  slide: number;
  texts: string[];
  title: string;
}

interface PresentationSlideProps {
  slideData: SlideData | undefined;
  currentSlide: number;
  totalSlides: number;
  onNextSlide: () => void;
  onPrevSlide: () => void;
  onGoToSlide: (slideNumber: number) => void;
  onStartDiagnostic: () => void;
}

const PresentationSlide: React.FC<PresentationSlideProps> = ({
  slideData,
  currentSlide,
  totalSlides,
  onNextSlide,
  onPrevSlide,
  onGoToSlide,
  onStartDiagnostic
}) => {
  const [isFullScreen, setIsFullScreen] = useState(false);
  
  // Lidar com a navegação via teclado
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === 'n' || e.key === 'N') {
      onNextSlide();
    } else if (e.key === 'ArrowLeft' || e.key === 'PageUp' || e.key === 'p' || e.key === 'P') {
      onPrevSlide();
    } else if (e.key === 'f' || e.key === 'F') {
      toggleFullScreen();
    } else if (e.key === 'Escape') {
      exitFullScreen();
    }
  };
  
  // Alternar entre tela cheia e modo normal
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Erro ao tentar abrir em tela cheia: ${err.message}`);
      });
      setIsFullScreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullScreen(false);
      }
    }
  };
  
  // Sair do modo tela cheia
  const exitFullScreen = () => {
    if (document.exitFullscreen) {
      document.exitFullscreen();
      setIsFullScreen(false);
    }
  };
  
  // Renderiza a barra de progresso
  const renderProgressBar = () => {
    return (
      <div className="progress-bar-container">
        <div className="progress-bar" style={{ width: `${(currentSlide / totalSlides) * 100}%` }}></div>
      </div>
    );
  };
  
  // Renderiza os controles de navegação
  const renderNavigationControls = () => {
    return (
      <div className="navigation-controls">
        <button 
          className={`nav-button ${currentSlide === 1 ? 'disabled' : ''}`}
          onClick={onPrevSlide}
          disabled={currentSlide === 1}
        >
          &lt; Anterior
        </button>
        
        <div className="slide-counter">
          Slide {currentSlide} de {totalSlides}
        </div>
        
        {currentSlide < totalSlides ? (
          <button 
            className="nav-button"
            onClick={onNextSlide}
          >
            Próximo &gt;
          </button>
        ) : (
          <button 
            className="nav-button diagnostic-button"
            onClick={onStartDiagnostic}
          >
            Iniciar Diagnóstico ➡
          </button>
        )}
        
        <button 
          className="fullscreen-button"
          onClick={toggleFullScreen}
          title={isFullScreen ? "Sair da tela cheia" : "Ver em tela cheia"}
        >
          {isFullScreen ? "↙" : "↗"}
        </button>
      </div>
    );
  };
  
  // Renderiza o conteúdo de um slide específico
  const renderSlideContent = () => {
    if (!slideData) {
      return <div className="slide-error">Slide não encontrado</div>;
    }
    
    // Slides especiais com tratamento customizado
    if (slideData.slide === 1) {
      // Slide inicial com logotipo grande e texto destacado
      return (
        <div className="slide-content slide-1">
          <div className="logo-container">
            <img src="/logo-seusdados-grande.png" alt="SeusDados Logo" className="main-logo" />
          </div>
          <h1 className="main-title">{slideData.texts[0]}</h1>
          <p className="main-subtitle">{slideData.texts[1]}</p>
          <div className="company-info">{slideData.texts[2]}</div>
          
          <div className="stats-container">
            <div className="stat-item">
              <div className="stat-value">{slideData.texts[3]}</div>
              <div className="stat-label">{slideData.texts[4]}</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{slideData.texts[5]}</div>
              <div className="stat-label">{slideData.texts[6]}</div>
            </div>
          </div>
        </div>
      );
    } else if (slideData.slide === 9) {
      // Último slide com CTA para iniciar o diagnóstico
      return (
        <div className="slide-content slide-final">
          <h1 className="final-title">{slideData.texts[0]}</h1>
          <p className="ceo-info">{slideData.texts[1]}</p>
          
          <div className="cta-container">
            <div className="cta-box">
              <h2 className="cta-title">{slideData.texts[2]}</h2>
              <p>{slideData.texts[3]}</p>
              <p>{slideData.texts[4]}</p>
              <p>{slideData.texts[5]}</p>
              
              <button 
                className="cta-button"
                onClick={onStartDiagnostic}
              >
                {slideData.texts[6]}
              </button>
            </div>
            
            <div className="contact-info">
              <h3 className="contact-title">{slideData.texts[7]}</h3>
              <p className="contact-phone">{slideData.texts[8]}</p>
              <p className="contact-whatsapp">{slideData.texts[9]}</p>
              <p className="contact-email">{slideData.texts[10]}</p>
              
              <div className="process-steps">
                <h3 className="process-title">{slideData.texts[11]}</h3>
                <div className="steps">
                  <div className="step">
                    <div className="step-number">{slideData.texts[12].split('\t')[0]}</div>
                    <div className="step-text">{slideData.texts[12].split('\t')[1]}</div>
                  </div>
                  <div className="step">
                    <div className="step-number">{slideData.texts[14].split('\t')[0]}</div>
                    <div className="step-text">{slideData.texts[14].split('\t')[1]}</div>
                  </div>
                  <div className="step">
                    <div className="step-number">{slideData.texts[16]}</div>
                    <div className="step-text">{slideData.texts[17]}</div>
                  </div>
                  <div className="step">
                    <div className="step-number">{slideData.texts[18]}</div>
                    <div className="step-text">{slideData.texts[19]}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="footer-info">{slideData.texts[20]}</div>
          <p className="footer-hours">{slideData.texts[21]}</p>
        </div>
      );
    } else {
      // Renderização padrão para os outros slides
      return (
        <div className="slide-content">
          {slideData.title && <h1 className="slide-title">{slideData.title}</h1>}
          
          {slideData.texts.map((text, index) => {
            // Verificar se o texto parece um título
            if (index === 0 && !slideData.title) {
              return <h1 key={index} className="slide-title">{text}</h1>;
            }
            
            // Verificar se é um subtítulo (texto curto e enfático)
            if (text.length < 50 && (text.includes('?') || text.endsWith('.'))) {
              return <h2 key={index} className="slide-subtitle">{text}</h2>;
            }
            
            // Renderizar parágrafos normais
            return <p key={index} className="slide-text">{text}</p>;
          })}
        </div>
      );
    }
  };
  
  return (
    <div 
      className="slide-container"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {renderProgressBar()}
      {renderSlideContent()}
      {renderNavigationControls()}
      
      {/* Dicas de navegação */}
      <div className="keyboard-tips">
        Dicas: Use as setas ← → para navegar | F para tela cheia | ESC para sair
      </div>
    </div>
  );
};

export default PresentationSlide;