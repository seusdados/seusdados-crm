import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Edit3, Eye } from 'lucide-react';
import { ProposalConfig } from '../types/proposal';
import { Slide1 } from './slides/Slide1';
import { Slide2 } from './slides/Slide2';
import { Slide3 } from './slides/Slide3';
import { Slide4 } from './slides/Slide4';
import { Slide5 } from './slides/Slide5';
import { Slide6 } from './slides/Slide6';
import { Slide7 } from './slides/Slide7';

interface PresentationProps {
  config: ProposalConfig;
  onConfigChange: (config: ProposalConfig) => void;
  onAprovarProposta: () => void;
}

export function Presentation({ config, onConfigChange, onAprovarProposta }: PresentationProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  
  const totalSlides = 7;
  
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };
  
  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };
  
  const handleClientNameChange = (nome: string) => {
    const newConfig = {
      ...config,
      nome_cliente: nome
    };
    onConfigChange(newConfig);
  };
  
  const renderSlide = () => {
    const currentDate = new Date().toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    switch (currentSlide) {
      case 0:
        return (
          <Slide1 
            config={config}
            onConfigChange={onConfigChange}
            isEditing={isEditing}
          />
        );
      case 1:
        return <Slide2 />;
      case 2:
        return <Slide3 />;
      case 3:
        return (
          <Slide4 
            config={config} 
            onConfigChange={onConfigChange} 
            isEditing={isEditing}
          />
        );
      case 4:
        return (
          <Slide5 
            config={config}
            onConfigChange={onConfigChange}
            isEditing={isEditing}
          />
        );
      case 5:
        return (
          <Slide6 
            config={config} 
            onConfigChange={onConfigChange} 
            isEditing={isEditing}
          />
        );
      case 6:
        return <Slide7 onAprovarProposta={onAprovarProposta} />;
      default:
        return (
          <Slide1 
            config={config}
            onConfigChange={onConfigChange}
            isEditing={isEditing}
          />
        );
    }
  };
  
  return (
    <div className="min-h-screen bg-[#f5f5fa] py-8">
      {/* Controles de Apresentação */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="flex justify-between items-center bg-white rounded-xl p-4 shadow-lg">
          {/* Campo de Nome do Cliente */}
          <div className="flex items-center space-x-4">
            <label className="text-[14px] font-medium text-[#1a237e]">
              Nome do Cliente:
            </label>
            <input
              type="text"
              value={config.nome_cliente}
              onChange={(e) => handleClientNameChange(e.target.value)}
              placeholder="Digite o nome da empresa"
              className="px-3 py-2 border border-[#e0e4e8] rounded-lg focus:outline-none focus:border-[#6a1b9a] text-[14px] min-w-[250px]"
            />
          </div>
          
          {/* Navegação e Controles */}
          <div className="flex items-center space-x-4">
            {/* Botão de Edição */}
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                isEditing
                  ? 'bg-[#6a1b9a] text-white'
                  : 'bg-[#f7f8fc] text-[#6a1b9a] hover:bg-[#6a1b9a] hover:text-white'
              }`}
            >
              {isEditing ? <Eye className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
              <span className="text-[14px] font-medium">
                {isEditing ? 'Modo Visualização' : 'Modo Edição'}
              </span>
            </button>
            
            {/* Navegação */}
            <div className="flex items-center space-x-2">
              <button
                onClick={prevSlide}
                className="p-2 rounded-lg bg-[#f7f8fc] text-[#6a1b9a] hover:bg-[#6a1b9a] hover:text-white transition-all duration-300"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <span className="text-[14px] font-medium text-[#1a237e] px-3">
                {currentSlide + 1} / {totalSlides}
              </span>
              
              <button
                onClick={nextSlide}
                className="p-2 rounded-lg bg-[#f7f8fc] text-[#6a1b9a] hover:bg-[#6a1b9a] hover:text-white transition-all duration-300"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Slide Container */}
      <div className="flex justify-center">
        <div className="transform scale-75 origin-top">
          {renderSlide()}
        </div>
      </div>
      
      {/* Indicadores de Slide */}
      <div className="flex justify-center mt-6 space-x-2">
        {Array.from({ length: totalSlides }, (_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              currentSlide === index
                ? 'bg-[#6a1b9a] scale-125'
                : 'bg-[#e0e4e8] hover:bg-[#6a1b9a] hover:bg-opacity-50'
            }`}
          />
        ))}
      </div>
    </div>
  );
}