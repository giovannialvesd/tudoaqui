import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, setDoc, deleteDoc, updateDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { useConfirm } from '../../hooks/useConfirm';
import { MapPin, Calendar, Clock, Trash2, Check, AlertTriangle } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../../firebase/errors';

export default function AdminGarbageCollection({ cityId: overrideCityId }: { cityId?: string }) {
   const { userProfile } = useAuth();
   const isSuperAdmin = userProfile?.role === 'super_admin' || userProfile?.role === 'admin';
   const cityId = overrideCityId || userProfile?.cityId;

   const [routes, setRoutes] = useState<any[]>([]);
   const [adding, setAdding] = useState(false);
   const [current, setCurrent] = useState<any>({ name: '', days: '', time: '', type: 'Comum' });
   const { confirm } = useConfirm();

   useEffect(() => { 
      const constraints: any[] = [];
      if (cityId) {
        constraints.push(where('cityId', '==', cityId));
      }
      const unsub = onSnapshot(query(collection(db, 'garbage_routes'), ...constraints), (snapshot) => {
         setRoutes(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      }, (err) => handleFirestoreError(err, OperationType.GET, 'garbage_routes'));
      return () => unsub();
   }, [isSuperAdmin, cityId]);

   const fetchAll = async () => {};

   const handleSave = async () => {
      if(!current.name || !current.days) return;
      const id = current.id || `route_${Date.now()}`;
      try {
         await setDoc(doc(db, 'garbage_routes', id), {
            name: current.name,
            days: current.days,
            time: current.time,
            type: current.type,
            cityId: cityId || (current.cityId || ''),
            updatedAt: serverTimestamp(),
         }, { merge: true });
         toast.success('Rota de coleta salva!');
         setAdding(false);
         setCurrent({ name: '', days: '', time: '', type: 'Comum' });
         fetchAll();
      } catch (e) {
         toast.error('Erro ao salvar rota.');
      }
   }

   const handleDelete = async (id: string) => {
      const isConfirmed = await confirm({
         title: 'Excluir Rota',
         description: 'Deseja remover este horário de coleta permanentemente?',
         type: 'danger',
         confirmText: 'Excluir'
      });
      if(isConfirmed) {
         await deleteDoc(doc(db, 'garbage_routes', id));
         toast.success('Rota excluída.');
         fetchAll();
      }
   }

   return (
      <div className="bg-white rounded-3xl shadow-sm border border-zinc-100 overflow-hidden mb-8">
         <div className="px-8 py-6 border-b border-zinc-100 flex justify-between items-center bg-white">
            <div>
               <h3 className="font-black text-xl text-zinc-900">Coleta de Lixo</h3>
               <p className="text-sm text-zinc-500">Gerencie os dias e horários de coleta por região.</p>
            </div>
            {!adding && (
               <button onClick={() => setAdding(true)} className="bg-primary text-white font-bold px-4 py-2 rounded-xl text-sm">
                  + Nova Região
               </button>
            )}
         </div>
         
         <div className="p-8">
            {adding && (
               <div className="bg-zinc-50 p-6 rounded-2xl border border-zinc-200 mb-8 space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <label className="text-xs font-bold text-zinc-500 uppercase block mb-1">Nome/Região</label>
                        <input type="text" value={current.name} onChange={e => setCurrent({...current, name: e.target.value})} className="w-full px-4 py-2 border rounded-xl outline-none" placeholder="Ex: Centro" />
                     </div>
                     <div>
                        <label className="text-xs font-bold text-zinc-500 uppercase block mb-1">Tipo de Lixo</label>
                        <select value={current.type} onChange={e => setCurrent({...current, type: e.target.value})} className="w-full px-4 py-2 border rounded-xl outline-none">
                           <option>Comum</option>
                           <option>Seletiva</option>
                           <option>Comum e Seletiva</option>
                        </select>
                     </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <label className="text-xs font-bold text-zinc-500 uppercase block mb-1">Dias da Semana</label>
                        <input type="text" value={current.days} onChange={e => setCurrent({...current, days: e.target.value})} className="w-full px-4 py-2 border rounded-xl outline-none" placeholder="Ex: Seg, Qua e Sex" />
                     </div>
                     <div>
                        <label className="text-xs font-bold text-zinc-500 uppercase block mb-1">Horário</label>
                        <input type="text" value={current.time} onChange={e => setCurrent({...current, time: e.target.value})} className="w-full px-4 py-2 border rounded-xl outline-none" placeholder="Ex: A partir das 19h" />
                     </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                     <button onClick={() => { setAdding(false); setCurrent({ name: '', days: '', time: '', type: 'Comum' }); }} className="px-4 py-2 text-zinc-600 font-bold">Cancelar</button>
                     <button onClick={handleSave} className="bg-primary text-white font-bold px-6 py-2 rounded-xl">Salvar Rota</button>
                  </div>
               </div>
            )}

            <div className="space-y-4">
               {routes.map(r => (
                  <div key={r.id} className="border border-zinc-200 rounded-2xl p-4 flex justify-between items-center group">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-zinc-50 rounded-xl flex items-center justify-center">
                           <MapPin className="w-5 h-5 text-rose-500" />
                        </div>
                        <div>
                           <h4 className="font-bold text-zinc-900">{r.name}</h4>
                           <p className="text-xs text-zinc-500">{r.type}</p>
                        </div>
                     </div>
                     <div className="flex items-center gap-6">
                        <div className="hidden md:block">
                           <p className="text-xs font-bold text-zinc-400 uppercase">Horário</p>
                           <p className="text-sm font-semibold text-zinc-700">{r.days} - {r.time}</p>
                        </div>
                        <div className="flex gap-2">
                           <button onClick={() => { setCurrent(r); setAdding(true); }} className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-500 transition-colors"><Check className="w-4 h-4" /></button>
                           <button onClick={() => handleDelete(r.id)} className="p-2 hover:bg-rose-50 rounded-lg text-rose-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                     </div>
                  </div>
               ))}
               {routes.length === 0 && (
                  <div className="text-center py-12 bg-zinc-50 rounded-3xl border-2 border-dashed">
                     <Trash2 className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
                     <p className="text-zinc-500 font-medium">Nenhuma rota de coleta cadastrada.</p>
                  </div>
               )}
            </div>
         </div>
      </div>
   );
}
