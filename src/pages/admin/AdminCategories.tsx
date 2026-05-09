import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, setDoc, deleteDoc, serverTimestamp, orderBy, onSnapshot, where, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Trash2, Plus, Edit2, Layers, Search, Store, Briefcase, Package, User, PawPrint, Wand2, ArrowUp, ArrowDown } from 'lucide-react';
import { useConfirm } from '../../hooks/useConfirm';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import { suggestIcons } from '../../services/aiService';
import * as Icons from 'lucide-react';
import { handleFirestoreError, OperationType } from '../../firebase/errors';

const TYPE_CONFIG: Record<string, { label: string, icon: any, color: string }> = {
   'merchant': { label: 'Comércio / Loja', icon: Store, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
   'service': { label: 'Prestador / Serviço', icon: Briefcase, color: 'text-blue-600 bg-blue-50 border-blue-200' },
   'product': { label: 'Produto Físico', icon: Package, color: 'text-purple-600 bg-purple-50 border-purple-200' },
   'job': { label: 'Vaga / Emprego', icon: User, color: 'text-orange-600 bg-orange-50 border-orange-200' },
   'adoption': { label: 'Espécie (Adoção)', icon: PawPrint, color: 'text-rose-600 bg-rose-50 border-rose-200' },
};

export default function AdminCategories({ cityId: overrideCityId }: { cityId?: string }) {
   const { userProfile } = useAuth();
   const isSuperAdmin = userProfile?.role === 'super_admin' || userProfile?.role === 'admin';
   const cityId = overrideCityId || userProfile?.cityId;

   const { confirm } = useConfirm();
   const [categories, setCategories] = useState<any[]>([]);
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [current, setCurrent] = useState<any>({});
   const [searchTerm, setSearchTerm] = useState('');
   const [activeTab, setActiveTab] = useState('all');
   const [isSuggestingIcon, setIsSuggestingIcon] = useState(false);
   const [suggestedIcons, setSuggestedIcons] = useState<string[]>([]);
   const [saving, setSaving] = useState(false);

   const fetchAll = async () => {};
   
   useEffect(() => { 
      const constraints: any[] = [];
      if (cityId) {
        constraints.push(where('cityId', '==', cityId));
      }
      const unsub = onSnapshot(query(collection(db, 'categories'), ...constraints, orderBy('type', 'asc'), orderBy('order', 'asc')), (snap) => {
         setCategories(snap.docs.map(d => ({id: d.id, ...d.data()})));
      }, (err) => handleFirestoreError(err, OperationType.GET, 'categories'));
      return () => unsub();
   }, [isSuperAdmin, cityId]);

   const handleSuggestIcon = async () => {
      if (!current.name) {
         toast.error("Preencha o nome da categoria primeiro.");
         return;
      }
      setIsSuggestingIcon(true);
      try {
         const icons = await suggestIcons(current.name);
         setSuggestedIcons(icons);
         if (icons.length > 0 && !current.iconUrl) {
            setCurrent({ ...current, iconUrl: icons[0] });
         }
         toast.success("Opções de ícones sugeridas com sucesso!");
      } catch (err) {
         toast.error("Erro ao sugerir ícone.");
      } finally {
         setIsSuggestingIcon(false);
      }
   }

   const openModal = (cat?: any) => {
      setCurrent(cat || { type: 'merchant', active: true, order: categories.length });
      setSuggestedIcons([]);
      setIsModalOpen(true);
   }

   const handleSave = async (e: React.FormEvent) => {
      e.preventDefault();
      if(!current.name || !current.type) return;
      setSaving(true);
      const id = current.id || `cat_${Date.now()}`;
      try {
        await setDoc(doc(db, 'categories', id), {
           name: current.name,
           type: current.type,
           iconUrl: current.iconUrl || '',
           cityId: cityId || '',
           order: current.order ?? categories.length,
           active: current.active ?? true,
           createdAt: current.createdAt || serverTimestamp(),
        }, { merge: true });
        
        setIsModalOpen(false);
        setCurrent({});
        fetchAll();
        toast.success('Categoria salva com sucesso!');
      } catch(e) {
        handleFirestoreError(e, OperationType.WRITE, 'categories');
      } finally {
        setSaving(false);
      }
   }

   const handleDelete = async (id: string, name: string) => {
      const isConfirmed = await confirm({
         title: 'Excluir Categoria',
         description: `Deseja realmente excluir a categoria "${name}"? Os registros que a utilizam não serão encontrados corretamente.`,
         type: 'danger',
         confirmText: 'Sim, Excluir'
      });
      if(isConfirmed) {
         await deleteDoc(doc(db, 'categories', id));
         toast.success('Categoria excluída.');
         fetchAll();
      }
   }

   const moveCategory = async (index: number, direction: 'up' | 'down', typeGroup: string) => {
      const groupCats = categories.filter(c => c.type === typeGroup);
      const itemInGroup = groupCats[index];
      if (!itemInGroup) return;

      if ((direction === 'up' && index === 0) || (direction === 'down' && index === groupCats.length - 1)) return;
      
      const newGroupCats = [...groupCats];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      
      const temp = newGroupCats[index];
      newGroupCats[index] = newGroupCats[targetIndex];
      newGroupCats[targetIndex] = temp;

      // Save order to DB
      try {
         const promises = newGroupCats.map((c, i) => updateDoc(doc(db, 'categories', c.id), { order: i }));
         await Promise.all(promises);
         toast.success('Ordem atualizada!');
      } catch (e) {
         toast.error('Erro ao salvar ordem.');
      }
   };

   // Filtering
   let filtered = categories;
   if (activeTab !== 'all') filtered = filtered.filter(c => c.type === activeTab);
   if (searchTerm) filtered = filtered.filter(c => c.name?.toLowerCase().includes(searchTerm.toLowerCase()));

   // Grouping for grouped view (if all)
   const groupByType = (list: any[]) => {
      const groups: Record<string, any[]> = {};
      list.forEach(c => {
         const t = c.type || 'none';
         if (!groups[t]) groups[t] = [];
         groups[t].push(c);
      });
      return groups;
   };

   const grouped = activeTab === 'all' ? groupByType(filtered) : { [activeTab]: filtered };

   return (
      <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-zinc-100 min-h-[80vh] flex flex-col">
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-zinc-100 pb-6">
            <div>
               <h2 className="text-2xl font-black text-zinc-900 tracking-tight flex items-center gap-3"><Layers className="w-8 h-8 text-indigo-500" /> Estrutura de Categorias</h2>
               <p className="text-zinc-500 font-medium mt-1">Organize as "Categorias Principais" e suas "Subcategorias".</p>
            </div>
            <button onClick={() => openModal()} className="bg-zinc-900 text-white font-bold px-6 py-3.5 rounded-2xl flex items-center gap-2 hover:bg-black transition-colors shadow-lg shadow-black/10">
               <Plus className="w-5 h-5" /> Adicionar Categoria
            </button>
         </div>

         {/* Filters bar */}
         <div className="flex flex-col md:flex-row items-center gap-4 mb-8">
             <div className="flex bg-zinc-100 p-1.5 rounded-2xl w-full md:w-auto overflow-x-auto custom-scrollbar">
                <button onClick={() => setActiveTab('all')} className={`px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${activeTab === 'all' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500 hover:text-zinc-700'}`}>Todas</button>
                {Object.entries(TYPE_CONFIG).map(([type, conf]) => (
                   <button key={type} onClick={() => setActiveTab(type)} className={`px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 ${activeTab === type ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500 hover:text-zinc-700'}`}>
                      <conf.icon className="w-4 h-4" /> {conf.label}
                   </button>
                ))}
             </div>

             <div className="relative w-full md:flex-1">
                <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input 
                  type="text" 
                  placeholder="Buscar categoria específica..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 pl-11 pr-4 py-3 rounded-2xl outline-none focus:border-indigo-500 transition-colors font-medium text-zinc-800"
                />
             </div>
         </div>

         {Object.keys(grouped).length === 0 ? (
            <div className="text-center py-24 bg-zinc-50 rounded-3xl border border-zinc-100 mt-auto mb-auto">
               <Layers className="w-16 h-16 text-zinc-300 mx-auto mb-4" />
               <h3 className="text-xl font-bold text-zinc-800">Nenhuma categoria encontrada</h3>
               <p className="text-zinc-500 max-w-sm mx-auto mt-2">Crie novas categorias para organizar o seu marketplace.</p>
            </div>
         ) : (
            <div className="space-y-10">
               {Object.entries(grouped).map(([typeKey, cats]) => {
                  const Icon = TYPE_CONFIG[typeKey]?.icon || Layers;
                  const label = TYPE_CONFIG[typeKey]?.label || 'Outros';
                  const colorClass = TYPE_CONFIG[typeKey]?.color || 'bg-zinc-100 text-zinc-600 border-zinc-200';

                  return (
                     <div key={typeKey} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center gap-3 mb-4">
                           <div className={`p-2 rounded-xl border ${colorClass}`}><Icon className="w-5 h-5" /></div>
                           <h3 className="text-lg font-black text-zinc-900 uppercase tracking-widest">{label} <span className="text-zinc-400 text-sm ml-2">({cats.length})</span></h3>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                           {cats.map((cat: any, idx: number) => {
                              const DynamicIcon = cat.iconUrl ? (Icons as any)[cat.iconUrl] : null;
                              return (
                               <div key={cat.id} className="group relative bg-white border border-zinc-200 rounded-2xl p-5 hover:border-indigo-500 hover:shadow-md transition-all cursor-default">
                                  <div className="flex justify-between items-center mb-2">
                                     <div className="flex items-center gap-3 pr-8">
                                          <div className="flex flex-col gap-1 items-center bg-zinc-50 rounded-lg p-1 border border-zinc-200">
                                            <button onClick={() => moveCategory(idx, 'up', typeKey)} disabled={idx === 0} className="p-1 rounded hover:bg-zinc-200 text-zinc-400 disabled:opacity-30 transition-colors"><ArrowUp className="w-3 h-3" /></button>
                                            <button onClick={() => moveCategory(idx, 'down', typeKey)} disabled={idx === cats.length - 1} className="p-1 rounded hover:bg-zinc-200 text-zinc-400 disabled:opacity-30 transition-colors"><ArrowDown className="w-3 h-3" /></button>
                                          </div>
                                          {DynamicIcon && <DynamicIcon className="w-5 h-5 text-indigo-500 shrink-0" />}
                                          <div>
                                              <h4 className="font-bold text-zinc-800 text-base leading-tight">{cat.name}</h4>
                                              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Ordem: {cat.order ?? idx}</span>
                                          </div>
                                     </div>
                                     <div className="flex opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                                        <button onClick={() => openModal(cat)} className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-600 hover:bg-zinc-200"><Edit2 className="w-4 h-4" /></button>
                                        <button onClick={() => handleDelete(cat.id, cat.name)} className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 hover:bg-rose-500 hover:text-white"><Trash2 className="w-4 h-4" /></button>
                                     </div>
                                  </div>
                                  {!cat.active && <span className="inline-block mt-2 text-[10px] uppercase font-black tracking-wider bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">Inativa</span>}
                               </div>
                              )
                           })}
                        </div>
                     </div>
                  )
               })}
            </div>
         )}

         {isModalOpen && (
            <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
               <form onSubmit={handleSave} className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                  <h3 className="text-2xl font-black text-zinc-900 mb-6 border-b border-zinc-100 pb-4">{current.id ? 'Editar Categoria' : 'Criar Categoria'}</h3>
                  
                  <div className="space-y-5">
                     <div>
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-2">Categoria Principal (Tipo)</label>
                        <select value={current.type || 'merchant'} onChange={e => setCurrent({...current, type: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 px-5 py-3.5 rounded-2xl outline-none focus:border-indigo-500 focus:bg-white font-medium text-zinc-900 transition-colors">
                           {Object.entries(TYPE_CONFIG).map(([k, v]) => (
                              <option key={k} value={k}>{v.label}</option>
                           ))}
                        </select>
                     </div>

                     <div>
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-2">Nome Específico / Subcategoria</label>
                        <input required type="text" value={current.name || ''} onChange={e => setCurrent({...current, name: e.target.value})} placeholder="Ex: Mercado, Encanador, Limpeza..." className="w-full bg-zinc-50 border border-zinc-200 px-5 py-3.5 rounded-2xl outline-none focus:border-indigo-500 focus:bg-white font-medium text-zinc-900 transition-colors" />
                     </div>

                     <div>
                        <div className="flex items-center justify-between mb-2">
                           <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">Ícone (Nome Lucide)</label>
                           <button type="button" onClick={handleSuggestIcon} disabled={isSuggestingIcon || !current.name} className="flex items-center gap-1.5 text-xs font-bold bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg hover:bg-indigo-100 disabled:opacity-50 transition-colors">
                              {isSuggestingIcon ? <span className="w-3.5 h-3.5 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></span> : <Wand2 className="w-3.5 h-3.5" />}
                              Sugerir com IA
                           </button>
                        </div>
                        <div className="flex gap-2">
                           <div className="w-14 h-[52px] bg-zinc-100 border border-zinc-200 rounded-2xl flex items-center justify-center shrink-0">
                              {current.iconUrl && (Icons as any)[current.iconUrl] ? React.createElement((Icons as any)[current.iconUrl], { className: "w-6 h-6 text-indigo-500" }) : <span className="text-zinc-400 font-medium text-xs">N/A</span>}
                           </div>
                           <input type="text" value={current.iconUrl || ''} onChange={e => setCurrent({...current, iconUrl: e.target.value})} placeholder="Ex: ShoppingCart" className="w-full bg-zinc-50 border border-zinc-200 px-5 py-3.5 rounded-2xl outline-none focus:border-indigo-500 focus:bg-white font-medium text-zinc-900 transition-colors" />
                        </div>
                        {suggestedIcons.length > 0 && (
                           <div className="mt-3 p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-2">
                              <p className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">Escolha uma opção:</p>
                              <div className="flex flex-wrap gap-2">
                                 {suggestedIcons.map(iconName => {
                                    const IconComponent = (Icons as any)[iconName];
                                    if (!IconComponent) return null;
                                    const isSelected = current.iconUrl === iconName;
                                    return (
                                       <button
                                          key={iconName}
                                          type="button"
                                          onClick={() => setCurrent({ ...current, iconUrl: iconName })}
                                          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border transition-all ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-zinc-200 text-zinc-600 hover:border-indigo-300 hover:bg-indigo-50/50'}`}
                                       >
                                          <IconComponent className="w-4 h-4" />
                                          <span className="text-xs font-semibold">{iconName}</span>
                                       </button>
                                    );
                                 })}
                              </div>
                           </div>
                        )}
                        <p className="text-[11px] text-zinc-400 mt-2">Usado para identificar a categoria visualmente em algumas listas.</p>
                     </div>

                     <div className="flex items-center gap-3 bg-zinc-50 p-4 rounded-2xl border border-zinc-200">
                        <input type="checkbox" id="act" checked={current.active ?? true} onChange={e => setCurrent({...current, active: e.target.checked})} className="w-5 h-5 accent-indigo-600 rounded" />
                        <label htmlFor="act" className="font-bold text-zinc-800 cursor-pointer">Deixar visível no aplicativo</label>
                     </div>
                  </div>

                  <div className="flex gap-4 pt-8 border-t border-zinc-100 mt-6">
                     <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-zinc-100 font-bold px-4 py-4 rounded-2xl hover:bg-zinc-200 text-zinc-700 transition-colors">Cancelar</button>
                     <button type="submit" className="flex-1 bg-indigo-600 text-white font-bold px-4 py-4 rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all">Salvar</button>
                  </div>
               </form>
            </div>
         )}
      </div>
   )
}
