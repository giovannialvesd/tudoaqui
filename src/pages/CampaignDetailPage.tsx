import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, MapPin, Heart, Share2, AlertTriangle, Bookmark, Target, MessageCircle, Navigation, Users, CheckCircle, Smartphone } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useFavorites } from '../hooks/useFavorites';
import { cn } from '../lib/utils';
import { BlocksRenderer } from '../components/AIPageBlocks';

export default function CampaignDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [campaign, setCampaign] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
     const fetchCampaign = async () => {
        if(!id) return;
        try {
           const docRef = doc(db, 'campaigns', id);
           const docSnap = await getDoc(docRef);
           if(docSnap.exists()) {
              setCampaign({id: docSnap.id, ...docSnap.data()});
           }
        } catch(e) {
           console.error(e);
        } finally {
           setLoading(false);
        }
     }
     fetchCampaign();
  }, [id]);

  if(loading) return <div className="h-screen w-full flex items-center justify-center bg-bg-base"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div></div>;

  if(!campaign) return (
     <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center p-4">
        <AlertTriangle className="w-16 h-16 text-zinc-300 mb-4" />
        <h2 className="text-xl font-bold text-zinc-700 mb-6">Campanha não encontrada</h2>
        <button onClick={() => navigate('/campanhas')} className="bg-primary text-white font-bold px-6 py-3 rounded-full">Voltar para Campanhas</button>
     </div>
  );

  // Se a campanha possui configuração de IA, renderiza os blocos da IA (BlocksRenderer) misturado com widgets.
  // Aqui optamos por renderizar o layout moderno e integrar a IA.

  const progress = campaign.goal ? Math.min(100, Math.round(((campaign.raised || 0) / campaign.goal) * 100)) : 0;

  return (
     <div className="flex flex-col w-full min-h-screen bg-bg-base pb-20 md:pb-10 font-sans">
        
        {/* Cabecalho Emocionante e Personalizado */}
        <div className="w-full h-[50vh] md:h-[60vh] relative bg-zinc-900 rounded-b-[40px] overflow-hidden sticky top-0 z-0">
           {campaign.imageUrl ? (
              <img src={campaign.imageUrl} alt={campaign.title} className="w-full h-full object-cover opacity-50 mix-blend-overlay" />
           ) : (
              <div className="w-full h-full bg-primary/20 flex items-center justify-center"><Heart className="w-24 h-24 text-white/20" /></div>
           )}
           <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/60 to-transparent"></div>
           
           <div className="absolute top-6 left-4 right-4 flex justify-between max-w-screen-xl mx-auto w-full z-10 px-4 md:px-0">
              <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center hover:bg-white/30 transition-colors">
                 <ArrowLeft className="w-5 h-5 text-white" />
              </button>
              <div className="flex gap-2">
                 <button onClick={(e) => {
                    e.preventDefault();
                    toggleFavorite({
                       itemId: id!,
                       type: 'campaign',
                       title: campaign.title || 'Campanha',
                       subtitle: campaign.tag || 'Causa Social',
                       imageUrl: campaign.imageUrl,
                       url: `/campanha/${id}`
                    });
                 }} className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center hover:bg-white/30 transition-colors">
                    <Bookmark className={cn("w-4 h-4 transition-colors text-white", isFavorite(id!, 'campaign') && "fill-white")} />
                 </button>
                 <button onClick={() => {
                   if(navigator.share) navigator.share({title: campaign.title, url: window.location.href});
                 }} className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center hover:bg-white/30 transition-colors">
                    <Share2 className="w-4 h-4 text-white" />
                 </button>
              </div>
           </div>

           <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 max-w-screen-xl mx-auto w-full z-10">
              {campaign.tag && (
                 <span className="bg-primary text-white text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-md mb-4 inline-block shadow-lg shadow-primary/20">
                    {campaign.tag}
                 </span>
              )}
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white leading-tight drop-shadow-xl tracking-tight mb-4">{campaign.title}</h1>
              {campaign.location && (
                  <p className="text-white/80 font-medium flex items-center gap-2"><MapPin className="w-5 h-5 text-primary" /> {campaign.location}</p>
              )}
           </div>
        </div>

        {/* Content Area */}
        <div className="max-w-screen-xl mx-auto w-full px-4 md:px-8 -mt-12 relative z-20 flex flex-col lg:flex-row gap-8 items-start">
           
           <div className="flex-1 w-full space-y-8">
              
              {/* Informações Completas */}
              <div className="bg-white rounded-3xl p-8 md:p-10 shadow-sm border border-zinc-100">
                 <h2 className="text-2xl font-black text-zinc-900 mb-6 flex items-center gap-3"><Target className="w-6 h-6 text-primary" /> Objetivo da Campanha</h2>
                 <div className="prose prose-zinc prose-lg max-w-none mb-8">
                    {campaign.description?.split('\n').map((para: string, i: number) => (
                       <p key={i} className="mb-4 text-zinc-600 leading-relaxed font-medium">{para}</p>
                    ))}
                 </div>

                 {(campaign.needs && campaign.needs.length > 0) && (
                    <div className="bg-zinc-50 rounded-2xl p-6 border border-zinc-200 mt-8">
                        <h3 className="font-bold text-zinc-900 mb-4 text-lg">Itens mais urgentes:</h3>
                        <div className="flex flex-wrap gap-2">
                           {campaign.needs.map((n: string, i: number) => (
                               <span key={i} className="bg-white border border-zinc-200 text-zinc-700 px-4 py-2 rounded-xl text-sm font-bold shadow-sm flex items-center gap-2">
                                  <CheckCircle className="w-4 h-4 text-primary" /> {n}
                               </span>
                           ))}
                        </div>
                    </div>
                 )}
              </div>

              {/* Se a campanha tiver AIPageConfig, renderizar o visualizador dinâmico adicional */}
              {campaign.pageConfig && campaign.pageConfig.blocks && (
                  <div className="bg-white rounded-3xl p-4 shadow-sm border border-zinc-100 overflow-hidden">
                     <BlocksRenderer blocks={campaign.pageConfig.blocks} themeColor={campaign.pageConfig.themeColor || 'primary'} />
                  </div>
              )}

           </div>

           {/* Área Lateral de Doação e Mobilização */}
           <div className="w-full lg:w-[400px] flex flex-col gap-6 shrink-0">
              
              {/* Progresso Financeiro (Se existir meta) */}
              {campaign.goal > 0 && (
                 <div className="bg-white rounded-3xl p-8 shadow-xl shadow-zinc-200/40 border border-zinc-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
                    <h3 className="font-black text-zinc-900 mb-4 uppercase text-xs tracking-widest text-zinc-500">Progresso de Arrecadação</h3>
                    <div className="flex items-end gap-2 mb-2">
                        <span className="text-4xl font-black text-zinc-900">R$ {campaign.raised?.toLocaleString('pt-BR') || '0'}</span>
                    </div>
                    <p className="text-zinc-500 font-medium text-sm mb-6">arrecadados da meta de <b className="text-zinc-700">R$ {campaign.goal.toLocaleString('pt-BR')}</b></p>
                    
                    <div className="h-4 bg-zinc-100 rounded-full overflow-hidden mb-2">
                       <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                    </div>
                    <p className="text-right text-xs font-bold text-primary">{progress}% concluído</p>
                 </div>
              )}

              {/* Central de Doação */}
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-zinc-100">
                 <h3 className="font-black text-zinc-900 mb-6 flex items-center gap-2"><Heart className="w-5 h-5 text-rose-500" /> Formas de Ajudar</h3>
                 
                 {campaign.howToHelp && (
                     <p className="text-zinc-600 text-sm mb-6 font-medium leading-relaxed bg-zinc-50 p-4 rounded-2xl">{campaign.howToHelp}</p>
                 )}

                 <div className="space-y-3">
                     {campaign.pixKey && (
                        <button onClick={() => {
                            navigator.clipboard.writeText(campaign.pixKey);
                            alert("Chave PIX copiada!");
                        }} className="w-full bg-emerald-50 border border-emerald-100 text-emerald-700 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-emerald-100 transition-colors shadow-sm">
                           <Users className="w-5 h-5" /> Copiar Chave PIX
                        </button>
                     )}

                     {campaign.whatsapp && (
                        <a href={`https://wa.me/${campaign.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer" className="w-full bg-[#25D366] text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-[#1ebd59] transition-colors shadow-lg shadow-emerald-500/20">
                           <MessageCircle className="w-5 h-5" /> Falar no WhatsApp
                        </a>
                     )}

                     {campaign.actionUrl && (
                        <a href={campaign.actionUrl} target="_blank" rel="noopener noreferrer" className="w-full bg-primary text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors text-center shadow-lg shadow-primary/30">
                           <Navigation className="w-5 h-5 fill-current" /> {campaign.actionText || 'Página Oficial / Contribuir'}
                        </a>
                     )}

                     {(!campaign.pixKey && !campaign.actionUrl && !campaign.whatsapp) && (
                        <button className="w-full bg-zinc-900 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-black transition-colors shadow-lg">
                           <MapPin className="w-5 h-5" /> Ver Pontos de Coleta
                        </button>
                     )}
                 </div>
              </div>

           </div>
        </div>
     </div>
  );
}
