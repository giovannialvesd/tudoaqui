import React, { useEffect, useState } from 'react';
import { collection, query, limit, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/errors';
import { Store, Star, ArrowRight, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function RecommendedProducts() {
   const [products, setProducts] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);
   const navigate = useNavigate();

   useEffect(() => {
     const fetchProducts = async () => {
       try {
         const q = query(collection(db, 'products'), limit(30));
         const snapshot = await getDocs(q);
         if (!snapshot.empty) {
           const allProducts = snapshot.docs
             .map(d => ({id: d.id, ...d.data()}))
             .filter((p: any) => p.merchantId && p.merchantId.trim() !== '');
           
           const shuffled = allProducts.sort(() => 0.5 - Math.random()).slice(0, 10);
           setProducts(shuffled);
         }
       } catch(e) {
         handleFirestoreError(e, OperationType.LIST, 'products');
       } finally {
         setLoading(false);
       }
     }
     fetchProducts();
   }, []);

   if(loading) return null;
   if(products.length === 0) return null;

   return (
      <section className="mb-10">
         <div className="flex items-end justify-between mb-5">
            <div>
               <h2 className="font-black text-xl text-zinc-900 tracking-tight">Seleção para você</h2>
               <p className="text-sm text-zinc-500 font-medium">Produtos recomendados das lojas da região</p>
            </div>
         </div>
         
         <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 -mx-4 px-4 md:mx-0 md:px-0 scroll-smooth">
           {products.map(product => (
              <div 
                key={product.id} 
                onClick={() => navigate(`/produto/${product.id}`)} 
                className="w-[110px] md:w-[130px] bg-white rounded-[1.1rem] p-1.5 border border-zinc-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-md transition-shadow cursor-pointer shrink-0 group flex flex-col justify-between"
              >
                 <div>
                    <div className="w-full aspect-square rounded-xl overflow-hidden relative mb-2 bg-zinc-100 flex items-center justify-center">
                       {product.imageUrl ? (
                         <img 
                           src={product.imageUrl} 
                           alt={product.name} 
                           loading="lazy"
                           onError={(e) => {
                             e.currentTarget.onerror = null;
                             e.currentTarget.src = 'https://placehold.co/400x400/e4e4e7/a1a1aa?text=Produto';
                           }}
                           className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                         />
                       ) : (
                         <Package className="w-8 h-8 text-zinc-300" />
                       )}
                       {product.isPromotion && (
                          <div className="absolute top-1.5 left-1.5 bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md">
                            OFERTA
                          </div>
                       )}
                    </div>
                    <div className="px-1">
                       <h3 className="font-bold text-zinc-900 text-sm line-clamp-2 leading-tight mb-1">{product.name}</h3>
                       {product.merchantName && (
                          <p className="text-[10px] text-zinc-500 flex items-center gap-1 mb-1.5">
                             <Store className="w-3 h-3 shrink-0" /> <span className="truncate">{product.merchantName}</span>
                          </p>
                       )}
                    </div>
                 </div>
                 <div className="px-1 mt-1">
                    <div className="flex items-center justify-between">
                       <span className="font-black text-emerald-600 text-base">R$ {product.price?.toFixed(2)}</span>
                       <button className="bg-zinc-100 text-zinc-600 p-1.5 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                          <ArrowRight className="w-3.5 h-3.5" />
                       </button>
                    </div>
                 </div>
              </div>
           ))}
         </div>
      </section>
   );
}
