import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, deleteDoc, updateDoc, where, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { useConfirm } from '../../hooks/useConfirm';
import { CarFront, Trash2, Search, Star, ExternalLink, Plus, X, Mail, User } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../../firebase/errors';
import { useNavigate } from 'react-router-dom';

export default function AdminDrivers({ cityId: overrideCityId }: { cityId?: string }) {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const isSuperAdmin = userProfile?.role === 'super_admin' || userProfile?.role === 'admin';
  const cityId = overrideCityId || userProfile?.cityId;

  const [drivers, setDrivers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [useEmail, setUseEmail] = useState(true);
  const [newData, setNewData] = useState({ email: '', name: '', vehicle: '' });
  const [saving, setSaving] = useState(false);
  const { confirm } = useConfirm();

  const fetchDrivers = async () => {};

  useEffect(() => {
    const constraints: any[] = [];
    if (cityId) {
      constraints.push(where('cityId', '==', cityId));
    }
    const unsub = onSnapshot(query(collection(db, 'driver_profiles'), ...constraints), (snap) => {
      setDrivers(snap.docs.map(d => ({id: d.id, ...d.data()})));
      setLoading(false);
    }, (error) => {
      toast.error('Erro ao carregar motoristas.');
      handleFirestoreError(error, OperationType.GET, 'driver_profiles');
      setLoading(false);
    });
    return () => unsub();
  }, [isSuperAdmin, cityId]);

  const handleAddDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newData.name) return;
    if (useEmail && !newData.email) return;
    
    setSaving(true);

    try {
      let userId = `driver_${Date.now()}`;

      if (useEmail) {
        const uQ = query(collection(db, 'users'), where('email', '==', newData.email.toLowerCase().trim()));
        const uSnap = await getDocs(uQ);

        if (uSnap.empty) {
          toast.error('Usuário não encontrado com este email.');
          setSaving(false);
          return;
        }

        userId = uSnap.docs[0].id;
        await updateDoc(doc(db, 'users', userId), {
           role: 'driver',
           updatedAt: serverTimestamp() 
        });
      }

      await setDoc(doc(db, 'driver_profiles', userId), {
        userId,
        cityId: cityId || '',
        name: newData.name,
        vehicle: newData.vehicle,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        rating: 5.0,
        isOnline: true
      }, { merge: true });

      toast.success(useEmail ? 'Perfil criado e vinculado!' : 'Perfil criado com sucesso!');
      setIsAddModalOpen(false);
      setNewData({ email: '', name: '', vehicle: '' });
      fetchDrivers();
    } catch (e) {
      toast.error('Erro ao criar motorista.');
      handleFirestoreError(e, OperationType.WRITE, null);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const isConfirmed = await confirm({
       title: 'Excluir Motorista',
       description: `Tem certeza que deseja excluir permanentemente o motorista "${name}"?`,
       type: 'danger',
       confirmText: 'Sim, excluir'
    });
    if (isConfirmed) {
      try {
        await deleteDoc(doc(db, 'driver_profiles', id));
        toast.success('Motorista excluído com sucesso.');
        fetchDrivers();
      } catch(e) {
        toast.error('Erro ao excluir motorista.');
      }
    }
  };

  const filtered = drivers.filter(m => (m.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()));

  if (loading) return <div className="p-8 text-center text-zinc-500">Carregando motoristas...</div>;

  return (
    <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-zinc-100 h-full flex flex-col">
       <div className="flex justify-between items-center mb-8 border-b border-zinc-100 pb-5">
         <div>
            <h2 className="text-2xl font-black text-zinc-900 tracking-tight">Gestão de Motoristas</h2>
            <p className="text-zinc-500 font-medium">Controle de motoristas e frotas ({drivers.length})</p>
         </div>
         <button 
           onClick={() => setIsAddModalOpen(true)}
           className="bg-orange-500 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20"
         >
            <Plus className="w-5 h-5" /> Adicionar Motorista
         </button>
       </div>

       <div className="relative mb-6">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input 
            type="text" 
            placeholder="Buscar por nome do motorista..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-50 border border-zinc-200 pl-11 pr-4 py-3 rounded-2xl outline-none focus:border-orange-500 transition-colors font-medium text-zinc-800"
          />
       </div>

       {filtered.length === 0 ? (
          <div className="text-center py-20 bg-zinc-50 rounded-3xl border border-zinc-100">
             <CarFront className="w-16 h-16 text-zinc-300 mx-auto mb-4" />
             <h3 className="text-xl font-bold text-zinc-800">Nenhum motorista encontrado</h3>
          </div>
       ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {filtered.map(driver => (
               <div key={driver.id} className="flex flex-col p-5 rounded-2xl border border-zinc-200 bg-white hover:border-orange-500 transition-colors shadow-sm">
                  <div className="flex items-center gap-4 mb-4">
                     <div className="w-16 h-16 rounded-xl bg-zinc-100 overflow-hidden shrink-0 border border-zinc-100">
                        {driver.imageUrl ? (
                           <img src={driver.imageUrl} className="w-full h-full object-cover" />
                        ) : (
                           <div className="w-full h-full flex items-center justify-center"><CarFront className="w-6 h-6 text-zinc-300" /></div>
                        )}
                     </div>
                     <div className="flex-1 min-w-0">
                        <h3 className="font-black text-zinc-900 truncate">{driver.name}</h3>
                        <p className="text-sm font-bold text-orange-600 truncate">{driver.vehicle || 'Sem Veículo'}</p>
                        <p className="text-xs text-zinc-400 truncate mt-0.5">{driver.phone || 'Sem contato'}</p>
                     </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
                     <div className="flex items-center gap-1 text-orange-500 font-bold bg-orange-50 px-2 py-1 rounded-lg text-sm">
                        <Star className="w-4 h-4 fill-current" /> {driver.rating?.toFixed(1) || '5.0'}
                     </div>
                     <div className="flex gap-2">
                        <button onClick={() => navigate(`/motorista/painel?admin_view=${driver.id}`)} className="w-10 h-10 rounded-full flex items-center justify-center bg-zinc-100 text-zinc-600 hover:bg-orange-500 hover:text-white transition-colors" title="Ver Painel">
                           <ExternalLink className="w-5 h-5" />
                        </button>
                        <button onClick={() => handleDelete(driver.id, driver.name)} className="w-10 h-10 rounded-full flex items-center justify-center bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-colors" title="Excluir">
                           <Trash2 className="w-5 h-5" />
                        </button>
                     </div>
                  </div>
               </div>
             ))}
          </div>
       )}

       {/* ADD MODAL */}
       {isAddModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
             <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="px-8 py-6 border-b border-zinc-100 flex items-center justify-between">
                   <h3 className="font-black text-xl text-zinc-900">Novo Motorista</h3>
                   <button onClick={() => setIsAddModalOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                      <X className="w-6 h-6" />
                   </button>
                </div>
                <form onSubmit={handleAddDriver} className="p-8 space-y-6">
                   <div className="space-y-6">
                      <div className="flex items-center justify-between bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
                         <div>
                            <p className="font-bold text-zinc-900 text-sm">Vincular a Usuário</p>
                            <p className="text-[10px] text-zinc-500 uppercase tracking-tighter font-black">Permite login por e-mail</p>
                         </div>
                         <button 
                           type="button"
                           onClick={() => setUseEmail(!useEmail)}
                           className={`w-12 h-6 rounded-full transition-colors relative ${useEmail ? 'bg-orange-500' : 'bg-zinc-300'}`}
                         >
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${useEmail ? 'left-7' : 'left-1'}`}></div>
                         </button>
                      </div>

                      {useEmail && (
                        <div className="animate-in slide-in-from-top-2 duration-300">
                           <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Email do Motorista</label>
                           <div className="relative">
                              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                              <input 
                                 required={useEmail}
                                 type="email" 
                                 placeholder="usuario@email.com" 
                                 value={newData.email}
                                 onChange={e => setNewData({...newData, email: e.target.value})}
                                 className="w-full bg-zinc-50 border border-zinc-200 pl-12 pr-4 py-4 rounded-xl outline-none focus:border-orange-500 focus:bg-white font-medium shadow-inner"
                              />
                           </div>
                        </div>
                      )}

                      <div>
                         <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Nome do Motorista</label>
                         <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                            <input 
                               required
                               type="text" 
                               placeholder="Nome Completo" 
                               value={newData.name}
                               onChange={e => setNewData({...newData, name: e.target.value})}
                               className="w-full bg-zinc-50 border border-zinc-200 pl-12 pr-4 py-4 rounded-xl outline-none focus:border-orange-500 focus:bg-white font-medium shadow-inner"
                            />
                         </div>
                      </div>
                      <div>
                         <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Veículo (Modelo/Cor)</label>
                         <input 
                            type="text" 
                            placeholder="ex: Toyota Corolla Prata" 
                            value={newData.vehicle}
                            onChange={e => setNewData({...newData, vehicle: e.target.value})}
                            className="w-full bg-zinc-50 border border-zinc-200 px-4 py-4 rounded-xl outline-none focus:border-orange-500 focus:bg-white font-medium shadow-inner"
                         />
                      </div>
                   </div>
                   
                   <button 
                     disabled={saving}
                     type="submit" 
                     className="w-full bg-orange-500 text-white font-black py-5 rounded-xl shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition-all uppercase tracking-widest text-sm disabled:opacity-50"
                   >
                      {saving ? 'Criando...' : 'Cadastrar Motorista'}
                   </button>
                </form>
             </div>
          </div>
       )}
    </div>
  )
}
