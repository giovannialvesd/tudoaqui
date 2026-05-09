import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Store, Heart } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { toast } from 'sonner';
import { useFavorites } from '../hooks/useFavorites';
import { cn } from '../lib/utils';

export default function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useFavorites();

  const [product, setProduct] = useState<any>(null);
  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if(!id) return;
    const fetchProduct = async () => {
       try {
         const snap = await getDoc(doc(db, 'products', id));
         if (snap.exists()) {
            const prodData = snap.data();
            setProduct(prodData);
            
            // fetch store
            if (prodData.merchantId) {
               const sSnap = await getDoc(doc(db, 'business_profiles', prodData.merchantId));
               if(sSnap.exists()) setStore(sSnap.data());
            }
         }
       } catch(e) {
         console.error(e);
       } finally {
         setLoading(false);
       }
    };
    fetchProduct();
  }, [id]);

  if (loading) return <div className="min-h-screen bg-zinc-50 flex items-center justify-center">Carregando...</div>;
  
  if (!product) return <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-4 text-center">
    <Package className="w-12 h-12 text-zinc-300 mb-4" />
    <h2 className="text-xl font-bold text-zinc-700">Produto não encontrado</h2>
    <button onClick={() => navigate('/')} className="mt-4 text-emerald-600 font-bold">Voltar</button>
  </div>;

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 md:bg-zinc-100/50 pb-20">
      
      {/* Top Header Navigation */}
      <div className="fixed top-0 inset-x-0 h-20 bg-white/80 backdrop-blur-md z-50 flex items-center justify-between px-4 lg:px-8 shadow-sm">
         <button 
           onClick={() => navigate(-1)}
           className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-700 hover:bg-zinc-200 transition-colors"
         >
           <ArrowLeft className="w-5 h-5" />
         </button>
         <h1 className="font-bold text-zinc-900 truncate px-4 max-w-[200px] md:max-w-xs">{product.name}</h1>
         <button 
           onClick={(e) => {
              e.preventDefault();
              toggleFavorite({
                 itemId: id!,
                 type: 'product',
                 title: product.name || 'Produto',
                 subtitle: `R$ ${product.price?.toFixed(2)}`,
                 imageUrl: product.imageUrl,
                 url: `/produto/${id}`
              });
           }}
           className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-700 hover:bg-zinc-200 transition-colors"
         >
            <Heart className={cn("w-5 h-5 transition-colors", isFavorite(id!, 'product') && "fill-rose-500 text-rose-500")} />
         </button>
      </div>

      <div className="pt-24 px-4 lg:px-8 max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16">
         
         {/* Left Side: Product Image Galery Frame */}
         <div className="relative w-full aspect-square md:aspect-auto md:h-[600px] bg-white rounded-[2.5rem] p-6 shadow-sm border border-zinc-100 flex items-center justify-center overflow-hidden">
            {product.imageUrl ? (
              <img 
                 src={product.imageUrl} 
                 alt={product.name} 
                 className="w-full h-full object-contain drop-shadow-xl hover:scale-[1.02] transition-transform duration-500" 
              />
            ) : (
              <Package className="w-32 h-32 text-zinc-200 drop-shadow-sm" />
            )}
            {product.isPromotion && (
               <div className="absolute top-6 left-6 bg-rose-500 text-white text-xs font-black px-3 py-1.5 rounded-full shadow-lg">
                 OFERTA ESPECIAL
               </div>
            )}
         </div>

         {/* Right Side: Product Details */}
         <div className="flex flex-col justify-center py-4 md:py-8">
            {product.category && (
               <p className="text-emerald-600 font-bold text-sm tracking-widest uppercase mb-3">{product.category}</p>
            )}
            <h1 className="text-3xl md:text-5xl font-black text-zinc-900 leading-tight mb-4 tracking-tight">
               {product.name}
            </h1>
            
            <div className="flex items-baseline gap-3 mb-8">
               <span className="text-4xl font-black text-zinc-900">R$ {product.price?.toFixed(2).replace('.', ',')}</span>
            </div>
            
            {product.description && (
               <div className="mb-10">
                  <p className="text-zinc-600 text-base md:text-lg leading-relaxed">{product.description}</p>
               </div>
            )}

            <button 
               onClick={() => {
                   if (!store?.phone) return toast.error('Comerciante sem telefone cadastrado');
                   const number = store.phone.replace(/\D/g, '');
                   const intent = store.acceptsDelivery 
                      ? `Olá, gostaria de fazer um pedido de entrega do produto *${product.name}* (R$ ${product.price?.toFixed(2)}).`
                      : `Olá, tenho interesse no produto *${product.name}* (R$ ${product.price?.toFixed(2)}).`;
                   window.open(`https://wa.me/55${number}?text=${encodeURIComponent(intent)}`, '_blank');
               }}
               className="bg-emerald-600 text-white font-black text-lg px-8 py-5 rounded-2xl shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 hover:-translate-y-1 hover:shadow-xl transition-all w-full flex items-center justify-center gap-2 mb-10"
            >
               {store?.acceptsDelivery ? 'Fazer Pedido Agora' : 'Conversar com o Vendedor'}
            </button>
            
            {store && (
              <div 
                onClick={() => navigate(`/comercio/${product.merchantId}`)}
                className="bg-white p-5 rounded-3xl border border-zinc-100 shadow-sm flex items-center gap-4 cursor-pointer hover:border-emerald-300 transition-colors group"
              >
                 <div className="w-14 h-14 rounded-2xl bg-zinc-50 border border-zinc-100 overflow-hidden shrink-0 flex items-center justify-center relative">
                    {store.logoImage ? (
                       <img src={store.logoImage} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                       <Store className="w-6 h-6 text-zinc-300" />
                    )}
                 </div>
                 <div className="flex-1">
                    <p className="text-xs text-zinc-500 font-medium mb-0.5">Vendido e entregue por</p>
                    <h4 className="text-base font-bold text-zinc-900 group-hover:text-emerald-600 transition-colors">{store.businessName}</h4>
                 </div>
                 <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <ArrowLeft className="w-5 h-5 rotate-180" />
                 </div>
              </div>
            )}
         </div>

      </div>
    </div>
  )
}

