import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, HeartHandshake, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';

import { useCity } from '../contexts/CityContext';

export default function CampaignsPage() {
  const navigate = useNavigate();
  const { currentCity } = useCity();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
     const fetchCampaigns = async () => {
        try {
           const cityId = currentCity?.id;
           const constraints: any[] = [where('active', '==', true), orderBy('createdAt', 'desc')];
           if (cityId) constraints.push(where('cityId', '==', cityId));
           
           const q = query(collection(db, 'campaigns'), ...constraints);
           const snap = await getDocs(q);
           setCampaigns(snap.docs.map(d => ({id: d.id, ...d.data()})));
        } catch(e) {
           console.error(e);
        } finally {
           setLoading(false);
        }
     }
     fetchCampaigns();
  }, [currentCity]);

  return (
     <div className="flex flex-col w-full min-h-screen bg-zinc-50 pb-20 md:pb-10">
        <div className="bg-white px-4 py-8 rounded-b-[40px] shadow-sm border-b border-zinc-100 mb-8 max-w-screen-xl mx-auto w-full">
           <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center hover:bg-zinc-200 transition-colors mb-6">
              <ArrowLeft className="w-5 h-5 text-zinc-600" />
           </button>
           <h1 className="text-4xl font-black text-zinc-900 tracking-tight flex items-center gap-3">
              Campanhas Sociais <HeartHandshake className="w-10 h-10 text-rose-500" />
           </h1>
           <p className="text-zinc-500 mt-2 text-lg">Apoie causas importantes na nossa comunidade. Juntos somos mais fortes.</p>
        </div>

        <div className="max-w-screen-xl mx-auto w-full px-4 md:px-8 space-y-8">
           {loading ? (
             <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
           ) : campaigns.length === 0 ? (
             <div className="text-center py-20 bg-white rounded-3xl border border-zinc-100">
                <HeartHandshake className="w-16 h-16 text-zinc-200 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-zinc-400">Nenhuma campanha ativa no momento</h2>
             </div>
           ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {campaigns.map(camp => (
                    <div key={camp.id} onClick={() => navigate(`/campanha/${camp.id}`)} className="bg-white rounded-[32px] overflow-hidden border border-zinc-100 shadow-sm hover:shadow-xl transition-all group cursor-pointer flex flex-col">
                       <div className="w-full h-56 relative overflow-hidden bg-zinc-100">
                          {camp.imageUrl ? (
                             <img src={camp.imageUrl} alt={camp.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                          ) : (
                             <div className="w-full h-full flex items-center justify-center"><Calendar className="w-12 h-12 text-zinc-300" /></div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                          {camp.tag && (
                             <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md text-zinc-900 text-xs font-black px-3 py-1.5 rounded-full">
                                {camp.tag}
                             </div>
                          )}
                          <h2 className="absolute bottom-4 left-4 right-4 text-white font-black text-2xl leading-tight drop-shadow-lg">{camp.title}</h2>
                       </div>
                       <div className="p-6 flex-1 flex flex-col">
                          <p className="text-zinc-600 text-sm line-clamp-3 mb-6">{camp.description}</p>
                          <div className="mt-auto pt-4 border-t border-zinc-100 flex items-center justify-between">
                             <div className="flex items-center gap-2 text-zinc-500 text-sm font-medium">
                                <MapPin className="w-4 h-4 text-primary" /> {camp.location || 'Vários Pontos'}
                             </div>
                             <span className="bg-zinc-900 group-hover:bg-primary text-white text-xs font-bold px-4 py-2 rounded-full transition-colors">
                                Ver Detalhes
                             </span>
                          </div>
                       </div>
                    </div>
                 ))}
              </div>
           )}
        </div>
     </div>
  );
}
