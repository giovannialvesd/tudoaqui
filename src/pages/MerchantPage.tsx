import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Clock, MapPin, Search, ChevronRight, Store, Heart, Share2, MessageCircle, Info, LayoutGrid, Tag } from 'lucide-react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { toast } from 'sonner';
import { useFavorites } from '../hooks/useFavorites';
import { cn } from '../lib/utils';
import RecommendedProducts from '../components/RecommendedProducts';
import { motion, AnimatePresence } from 'motion/react';

// Leaflet Map Imports
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
// @ts-ignore
import iconUrl from 'leaflet/dist/images/marker-icon.png';
// @ts-ignore
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
// @ts-ignore
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

function LocationMap({ address, name }: { address: string, name: string }) {
  const [coords, setCoords] = useState<[number, number] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`)
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          setCoords([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
        } else {
          setError(true);
        }
      })
      .catch(() => setError(true));
  }, [address]);

  if (error) return <div className="text-zinc-500 text-sm p-4 bg-zinc-50 rounded-3xl border border-zinc-100 flex items-center justify-center h-full">Não foi possível encontrar a localização no mapa.</div>;
  if (!coords) return <div className="h-full bg-zinc-50 rounded-3xl animate-pulse flex items-center justify-center text-sm text-zinc-400 border border-zinc-100 italic">Preparando mapa...</div>;

  return (
    <div className="h-full w-full rounded-3xl overflow-hidden shadow-inner border border-zinc-200 z-0 relative min-h-[200px]">
      <MapContainer center={coords} zoom={15} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={coords}>
          <Popup>{name}</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}

export default function MerchantPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useFavorites();

  const [store, setStore] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'products' | 'info'>('products');

  useEffect(() => {
    if(!id) return;
    const fetchStoreUser = async () => {
       try {
         const profileSnap = await getDoc(doc(db, 'business_profiles', id));
         if (profileSnap.exists()) {
            setStore(profileSnap.data());
         }

         const q = query(collection(db, 'products'), where('merchantId', '==', id), where('isAvailable', '==', true));
         const pSnap = await getDocs(q);
         setProducts(pSnap.docs.map(d => ({id: d.id, ...d.data()})));

       } catch(e) {
         console.error(e);
       } finally {
         setLoading(false);
       }
    }
    fetchStoreUser();
  }, [id]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: store.businessName,
        text: `Confira a loja ${store.businessName} no TudoAqui!`,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copiado para a área de transferência!');
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent animate-spin rounded-full"></div>
        <p className="text-zinc-500 font-bold animate-pulse uppercase tracking-widest text-xs">Carregando Estabelecimento</p>
      </div>
    </div>
  );
  
  if (!store) return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-8 text-center">
      <div className="w-20 h-20 bg-zinc-100 rounded-3xl flex items-center justify-center mb-6 text-zinc-300">
        <Store className="w-10 h-10" />
      </div>
      <h2 className="text-2xl font-black text-zinc-900 mb-2">Ops! Comércio não encontrado</h2>
      <p className="text-zinc-500 mb-8 max-w-xs">Parece que este estabelecimento não está cadastrado ou foi removido.</p>
      <button 
        onClick={() => navigate('/')} 
        className="bg-zinc-900 text-white font-black py-4 px-8 rounded-2xl shadow-xl shadow-zinc-900/20 active:scale-95 transition-transform"
      >
        Voltar ao início
      </button>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen pb-20 bg-zinc-50">
      
      {/* Cover / Header Area with modern vibe */}
      <div className="relative h-64 md:h-[450px] w-full overflow-hidden bg-zinc-950">
         {store.bannerImage ? (
           <motion.div 
             initial={{ scale: 1.05, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             transition={{ duration: 1.2, ease: "easeOut" }}
             className="absolute inset-0"
           >
             <img 
               src={store.bannerImage} 
               alt="Cover" 
               className="w-full h-full object-cover object-center" 
             />
             {/* Dynamic subtle overlays for depth and legibility */}
             <div className="absolute inset-0 bg-gradient-to-t from-zinc-50 via-transparent to-black/40"></div>
             <div className="absolute inset-0 bg-black/10"></div>
          </motion.div>
         ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center overflow-hidden">
               <Store className="w-64 h-64 text-white/5 -rotate-12 absolute -right-10 -bottom-10" />
               <div className="absolute inset-0 bg-gradient-to-t from-zinc-50 to-transparent"></div>
            </div>
         )}
         
         <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-20">
            <button 
              onClick={() => navigate(-1)}
              className="w-12 h-12 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center text-white border border-white/20 hover:bg-white/40 transition-all shadow-lg"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="flex gap-2">
               <button 
                  onClick={handleShare}
                  className="w-12 h-12 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center text-white border border-white/20 hover:bg-white/40 transition-all shadow-lg"
               >
                  <Share2 className="w-5 h-5" />
               </button>
               <button 
                  onClick={(e) => {
                     e.preventDefault();
                     toggleFavorite({
                        itemId: id!,
                        type: 'merchant',
                        title: store.businessName || 'Comércio',
                        subtitle: store.category,
                        imageUrl: store.logoImage,
                        url: `/comercio/${id}`
                     });
                  }}
                  className="w-12 h-12 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center text-white border border-white/20 hover:bg-white/40 transition-all shadow-lg"
               >
                  <Heart className={cn("w-5 h-5 transition-colors", isFavorite(id!, 'merchant') && "fill-rose-500 text-rose-500")} />
               </button>
            </div>
         </div>
      </div>

      <div className="px-5 md:px-8 max-w-6xl mx-auto w-full -mt-20 md:-mt-32 relative z-30">
         {/* Store Profile Main Card */}
         <div className="bg-white rounded-[2.5rem] p-6 md:p-10 shadow-2xl shadow-zinc-200/60 border border-zinc-100 mb-10">
            <div className="flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-8">
               <motion.div 
                 initial={{ y: 20, opacity: 0 }}
                 animate={{ y: 0, opacity: 1 }}
                 className="relative"
               >
                  <div className="w-32 h-32 md:w-44 md:h-44 rounded-[2.5rem] border-8 border-white overflow-hidden shrink-0 shadow-2xl bg-zinc-50 flex items-center justify-center relative z-10">
                     {store.logoImage ? (
                        <img src={store.logoImage} alt="Logo" className="w-full h-full object-cover" />
                     ) : (
                        <Store className="w-16 h-16 text-zinc-300" />
                     )}
                  </div>
                  {store.isOpen ? (
                     <div className="absolute -top-2 -right-2 bg-emerald-500 text-white text-[10px] font-black uppercase px-3 py-1.5 rounded-full border-4 border-white shadow-lg z-20 flex items-center gap-1">
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                        Aberto
                     </div>
                  ) : (
                     <div className="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] font-black uppercase px-3 py-1.5 rounded-full border-4 border-white shadow-lg z-20">
                        Fechado
                     </div>
                  )}
               </motion.div>
               
               <div className="flex-1">
                  <div className="mb-4">
                    <span className="bg-emerald-50 text-emerald-600 px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-widest mb-3 inline-block">
                       {store.category || 'Estabelecimento Parceiro'}
                    </span>
                    <h1 className="text-3xl md:text-5xl font-black text-zinc-900 tracking-tighter leading-none mb-4">{store.businessName}</h1>
                  </div>
                  
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-8">
                     <div className="flex items-center text-orange-400 font-black bg-orange-50 px-4 py-2 rounded-2xl text-sm border border-orange-100/50">
                        <Star className="w-4 h-4 fill-orange-400 mr-2" />
                        {store.rating?.toFixed(1) || '5.0'}
                        <span className="text-zinc-400 font-bold ml-2">(24+)</span>
                     </div>
                     <div className="flex items-center text-zinc-500 font-bold bg-zinc-50 px-4 py-2 rounded-2xl text-sm border border-zinc-100">
                        <Clock className="w-4 h-4 mr-2 text-zinc-400" />
                        <div className="flex flex-col text-[10px] leading-none">
                           <span className="text-zinc-400 uppercase mb-0.5 tracking-tighter">Horário</span>
                           <span className="text-zinc-700 text-xs font-black">{store.openingHours || '08:00 - 18:00'}</span>
                        </div>
                     </div>
                     {store.openingDays && store.openingDays.length > 0 && (
                        <div className="flex items-center gap-1 bg-zinc-50 px-3 py-2 rounded-2xl border border-zinc-100">
                           {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'].map(d => (
                              <span 
                                 key={d} 
                                 className={cn(
                                    "text-[9px] font-black w-5 h-5 flex items-center justify-center rounded-md",
                                    store.openingDays.includes(d) ? "bg-emerald-500 text-white" : "text-zinc-300"
                                 )}
                              >
                                 {d[0]}
                              </span>
                           ))}
                        </div>
                     )}
                     {store.distance && (
                       <div className="flex items-center text-zinc-500 font-bold bg-zinc-50 px-4 py-2 rounded-2xl text-sm border border-zinc-100">
                          <MapPin className="w-4 h-4 mr-2 text-zinc-400" />
                          {store.distance}
                       </div>
                     )}
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4">
                     <button 
                        onClick={() => store?.phone ? window.open(`https://wa.me/55${store.phone.replace(/\D/g, '')}`, '_blank') : toast.error('Telefone não cadastrado')}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white font-black py-5 px-10 rounded-[2rem] shadow-xl shadow-emerald-500/30 transition-all hover:-translate-y-1 flex items-center justify-center gap-3 active:scale-95 group"
                     >
                        <MessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
                        <span>Conversar no WhatsApp</span>
                     </button>
                     {store.phone && (
                        <a 
                          href={`tel:${store.phone}`}
                          className="bg-zinc-900 hover:bg-black text-white font-black py-5 px-8 rounded-[2rem] shadow-xl shadow-zinc-900/10 transition-all hover:-translate-y-1 flex items-center justify-center gap-3 active:scale-95"
                        >
                          Ligar Agora
                        </a>
                     )}
                  </div>
               </div>
            </div>
         </div>

         {/* Navigation Tabs */}
         <div className="flex p-2 bg-white rounded-3xl border border-zinc-100 mb-8 shadow-sm">
            <button 
              onClick={() => setActiveTab('products')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all",
                activeTab === 'products' ? "bg-zinc-900 text-white shadow-lg" : "text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50"
              )}
            >
               <LayoutGrid className="w-4 h-4" />
               Catálogo
            </button>
            <button 
              onClick={() => setActiveTab('info')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all",
                activeTab === 'info' ? "bg-zinc-900 text-white shadow-lg" : "text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50"
              )}
            >
               <Info className="w-4 h-4" />
               Informações
            </button>
         </div>

         <AnimatePresence mode="wait">
            {activeTab === 'products' ? (
               <motion.div 
                 key="products"
                 initial={{ y: 20, opacity: 0 }}
                 animate={{ y: 0, opacity: 1 }}
                 exit={{ y: -20, opacity: 0 }}
                 transition={{ duration: 0.3 }}
               >
                  <div className="flex items-center justify-between mb-8">
                     <h2 className="font-extrabold text-2xl text-zinc-900 tracking-tight">Nosso Catálogo</h2>
                     <div className="flex items-center gap-2 text-zinc-400 text-xs font-bold uppercase tracking-widest">
                        <Tag className="w-4 h-4" /> {products.length} Itens
                     </div>
                  </div>

                  {products.length === 0 ? (
                     <div className="text-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-zinc-100">
                        <Store className="w-16 h-16 text-zinc-100 mx-auto mb-4" />
                        <h3 className="font-bold text-zinc-400 text-lg">Catálogo em construção</h3>
                        <p className="text-zinc-300 text-sm mt-1">Este estabelecimento ainda não publicou seus produtos.</p>
                     </div>
                  ) : (
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                        {products.map((product, idx) => (
                          <motion.div 
                            key={product.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            onClick={() => navigate(`/produto/${product.id}`)}
                            className="bg-white rounded-[2.5rem] p-3 shadow-xl shadow-zinc-100/30 border border-zinc-100 hover:border-emerald-500/30 transition-all cursor-pointer group flex items-stretch h-44"
                          >
                            <div className="w-36 h-full rounded-[2rem] overflow-hidden bg-zinc-50 shrink-0 relative">
                               {product.imageUrl ? (
                                  <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                               ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-zinc-100 text-zinc-300">
                                     <Store className="w-8 h-8 opacity-20" />
                                  </div>
                               )}
                               {product.isPromotion && (
                                  <div className="absolute top-2 left-2 bg-orange-500 text-white text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-wider shadow-lg">Oferta</div>
                               )}
                            </div>
                            <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
                               <div>
                                  <h3 className="font-black text-zinc-800 text-lg leading-none mb-2 line-clamp-1 group-hover:text-emerald-600 transition-colors">{product.name}</h3>
                                  <p className="text-sm text-zinc-400 font-medium line-clamp-2 leading-relaxed">{product.description}</p>
                               </div>
                               <div className="flex items-center justify-between mt-autp">
                                  <span className="font-black text-2xl text-zinc-900 tracking-tighter">R$ {product.price?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                  <div className="w-10 h-10 rounded-2xl bg-zinc-50 flex items-center justify-center text-zinc-400 group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-sm">
                                     <ChevronRight className="w-5 h-5" />
                                  </div>
                               </div>
                            </div>
                          </motion.div>
                        ))}
                     </div>
                  )}
               </motion.div>
            ) : (
               <motion.div 
                 key="info"
                 initial={{ y: 20, opacity: 0 }}
                 animate={{ y: 0, opacity: 1 }}
                 exit={{ y: -20, opacity: 0 }}
                 transition={{ duration: 0.3 }}
                 className="space-y-8"
               >
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                     {store.description && (
                        <div className="bg-white rounded-[2.5rem] p-10 border border-zinc-100 shadow-sm">
                           <h3 className="text-2xl font-black text-zinc-900 tracking-tight mb-6 underline decoration-emerald-500/30 decoration-[6px] underline-offset-4">Sobre o Negócio</h3>
                           <p className="text-zinc-500 font-medium text-lg leading-relaxed whitespace-pre-wrap">{store.description}</p>
                        </div>
                     )}

                     <div className="bg-white rounded-[2.5rem] p-10 border border-zinc-100 shadow-sm flex flex-col">
                        <h3 className="text-2xl font-black text-zinc-900 tracking-tight mb-6 underline decoration-orange-500/30 decoration-[6px] underline-offset-4">Onde Estamos</h3>
                        {store.address ? (
                           <>
                              <p className="text-zinc-600 font-bold mb-8 flex items-start gap-3">
                                 <MapPin className="w-6 h-6 text-emerald-500 shrink-0" />
                                 <span className="text-lg leading-tight">{store.address}</span>
                              </p>
                              <div className="flex-1 rounded-3xl overflow-hidden shadow-inner border border-zinc-200 min-h-[300px]">
                                 <LocationMap address={store.address} name={store.businessName} />
                              </div>
                           </>
                        ) : (
                           <div className="flex-1 flex flex-col items-center justify-center text-center p-10 bg-zinc-50 rounded-3xl border border-dashed border-zinc-200">
                              <MapPin className="w-12 h-12 text-zinc-200 mb-4" />
                              <p className="text-zinc-400 font-bold">Localização não fornecida</p>
                           </div>
                        )}
                     </div>
                  </div>
               </motion.div>
            )}
         </AnimatePresence>

         <div className="mt-24 pt-12 border-t border-zinc-100">
            <RecommendedProducts />
         </div>

      </div>
    </div>
  );
}
