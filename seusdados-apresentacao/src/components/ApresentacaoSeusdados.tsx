import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import SlideCapa from './slides/SlideCapa';
import SlideQuemSomos from './slides/SlideQuemSomos';
import SlideNossosNumeros from './slides/SlideNossosNumeros';
import SlideCenarioLGPD from './slides/SlideCenarioLGPD';
import SlideDiferenciais from './slides/SlideDiferenciais';
import SlideMetodologia from './slides/SlideMetodologia';
import SlideCasosSucesso from './slides/SlideCasosSucesso';
import SlideProximosPassos from './slides/SlideProximosPassos';

interface Slide {
  id: number;
  component: React.ComponentType;
  title: string;
}

const slides: Slide[] = [
  { id: 1, component: SlideCapa, title: 'Capa' },
  { id: 2, component: SlideQuemSomos, title: 'Quem Somos' },
  { id: 3, component: SlideNossosNumeros, title: 'Nossos Números' },
  { id: 4, component: SlideCenarioLGPD, title: 'Cenário LGPD' },
  { id: 5, component: SlideDiferenciais, title: 'Diferenciais' },
  { id: 6, component: SlideMetodologia, title: 'Metodologia' },
  { id: 7, component: SlideCasosSucesso, title: 'Casos de Sucesso' },
  { id: 8, component: SlideProximosPassos, title: 'Próximos Passos' }
];

export default function ApresentacaoSeusdados() {
  const [slideAtual, setSlideAtual] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(true);
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (autoPlay) {
      interval = setInterval(() => {
        setSlideAtual((prev) => (prev + 1) % slides.length);
      }, 8000); // 8 segundos por slide
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoPlay]);

  const proximoSlide = () => {
    setSlideAtual((prev) => (prev + 1) % slides.length);
  };

  const slideAnterior = () => {
    setSlideAtual((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const irParaSlide = (index: number) => {
    setSlideAtual(index);
  };

  const toggleAutoPlay = () => {
    setAutoPlay(!autoPlay);
  };

  const ComponenteAtual = slides[slideAtual].component;

  if (!loaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#1a237e]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col items-center justify-center p-4">
      {/* Container principal da apresentação */}
      <div className="slide-container shadow-2xl rounded-3xl overflow-hidden bg-white">
        <ComponenteAtual />
      </div>

      {/* Controles da apresentação */}
      <div className="mt-4 flex items-center gap-4">
        {/* Botão slide anterior */}
        <button
          onClick={slideAnterior}
          className="p-3 bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
          title="Slide anterior"
        >
          <ChevronLeft className="h-6 w-6 text-[#1a237e]" />
        </button>

        {/* Indicadores de slide */}
        <div className="flex gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => irParaSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === slideAtual
                  ? 'bg-[#1a237e] scale-125'
                  : 'bg-slate-300 hover:bg-slate-400'
              }`}
              title={`Ir para slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Botão próximo slide */}
        <button
          onClick={proximoSlide}
          className="p-3 bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
          title="Próximo slide"
        >
          <ChevronRight className="h-6 w-6 text-[#1a237e]" />
        </button>

        {/* Botão AutoPlay */}
        <button
          onClick={toggleAutoPlay}
          className={`p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110 ${
            autoPlay ? 'bg-[#1a237e] text-white' : 'bg-white text-[#1a237e]'
          }`}
          title={autoPlay ? 'Pausar apresentação' : 'Reproduzir automaticamente'}
        >
          {autoPlay ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
        </button>
      </div>

      {/* Informações do slide atual */}
      <div className="mt-3 text-center">
        <p className="text-xs text-slate-600">
          Slide {slideAtual + 1} de {slides.length}: {slides[slideAtual].title}
        </p>
      </div>
    </div>
  );
}