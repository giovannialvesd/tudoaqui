import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, UserCircle, MapPin, Star, Wrench, MessageCircle } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { toast } from 'sonner';
import { useFavorites } from '../hooks/useFavorites';
import { cn } from '../lib/utils';
import { Heart } from 'lucide-react';

export default function ProviderPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useFavorites();

  const [provider, setProvider] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if(!id) return;
    const fetchProvider = async () => {
       try {
         const snap = await getDoc(doc(db, 'provider_profiles', id));
         if (snap.exists()) {
            // Also getting user profile just in case we need the real name, but assuming we store relevant info in provider_profiles
            const data = snap.data();
            setProvider(data);
         }
       } catch(e) {
         console.error(e);
       } finally {
         setLoading(false);
       }
    };
    fetchProvider();
  }, [id]);

  if (loading) return <div className="min-h-screen bg-bg-base flex items-center justify-center">Carregando...</div>;
  
  if (!provider) return <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center p-4 text-center">
    <Wrench className="w-12 h-12 text-zinc-300 mb-4" />
    <h2 className="text-xl font-bold text-zinc-700">Profissional não encontrado</h2>
    <p className="text-zinc-500 mt-2">Este perfil pode ter sido ocultado ou removido.</p>
    <button onClick={() => navigate('/servicos')} className="mt-6 text-white bg-blue-600 px-6 py-2 rounded-xl font-bold">Voltar para Serviços</button>
  </div>;

  return (
    <div className="flex flex-col min-h-screen pb-20 bg-bg-base">
      
      {/* Header/Banner Profissional */}
      <div className="relative h-48 md:h-64 w-full bg-blue-600">
         <div className="absolute inset-0 bg-blue-800/50"></div>
         <div className="absolute top-4 left-4 right-4 flex justify-between">
            <button 
              onClick={() => navigate(-1)}
              className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/30"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button 
              onClick={() => {
                 toggleFavorite({
                    itemId: id!,
                    type: 'provider',
                    title: provider.name || provider.category || 'Profissional',
                    subtitle: provider.category || 'Serviços Gerais',
                    imageUrl: provider.imageUrl,
                    url: `/prestador/${id}`
                 });
              }}
              className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/30"
            >
               <Heart className={cn("w-5 h-5 transition-colors", isFavorite(id!, 'provider') && "fill-rose-500 text-rose-500")} />
            </button>
         </div>
      </div>

      <div className="px-4 md:px-8 max-w-3xl mx-auto w-full -mt-20 relative z-10">
         
         <div className="bg-white rounded-3xl p-6 md:p-8 shadow-md border border-zinc-100 mb-6">
            <div className="flex flex-col md:flex-row gap-6 items-center md:items-start text-center md:text-left mb-6 border-b border-zinc-100 pb-6">
               <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white overflow-hidden shadow-lg bg-zinc-100 flex items-center justify-center shrink-0">
                  {provider.imageUrl ? (
                     <img src={provider.imageUrl} alt="Foto" className="w-full h-full object-cover" />
                  ) : (
                     <UserCircle className="w-16 h-16 text-zinc-300" />
                  )}
               </div>
               <div className="flex-1 pt-2">
                  <div className="inline-block bg-blue-50 text-blue-600 font-black text-xs uppercase tracking-widest px-3 py-1 rounded-full mb-3">
                     {provider.category || 'Prestador de Serviço'}
                  </div>
                  <h1 className="text-3xl font-black text-zinc-900 leading-tight mb-2">{provider.name || 'Nome do Profissional'}</h1>
                  
                  <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 text-sm font-bold mt-4">
                     <span className="flex items-center text-orange-500 bg-orange-50 px-2 py-1 rounded-lg"><Star className="w-4 h-4 mr-1 fill-current" /> 5.0 (Novato)</span>
                     {provider.address && (
                        <span className="flex items-center text-zinc-600"><MapPin className="w-4 h-4 mr-1" /> {provider.address}</span>
                     )}
                     <span className={cn("flex items-center", provider.isAvailable ? "text-emerald-600" : "text-rose-500")}>
                        <div className={cn("w-2 h-2 rounded-full mr-2", provider.isAvailable ? "bg-emerald-500" : "bg-rose-500")}></div>
                        {provider.isAvailable ? 'Disponível para novos contatos' : 'Oculto / Ocupado'}
                     </span>
                  </div>
               </div>
            </div>
            
            <div className="mb-8">
               <h3 className="text-lg font-black text-zinc-900 mb-4 flex items-center gap-2"><Wrench className="w-5 h-5 text-blue-500" /> Descrição dos Serviços</h3>
               {provider.description ? (
                  <p className="text-zinc-600 text-base leading-relaxed bg-zinc-50 p-6 rounded-2xl italic border border-zinc-100">
                     "{provider.description}"
                  </p>
               ) : (
                  <p className="text-zinc-500 italic">O profissional não adicionou uma descrição detalhada.</p>
               )}
            </div>

            {provider.workingHours && (
               <div className="mb-8">
                  <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-2">Horário de Atendimento</h3>
                  <p className="text-zinc-800 font-medium">{provider.workingHours}</p>
               </div>
            )}

            <button 
               onClick={() => provider.phone ? window.open(`https://wa.me/${provider.phone.replace(/\D/g, '')}`, '_blank') : toast.error('Telefone não cadastrado')}
               className="bg-zinc-900 text-white font-bold px-8 py-4 rounded-xl shadow-lg hover:bg-black transition-colors w-full flex items-center justify-center gap-3 text-lg"
            >
               <MessageCircle className="w-6 h-6 text-green-400" /> Entrar em Contato no WhatsApp
            </button>
         </div>

      </div>
    </div>
  )
}
