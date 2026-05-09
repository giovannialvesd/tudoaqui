import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { ArrowLeft, AlertTriangle, Calendar, Star, Store, CheckCircle2, ChevronRight, Video, Compass, MapPin } from 'lucide-react';
import { motion } from 'motion/react';
import Markdown from 'react-markdown';

export default function BannerPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [banner, setBanner] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [merchant, setMerchant] = useState<any>(null);
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);

  useEffect(() => {
     const fetchBanner = async () => {
        if(!id) return;
        try {
           const docRef = doc(db, 'banners', id);
           const docSnap = await getDoc(docRef);
           if(docSnap.exists()) {
              const bData = {id: docSnap.id, ...docSnap.data()} as any;
              setBanner(bData);
              if (bData.createdBy) {
                  const mSnap = await getDoc(doc(db, 'business_profiles', bData.createdBy));
                  if (mSnap.exists()) setMerchant(mSnap.data());
              }
              if (bData.selectedProducts && bData.selectedProducts.length > 0) {
                 // Fetch all items sequentially or parallel
                 const prodPromises = bData.selectedProducts.map((pId: string) => getDoc(doc(db, 'products', pId)));
                 const prodSnaps = await Promise.all(prodPromises);
                 const validProds = prodSnaps.map(snap => snap.exists() ? {id: snap.id, ...snap.data()} as any : null).filter(Boolean);
                 setSelectedProducts(validProds);
              }
           }
        } catch(e) {
           console.error(e);
        } finally {
           setLoading(false);
        }
     }
     fetchBanner();
  }, [id]);

  if(loading) return <div className="min-h-screen w-full flex items-center justify-center bg-bg-base"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div></div>;

  if(!banner || !banner.pageEnabled) return (
     <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center p-4 text-center">
        <AlertTriangle className="w-16 h-16 text-zinc-300 mb-4" />
        <h2 className="text-xl font-bold text-zinc-700 mb-2">Página não encontrada ou desativada</h2>
        <p className="text-zinc-500 mb-6 text-sm">Este banner não possui uma página configurada.</p>
        <button onClick={() => navigate(-1)} className="bg-primary text-white font-bold px-6 py-3 rounded-full hover:bg-primary/90 transition-colors">Voltar</button>
     </div>
  );

  const blocks = banner.pageBlocks || [];
  const theme = banner.themeColor || 'bg-rose-600';
  // Use a generic style replacement for the theme config. This is basic tailwind safe-listing or inline style approach. We will just use the theme string if it is a standard tailwind class, else fallback.
  const themeBgList = theme.includes('bg-') ? theme : `bg-rose-600`;
  const themeTextList = theme.replace('bg-', 'text-');

  // Generic helper to resolve style
  const resolveStyle = (style: string, customBg?: string, customText?: string) => {
     if (style === 'custom' && customBg) return `${customBg} ${customText || 'text-white'}`;
     if (style === 'primary') return 'bg-rose-600 text-white';
     if (style === 'dark') return 'bg-zinc-900 text-white';
     if (style === 'light') return 'bg-zinc-50 text-zinc-900 border border-zinc-200';
     return `${themeBgList} text-white`; // default fallback to banner theme
  };

  const renderBlock = (block: any, idx: number) => {
     const config = block.config || {};
     switch(block.type) {
        case 'hero':
           const heroStyle = resolveStyle(config.style || 'default', config.customBgClass, config.customTextClass);
           return (
              <div key={idx} className={`${heroStyle} rounded-3xl p-8 md:p-16 ${config.layout === 'left' ? 'text-left' : 'text-center'} shadow-lg my-6`}>
                 <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tight drop-shadow-sm">{config.headline || banner.title}</h1>
                 {config.subheadline && <p className="text-lg md:text-xl font-medium opacity-90 max-w-2xl mb-8">{config.subheadline}</p>}
                 {config.buttonText && (
                    <button className={`${config.style === 'light' ? themeBgList + ' text-white' : 'bg-white text-zinc-900'} font-black px-8 py-4 rounded-full shadow-xl hover:scale-105 transition-transform inline-flex items-center gap-2`}>
                       {config.buttonText} <ChevronRight className="w-5 h-5" />
                    </button>
                 )}
              </div>
           );
        case 'features':
           return (
              <div key={idx} className="my-12">
                 {config.title && <h2 className="text-3xl font-black text-zinc-900 mb-2 text-center">{config.title}</h2>}
                 {config.subtitle && <p className="text-zinc-500 font-medium mb-8 text-center">{config.subtitle}</p>}
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {(config.items || []).map((item: any, i: number) => (
                       <div key={i} className={`rounded-3xl p-6 ${config.style === 'minimal' ? '' : 'bg-white border border-zinc-100 shadow-sm'} text-center flex flex-col items-center justify-center`}>
                          <div className={`w-16 h-16 rounded-full ${themeBgList} bg-opacity-10 text-rose-600 mb-5 flex items-center justify-center`}>
                             <CheckCircle2 className="w-8 h-8" />
                          </div>
                          <h3 className="text-xl font-bold text-zinc-900 mb-2">{item.title}</h3>
                          <p className="text-zinc-500 font-medium leading-relaxed">{item.description}</p>
                       </div>
                    ))}
                 </div>
              </div>
           );
        case 'text':
           return (
              <div key={idx} className={`my-8 ${config.style === 'boxed' ? 'bg-zinc-50 rounded-3xl p-8 md:p-12 border border-zinc-200' : ''}`}>
                 <div className={`prose prose-lg prose-zinc max-w-none ${config.alignment === 'center' ? 'text-center mx-auto' : ''}`}>
                    <Markdown>{config.content || ''}</Markdown>
                 </div>
              </div>
           );
        case 'video':
           return (
              <div key={idx} className="my-10">
                 {config.title && <h2 className="text-3xl font-black text-zinc-900 mb-2">{config.title}</h2>}
                 {config.subtitle && <p className="text-zinc-500 font-medium mb-6">{config.subtitle}</p>}
                 <div className="rounded-3xl overflow-hidden bg-black aspect-video relative group flex items-center justify-center shadow-2xl">
                    {config.url ? (
                       <iframe src={config.url} className="w-full h-full absolute inset-0 border-0" allowFullScreen></iframe>
                    ) : (
                       <div className="text-center text-white/50">
                          <Video className="w-16 h-16 mx-auto mb-4 opacity-50" />
                          <p className="font-bold">Vídeo Indisponível</p>
                       </div>
                    )}
                 </div>
              </div>
           );
        case 'callToAction':
           const ctaStyle = resolveStyle(config.style || 'primary', config.customBgClass, config.customTextClass);
           return (
              <div key={idx} className={`my-8 rounded-[2rem] p-8 md:p-14 text-center border ${ctaStyle} shadow-xl`}>
                 <h2 className={`text-3xl md:text-4xl font-black mb-4 tracking-tight`}>{config.title}</h2>
                 <p className={`font-medium mb-8 max-w-xl mx-auto opacity-90 text-lg`}>{config.subtitle}</p>
                 <button className={`${config.style === 'light' ? themeBgList + ' text-white' : 'bg-white text-zinc-900'} font-black px-10 py-4 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:scale-105 transition-transform inline-flex items-center gap-2`}>
                    {config.buttonText}
                 </button>
              </div>
           );
         case 'testimonials':
           return (
              <div key={idx} className="my-16">
                 {config.title && <h2 className="text-3xl font-black text-zinc-900 mb-2 text-center tracking-tight">{config.title}</h2>}
                 {config.subtitle && <p className="text-zinc-500 font-medium mb-10 text-center">{config.subtitle}</p>}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {(config.items || []).map((t: any, i: number) => (
                       <div key={i} className={`rounded-[2rem] p-8 ${config.style === 'cards' ? 'bg-white border border-zinc-100 shadow-sm' : 'bg-zinc-50'} relative`}>
                          <Star className="w-10 h-10 text-amber-300 absolute top-6 right-6 opacity-30" />
                          <p className="text-zinc-700 font-medium italic text-lg leading-relaxed mb-8">"{t.quote}"</p>
                          <div className="flex items-center gap-4">
                             <div className={`w-14 h-14 rounded-full ${themeBgList} flex items-center justify-center text-white font-bold text-xl shadow-inner`}>
                                {t.name?.charAt(0)}
                             </div>
                             <div>
                                <h4 className="font-bold text-zinc-900">{t.name}</h4>
                                <p className="text-sm text-zinc-500 font-medium">{t.role}</p>
                             </div>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
           );
         case 'products':
           return (
              <div key={idx} className="my-16">
                 <div className="flex items-center justify-between mb-8">
                    <div>
                       <h2 className="text-2xl md:text-3xl font-black text-zinc-900">{config.title || 'Destaques'}</h2>
                       {config.subtitle && <p className="text-zinc-500 font-medium mt-1">{config.subtitle}</p>}
                    </div>
                    {merchant && <button onClick={() => navigate(`/comercio/${merchant.userId}`)} className="text-rose-600 font-bold hover:underline">Ver Todos</button>}
                 </div>
                 {/* Placeholder for products - In a real setup, we would fetch the user products context here */}
                 <div className={`grid ${config.layout === 'carousel' ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2'} gap-4`}>
                    {Array.from({length: config.count || 4}).map((_, i) => (
                       <div key={i} className="bg-white border border-zinc-100 rounded-2xl p-4 shadow-sm text-center opacity-70 hover:opacity-100 transition-opacity">
                          <div className="aspect-square bg-zinc-100 rounded-xl mb-4 flex items-center justify-center">
                             <Store className="w-10 h-10 text-zinc-300" />
                          </div>
                          <div className="h-4 bg-zinc-200 rounded w-3/4 mx-auto mb-2"></div>
                          <div className="h-3 bg-zinc-100 rounded w-1/2 mx-auto mb-3"></div>
                          <button className={`w-full py-2.5 rounded-xl font-bold text-sm ${themeBgList} text-white`}>Comprar</button>
                       </div>
                    ))}
                 </div>
              </div>
           );
         case 'faq':
           return (
              <div key={idx} className="my-16 max-w-3xl mx-auto">
                 {config.title && <h2 className="text-3xl font-black text-zinc-900 mb-2 text-center tracking-tight">{config.title}</h2>}
                 {config.subtitle && <p className="text-zinc-500 font-medium mb-10 text-center">{config.subtitle}</p>}
                 <div className="space-y-4">
                    {(config.items || []).map((faq: any, i: number) => (
                       <div key={i} className="bg-white border border-zinc-100 rounded-2xl p-6 shadow-sm">
                          <h4 className="font-bold text-zinc-900 text-lg mb-2">{faq.question}</h4>
                          <p className="text-zinc-500 font-medium">{faq.answer}</p>
                       </div>
                    ))}
                 </div>
              </div>
           );
         case 'gallery':
           return (
              <div key={idx} className="my-16">
                 {config.title && <h2 className="text-3xl font-black text-zinc-900 mb-2 text-center">{config.title}</h2>}
                 {config.subtitle && <p className="text-zinc-500 font-medium mb-10 text-center">{config.subtitle}</p>}
                 <div className={`grid ${config.layout === 'masonry' ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-2 md:grid-cols-4'} gap-4`}>
                    {(config.items || []).map((img: any, i: number) => (
                       <div key={i} className="aspect-square bg-zinc-100 rounded-2xl overflow-hidden relative group">
                          {img.url ? <img src={img.url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-bold text-zinc-300">Img {i + 1}</div>}
                          {img.caption && <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent"><p className="text-white font-medium text-sm">{img.caption}</p></div>}
                       </div>
                    ))}
                 </div>
              </div>
           );
        default:
           return <div key={idx} className="p-4 bg-zinc-100 mix-blend-multiply rounded-xl text-center font-mono text-sm text-zinc-500 mb-4">Bloco desconhecido ({block.type})</div>;
     }
  }

  return (
     <div className="min-h-screen bg-bg-base flex flex-col">
        {/* Simple Top Nav if it has no Hero at the top, or just overlay Nav */}
        <div className="fixed top-0 left-0 right-0 z-50 p-4 pointer-events-none">
           <div className="max-w-screen-xl mx-auto w-full flex justify-between">
              <button onClick={() => navigate(-1)} className="pointer-events-auto w-12 h-12 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center hover:bg-black/30 transition-colors border border-white/10 shadow-lg">
                 <ArrowLeft className="w-6 h-6 text-white" />
              </button>
           </div>
        </div>

        {banner.imageUrl && blocks.length === 0 && (
           <div className="relative w-full h-[40vh] md:h-[50vh] bg-zinc-900 overflow-hidden shrink-0">
              <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover opacity-60" />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 max-w-screen-xl mx-auto w-full z-10">
                 {banner.pageLayoutType && (
                    <span className="bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-md mb-4 inline-block">
                       {banner.pageLayoutType === 'promo' ? '🔥 Promoção' : banner.pageLayoutType === 'event' ? '📅 Evento' : '📄 Destaque'}
                    </span>
                 )}
                 <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white leading-tight drop-shadow-xl max-w-3xl">{banner.title}</h1>
                 {banner.subtitle && <p className="text-white/80 font-medium text-lg mt-3 max-w-2xl">{banner.subtitle}</p>}
              </div>
           </div>
        )}

        <div className={`flex-1 w-full relative z-20 ${blocks.length > 0 ? '' : 'max-w-screen-xl mx-auto px-4 md:px-8 -mt-8 pb-20'}`}>
           
           {blocks.length > 0 ? (
              <div className="w-full">
                 {blocks.map((block: any, idx: number) => (
                    <div key={idx} className="max-w-screen-lg mx-auto px-4 w-full">
                       {renderBlock(block, idx)}
                    </div>
                 ))}
                 
                 {selectedProducts.length > 0 && (
                    <div className="max-w-screen-lg mx-auto px-4 w-full mt-16">
                       <h2 className="text-3xl font-black text-zinc-900 mb-8 border-b border-zinc-100 pb-4 text-center">Nossos Produtos</h2>
                       <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                          {selectedProducts.map((prod) => (
                             <div key={prod.id} className="bg-white border border-zinc-100 rounded-3xl p-5 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
                                <div className="aspect-square bg-zinc-100 rounded-2xl mb-5 overflow-hidden relative">
                                   {prod.imageUrl ? (
                                      <img src={prod.imageUrl} className="w-full h-full object-cover" />
                                   ) : (
                                      <div className="w-full h-full flex items-center justify-center">
                                         <Store className="w-10 h-10 text-zinc-300" />
                                      </div>
                                   )}
                                </div>
                                <h3 className="font-bold text-zinc-900 line-clamp-2 min-h-[48px]">{prod.name}</h3>
                                <div className="mt-4 flex items-center justify-between">
                                   <p className="font-black text-lg text-emerald-600 tracking-tight">R$ {prod.price}</p>
                                   <button onClick={() => window.open(`https://wa.me/?text=Olá! Gostaria de comprar o produto: ${prod.name}`, '_blank')} className="w-10 h-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center hover:bg-zinc-800 transition-colors shadow-md shadow-zinc-900/20">
                                      <ChevronRight className="w-5 h-5" />
                                   </button>
                                </div>
                             </div>
                          ))}
                       </div>
                    </div>
                 )}

                 {merchant && (
                    <div className="max-w-screen-lg mx-auto px-4 w-full mt-20 mb-10">
                       <div className="bg-white rounded-3xl p-8 border border-zinc-100 shadow-sm flex flex-col md:flex-row items-center gap-6 justify-between">
                          <div className="flex items-center gap-6">
                             <div className="w-20 h-20 rounded-2xl bg-zinc-50 border border-zinc-200 overflow-hidden shrink-0 flex items-center justify-center">
                                {merchant.logoImage ? (
                                   <img src={merchant.logoImage} className="w-full h-full object-cover" />
                                ) : (
                                   <Store className="w-8 h-8 text-zinc-300" />
                                )}
                             </div>
                             <div>
                                <h4 className="font-black text-2xl text-zinc-900 mb-1">{merchant.businessName}</h4>
                                <p className="text-zinc-500 font-medium flex items-center gap-1"><MapPin className="w-4 h-4" /> {merchant.address || 'Loja Parceira'}</p>
                             </div>
                          </div>
                          <button onClick={() => navigate(`/comercio/${merchant.userId}`)} className={`w-full md:w-auto ${themeBgList} hover:opacity-90 text-white font-bold py-4 px-8 rounded-full transition-colors flex items-center justify-center gap-2 shadow-lg`}>
                             Visitar Loja <ChevronRight className="w-5 h-5" />
                          </button>
                       </div>
                    </div>
                 )}
              </div>
           ) : (
              // Old Legacy Render for Non-AI Banner pages
              <div className="flex flex-col md:flex-row gap-8">
                 <motion.div 
                   initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} 
                   className="flex-1 bg-white rounded-[2rem] p-6 md:p-10 shadow-sm border border-zinc-100 min-h-[400px]"
                 >
                    {banner.pageContent ? (
                        <div className="prose prose-zinc max-w-none">
                           <Markdown>{banner.pageContent}</Markdown>
                        </div>
                    ) : (
                        <div className="text-center py-20 text-zinc-400 font-medium">Nenhum conteúdo adicional informado.</div>
                    )}
                 </motion.div>

                 <motion.div 
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="w-full md:w-[350px] shrink-0 space-y-6"
                 >
                    {merchant && (
                       <div className="bg-white rounded-[2rem] p-6 border border-zinc-100 shadow-sm">
                          <h3 className="font-black text-zinc-900 mb-4 uppercase text-xs tracking-wider">Organizador</h3>
                          <div className="flex items-center gap-3 mb-5">
                             <div className="w-12 h-12 rounded-xl bg-zinc-100 border border-zinc-200 overflow-hidden shrink-0">
                                {merchant.logoImage ? (
                                   <img src={merchant.logoImage} className="w-full h-full object-cover" />
                                ) : (
                                   <Store className="w-6 h-6 m-auto mt-3 text-zinc-400" />
                                )}
                             </div>
                             <div>
                                <p className="font-bold text-zinc-900 leading-tight">{merchant.businessName}</p>
                                <p className="text-xs text-zinc-500 font-medium">{merchant.category}</p>
                             </div>
                          </div>
                          <button onClick={() => navigate(`/comercio/${merchant.userId}`)} className="w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold py-3 rounded-xl transition-colors">
                             Visitar Loja
                          </button>
                       </div>
                    )}

                    {banner.actionUrl && (
                       <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-[2rem] p-6 border border-primary/20 shadow-sm text-center">
                          <h3 className="font-black text-primary mb-2 text-lg">Gostou deste destaque?</h3>
                          <p className="text-sm text-zinc-600 mb-5 font-medium">Aproveite a oportunidade e acesse agora mesmo!</p>
                          <a href={banner.actionUrl} target="_blank" rel="noopener noreferrer" className="block w-full bg-primary text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all">
                             {banner.actionText || 'Acessar Link Externo'}
                          </a>
                       </div>
                    )}
                 </motion.div>
              </div>
           )}

        </div>
     </div>
  );
}