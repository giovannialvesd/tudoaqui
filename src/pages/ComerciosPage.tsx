import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, ChevronRight, Search, MapPin, Star, TicketPercent, TrendingUp, Clock, ShoppingBag } from 'lucide-react';
import { collection, query, where, getDocs, orderBy, getDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useCity } from '../contexts/CityContext';
import { cn } from '../lib/utils';

export default function ComerciosPage() {
   const navigate = useNavigate();
   const { currentCity } = useCity();
   const [categories, setCategories] = useState<any[]>([]);
   const [merchants, setMerchants] = useState<any[]>([]);
   const [banners, setBanners] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);

   useEffect(() => {
     const fetchData = async () => {
        try {
           const cityId = currentCity?.id;
           const catSnap = await getDocs(query(collection(db, 'categories'), where('type', '==', 'merchant'), where('active', '==', true)));
           setCategories(catSnap.docs.map(d => ({id: d.id, ...d.data()})));

           const mercConstraints: any[] = [];
           if (cityId) mercConstraints.push(where('cityId', '==', cityId));
           const mercSnap = await getDocs(query(collection(db, 'business_profiles'), ...mercConstraints));
           setMerchants(mercSnap.docs.map(d => ({id: d.id, ...d.data()})));
           
           const banConstraints: any[] = [where('active', '==', true)];
           if (cityId) banConstraints.push(where('cityId', '==', cityId));
           const banSnap = await getDocs(query(collection(db, 'banners'), ...banConstraints));
           setBanners(banSnap.docs.map(d => ({id: d.id, ...d.data()})));
        } catch(e) {
           console.error(e);
        } finally {
           setLoading(false);
        }
     };
     fetchData();
   }, [currentCity]);

   return (
      <div className="min-h-screen bg-[#F8FAFC] pb-24">
         {/* Hero Header */}
         <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white px-6 pt-10 pb-20 rounded-b-[3rem] relative overflow-hidden shadow-lg">
            {/* Background Decorations */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-400/20 rounded-full blur-2xl -ml-10 -mb-10"></div>
            
            <div className="absolute top-10 right-4 opacity-10 transform rotate-12">
               <ShoppingBag className="w-40 h-40" />
            </div>

            <div className="flex items-center gap-4 mb-8 relative z-10">
               <button onClick={() => navigate('/')} className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center hover:bg-white/20 transition-colors border border-white/10">
                  <ChevronRight className="w-7 h-7 rotate-180" />
               </button>
               <div>
                  <h1 className="text-3xl font-black tracking-tight">Comércios</h1>
                  <p className="text-emerald-100/90 font-medium text-sm mt-0.5 flex items-center gap-1.5">
                     <MapPin className="w-3.5 h-3.5" /> Encontre tudo perto de você
                  </p>
               </div>
            </div>
            
            <div 
               onClick={() => navigate('/busca?tab=merchant')}
               className="relative z-10 bg-white shadow-xl shadow-emerald-900/20 rounded-2xl p-4 flex items-center gap-3 cursor-text group transition-transform hover:scale-[1.02]"
            >
               <Search className="w-6 h-6 text-emerald-500 group-hover:scale-110 transition-transform" />
               <div className="flex-1">
                  <p className="text-zinc-400 font-medium text-sm">O que você precisa hoje?</p>
               </div>
               <div className="bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-xl text-xs font-bold">Buscar</div>
            </div>
         </div>

         {/* Bento Grid Content */}
         <div className="px-4 -mt-8 relative z-20 space-y-8 max-w-4xl mx-auto">
            
            {/* Categories Bento */}
            <section className="bg-white rounded-3xl p-6 shadow-sm border border-zinc-100">
               <div className="flex items-center justify-between mb-4">
                  <h2 className="font-black text-xl text-zinc-900 flex items-center gap-2">
                     Explorar por Categoria
                  </h2>
               </div>
               
               <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {categories.map((cat, i) => {
                     // Colors logic just to make them pop uniquely
                     const bgColors = ['bg-blue-50', 'bg-rose-50', 'bg-amber-50', 'bg-purple-50', 'bg-emerald-50', 'bg-sky-50'];
                     const textColors = ['text-blue-600', 'text-rose-600', 'text-amber-600', 'text-purple-600', 'text-emerald-600', 'text-sky-600'];
                     const bgCount = bgColors[i % bgColors.length];
                     const txtCount = textColors[i % textColors.length];

                     return (
                     <div 
                        key={cat.id} 
                        onClick={() => navigate(`/busca?tab=merchant&cat=${cat.id}`)} 
                        className="flex flex-col items-center gap-2 cursor-pointer group"
                     >
                        <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-sm border border-black/5", bgCount, "group-hover:scale-110 group-hover:-translate-y-1")}>
                           <Store className={cn("w-7 h-7", txtCount)} />
                        </div>
                        <span className="font-semibold text-xs text-zinc-600 text-center line-clamp-2 w-full px-1">{cat.name}</span>
                     </div>
                  )})}
                  {categories.length === 0 && !loading && (
                     <div className="col-span-full text-center py-6 text-zinc-500 text-sm font-medium">Nenhuma categoria ativa no momento.</div>
                  )}
               </div>
            </section>

            {/* Banners / Promocoes do Dia */}
            {banners.filter(b => b.pageLayoutType === 'promo').length > 0 && (
               <section className="mb-6">
                  <div className="flex items-center gap-2 mb-4">
                     <TicketPercent className="w-6 h-6 text-orange-500" />
                     <h2 className="font-black text-2xl text-zinc-900">Promoções do Dia</h2>
                  </div>
                  <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 snap-x">
                     {banners.filter(b => b.pageLayoutType === 'promo').map((banner, i) => (
                        <div 
                           key={banner.id || i} 
                           onClick={() => {
                              if (banner.actionType) {
                                switch(banner.actionType) {
                                  case 'ai_page':
                                    navigate(`/banner/${banner.id}`);
                                    break;
                                  case 'product':
                                  case 'service':
                                  case 'merchant':
                                    if (banner.actionTarget) navigate(`/comercio/${banner.actionTarget}`);
                                    break;
                                  case 'job':
                                    navigate(`/empregos`);
                                    break;
                                  case 'external':
                                    window.open(banner.actionTarget, '_blank');
                                    break;
                                  case 'search':
                                    navigate(`/busca?q=${encodeURIComponent(banner.actionTarget || '')}`);
                                    break;
                                  default:
                                    if (banner.pageEnabled) navigate(`/banner/${banner.id}`);
                                    else if (banner.actionTarget) navigate(`/comercio/${banner.actionTarget}`);
                                }
                              } else {
                                if (banner.pageEnabled) navigate(`/banner/${banner.id}`);
                                else if (banner.actionTarget) navigate(`/comercio/${banner.actionTarget}`);
                              }
                           }}
                           className="snap-center shrink-0 w-[280px] md:w-[320px] h-[160px] rounded-3xl overflow-hidden relative shadow-sm cursor-pointer group"
                        >
                           <img src={banner.imageUrl || 'https://placehold.co/600x300/orange/white'} alt={banner.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                           <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4">
                              <h3 className="text-white font-black text-lg leading-tight">{banner.title}</h3>
                              <p className="text-white/80 text-xs font-medium mt-1">{banner.subtitle}</p>
                           </div>
                        </div>
                     ))}
                  </div>
               </section>
            )}

            {/* Classified Stores List */}
            <div className="space-y-12">
               {loading ? (
                   <div className="flex justify-center py-12"><div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div>
               ) : merchants.length === 0 ? (
                  <div className="bg-white rounded-3xl p-8 text-center border border-zinc-100 shadow-sm flex flex-col items-center">
                     <Store className="w-16 h-16 text-zinc-300 mb-4" />
                     <h3 className="font-bold text-lg text-zinc-800">Nada por aqui ainda</h3>
                     <p className="text-sm text-zinc-500">Nenhum comércio foi cadastrado.</p>
                  </div>
               ) : (
                  <>
                     {categories.map((cat) => {
                        // find merchants in this category
                        const catMerchants = merchants.filter(m => m.categoryId === cat.id || m.category === cat.name);
                        if (catMerchants.length === 0) return null;

                        return (
                           <section key={cat.id} className="bg-white rounded-3xl p-6 shadow-sm border border-zinc-100">
                              <h2 className="font-black text-2xl text-zinc-900 mb-6 flex items-center gap-2">
                                 <Store className="w-6 h-6 text-emerald-500" />
                                 {cat.name}
                              </h2>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                 {catMerchants.map(merc => (
                                    <div 
                                       key={merc.id} 
                                       onClick={() => navigate(`/comercio/${merc.id}`)} 
                                       className="bg-zinc-50 rounded-2xl p-4 border border-zinc-200/60 flex items-start gap-4 cursor-pointer hover:border-emerald-300 hover:shadow-md transition-all group"
                                    >
                                       <div className="w-24 h-24 rounded-2xl bg-white overflow-hidden shrink-0 border border-zinc-200 shadow-sm relative flex items-center justify-center">
                                          {merc.logoImage ? (
                                             <img src={merc.logoImage} alt={merc.businessName} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                          ) : (
                                             <Store className="w-8 h-8 text-zinc-300" />
                                          )}
                                          {!merc.isOpen && (
                                             <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
                                                <span className="text-white text-[10px] font-bold uppercase tracking-wider bg-black/60 px-2 py-1 rounded-md mb-2">Fechado</span>
                                             </div>
                                          )}
                                       </div>
                                       <div className="flex-1 min-w-0 py-1 flex flex-col h-full justify-between">
                                          <div>
                                             <h3 className="font-bold text-zinc-900 truncate text-lg group-hover:text-emerald-600 transition-colors">{merc.businessName}</h3>
                                             <p className="text-sm text-zinc-500 mb-2 truncate font-medium">{cat.name}</p>
                                          </div>
                                          <div className="flex items-center justify-between mt-auto">
                                             <span className={cn("flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg", merc.isOpen ? "bg-emerald-50 text-emerald-600" : "bg-zinc-100 text-zinc-500")}>
                                                <Clock className="w-3.5 h-3.5" />
                                                {merc.isOpen ? 'Aberto' : 'Fechado'}
                                             </span>
                                             <span className="flex items-center gap-1 text-orange-500 font-bold text-sm bg-orange-50 px-2.5 py-0.5 rounded-lg border border-orange-100">
                                                <Star className="w-3.5 h-3.5 fill-current" /> 4.9
                                             </span>
                                          </div>
                                       </div>
                                    </div>
                                 ))}
                              </div>
                           </section>
                        );
                     })}

                     {/* Uncategorized or local stores */}
                     {merchants.filter(m => !categories.some(cat => m.categoryId === cat.id || m.category === cat.name)).length > 0 && (
                        <section className="bg-white rounded-3xl p-6 shadow-sm border border-zinc-100">
                           <h2 className="font-black text-2xl text-zinc-900 mb-6 flex items-center gap-2">
                              <Store className="w-6 h-6 text-zinc-400" />
                              Outros Comércios
                           </h2>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {merchants.filter(m => !categories.some(cat => m.categoryId === cat.id || m.category === cat.name)).map(merc => (
                                 <div 
                                    key={merc.id} 
                                    onClick={() => navigate(`/comercio/${merc.id}`)} 
                                    className="bg-zinc-50 rounded-2xl p-4 border border-zinc-200/60 flex items-start gap-4 cursor-pointer hover:border-zinc-300 hover:shadow-md transition-all group"
                                    >
                                    <div className="w-24 h-24 rounded-2xl bg-white overflow-hidden shrink-0 border border-zinc-200 shadow-sm relative flex items-center justify-center">
                                       {merc.logoImage ? (
                                          <img src={merc.logoImage} alt={merc.businessName} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                       ) : (
                                          <Store className="w-8 h-8 text-zinc-300" />
                                       )}
                                       {!merc.isOpen && (
                                          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
                                             <span className="text-white text-[10px] font-bold uppercase tracking-wider bg-black/60 px-2 py-1 rounded-md mb-2">Fechado</span>
                                          </div>
                                       )}
                                    </div>
                                    <div className="flex-1 min-w-0 py-1 flex flex-col h-full justify-between">
                                       <div>
                                          <h3 className="font-bold text-zinc-900 truncate text-lg group-hover:text-zinc-600 transition-colors">{merc.businessName}</h3>
                                          <p className="text-sm text-zinc-500 mb-2 truncate font-medium">{merc.category || 'Comércio Local'}</p>
                                       </div>
                                       <div className="flex items-center justify-between mt-auto">
                                          <span className={cn("flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg", merc.isOpen ? "bg-emerald-50 text-emerald-600" : "bg-zinc-100 text-zinc-500")}>
                                             <Clock className="w-3.5 h-3.5" />
                                             {merc.isOpen ? 'Aberto' : 'Fechado'}
                                          </span>
                                          <span className="flex items-center gap-1 text-orange-500 font-bold text-sm bg-orange-50 px-2.5 py-0.5 rounded-lg border border-orange-100">
                                             <Star className="w-3.5 h-3.5 fill-current" /> 4.9
                                          </span>
                                       </div>
                                    </div>
                                 </div>
                              ))}
                           </div>
                        </section>
                     )}
                  </>
               )}
            </div>
         </div>
      </div>
   );
}
