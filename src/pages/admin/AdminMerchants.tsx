import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, deleteDoc, updateDoc, where, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { useConfirm } from '../../hooks/useConfirm';
import { Store, Trash2, Search, Star, ExternalLink, Plus, X, Mail, User } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../../firebase/errors';
import { useNavigate } from 'react-router-dom';

export default function AdminMerchants({ cityId: overrideCityId }: { cityId?: string }) {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const isSuperAdmin = userProfile?.role === 'super_admin' || userProfile?.role === 'admin';
  const cityId = overrideCityId || userProfile?.cityId;

  const [merchants, setMerchants] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [useEmail, setUseEmail] = useState(true);
  const [newData, setNewData] = useState({ email: '', businessName: '', category: '' });
  const [saving, setSaving] = useState(false);
  const { confirm } = useConfirm();

  const fetchMerchants = async () => {};

  useEffect(() => {
    const constraints: any[] = [];
    if (cityId) {
      constraints.push(where('cityId', '==', cityId));
    }
    const unsub = onSnapshot(query(collection(db, 'business_profiles'), ...constraints), (snap) => {
      setMerchants(snap.docs.map(d => ({id: d.id, ...d.data()})));
      setLoading(false);
    }, (error) => {
      toast.error('Erro ao carregar comércios.');
      handleFirestoreError(error, OperationType.GET, 'business_profiles');
      setLoading(false);
    });
    return () => unsub();
  }, [isSuperAdmin, cityId]);

  const handleAddMerchant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newData.businessName) return;
    if (useEmail && !newData.email) return;
    
    setSaving(true);

    try {
      let userId = `merchant_${Date.now()}`;

      if (useEmail) {
        // 1. Find user by email
        const uQ = query(collection(db, 'users'), where('email', '==', newData.email.toLowerCase().trim()));
        const uSnap = await getDocs(uQ);

        if (uSnap.empty) {
          toast.error('Usuário não encontrado com este email.');
          setSaving(false);
          return;
        }

        const userDoc = uSnap.docs[0];
        userId = userDoc.id;

        // 2. Update user role
        await updateDoc(doc(db, 'users', userId), {
           role: 'merchant',
           updatedAt: serverTimestamp() 
        });
      }

      // 3. Create business profile
      await setDoc(doc(db, 'business_profiles', userId), {
        userId,
        cityId: cityId || '',
        businessName: newData.businessName,
        category: newData.category,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        rating: 5.0,
        isOpen: true
      }, { merge: true });

      toast.success(useEmail ? 'Comércio criado e vinculado!' : 'Comércio criado com sucesso!');
      setIsAddModalOpen(false);
      setNewData({ email: '', businessName: '', category: '' });
      fetchMerchants();
    } catch (e) {
      toast.error('Erro ao criar comércio.');
      handleFirestoreError(e, OperationType.WRITE, null);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const isConfirmed = await confirm({
       title: 'Excluir Comércio',
       description: `Tem certeza que deseja excluir permanentemente o comércio "${name}"? Esta ação removerá TUDO associado a esta loja: produtos, banners e vagas de emprego.`,
       type: 'danger',
       confirmText: 'Sim, excluir tudo'
    });
    if (isConfirmed) {
      try {
        setSaving(true);
        
        // 1. Delete Products
        const prodQ = query(collection(db, 'products'), where('merchantId', '==', id));
        const prodSnap = await getDocs(prodQ);
        const prodDeletes = prodSnap.docs.map(d => deleteDoc(doc(db, 'products', d.id)));
        
        // 2. Delete Banners
        const banQ = query(collection(db, 'banners'), where('createdBy', '==', id));
        const banSnap = await getDocs(banQ);
        const banDeletes = banSnap.docs.map(d => deleteDoc(doc(db, 'banners', d.id)));
        
        // 3. Delete Jobs
        const jobQ = query(collection(db, 'jobs'), where('merchantId', '==', id));
        const jobSnap = await getDocs(jobQ);
        const jobDeletes = jobSnap.docs.map(d => deleteDoc(doc(db, 'jobs', d.id)));

        // Execute all deletions (limited for safety, but usually merchants don't have thousands)
        await Promise.all([...prodDeletes, ...banDeletes, ...jobDeletes]);

        // 4. Delete Profile
        await deleteDoc(doc(db, 'business_profiles', id));
        
        toast.success('Comércio e todos os dados associados foram excluídos.');
        fetchMerchants();
      } catch(e) {
        console.error('Delete error:', e);
        toast.error('Erro ao excluir dados do comércio.');
      } finally {
        setSaving(false);
      }
    }
  };

  const filtered = merchants.filter(m => (m.businessName?.toLowerCase() || '').includes(searchTerm.toLowerCase()));

  if (loading) return <div className="p-8 text-center text-zinc-500">Carregando comércios...</div>;

  return (
    <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-zinc-100 h-full flex flex-col">
       <div className="flex justify-between items-center mb-8 border-b border-zinc-100 pb-5">
         <div>
            <h2 className="text-2xl font-black text-zinc-900 tracking-tight">Gestão de Comércios</h2>
            <p className="text-zinc-500 font-medium">Lojas, mercados e estabelecimentos cadastrados ({merchants.length})</p>
         </div>
         <div className="flex gap-2">
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20"
            >
               <Plus className="w-5 h-5" /> Adicionar Comércio
            </button>
         </div>
       </div>

       <div className="relative mb-6">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input 
            type="text" 
            placeholder="Buscar por nome da loja..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-50 border border-zinc-200 pl-11 pr-4 py-3 rounded-2xl outline-none focus:border-emerald-500 transition-colors font-medium text-zinc-800"
          />
       </div>

       {filtered.length === 0 ? (
          <div className="text-center py-20 bg-zinc-50 rounded-3xl border border-zinc-100">
             <Store className="w-16 h-16 text-zinc-300 mx-auto mb-4" />
             <h3 className="text-xl font-bold text-zinc-800">Nenhum comércio encontrado</h3>
          </div>
       ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {filtered.map(merc => (
               <div key={merc.id} className="flex flex-col p-5 rounded-2xl border border-zinc-200 bg-white hover:border-emerald-500 transition-colors shadow-sm">
                  <div className="flex items-center gap-4 mb-4">
                     <div className="w-16 h-16 rounded-xl bg-zinc-100 overflow-hidden shrink-0 border border-zinc-100">
                        {merc.logoImage ? (
                           <img src={merc.logoImage} className="w-full h-full object-cover" />
                        ) : (
                           <div className="w-full h-full flex items-center justify-center"><Store className="w-6 h-6 text-zinc-300" /></div>
                        )}
                     </div>
                     <div className="flex-1 min-w-0">
                        <h3 className="font-black text-zinc-900 truncate">{merc.businessName}</h3>
                        <p className="text-sm font-bold text-emerald-600 truncate">{merc.category || 'Sem Categoria'}</p>
                        <p className="text-xs text-zinc-400 truncate mt-0.5">{merc.address || 'Sem endereço'}</p>
                     </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
                     <div className="flex items-center gap-1 text-orange-500 font-bold bg-orange-50 px-2 py-1 rounded-lg text-sm">
                        <Star className="w-4 h-4 fill-current" /> {merc.rating?.toFixed(1) || '5.0'}
                     </div>
                     <div className="flex gap-2">
                        <button onClick={() => navigate(`/comerciante/painel?admin_view=${merc.userId || merc.id}`)} className="w-10 h-10 rounded-full flex items-center justify-center bg-zinc-100 text-zinc-600 hover:bg-emerald-500 hover:text-white transition-colors" title="Acessar Painel">
                           <ExternalLink className="w-5 h-5" />
                        </button>
                        <button onClick={() => handleDelete(merc.id, merc.businessName)} className="w-10 h-10 rounded-full flex items-center justify-center bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-colors">
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
                   <h3 className="font-black text-xl text-zinc-900">Novo Comércio</h3>
                   <button onClick={() => setIsAddModalOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                      <X className="w-6 h-6" />
                   </button>
                </div>
                <form onSubmit={handleAddMerchant} className="p-8 space-y-6">
                   <div className="space-y-6">
                      <div className="flex items-center justify-between bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
                         <div>
                            <p className="font-bold text-zinc-900 text-sm">Vincular a Usuário</p>
                            <p className="text-[10px] text-zinc-500 uppercase tracking-tighter font-black">Permite login por e-mail</p>
                         </div>
                         <button 
                           type="button"
                           onClick={() => setUseEmail(!useEmail)}
                           className={`w-12 h-6 rounded-full transition-colors relative ${useEmail ? 'bg-emerald-500' : 'bg-zinc-300'}`}
                         >
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${useEmail ? 'left-7' : 'left-1'}`}></div>
                         </button>
                      </div>

                      {useEmail && (
                        <div className="animate-in slide-in-from-top-2 duration-300">
                           <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Email do Dono</label>
                           <div className="relative">
                              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                              <input 
                                 required={useEmail}
                                 type="email" 
                                 placeholder="usuario@email.com" 
                                 value={newData.email}
                                 onChange={e => setNewData({...newData, email: e.target.value})}
                                 className="w-full bg-zinc-50 border border-zinc-200 pl-12 pr-4 py-4 rounded-xl outline-none focus:border-emerald-500 focus:bg-white font-medium shadow-inner"
                              />
                           </div>
                        </div>
                      )}

                      <div>
                         <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Nome da Empresa / Loja</label>
                         <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                            <input 
                               required
                               type="text" 
                               placeholder="Nome do Comércio" 
                               value={newData.businessName}
                               onChange={e => setNewData({...newData, businessName: e.target.value})}
                               className="w-full bg-zinc-50 border border-zinc-200 pl-12 pr-4 py-4 rounded-xl outline-none focus:border-emerald-500 focus:bg-white font-medium shadow-inner"
                            />
                         </div>
                      </div>
                      <div>
                         <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Categoria Principal</label>
                         <input 
                            type="text" 
                            placeholder="ex: Pizzaria, Roupas, etc." 
                            value={newData.category}
                            onChange={e => setNewData({...newData, category: e.target.value})}
                            className="w-full bg-zinc-50 border border-zinc-200 px-4 py-4 rounded-xl outline-none focus:border-emerald-500 focus:bg-white font-medium shadow-inner"
                         />
                      </div>
                   </div>
                   
                   <button 
                     disabled={saving}
                     type="submit" 
                     className="w-full bg-emerald-600 text-white font-black py-5 rounded-xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-all uppercase tracking-widest text-sm disabled:opacity-50"
                   >
                      {saving ? 'Criando...' : 'Cadastrar Comércio'}
                   </button>
                </form>
             </div>
          </div>
       )}
    </div>
  )
}
