import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, setDoc, deleteDoc, serverTimestamp, orderBy, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Trash2, Plus, Edit2, GripVertical, AlertTriangle, ArrowUp, ArrowDown } from 'lucide-react';
import ImageUploader from '../../components/ImageUploader';
import { useConfirm } from '../../hooks/useConfirm';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import { handleFirestoreError, OperationType } from '../../firebase/errors';

export default function AdminSections({ cityId: overrideCityId }: { cityId?: string }) {
   const { userProfile } = useAuth();
   const isSuperAdmin = userProfile?.role === 'super_admin' || userProfile?.role === 'admin';
   const cityId = overrideCityId || userProfile?.cityId;

   const { confirm } = useConfirm();
   const [sections, setSections] = useState<any[]>([]);
   const [isAdding, setIsAdding] = useState(false);
   const [editingId, setEditingId] = useState<string | null>(null);
   const [current, setCurrent] = useState<any>({});

   const fetchAll = async () => {};
   
   useEffect(() => { 
      const constraints: any[] = [];
      if (cityId) {
        constraints.push(where('cityId', '==', cityId));
      }
      const unsub = onSnapshot(query(collection(db, 'home_sections'), ...constraints, orderBy('order', 'asc')), (snap) => {
         setSections(snap.docs.map(d => ({id: d.id, ...d.data()})));
      }, (err) => handleFirestoreError(err, OperationType.GET, 'home_sections'));
      return () => unsub();
   }, [isSuperAdmin, cityId]);

   const handleSave = async () => {
      if(!current.title) return;
      const id = editingId || `sec_${Date.now()}`;
      await setDoc(doc(db, 'home_sections', id), {
         title: current.title,
         subtitle: current.subtitle || '',
         type: current.type || 'products',
         categoryId: current.categoryId || '',
         cityId: cityId || '',
         order: current.order ?? sections.length + 1,
         active: current.active ?? true,
         createdAt: current.createdAt || serverTimestamp(),
      }, { merge: true });
      setIsAdding(false);
      setEditingId(null);
      setCurrent({});
      fetchAll();
      toast.success('Seção salva com sucesso!');
   }

   const handleDelete = async (id: string) => {
      const isConfirmed = await confirm({
         title: 'Excluir Seção',
         description: 'Deseja realmente excluir esta seção?',
         type: 'danger',
         confirmText: 'Excluir'
      });
      if(isConfirmed) {
         await deleteDoc(doc(db, 'home_sections', id));
         toast.success('Seção excluída.');
         fetchAll();
      }
   }

   const moveSection = async (index: number, direction: 'up' | 'down') => {
      if ((direction === 'up' && index === 0) || (direction === 'down' && index === sections.length - 1)) return;
      
      const newSections = [...sections];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      
      const temp = newSections[index];
      newSections[index] = newSections[targetIndex];
      newSections[targetIndex] = temp;

      // Update local state immediately for UX
      setSections(newSections);

      // Save order to DB
      try {
         const promises = newSections.map((s, i) => updateDoc(doc(db, 'home_sections', s.id), { order: i }));
         await Promise.all(promises);
         toast.success('Ordem atualizada!');
      } catch (e) {
         toast.error('Erro ao salvar ordem.');
         handleFirestoreError(e, OperationType.UPDATE, 'home_sections');
      }
   };

   return (
      <div className="space-y-6">
         <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-zinc-100">
            <div>
               <h2 className="text-xl font-black text-zinc-900">Gerenciador de Seções</h2>
               <p className="text-sm text-zinc-500">Adicione ou remova blocos de conteúdo da página inicial.</p>
            </div>
            <button onClick={() => { setCurrent({order: sections.length + 1, type: 'products'}); setIsAdding(true); setEditingId(null); }} className="bg-primary text-white font-bold px-4 py-2 rounded-xl flex items-center gap-2">
               <Plus className="w-4 h-4" /> Nova Seção
            </button>
         </div>

         {(isAdding || editingId) && (
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-100 space-y-4">
               <h3 className="font-bold text-zinc-800">{editingId ? 'Editar Seção' : 'Criar Nova Seção'}</h3>
               
               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-zinc-500 uppercase">Título da Seção</label>
                    <input type="text" placeholder="Ex: Mercado em Casa" value={current.title || ''} onChange={e => setCurrent({...current, title: e.target.value})} className="w-full mt-1 bg-zinc-50 border border-zinc-200 px-4 py-3 rounded-xl outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-500 uppercase">Subtítulo</label>
                    <input type="text" placeholder="Aparece logo abaixo do título" value={current.subtitle || ''} onChange={e => setCurrent({...current, subtitle: e.target.value})} className="w-full mt-1 bg-zinc-50 border border-zinc-200 px-4 py-3 rounded-xl outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-500 uppercase">Tipo de Conteúdo</label>
                    <select value={current.type || 'products'} onChange={e => setCurrent({...current, type: e.target.value})} className="w-full mt-1 bg-zinc-50 border border-zinc-200 px-4 py-3 rounded-xl outline-none">
                       <option value="products">Lista de Produtos Diversos</option>
                       <option value="merchants">Lista de Comércios/Lojas</option>
                       <option value="services">Lista de Serviços</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-500 uppercase">ID da Categoria (opcional filtro)</label>
                    <input type="text" placeholder="Ex: mercado, lanche, servicos" value={current.categoryId || ''} onChange={e => setCurrent({...current, categoryId: e.target.value})} className="w-full mt-1 bg-zinc-50 border border-zinc-200 px-4 py-3 rounded-xl outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-500 uppercase">Ordem de Exibição</label>
                    <input type="number" value={current.order || 0} onChange={e => setCurrent({...current, order: Number(e.target.value)})} className="w-full mt-1 bg-zinc-50 border border-zinc-200 px-4 py-3 rounded-xl outline-none" />
                  </div>
               </div>

               <label className="flex items-center gap-2 cursor-pointer pt-2">
                  <input type="checkbox" checked={current.active ?? true} onChange={e => setCurrent({...current, active: e.target.checked})} className="w-5 h-5 accent-primary" />
                  <span className="font-bold text-zinc-700">Seção Ativa/Visível</span>
               </label>
               <div className="flex gap-2 pt-2 text-sm">
                  <button onClick={handleSave} className="bg-emerald-600 text-white font-bold px-6 py-2 rounded-xl">Salvar</button>
                  <button onClick={() => { setIsAdding(false); setEditingId(null); }} className="bg-zinc-200 text-zinc-700 font-bold px-6 py-2 rounded-xl">Cancelar</button>
               </div>
            </div>
         )}

         <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm flex flex-col gap-3">
            <div className="flex items-center gap-2 text-primary font-bold bg-primary/10 px-4 py-3 rounded-2xl mb-2">
               <AlertTriangle className="w-5 h-5" /> Você pode alterar a ordem editando o número da posição (Ordem).
            </div>
            {sections.map((sec, index) => (
               <div key={sec.id} className={`flex items-center justify-between p-4 rounded-2xl border ${sec.active ? 'border-zinc-200 bg-zinc-50' : 'border-dashed border-zinc-300 bg-zinc-50/50 opacity-60'}`}>
                  <div className="flex items-center gap-4">
                     <div className="flex flex-col gap-1 items-center bg-white rounded-lg p-1 border border-zinc-200">
                        <button onClick={() => moveSection(index, 'up')} disabled={index === 0} className="p-1 rounded hover:bg-zinc-100 text-zinc-400 disabled:opacity-30 transition-colors"><ArrowUp className="w-4 h-4" /></button>
                        <button onClick={() => moveSection(index, 'down')} disabled={index === sections.length - 1} className="p-1 rounded hover:bg-zinc-100 text-zinc-400 disabled:opacity-30 transition-colors"><ArrowDown className="w-4 h-4" /></button>
                     </div>
                     <div className="w-10 h-10 bg-zinc-200 rounded-lg flex items-center justify-center font-black text-zinc-500">{sec.order}</div>
                     <div>
                        <h4 className="font-bold text-zinc-900 leading-tight">{sec.title}</h4>
                        <p className="text-zinc-500 text-xs">Tipo: {sec.type} {sec.categoryId && `| Filtro: ${sec.categoryId}`}</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                     <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md ${sec.active ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {sec.active ? 'Visível' : 'Oculta'}
                     </span>
                     <button onClick={() => { setEditingId(sec.id); setCurrent(sec); setIsAdding(false); }} className="w-8 h-8 bg-white border border-zinc-200 rounded-full flex items-center justify-center text-zinc-600 hover:bg-primary hover:text-white hover:border-primary"><Edit2 className="w-4 h-4" /></button>
                     <button onClick={() => handleDelete(sec.id)} className="w-8 h-8 bg-white border border-zinc-200 rounded-full flex items-center justify-center text-zinc-600 hover:bg-rose-500 hover:text-white hover:border-rose-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
               </div>
            ))}
         </div>
      </div>
   );
}
