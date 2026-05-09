import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useNavigate } from 'react-router-dom';
import { Star, MapPin, Package, ShoppingBag, PlusCircle } from 'lucide-react';

export default function HomeSectionBlock({ section }: { section: any, key?: string | number }) {
   const navigate = useNavigate();
   const [items, setItems] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      const fetchItems = async () => {
         try {
            let q: any;
            if (section.type === 'products') {
               q = query(collection(db, 'products'), where('isAvailable', '==', true), limit(10));
            } else if (section.type === 'merchants') {
               q = query(collection(db, 'business_profiles'), limit(10));
            } else if (section.type === 'services') {
               q = query(collection(db, 'provider_profiles'), limit(10));
            }

            if (q) {
               const snap = await getDocs(q);
               let fetched = snap.docs.map(d => ({id: d.id, ...(d.data() as any)}));
               
               // Filter products without merchant
               if (section.type === 'products') {
                  fetched = fetched.filter(item => item.merchantId && item.merchantId.trim() !== '');
               }

               // Client-side category filtering if categoryId is provided (since we might not have composite indexes ready)
               if (section.categoryId) {
                  fetched = fetched.filter(item => item.category === section.categoryId || item.businessCategory === section.categoryId);
               }
               setItems(fetched);
            }
         } catch(e) {
            console.warn(e);
         } finally {
            setLoading(false);
         }
      }
      fetchItems();
   }, [section]);

   if (loading || items.length === 0) return null;

   return (
      <section className="mb-12 w-full">
         <div className="flex items-end justify-between px-4 md:px-0 mb-6">
            <div>
               <h2 className="font-black text-2xl text-zinc-900 tracking-tight flex items-center gap-2">
                  {section.type === 'products' ? <ShoppingBag className="w-5 h-5 text-emerald-500" /> : <Star className="w-5 h-5 text-emerald-500" />}
                  {section.title}
               </h2>
               {section.subtitle && <p className="text-zinc-500 text-sm mt-1">{section.subtitle}</p>}
            </div>
            <button onClick={() => navigate('/busca')} className="text-emerald-600 font-bold text-sm bg-emerald-50 px-4 py-2 rounded-xl hover:bg-emerald-100 transition-colors shadow-sm">
               Ver Tudo
            </button>
         </div>

         <div className="flex gap-5 overflow-x-auto no-scrollbar pb-6 -mx-4 px-4 md:mx-0 md:px-0 scroll-smooth snap-x">
            {items.map((item, idx) => (
               <div key={item.id} className="snap-start shrink-0 w-[260px] md:w-[300px]">
                  {section.type === 'products' ? (
                     <div onClick={() => navigate(`/produto/${item.id}`)} className="bg-white rounded-3xl overflow-hidden border border-zinc-100 shadow-sm hover:shadow-xl hover:shadow-zinc-200/40 hover:-translate-y-1 transition-all duration-300 cursor-pointer group flex flex-col h-full">
                        <div className="w-full h-44 bg-zinc-100 relative overflow-hidden">
                           {item.imageUrl ? (
                              <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                           ) : (
                              <div className="w-full h-full flex items-center justify-center"><Package className="w-12 h-12 text-zinc-300" /></div>
                           )}
                           <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm px-2.5 py-1.5 rounded-xl flex items-center gap-1 font-bold text-xs text-zinc-800 shadow-sm">
                               <Star className="w-3.5 h-3.5 text-orange-400 fill-orange-400" /> 4.9
                           </div>
                        </div>
                        <div className="p-5 flex flex-col flex-1">
                           <h3 className="font-bold text-zinc-900 text-lg leading-tight mb-2 group-hover:text-emerald-600 transition-colors line-clamp-2">{item.name}</h3>
                           <p className="text-xs text-zinc-500 mb-3 line-clamp-1">{item.merchantName || 'Loja Parceira'}</p>
                           <div className="mt-auto pt-4 flex items-center justify-between border-t border-zinc-50">
                              {item.promotionalPrice ? (
                                <div className="flex flex-col">
                                  <span className="text-emerald-600 font-black text-xl tracking-tight">R$ {item.promotionalPrice.toFixed(2)}</span>
                                  <span className="text-zinc-400 text-xs line-through font-medium">R$ {item.price.toFixed(2)}</span>
                                </div>
                              ) : (
                                <span className="text-emerald-600 font-black text-xl tracking-tight">R$ {item.price?.toFixed(2) || '0.00'}</span>
                              )}
                              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white text-emerald-600 transition-colors">
                                 <PlusCircle className="w-5 h-5 mx-auto" />
                              </div>
                           </div>
                        </div>
                     </div>
                  ) : (
                     <div onClick={() => navigate(`/comercio/${item.id}`)} className="bg-white rounded-3xl p-5 border border-zinc-100 shadow-sm hover:shadow-xl hover:shadow-zinc-200/40 hover:-translate-y-1 transition-all duration-300 cursor-pointer group h-full flex flex-col relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-emerald-50 to-teal-50/50 group-hover:h-32 transition-all duration-500 z-0"></div>
                        <div className="relative z-10 flex flex-col items-center text-center flex-1">
                           <div className="w-24 h-24 bg-white rounded-[1.5rem] overflow-hidden mb-4 relative shadow-md ring-4 ring-white">
                              {item.logoImage || item.logoUrl || item.profileImageUrl ? (
                                 <img src={item.logoImage || item.logoUrl || item.profileImageUrl} alt={item.businessName || item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                              ) : (
                                 <div className="w-full h-full flex items-center justify-center font-black text-3xl text-zinc-300 bg-zinc-50">
                                    {(item.businessName || item.name || 'L')[0]}
                                 </div>
                              )}
                           </div>
                           <h3 className="font-bold text-zinc-900 text-lg leading-tight mb-1 group-hover:text-emerald-600 transition-colors truncate w-full">{item.businessName || item.name}</h3>
                           <p className="text-sm text-zinc-500 line-clamp-1 mb-4 font-medium">{item.businessCategory || item.category || 'Parceiro Local'}</p>
                           
                           <div className="mt-auto flex items-center justify-center gap-2 w-full">
                              <span className="flex items-center text-zinc-700 font-bold text-xs bg-zinc-50 px-2.5 py-1.5 rounded-lg border border-zinc-100/50 flex-1 justify-center">
                                 <Star className="w-3.5 h-3.5 text-orange-400 fill-orange-400 mr-1" /> 4.9
                              </span>
                              <span className={`font-bold text-[10px] uppercase tracking-wider px-2.5 py-1.5 rounded-lg flex-1 border ${item.isOpen ? 'bg-emerald-50 text-emerald-600 border-emerald-100/50' : 'bg-zinc-50 text-zinc-400 border-zinc-100/50'}`}>
                                 {item.isOpen ? 'Aberto' : 'Fechado'}
                              </span>
                           </div>
                        </div>
                     </div>
                  )}
               </div>
            ))}
         </div>
      </section>
   );
}
