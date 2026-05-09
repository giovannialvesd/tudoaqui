import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useCity } from '../contexts/CityContext';
import { ChevronLeft, CarFront, Star, Phone, MessageSquare } from 'lucide-react';

export default function MotoristasPage() {
  const navigate = useNavigate();
  const { currentCity } = useCity();
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const cityId = currentCity?.id;
        const constraints: any[] = [];
        if (cityId) constraints.push(where('cityId', '==', cityId));
        const profilesSnap = await getDocs(query(collection(db, 'driver_profiles'), ...constraints));

        const driversData = profilesSnap.docs.map(d => {
          const profile = d.data();
          return {
            id: d.id,
            ...profile,
            name: profile.name || 'Motorista Parceiro',
            phone: profile.phone || ''
          };
        });

        setDrivers(driversData);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchDrivers();
  }, [currentCity]);

  return (
    <div className="min-h-screen bg-zinc-50 pb-20">
      {/* Header */}
      <div className="bg-white px-5 pt-8 pb-5 rounded-b-[2rem] shadow-sm sticky top-0 z-50 border-b border-zinc-100">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-zinc-100 transition-colors">
            <ChevronLeft className="w-6 h-6 text-zinc-600" />
          </button>
          <h1 className="text-2xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
             <CarFront className="w-7 h-7 text-orange-500" /> Motoristas
          </h1>
        </div>
      </div>

      <div className="px-5 mt-8 max-w-screen-xl mx-auto">
        <div className="mb-8">
           <h2 className="text-xl font-bold text-zinc-800">Motoristas na sua Região</h2>
           <p className="text-zinc-500 text-sm">Entre em contato para corridas, fretes e entregas.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
             <div className="animate-spin w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full"></div>
          </div>
        ) : drivers.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-3xl border border-zinc-100 shadow-sm">
             <CarFront className="w-16 h-16 text-zinc-200 mx-auto mb-4" />
             <h3 className="text-lg font-bold text-zinc-800">Nenhum motorista cadastrado</h3>
             <p className="text-zinc-500 mt-2">Seja o primeiro a oferecer este serviço!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {drivers.map(driver => (
              <div key={driver.id} className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110 duration-500"></div>
                
                <div className="flex items-start gap-5 relative z-10">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden bg-zinc-100 border border-zinc-200 shrink-0">
                    {driver.imageUrl ? (
                      <img src={driver.imageUrl} className="w-full h-full object-cover" alt={driver.name} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-400">
                        <CarFront className="w-10 h-10" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                       <h3 className="font-black text-zinc-900 text-lg truncate">{driver.name}</h3>
                       <div className="flex items-center gap-1 bg-orange-50 text-orange-600 px-2 py-0.5 rounded-lg text-xs font-black">
                          <Star className="w-3 h-3 fill-current" /> {driver.rating || '5.0'}
                       </div>
                    </div>
                    <p className="text-sm font-bold text-zinc-500 mb-4">{driver.vehicleModel || 'Veículo não informado'}</p>
                    
                    <div className="flex items-center gap-2">
                       {driver.isOnline ? (
                          <span className="flex items-center gap-1.5 text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg uppercase tracking-wider">
                             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> Disponível
                          </span>
                       ) : (
                          <span className="text-xs font-black text-zinc-400 bg-zinc-100 px-2 py-1 rounded-lg uppercase tracking-wider italic">Indisponível</span>
                       )}
                    </div>
                  </div>
                </div>

                <div className="mt-8 grid grid-cols-2 gap-3 relative z-10">
                   <a 
                     href={`tel:${driver.phone}`} 
                     className="flex items-center justify-center gap-2 bg-zinc-900 text-white font-bold py-3.5 rounded-2xl hover:bg-black transition-all shadow-lg shadow-zinc-900/10 active:scale-95"
                   >
                     <Phone className="w-4 h-4" /> Ligar
                   </a>
                   <a 
                     href={`https://wa.me/${driver.phone?.replace(/\D/g, '')}`} 
                     target="_blank" 
                     rel="noreferrer"
                     className="flex items-center justify-center gap-2 bg-emerald-600 text-white font-bold py-3.5 rounded-2xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/10 active:scale-95"
                   >
                     <MessageSquare className="w-4 h-4" /> WhatsApp
                   </a>
                </div>

                {driver.description && (
                  <div className="mt-6 pt-6 border-t border-zinc-50 relative z-10">
                     <p className="text-sm text-zinc-500 font-medium italic leading-relaxed line-clamp-2">"{driver.description}"</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
