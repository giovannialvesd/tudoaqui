import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, MapPin, Star, Store, CarFront, Wrench, ChevronLeft, SlidersHorizontal, Briefcase } from 'lucide-react';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useCity } from '../contexts/CityContext';
import { cn } from '../lib/utils';

export default function SearchPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentCity } = useCity();
  const searchParams = new URLSearchParams(location.search);
  const initialQuery = searchParams.get('q') || '';
  const initialTab = searchParams.get('tab') || 'all'; // all | merchant | service
  const initialCat = searchParams.get('cat') || '';

  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [activeCategory, setActiveCategory] = useState(initialCat);
  
  const [merchants, setMerchants] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const performSearch = async () => {
      setLoading(true);
      try {
         const cityId = currentCity?.id;
         
         const [mercSnap, provSnap] = await Promise.all([
             getDocs(query(collection(db, 'business_profiles'), ...(cityId ? [where('cityId', '==', cityId)] : []))),
             getDocs(query(collection(db, 'provider_profiles'), ...(cityId ? [where('cityId', '==', cityId)] : [])))
         ]);

         let m = mercSnap.docs.map(d => ({id: d.id, _type: 'merchant', ...d.data()})) as any[];
         let p = provSnap.docs.map(d => ({id: d.id, _type: 'provider', ...d.data()})) as any[];

         if (activeCategory) {
            m = m.filter(x => x.category === activeCategory); // Note: IDs might not match strictly, but conceptually.
            p = p.filter(x => x.category === activeCategory);
         }

         if (searchTerm.trim().length > 0) {
            const term = searchTerm.toLowerCase();
            m = m.filter(x => x.businessName?.toLowerCase().includes(term) || x.category?.toLowerCase().includes(term));
            p = p.filter(x => x.name?.toLowerCase().includes(term) || x.category?.toLowerCase().includes(term) || x.description?.toLowerCase().includes(term));
         }

         setMerchants(m);
         setProviders(p);
      } catch (err) {
         console.error(err);
      } finally {
         setLoading(false);
      }
    };

    const debounce = setTimeout(() => {
       performSearch();
    }, 500);

    return () => clearTimeout(debounce);
  }, [searchTerm, activeCategory, currentCity]);

  const showMerchants = activeTab === 'all' || activeTab === 'merchant';
  const showProviders = activeTab === 'all' || activeTab === 'service';

  return (
    <div className="min-h-screen bg-bg-base flex flex-col md:pt-4">
      <div className="bg-white p-4 sticky top-0 z-10 border-b border-zinc-100 md:hidden">
         <div className="flex items-center gap-3 mb-4">
            <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-zinc-100 transition-colors">
               <ChevronLeft className="w-6 h-6 text-zinc-600" />
            </button>
            <h1 className="text-xl font-bold text-zinc-900">Buscar</h1>
         </div>
      </div>

      <div className="px-4 py-4 md:px-8 max-w-screen-xl mx-auto w-full">
         <div className="flex gap-2">
            <div className="flex-1 relative">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
               <input 
                 type="text" 
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 placeholder="O que você está procurando? (Ex: Ar condicionado)" 
                 className="w-full bg-white rounded-2xl py-3.5 pl-12 pr-4 outline-none text-zinc-800 text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all border border-zinc-200 focus:border-primary/30"
               />
            </div>
            <button className="bg-white border border-zinc-200 rounded-2xl w-14 flex items-center justify-center hover:bg-zinc-50 transition-colors">
               <SlidersHorizontal className="w-5 h-5 text-zinc-600" />
            </button>
         </div>

         {/* Tabs */}
         <div className="flex gap-2 overflow-x-auto no-scrollbar py-4 mt-2 border-b border-zinc-200/60 mb-6">
            {[
              { id: 'all', label: 'Todos os Resultados' },
              { id: 'merchant', label: 'Lojas & Mercados', icon: Store },
              { id: 'service', label: 'Profissionais & Serviços', icon: Wrench },
            ].map(tab => (
               <button 
                 key={tab.id}
                 onClick={() => setActiveTab(tab.id)}
                 className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold shrink-0 transition-colors border ${activeTab === tab.id ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'}`}
               >
                 {tab.icon && <tab.icon className="w-4 h-4" />}
                 {tab.label}
               </button>
            ))}
         </div>

         {/* Results */}
         <div>
            {loading ? (
               <div className="flex justify-center py-12">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
               </div>
            ) : (
                <div className="space-y-10 pb-20">
                    
                    {showMerchants && merchants.length > 0 && (
                       <div>
                          <h2 className="font-black text-xl text-zinc-900 mb-4 flex items-center gap-2">
                             <Store className="w-6 h-6 text-emerald-500" />
                             Lojas e Comércios ({merchants.length})
                          </h2>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {merchants.map(item => (
                                <div key={item.id} onClick={() => navigate(`/comercio/${item.id}`)} className="flex items-center bg-white p-3 rounded-2xl border border-zinc-100 shadow-sm hover:border-emerald-500/30 transition-colors cursor-pointer group">
                                   <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-zinc-100 bg-zinc-50">
                                      {item.logoImage ? (
                                          <img src={item.logoImage} alt={item.businessName} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                      ) : (
                                          <div className="w-full h-full flex items-center justify-center"><Store className="w-8 h-8 text-zinc-300" /></div>
                                      )}
                                   </div>
                                   <div className="ml-4 flex-1 min-w-0">
                                      <h3 className="font-bold text-zinc-900 line-clamp-1 text-lg">{item.businessName}</h3>
                                      <p className="text-sm text-zinc-500 mt-0.5 truncate">{item.category || 'Comércio Local'}</p>
                                      <div className="flex items-center gap-3 mt-2 text-xs font-bold">
                                         <span className="flex items-center text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded-md"><Star className="w-3 h-3 mr-0.5 fill-current" /> 4.9</span>
                                         <span className={cn(item.isOpen ? "text-emerald-600" : "text-zinc-400")}>{item.isOpen ? 'Aberto' : 'Fechado'}</span>
                                      </div>
                                   </div>
                                </div>
                              ))}
                          </div>
                       </div>
                    )}

                    {showProviders && providers.length > 0 && (
                       <div>
                          <h2 className="font-black text-xl text-zinc-900 mb-4 flex items-center gap-2">
                             <Briefcase className="w-6 h-6 text-blue-500" />
                             Profissionais Independentes ({providers.length})
                          </h2>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {providers.map(prov => (
                                <div key={prov.id} onClick={() => navigate(`/prestador/${prov.id}`)} className="flex flex-col bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm hover:border-blue-500/30 transition-colors cursor-pointer group">
                                   <div className="flex items-start gap-4 mb-3">
                                      <div className="w-14 h-14 rounded-full overflow-hidden shrink-0 border-2 border-white shadow-sm ring-2 ring-blue-50 bg-blue-100 flex items-center justify-center">
                                         {prov.imageUrl ? (
                                             <img src={prov.imageUrl} alt={prov.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                         ) : (
                                             <Wrench className="w-6 h-6 text-blue-400" />
                                         )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                         <div className="inline-block bg-blue-50 text-blue-600 font-black text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full mb-1">
                                            {prov.category || 'Serviços'}
                                         </div>
                                         <h3 className="font-black text-zinc-900 line-clamp-1">{prov.name || 'Profissional'}</h3>
                                      </div>
                                   </div>
                                   {prov.description && (
                                     <p className="text-sm text-zinc-600 line-clamp-2 bg-zinc-50 p-2 rounded-lg italic">"{prov.description}"</p>
                                   )}
                                </div>
                              ))}
                          </div>
                       </div>
                    )}

                    {(!showMerchants || merchants.length === 0) && (!showProviders || providers.length === 0) && (
                       <div className="text-center py-20 bg-white rounded-3xl border border-zinc-100 shadow-sm">
                          <Search className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
                          <h3 className="text-lg font-bold text-zinc-800">Nenhum resultado encontrado</h3>
                          <p className="text-sm text-zinc-500 mt-1 max-w-sm mx-auto">Tente buscar usando termos diferentes ou selecione outra aba.</p>
                       </div>
                    )}

                </div>
            )}
         </div>
      </div>
    </div>
  );
}
