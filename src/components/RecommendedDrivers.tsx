import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, getDocs, limit } from 'firebase/firestore';
import { db } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/errors';
import { CarFront, Star, ChevronRight } from 'lucide-react';

export default function RecommendedDrivers() {
  const navigate = useNavigate();
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const q = query(collection(db, 'driver_profiles'), limit(6));
        const snapshot = await getDocs(q);
        setDrivers(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        handleFirestoreError(e, OperationType.LIST, 'driver_profiles');
      } finally {
        setLoading(false);
      }
    };
    fetchDrivers();
  }, []);

  if (loading) return null;
  if (drivers.length === 0) return null;

  return (
    <section className="mt-12">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h2 className="font-black text-2xl text-zinc-900 tracking-tight">Motoristas Recomendados</h2>
          <p className="text-zinc-500 font-medium">Os melhores avaliados para suas viagens</p>
        </div>
        <button 
          onClick={() => navigate('/motoristas')} 
          className="text-orange-600 font-bold text-sm bg-orange-50 px-5 py-2.5 rounded-xl hover:bg-orange-100 transition-colors"
        >
          Ver Todos
        </button>
      </div>

      <div className="flex gap-5 overflow-x-auto no-scrollbar pb-6 -mx-4 px-4 md:mx-0 md:px-0">
        {drivers.map(driver => (
          <div 
            key={driver.id} 
            onClick={() => navigate('/motoristas')}
            className="min-w-[280px] md:min-w-[320px] bg-white rounded-3xl p-5 border border-zinc-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group shrink-0"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-zinc-100 border border-zinc-200 shrink-0">
                {driver.imageUrl ? (
                  <img src={driver.imageUrl} alt={driver.name} loading="lazy" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-400">
                    <CarFront className="w-8 h-8" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="font-bold text-zinc-900 text-base truncate">{driver.name || 'Motorista Parceiro'}</h3>
                  <div className="flex items-center gap-1 text-orange-500 shrink-0">
                    <Star className="w-3 h-3 fill-current" />
                    <span className="text-xs font-black">{driver.rating || '5.0'}</span>
                  </div>
                </div>
                <p className="text-sm font-medium text-zinc-500 truncate">{driver.vehicleModel || 'Veículo Parceiro'}</p>
                <div className="flex items-center gap-2 mt-2">
                   {driver.isOnline ? (
                      <span className="flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg uppercase tracking-wider">
                         <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></div> Online
                      </span>
                   ) : (
                      <span className="text-[10px] font-black text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-lg uppercase tracking-wider">Offline</span>
                   )}
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-zinc-50 flex items-center justify-center group-hover:bg-orange-50 transition-colors">
                <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-orange-500 transition-colors" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
