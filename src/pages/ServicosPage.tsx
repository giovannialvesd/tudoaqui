import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wrench, ChevronRight, Search, MapPin, Star, UserCircle, Briefcase, CalendarClock } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

import { useCity } from '../contexts/CityContext';

export default function ServicosPage() {
   const navigate = useNavigate();
   const { currentCity } = useCity();
   const [categories, setCategories] = useState<any[]>([]);
   const [providers, setProviders] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);

   useEffect(() => {
     const fetchData = async () => {
        try {
           const cityId = currentCity?.id;
           const catSnap = await getDocs(query(collection(db, 'categories'), where('type', '==', 'service'), where('active', '==', true)));
           setCategories(catSnap.docs.map(d => ({id: d.id, ...d.data()})));

           const provConstraints: any[] = [];
           if (cityId) provConstraints.push(where('cityId', '==', cityId));
           const provSnap = await getDocs(query(collection(db, 'provider_profiles'), ...provConstraints));
           
           const provDocs = provSnap.docs.map(d => ({id: d.id, ...d.data()}));
           setProviders(provDocs);
        } catch(e) {
           console.error(e);
        } finally {
           setLoading(false);
        }
     };
     fetchData();
   }, [currentCity]);

   return (
      <div className="min-h-screen bg-zinc-50 pb-20">
         <div className="bg-blue-600 text-white px-4 py-8 rounded-b-3xl relative overflow-hidden shadow-lg shadow-blue-500/10">
            <div className="absolute top-0 right-0 opacity-10 transform translate-x-1/4 -translate-y-1/4">
               <Briefcase className="w-64 h-64" />
            </div>
            <div className="flex items-center gap-3 mb-6 relative z-10">
               <button onClick={() => navigate('/')} className="w-10 h-10 bg-black/20 rounded-full flex items-center justify-center hover:bg-black/30">
                  <ChevronRight className="w-6 h-6 rotate-180" />
               </button>
               <h1 className="text-2xl font-black tracking-tight">Profissionais & Serviços</h1>
            </div>
            
            <p className="relative z-10 text-blue-100 mb-6 max-w-sm">Encontre profissionais qualificados para reformas, consertos, limpeza e muito mais.</p>
            
            <div className="relative z-10 bg-white shadow-xl rounded-2xl p-2 border border-blue-100 flex items-center">
               <Search className="w-5 h-5 text-blue-400 ml-3 shrink-0" />
               <input type="text" placeholder="Ex: Eletricista, Encanador, Diarista..." onClick={() => navigate('/busca?tab=service')} className="bg-transparent border-none outline-none text-zinc-800 placeholder-zinc-400 w-full font-medium py-3 px-3" />
               <button onClick={() => navigate('/busca?tab=service')} className="bg-blue-600 text-white px-5 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors shrink-0">Buscar</button>
            </div>
         </div>

         <div className="px-4 py-8">
            <div className="flex items-center justify-between mb-5">
               <h2 className="font-black text-xl text-zinc-900 tracking-tight">Especialidades</h2>
               <span className="text-blue-600 font-bold text-sm bg-blue-50 px-3 py-1 rounded-full cursor-pointer" onClick={() => navigate('/busca?tab=service')}>Ver todas</span>
            </div>
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4">
               {categories.map(cat => (
                 <div key={cat.id} onClick={() => navigate(`/busca?tab=service&cat=${cat.id}`)} className="min-w-[120px] bg-white rounded-3xl p-5 border border-zinc-100 shadow-sm flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-blue-500 hover:shadow-md transition-all group shrink-0">
                    <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all">
                       <Wrench className="w-7 h-7" />
                    </div>
                    <span className="font-bold text-sm text-zinc-800 text-center leading-tight">{cat.name}</span>
                 </div>
               ))}
               {categories.length === 0 && !loading && (
                  <div className="w-full text-center py-6 text-zinc-500">Nenhuma categoria encontrada.</div>
               )}
            </div>
         </div>

         <div className="px-4 py-2">
            <h2 className="font-black text-xl text-zinc-900 mb-5 tracking-tight">Profissionais Disponíveis</h2>
            {loading ? (
                <div className="flex justify-center p-8"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {providers.length > 0 ? providers.map((prov) => (
                     <div key={prov.id} onClick={() => navigate(`/prestador/${prov.id}`)} className="bg-white rounded-3xl p-5 border border-zinc-100 shadow-sm cursor-pointer hover:border-blue-500 hover:shadow-lg transition-all group flex flex-col">
                        <div className="flex items-start gap-4 mb-4">
                           <div className="w-16 h-16 rounded-full bg-zinc-100 overflow-hidden shrink-0 border-2 border-white shadow-sm ring-2 ring-blue-50">
                              {prov.imageUrl ? (
                                 <img src={prov.imageUrl} alt="Profissional" className="w-full h-full object-cover" />
                              ) : (
                                 <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-500"><UserCircle className="w-10 h-10" /></div>
                              )}
                           </div>
                           <div className="flex-1 min-w-0 pt-1">
                              <h3 className="font-black text-zinc-900 truncate text-lg">{prov.name || 'Profissional'}</h3>
                              <p className="text-sm font-bold text-blue-600 mb-1 truncate">{prov.category || 'Serviços Gerais'}</p>
                              <div className="flex items-center gap-1 text-orange-500 font-bold text-sm"><Star className="w-4 h-4 fill-current" /> 5.0 (Sem avaliações)</div>
                           </div>
                        </div>
                        {prov.description && (
                           <p className="text-sm text-zinc-600 line-clamp-2 leading-relaxed bg-zinc-50 p-3 rounded-xl mb-4 italic">"{prov.description}"</p>
                        )}
                        <div className="mt-auto border-t border-zinc-100 pt-4 flex items-center justify-between">
                           <div className="flex items-center gap-2 text-xs font-bold text-zinc-500">
                              <MapPin className="w-4 h-4 text-zinc-400" /> {prov.address || 'Atende na região'}
                           </div>
                           <button className="bg-zinc-900 text-white px-4 py-2 rounded-xl text-sm font-bold group-hover:bg-blue-600 transition-colors">Ver Perfil</button>
                        </div>
                     </div>
                   )) : (
                      <div className="col-span-full bg-white p-8 border border-zinc-100 rounded-3xl text-center">
                         <Briefcase className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
                         <p className="text-zinc-600 font-medium">Nenhum profissional cadastrado ainda.</p>
                      </div>
                   )}
                </div>
            )}
         </div>
      </div>
   );
}
