import React, { useEffect, useState } from 'react';
import { ArrowLeft, Trash2, MapPin, Calendar, Clock, AlertTriangle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';

import { useCity } from '../contexts/CityContext';

export default function GarbageCollectionPage() {
  const navigate = useNavigate();
  const { currentCity } = useCity();
  const [routes, setRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const cityId = currentCity?.id;
        const constraints: any[] = [];
        if (cityId) constraints.push(where('cityId', '==', cityId));
        
        const q = query(collection(db, 'garbage_routes'), ...constraints);
        const snapshot = await getDocs(q);
        setRoutes(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchRoutes();
  }, [currentCity]);

  const neighborhoods = routes.length > 0 ? routes : [
    {
      name: 'Centro',
      days: 'Segunda, Quarta e Sexta',
      time: 'A partir das 19h',
      type: 'Comum e Seletiva'
    },
    {
      name: 'Zona Norte',
      days: 'Terça, Quinta e Sábado',
      time: 'A partir das 08h',
      type: 'Comum'
    },
  ];

  return (
    <div className="flex flex-col w-full pb-10 bg-zinc-50 min-h-screen">
      <div className="bg-white px-5 pt-7 pb-5 rounded-b-[2rem] shadow-sm z-10 sticky top-0 md:hidden border-b border-zinc-100 flex items-center justify-between">
         <button onClick={() => navigate(-1)} className="w-11 h-11 rounded-full bg-zinc-50 flex items-center justify-center hover:bg-zinc-100 transition-colors border border-zinc-200/60">
            <ArrowLeft className="w-5 h-5 text-zinc-600" />
         </button>
         <h1 className="font-black text-xl text-zinc-900 absolute left-1/2 -translate-x-1/2">Coleta de Lixo</h1>
      </div>

      <div className="px-4 md:px-8 mt-6">
         {/* Desktop Header */}
         <div className="hidden md:flex items-center gap-4 mb-8">
            <button onClick={() => navigate(-1)} className="w-12 h-12 rounded-full bg-white flex items-center justify-center hover:bg-zinc-50 transition-colors shadow-sm border border-zinc-100">
               <ArrowLeft className="w-5 h-5 text-zinc-600" />
            </button>
            <div>
               <h1 className="font-black text-3xl text-zinc-900">Horário da Coleta</h1>
               <p className="text-zinc-500 font-medium">Dias e horários da coleta de lixo por bairro</p>
            </div>
         </div>

         <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm mb-6">
            <div className="flex items-start gap-4 mb-4">
               <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center shrink-0">
                 <AlertTriangle className="w-6 h-6 text-rose-500" />
               </div>
               <div>
                 <h2 className="font-bold text-zinc-900 text-lg mb-1">Dica Importante</h2>
                 <p className="text-zinc-600 text-sm">Coloque o lixo na rua no máximo 1 hora antes do horário previsto para a coleta passar. Evite lixo espalhado!</p>
               </div>
            </div>
         </div>

         <div className="space-y-4">
            {neighborhoods.map((n, index) => (
               <div key={index} className="bg-white rounded-3xl p-5 border border-zinc-100 shadow-sm flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 rounded-2xl bg-zinc-50 border border-zinc-100 flex flex-col items-center justify-center shrink-0">
                        <MapPin className="w-5 h-5 text-rose-500" />
                     </div>
                     <div>
                        <h3 className="font-bold text-zinc-900 text-lg">{n.name}</h3>
                        <p className="text-xs text-zinc-500 font-medium bg-zinc-100 inline-block px-2 py-0.5 rounded-full mt-1">Lixo {n.type}</p>
                     </div>
                  </div>
                  
                  <div className="flex flex-col sm:items-end gap-1.5 ml-16 sm:ml-0 bg-zinc-50 sm:bg-transparent p-3 sm:p-0 rounded-2xl border sm:border-none border-zinc-100">
                     <div className="flex items-center gap-2 text-sm text-zinc-700 font-semibold">
                        <Calendar className="w-4 h-4 text-emerald-600" /> {n.days}
                     </div>
                     <div className="flex items-center gap-2 text-xs text-zinc-500 font-medium font-mono bg-white sm:bg-zinc-50 px-2 py-1 rounded-lg border sm:border-none border-zinc-200">
                        <Clock className="w-3.5 h-3.5" /> {n.time}
                     </div>
                  </div>
               </div>
            ))}
         </div>
         
         <div className="mt-8 text-center bg-zinc-100 rounded-3xl p-6 border border-zinc-200/60">
            <Trash2 className="w-8 h-8 text-zinc-400 mx-auto mb-3" />
            <p className="text-sm font-bold text-zinc-600 mb-1">Ajude a manter a cidade limpa.</p>
            <p className="text-xs text-zinc-500">Separe o lixo orgânico do reciclável.</p>
         </div>
      </div>
    </div>
  );
}
