import React, { useState, useEffect } from 'react';
import { Sun, MapPin, AlertTriangle, CloudSun } from 'lucide-react';
import { useCity } from '../contexts/CityContext';

export default function SmartTopBar() {
  const [time, setTime] = useState(new Date());
  const { cityName, temperature } = useCity();
  
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 60000); // Update every minute is enough
    return () => clearInterval(timer);
  }, []);

  const items = (
    <>
        <div className="flex items-center gap-3">
          <span className="font-mono text-zinc-300 bg-zinc-800 px-2 py-1 rounded">
            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          <div className="flex items-center gap-1.5 text-zinc-300">
            <MapPin className="w-4 h-4" />
            <span className="font-medium">{cityName}</span>
          </div>
          <div className="flex items-center gap-1.5 text-yellow-500">
            {temperature ? (
                <>
                    <CloudSun className="w-4 h-4 ml-2" />
                    <span className="font-bold">{temperature}</span>
                </>
            ) : (
                <>
                    <Sun className="w-4 h-4 ml-2" />
                    <span className="font-bold">--°C</span>
                </>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3 border-l border-zinc-700 pl-4">
          <div className="flex items-center gap-2 cursor-pointer bg-zinc-800/50 hover:bg-zinc-800 px-3 py-1 rounded-full transition-colors">
            <AlertTriangle className="w-4 h-4 text-emerald-400" />
            <span className="text-emerald-400 font-bold">Dica:</span>
            <span className="text-emerald-300">Confira as campanhas solidárias em "VOZ DA COMUNIDADE"</span>
          </div>
        </div>

        <div className="flex items-center gap-3 border-l border-zinc-700 pl-4">
          <div className="flex items-center gap-2">
            <span className="text-zinc-400">Anuncie no TudoAqui e faça seu negócio crescer!</span>
          </div>
        </div>
    </>
  );

  return (
    <div className="bg-zinc-900 text-white text-sm py-2 overflow-hidden relative z-[60] flex items-center h-12">
      <div className="flex whitespace-nowrap animate-marquee items-center gap-10 min-w-max">
        {items}
        {items}
        {items}
        {items}
        {items}
        {items}
        {items}
        {items}
      </div>
    </div>
  );
}
