import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, setDoc, deleteDoc, serverTimestamp, orderBy, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Trash2, Plus, Edit2, Megaphone, GripVertical, ArrowUp, ArrowDown } from 'lucide-react';
import ImageUploader from '../../components/ImageUploader';
import { useConfirm } from '../../hooks/useConfirm';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import AiPageBuilder from '../../components/AiPageBuilder';
import { handleFirestoreError, OperationType } from '../../firebase/errors';

export default function AdminBanners({ cityId: overrideCityId }: { cityId?: string }) {
   const { userProfile, currentUser } = useAuth();
   const isSuperAdmin = userProfile?.role === 'super_admin' || userProfile?.role === 'admin';
   const cityId = overrideCityId || userProfile?.cityId;
   
   const { confirm } = useConfirm();
   const [banners, setBanners] = useState<any[]>([]);
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [current, setCurrent] = useState<any>({});

   const fetchAll = async () => {};
   
   useEffect(() => { 
      const constraints: any[] = [];
      if (cityId) {
        constraints.push(where('cityId', '==', cityId));
      }
      const unsub = onSnapshot(query(collection(db, 'banners'), ...constraints, orderBy('order', 'asc'), orderBy('createdAt', 'desc')), (snap) => {
         setBanners(snap.docs.map(d => ({id: d.id, ...d.data()})));
      }, (err) => handleFirestoreError(err, OperationType.GET, 'banners'));
      return () => unsub();
   }, [isSuperAdmin, cityId]);

   const handleSave = async (e: React.FormEvent) => {
      e.preventDefault();
      if(!current.imageUrl) { toast.error('A imagem é obrigatória'); return; }

      const id = current.id || `banner_${Date.now()}`;
      await setDoc(doc(db, 'banners', id), {
         title: current.title || '',
         subtitle: current.subtitle || '',
         imageUrl: current.imageUrl,
         actionText: current.actionText || '',
         actionUrl: current.actionUrl || '',
         actionType: current.actionType || 'ai_page',
         actionTarget: current.actionTarget || '',
         priority: current.priority || 'normal',
         themeColor: current.themeColor || '',
         active: current.active ?? true,
         order: current.order ?? banners.length,
         type: 'global',
         cityId: cityId || '',
         pageEnabled: (current.actionType === 'ai_page' || current.pageEnabled) || false,
         pageBlocks: current.pageBlocks || [],
         pageLayoutType: current.pageEnabled ? (current.pageLayoutType || 'promo') : '',
         pageContent: current.pageEnabled ? (current.pageContent || '') : '',
         createdBy: current.createdBy || currentUser?.uid,
         createdAt: current.createdAt || serverTimestamp(),
         updatedAt: serverTimestamp(),
      }, { merge: true });
      
      setIsModalOpen(false);
      setCurrent({});
      fetchAll();
      toast.success('Banner salvo com sucesso!');
   }

   const handleDelete = async (id: string) => {
      const isConfirmed = await confirm({
         title: 'Excluir Banner',
         description: `Deseja remover este banner permanentemente?`,
         type: 'danger',
         confirmText: 'Excluir'
      });
      if(isConfirmed) {
         await deleteDoc(doc(db, 'banners', id));
         toast.success('Banner excluído.');
         fetchAll();
      }
   }

   const moveBanner = async (index: number, direction: 'up' | 'down') => {
      if ((direction === 'up' && index === 0) || (direction === 'down' && index === banners.length - 1)) return;
      
      const newBanners = [...banners];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      
      const temp = newBanners[index];
      newBanners[index] = newBanners[targetIndex];
      newBanners[targetIndex] = temp;

      // Update local state immediately for UX
      setBanners(newBanners);

      // Save order to DB
      try {
         const promises = newBanners.map((b, i) => setDoc(doc(db, 'banners', b.id), { order: i }, { merge: true }));
         await Promise.all(promises);
         toast.success('Ordem atualizada!');
      } catch (e) {
         toast.error('Erro ao salvar ordem.');
      }
   };

   return (
      <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-zinc-100 min-h-[80vh] flex flex-col">
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-zinc-100 pb-6">
            <div>
               <h2 className="text-2xl font-black text-zinc-900 tracking-tight flex items-center gap-3"><Megaphone className="w-8 h-8 text-rose-500" /> Banners do Topo</h2>
               <p className="text-zinc-500 font-medium mt-1">Gerencie os banners rotativos que aparecem no topo da página inicial.</p>
            </div>
            <button onClick={() => { setCurrent({ active: true }); setIsModalOpen(true); }} className="bg-zinc-900 text-white font-bold px-6 py-3.5 rounded-2xl flex items-center gap-2 hover:bg-black transition-colors shadow-lg shadow-black/10">
               <Plus className="w-5 h-5" /> Novo Banner
            </button>
         </div>

         {banners.length === 0 ? (
            <div className="text-center py-24 bg-zinc-50 rounded-3xl border border-zinc-100 mt-auto mb-auto">
               <Megaphone className="w-16 h-16 text-zinc-300 mx-auto mb-4" />
               <h3 className="text-xl font-bold text-zinc-800">Nenhum banner cadastrado</h3>
               <p className="text-zinc-500 max-w-sm mx-auto mt-2">Adicione imagens para divulgar campanhas e ofertas.</p>
            </div>
         ) : (
            <div className="space-y-4">
               {banners.map((ban, index) => (
                  <div key={ban.id} className="flex items-center gap-4 bg-white border border-zinc-200 p-4 rounded-2xl shadow-sm hover:border-rose-500 transition-colors group">
                     {/* Order Controls */}
                     <div className="flex flex-col gap-1 items-center bg-zinc-50 rounded-lg p-1 border border-zinc-200">
                        <button onClick={() => moveBanner(index, 'up')} disabled={index === 0} className="p-1 rounded hover:bg-white text-zinc-400 disabled:opacity-30"><ArrowUp className="w-4 h-4" /></button>
                        <button onClick={() => moveBanner(index, 'down')} disabled={index === banners.length - 1} className="p-1 rounded hover:bg-white text-zinc-400 disabled:opacity-30"><ArrowDown className="w-4 h-4" /></button>
                     </div>

                     <div className="flex-[0_0_120px] md:flex-[0_0_200px] h-20 md:h-28 rounded-xl overflow-hidden bg-zinc-100 shrink-0 border border-zinc-100 relative">
                        <img src={ban.imageUrl} className="w-full h-full object-cover" alt="Banner" />
                        <div className="absolute inset-0 bg-black/10"></div>
                     </div>

                     <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <h4 className="font-black text-zinc-900 truncate text-lg">{ban.title || 'Banner sem título'}</h4>
                        <p className="text-sm font-medium text-zinc-500 truncate">{ban.subtitle || '-'}</p>
                        <div className="mt-2 flex items-center gap-2">
                           <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-md ${ban.active ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                              {ban.active ? 'Ativo' : 'Oculto'}
                           </span>
                           {ban.type !== 'global' && <span className="text-[10px] uppercase font-bold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-md border border-zinc-200">Loja Parceira</span>}
                        </div>
                     </div>

                     <div className="flex items-center gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setCurrent(ban); setIsModalOpen(true); }} className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-600 hover:bg-zinc-200"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(ban.id)} className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 hover:bg-rose-500 hover:text-white"><Trash2 className="w-4 h-4" /></button>
                     </div>
                  </div>
               ))}
            </div>
         )}

         {isModalOpen && (
            <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
               <form onSubmit={handleSave} className="bg-white rounded-3xl p-8 w-full max-w-2xl shadow-2xl my-8 mt-[30vh]">
                  <h3 className="text-2xl font-black text-zinc-900 mb-6 border-b border-zinc-100 pb-4">{current.id ? 'Editar Banner' : 'Novo Banner'}</h3>
                  
                  <div className="space-y-6">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                       <div>
                          <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-2">Título do Banner</label>
                          <input required type="text" value={current.title || ''} onChange={e => setCurrent({...current, title: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 px-5 py-3.5 rounded-2xl outline-none focus:border-rose-500 font-bold text-zinc-900 transition-colors" placeholder="Ex: Promoção de Inverno" />
                       </div>
                       <div>
                          <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-2">Subtítulo (Opcional)</label>
                          <input type="text" value={current.subtitle || ''} onChange={e => setCurrent({...current, subtitle: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 px-5 py-3.5 rounded-2xl outline-none focus:border-rose-500 font-medium text-zinc-900 transition-colors" placeholder="Descrição curta do banner" />
                       </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-5">
                           <div>
                              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-2">Ação do Botão</label>
                              <select value={current.actionType || 'ai_page'} onChange={e => {
                                 const val = e.target.value;
                                 setCurrent({...current, actionType: val, pageEnabled: val === 'ai_page', actionUrl: val === 'ai_page' ? '' : current.actionUrl})
                              }} className="w-full bg-zinc-50 border border-zinc-200 px-5 py-3.5 rounded-2xl outline-none focus:border-rose-500 font-bold text-zinc-900 transition-colors">
                                 <option value="ai_page">Página Promocional (Página IA)</option>
                                 <option value="merchant">Perfil de um Comércio</option>
                                 <option value="product">Produto Específico (Em Breve)</option>
                                 <option value="job">Vaga de Emprego (Em Breve)</option>
                                 <option value="service">Serviço (Em Breve)</option>
                                 <option value="external">Site Externo / URL</option>
                                 <option value="search">Buscar (Termo/Categoria)</option>
                              </select>
                           </div>
                           
                           {current.actionType !== 'ai_page' && (
                              <div>
                                 <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-2">Destino (URL, ID do Comércio, etc.)</label>
                                 <input required type="text" value={current.actionTarget || ''} onChange={e => setCurrent({...current, actionTarget: e.target.value})} className="w-full bg-white border border-zinc-200 px-5 py-3.5 rounded-2xl outline-none focus:border-primary font-medium text-zinc-900 transition-colors" placeholder={current.actionType === 'external' ? 'https://...' : (current.actionType === 'merchant' ? 'Cole o ID do Comércio' : 'Destino da ação')} />
                              </div>
                           )}

                           <div>
                              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-2">Texto do Botão (Opcional)</label>
                              <input type="text" value={current.actionText || ''} onChange={e => setCurrent({...current, actionText: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 px-5 py-3.5 rounded-2xl outline-none focus:border-rose-500 font-medium text-zinc-900 transition-colors" placeholder="Eu Quero, Aproveitar, etc." />
                           </div>
                           
                           <div className="grid grid-cols-2 gap-4 mt-2">
                              <div>
                                 <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-2">Prioridade</label>
                                 <select value={current.priority || 'normal'} onChange={e => setCurrent({...current, priority: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 px-5 py-3.5 rounded-2xl outline-none focus:border-rose-500 font-bold text-zinc-900 transition-colors">
                                    <option value="normal">Normal</option>
                                    <option value="high">Alta (Destaque Topo)</option>
                                 </select>
                              </div>
                              <div>
                                 <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-2">Cor Tema</label>
                                 <select value={current.themeColor || 'bg-rose-600'} onChange={e => setCurrent({...current, themeColor: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 px-5 py-3.5 rounded-2xl outline-none focus:border-rose-500 font-bold text-zinc-900 transition-colors">
                                    <option value="bg-rose-600">Vermelho (Rose)</option>
                                    <option value="bg-blue-600">Azul (Blue)</option>
                                    <option value="bg-emerald-600">Verde (Emerald)</option>
                                    <option value="bg-purple-600">Roxo (Purple)</option>
                                    <option value="bg-amber-500">Amarelo (Amber)</option>
                                    <option value="bg-zinc-900">Preto (Zinc)</option>
                                 </select>
                              </div>
                           </div>
                        </div>

                        <div>
                           <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-2">Imagem do Banner</label>
                           <ImageUploader value={current.imageUrl || null} onChange={val => setCurrent({...current, imageUrl: val || ''})} label="Imagem em Paisagem" recommendedText="Alta Qualidade (1600px+)" />
                        </div>
                     </div>

                     <div className="flex items-center gap-3 bg-zinc-50 p-4 border border-zinc-100 rounded-xl">
                        <input type="checkbox" id="act" checked={current.active ?? true} onChange={e => setCurrent({...current, active: e.target.checked})} className="w-5 h-5 accent-rose-600 rounded" />
                        <label htmlFor="act" className="font-bold text-zinc-800 cursor-pointer">Banner ativo no aplicativo</label>
                     </div>

                     {(current.actionType === 'ai_page' || current.pageEnabled) && (
                        <div className="p-6 bg-zinc-50/50 rounded-2xl border border-zinc-200 space-y-6">
                           <div>
                              <h3 className="font-black text-zinc-900 flex items-center gap-2 mb-1">
                                 Página Promocional do Banner
                              </h3>
                              <p className="text-sm text-zinc-500 mb-4 font-medium">Configure a página que será exibida ao clicar no banner.</p>
                           </div>
                           
                           <AiPageBuilder 
                              blocks={current.pageBlocks || []} 
                              onChange={(blocks) => setCurrent({...current, pageBlocks: blocks})}
                           />
                        </div>
                     )}
                  </div>

                  <div className="flex gap-4 pt-8 border-t border-zinc-100 mt-6">
                     <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-zinc-100 font-bold px-4 py-4 rounded-2xl hover:bg-zinc-200 text-zinc-700 transition-colors">Cancelar</button>
                     <button type="submit" className="flex-1 bg-rose-600 text-white font-bold px-4 py-4 rounded-2xl hover:bg-rose-700 shadow-lg shadow-rose-600/20 transition-all">Salvar Banner</button>
                  </div>
               </form>
            </div>
         )}
      </div>
   )
}
