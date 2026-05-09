import React, { useState } from 'react';
import { MapPin, ChevronDown, Search, X, Check } from 'lucide-react';
import { useCity } from '../contexts/CityContext';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';

export default function CitySelector() {
  const { cities, currentCity, setCurrentCityBySlug } = useCity();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const filteredCities = cities.filter(city => 
    city.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    city.state.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (city: any) => {
    setCurrentCityBySlug(city.slug);
    setIsOpen(false);
    navigate(`/cidade/${city.slug}`);
  };

  return (
    <div className="relative">
      {/* Trigger */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2.5 rounded-2xl border border-zinc-200 bg-zinc-50 hover:bg-white hover:border-primary/20 transition-all group"
      >
        <MapPin className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
        <div className="flex flex-col items-start min-w-[100px] md:min-w-[140px]">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest hidden md:block">Você está em:</span>
          <span className="text-sm font-bold text-zinc-800 flex items-center gap-1">
            {currentCity ? currentCity.name : 'Selecionar Cidade'}
            <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
          </span>
        </div>
      </button>

      {/* Dropdown / Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60] md:z-auto" 
              onClick={() => setIsOpen(false)}
            />
            
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute top-full left-0 mt-2 w-[300px] md:w-[350px] bg-white rounded-3xl shadow-2xl border border-zinc-100 p-5 z-[70] overflow-hidden"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-lg text-zinc-900 tracking-tight">Cidades Ativas</h3>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-full hover:bg-zinc-100 transition-colors"
                >
                  <X className="w-4 h-4 text-zinc-400" />
                </button>
              </div>

              {/* Search */}
              <div className="relative mb-5">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input 
                  type="text"
                  placeholder="Buscar cidade ou estado..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-100 rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium outline-none focus:border-primary/30 focus:bg-white transition-all"
                  autoFocus
                />
              </div>

              {/* List */}
              <div className="max-h-[300px] overflow-y-auto no-scrollbar space-y-1.5">
                {filteredCities.length > 0 ? (
                  filteredCities.map((city) => (
                    <button
                      key={city.id}
                      onClick={() => handleSelect(city)}
                      className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all group ${currentCity?.id === city.id ? 'bg-primary/5 border-primary/10' : 'hover:bg-zinc-50 border-transparent'} border`}
                    >
                      <div className="flex flex-col items-start">
                        <span className={`font-bold text-[15px] transition-colors ${currentCity?.id === city.id ? 'text-primary' : 'text-zinc-800'}`}>
                          {city.name}
                        </span>
                        <span className="text-xs text-zinc-500 font-medium">{city.state}</span>
                      </div>
                      {currentCity?.id === city.id && (
                        <Check className="w-4 h-4 text-primary" />
                      )}
                    </button>
                  ))
                ) : (
                  <div className="py-8 text-center">
                    <p className="text-zinc-400 text-sm font-medium italic">Nenhuma cidade encontrada...</p>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-zinc-100 text-center">
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Tem uma prefeitura? Entre em contato.</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
