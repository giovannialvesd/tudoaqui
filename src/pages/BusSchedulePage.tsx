import React, { useState, useEffect } from 'react';
import { ArrowLeft, Clock, MapPin, Search, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

export default function BusSchedulePage() {
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Update current time every minute
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const [activeDay, setActiveDay] = useState<string>('Segunda a Sexta');
  
  const daysOptions = ['Segunda a Sexta', 'Sábado', 'Domingo', 'Feriados'];

  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const q = query(collection(db, 'bus_schedules'), where('active', '==', true));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          setSchedules(snapshot.docs.map(d => ({id: d.id, ...d.data()})));
        } else {
           setSchedules([
             { id: '1', routeName: 'Linha 10 - Centro/Bairro', stops: ['Terminal', 'Praça Central', 'Bairro Novo'], departureTimes: ['07:00', '08:30', '10:00', '12:00', '15:30', '18:45'], days: ['Segunda a Sexta'] },
             { id: '2', routeName: 'Linha 20 - Circular', stops: ['Av. Brasil', 'Shopping', 'Hospital'], departureTimes: ['06:45', '09:15', '11:45', '14:15', '17:00', '21:00'], days: ['Segunda a Sexta', 'Sábado'] }
           ]);
        }
      } catch(e) {
        console.error(e);
      }
    };
    fetchSchedules();
  }, []);

  const getNextDeparture = (times: string[]) => {
     if (!times || times.length === 0) return null;
     
     const currentH = currentTime.getHours();
     const currentM = currentTime.getMinutes();
     const currentTotalM = currentH * 60 + currentM;

     const upcoming = times.map(timeStr => {
        const [h, m] = timeStr.split(':').map(Number);
        return { timeStr, totalM: h * 60 + m };
     }).filter(t => t.totalM > currentTotalM)
       .sort((a,b) => a.totalM - b.totalM);

     return upcoming.length > 0 ? upcoming[0] : null;
  }

  const filteredSchedules = schedules.filter(sch => {
     const matchesSearch = sch.routeName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
          sch.stops?.some((stop: string) => stop.toLowerCase().includes(searchTerm.toLowerCase()));
     
     const matchesDay = !sch.days || sch.days.includes(activeDay);
     
     return matchesSearch && matchesDay;
  });

  return (
    <div className="flex flex-col min-h-screen pb-20 bg-bg-base">
       {/* Header */}
       <div className="bg-white px-4 py-5 border-b border-zinc-100 flex items-center justify-between sticky top-0 z-10 shadow-sm">
         <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-zinc-100 transition-colors">
               <ArrowLeft className="w-5 h-5 text-zinc-600" />
            </button>
            <h1 className="text-xl font-bold text-zinc-900">Horários de Ônibus</h1>
         </div>
       </div>

       <div className="p-4 md:p-8 max-w-3xl mx-auto w-full space-y-6 mt-2">
         {/* Day Filter */}
         <div className="flex gap-2 bg-zinc-100 p-1.5 rounded-2xl">
            {daysOptions.map(day => (
               <button
                  key={day}
                  onClick={() => setActiveDay(day)}
                  className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeDay === day ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
               >
                  {day}
               </button>
            ))}
         </div>

         {/* Search Filter */}
         <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 group-focus-within:text-zinc-900 transition-colors" />
            <input 
               type="text" 
               placeholder="Pesquisar ponto ou linha..." 
               value={searchTerm}
               onChange={e => setSearchTerm(e.target.value)}
               className="w-full bg-white border border-zinc-200 pl-12 pr-4 py-4 rounded-2xl outline-none focus:border-zinc-900 focus:bg-white transition-all font-medium text-zinc-900 shadow-sm"
            />
         </div>

         <div className="space-y-4">
            {filteredSchedules.map(schedule => {
               const nextDep = getNextDeparture(schedule.departureTimes);
               
               return (
                 <div key={schedule.id} className="bg-white rounded-[2rem] p-6 md:p-8 border border-zinc-100 shadow-sm transition-shadow hover:shadow-md overflow-hidden relative group">
                    <div className="flex items-center justify-between mb-6">
                       <div className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-zinc-950 rounded-2xl flex items-center justify-center shrink-0 shadow-lg group-hover:scale-105 transition-transform duration-500">
                             <Clock className="w-7 h-7 text-white" />
                          </div>
                          <div>
                            <h2 className="font-black text-2xl text-zinc-900 tracking-tight leading-none mb-2">{schedule.routeName}</h2>
                            <div className="flex items-center gap-2">
                               <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Ativo
                               </span>
                               <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 bg-zinc-50 px-2.5 py-1 rounded-full">
                                  {schedule.days?.join(', ') || 'Úteis'}
                               </span>
                            </div>
                          </div>
                       </div>
                    </div>
                    
                    {nextDep && (
                        <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 mb-5 flex items-center justify-between">
                            <div>
                               <p className="text-xs font-bold text-primary uppercase tracking-wide mb-1">Próxima Saída</p>
                               <div className="text-2xl font-black text-zinc-900 flex items-baseline gap-1">
                                  {nextDep.timeStr} <span className="text-sm font-medium text-zinc-500">hoje</span>
                               </div>
                            </div>
                            <div className="text-right">
                               <p className="text-xs font-medium text-zinc-500 mb-1">Em aprox.</p>
                               <p className="text-lg font-bold text-primary">
                                  {Math.floor((nextDep.totalM - (currentTime.getHours() * 60 + currentTime.getMinutes())) / 60)}h{' '}
                                  {(nextDep.totalM - (currentTime.getHours() * 60 + currentTime.getMinutes())) % 60}m
                               </p>
                            </div>
                        </div>
                    )}

                    <div className="space-y-5">
                       <div>
                         <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                           <MapPin className="w-3 h-3" /> Itinerário Principal
                         </h3>
                         <div className="flex flex-wrap gap-2 text-sm text-zinc-700">
                            {schedule.stops?.map((stop: string, i: number) => (
                                <span key={i} className="bg-zinc-100 px-3 py-1.5 rounded-lg border border-zinc-200/60 font-medium">
                                   {stop}
                                </span>
                            ))}
                         </div>
                       </div>
                       
                       <div>
                         <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                           <Clock className="w-3 h-3" /> Todos os Horários
                         </h3>
                         <div className="flex flex-wrap gap-2 text-sm font-mono text-zinc-600">
                            {schedule.departureTimes?.map((time: string, i: number) => (
                                <span key={i} className={`px-3 py-1.5 rounded-lg font-bold border ${nextDep?.timeStr === time ? 'bg-primary text-white border-primary' : 'bg-white border-zinc-200'}`}>
                                   {time}
                                </span>
                            ))}
                         </div>
                       </div>
                    </div>
                 </div>
               )
            })}
            
            {filteredSchedules.length === 0 && (
               <div className="text-center py-12 text-zinc-500">
                  Nenhuma linha encontrada para "{searchTerm}".
               </div>
            )}
         </div>
       </div>
    </div>
  )
}
