import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, setDoc, deleteDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Trash2, Plus, Edit2, CheckCircle, Search, Sparkles, Loader2 } from 'lucide-react';
import ImageUploader from '../../components/ImageUploader';
import { useConfirm } from '../../hooks/useConfirm';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import { generatePageFromDescription } from '../../services/aiPageGeneration';
import { handleFirestoreError, OperationType } from '../../firebase/errors';

export default function AdminCampaigns({ cityId: overrideCityId }: { cityId?: string }) {
   const { userProfile } = useAuth();
   const isSuperAdmin = userProfile?.role === 'super_admin' || userProfile?.role === 'admin';
   const cityId = overrideCityId || userProfile?.cityId;

   const { confirm } = useConfirm();
   const [campaigns, setCampaigns] = useState<any[]>([]);
   const [isAdding, setIsAdding] = useState(false);
   const [editingId, setEditingId] = useState<string | null>(null);
   const [current, setCurrent] = useState<any>({});
   const [isGenerating, setIsGenerating] = useState(false);

   const fetchAll = async () => {};
   
   useEffect(() => { 
      const constraints: any[] = [];
      if (cityId) {
        constraints.push(where('cityId', '==', cityId));
      }
      const unsub = onSnapshot(query(collection(db, 'campaigns'), ...constraints), (snap) => {
         setCampaigns(snap.docs.map(d => ({id: d.id, ...d.data()})));
      }, (err) => handleFirestoreError(err, OperationType.GET, 'campaigns'));
      return () => unsub();
   }, [isSuperAdmin, cityId]);

   const handleSave = async () => {
      if(!current.title) { toast.error('Título é obrigatório'); return; }
      
      const id = editingId || `camp_${Date.now()}`;
      
      let processedNeeds = [];
      if (typeof current.needs === 'string') {
         processedNeeds = current.needs.split(',').map((s: string) => s.trim()).filter(Boolean);
      } else if (Array.isArray(current.needs)) {
         processedNeeds = current.needs;
      }

      try {
         await setDoc(doc(db, 'campaigns', id), {
            title: current.title,
            description: current.description || '',
            tag: current.tag || '',
            imageUrl: current.imageUrl || '',
            location: current.location || '',
            howToHelp: current.howToHelp || '',
            actionText: current.actionText || '',
            actionUrl: current.actionUrl || '',
            pixKey: current.pixKey || '',
            whatsapp: current.whatsapp || '',
            goal: Number(current.goal) || 0,
            raised: Number(current.raised) || 0,
            cityId: cityId || (current.cityId || ''),
            needs: processedNeeds,
            pageConfig: current.pageConfig || null,
            active: current.active ?? true,
            createdAt: current.createdAt || serverTimestamp(),
            updatedAt: serverTimestamp(),
         }, { merge: true });
         
         setIsAdding(false);
         setEditingId(null);
         setCurrent({});
         fetchAll();
         toast.success('Campanha salva com sucesso!');
      } catch (e) {
         toast.error('Erro ao salvar campanha.');
      handleFirestoreError(e, OperationType.WRITE, null);
      }
   }

   const handleDelete = async (id: string) => {
      const isConfirmed = await confirm({
         title: 'Excluir Campanha',
         description: 'Deseja realmente excluir esta campanha?',
         type: 'danger',
         confirmText: 'Excluir'
      });
      if(isConfirmed) {
         await deleteDoc(doc(db, 'campaigns', id));
         toast.success('Campanha excluída.');
         fetchAll();
      }
   }

   const handleGenerateAI = async () => {
      if(!current.description) {
          toast.error("Preencha a descrição da campanha primeiro para a IA usar como base.");
          return;
      }
      setIsGenerating(true);
      try {
         const prompt = `Crie uma página de mobilização para a seguinte campanha: ${current.title}. Descrição: ${current.description}. Como ajudar: ${current.howToHelp}. Necessidades: ${current.needs || ''}. Inclua áreas de doação e galerias.`;
         const config = await generatePageFromDescription(prompt);
         if(config) {
             setCurrent({...current, pageConfig: config});
             toast.success('Layout da página gerado com sucesso!');
         } else {
             toast.error('Não foi possível gerar a página.');
         }
      } catch(e) {
         toast.error("Erro ao gerar página com IA");
      handleFirestoreError(e, OperationType.WRITE, null);
      } finally {
         setIsGenerating(false);
      }
   }

   return (
      <div className="space-y-6">
         <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-zinc-100">
            <div>
               <h2 className="text-xl font-black text-zinc-900">Campanhas e Doações</h2>
               <p className="text-sm text-zinc-500">Gerencie causas de caridade, socorro e doações.</p>
            </div>
            <button onClick={() => { setCurrent({}); setIsAdding(true); setEditingId(null); }} className="bg-primary text-white font-bold px-4 py-2 rounded-xl flex items-center gap-2">
               <Plus className="w-4 h-4" /> Nova Campanha
            </button>
         </div>

         {(isAdding || editingId) && (
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-100 space-y-4">
               <h3 className="font-bold text-zinc-800">{editingId ? 'Editar Campanha' : 'Criar Nova Campanha'}</h3>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <input type="text" placeholder="Título" value={current.title || ''} onChange={e => setCurrent({...current, title: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 px-4 py-3 rounded-xl outline-none" />
                    <textarea rows={4} placeholder="Descrição Completa" value={current.description || ''} onChange={e => setCurrent({...current, description: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 px-4 py-3 rounded-xl outline-none" />
                    <input type="text" placeholder="Tag (ex: SOS RS, Fome Não)" value={current.tag || ''} onChange={e => setCurrent({...current, tag: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 px-4 py-3 rounded-xl outline-none" />
                    <ImageUploader value={current.imageUrl || null} onChange={v => setCurrent({...current, imageUrl: v})} label="Imagem de Fundo" />
                  </div>
                  
                  <div className="space-y-4">
                    <input type="text" placeholder="Local/Ponto de Coleta" value={current.location || ''} onChange={e => setCurrent({...current, location: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 px-4 py-3 rounded-xl outline-none" />
                    <textarea rows={2} placeholder="Como ajudar? (Texto explicativo)" value={current.howToHelp || ''} onChange={e => setCurrent({...current, howToHelp: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 px-4 py-3 rounded-xl outline-none" />
                    <input type="text" placeholder="Itens necessários (separados por vírgula)" value={Array.isArray(current.needs) ? current.needs.join(', ') : (current.needs || '')} onChange={e => setCurrent({...current, needs: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 px-4 py-3 rounded-xl outline-none" />

                    <div className="grid grid-cols-2 gap-2">
                       <input type="number" placeholder="Meta R$ (0 para s/ meta)" value={current.goal || ''} onChange={e => setCurrent({...current, goal: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 px-4 py-3 rounded-xl outline-none" />
                       <input type="number" placeholder="Arrecadado R$ (0)" value={current.raised || ''} onChange={e => setCurrent({...current, raised: e.target.value})} className="w-full bg-emerald-50 text-emerald-900 font-bold border border-emerald-200 px-4 py-3 rounded-xl outline-none" />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                       <input type="text" placeholder="Chave PIX" value={current.pixKey || ''} onChange={e => setCurrent({...current, pixKey: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 px-4 py-3 rounded-xl outline-none" />
                       <input type="text" placeholder="WhatsApp (somente números)" value={current.whatsapp || ''} onChange={e => setCurrent({...current, whatsapp: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 px-4 py-3 rounded-xl outline-none" />
                    </div>

                    <div className="flex gap-4">
                       <input type="text" placeholder="Texto Opcional Botão" value={current.actionText || ''} onChange={e => setCurrent({...current, actionText: e.target.value})} className="w-1/2 bg-zinc-50 border border-zinc-200 px-4 py-3 rounded-xl outline-none" />
                       <input type="text" placeholder="URL Botão (Vaquinha)" value={current.actionUrl || ''} onChange={e => setCurrent({...current, actionUrl: e.target.value})} className="w-1/2 bg-zinc-50 border border-zinc-200 px-4 py-3 rounded-xl outline-none" />
                    </div>
                  </div>
               </div>

               <div className="bg-zinc-100 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between mt-4">
                  <div className="mb-4 sm:mb-0">
                      <p className="font-bold text-zinc-800 text-sm">Página Inteligente da Campanha</p>
                      <p className="text-zinc-500 text-xs">Transforme esta campanha em uma landing page completa.</p>
                      {current.pageConfig && <span className="bg-emerald-100 text-emerald-700 text-[10px] uppercase font-black px-2 py-1 rounded inline-block mt-1">Configuração IA Gerada</span>}
                  </div>
                  <button onClick={handleGenerateAI} disabled={isGenerating} className="bg-black hover:bg-zinc-800 text-white font-bold px-4 py-2 rounded-xl text-sm flex items-center gap-2">
                      {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Gerar com IA
                  </button>
               </div>

               <label className="flex items-center gap-2 cursor-pointer pt-2">
                  <input type="checkbox" checked={current.active ?? true} onChange={e => setCurrent({...current, active: e.target.checked})} className="w-5 h-5 accent-primary" />
                  <span className="font-bold text-zinc-700">Campanha Ativa</span>
               </label>
               <div className="flex gap-2 pt-2 text-sm">
                  <button onClick={handleSave} className="bg-emerald-600 text-white font-bold px-6 py-2 rounded-xl hover:bg-emerald-700 transition">Salvar Campanha</button>
                  <button onClick={() => { setIsAdding(false); setEditingId(null); }} className="bg-zinc-200 text-zinc-700 font-bold px-6 py-2 rounded-xl hover:bg-zinc-300">Cancelar</button>
               </div>
            </div>
         )}

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map(camp => (
               <div key={camp.id} className={`bg-white rounded-3xl p-5 border shadow-sm ${camp.active ? 'border-zinc-200' : 'border-rose-200 opacity-60'}`}>
                  {camp.imageUrl && <img src={camp.imageUrl} alt="" className="w-full h-32 object-cover rounded-xl mb-4 bg-zinc-100" />}
                  <div className="flex justify-between items-start mb-1">
                      <h3 className="font-bold text-zinc-900 line-clamp-1">{camp.title}</h3>
                      {camp.pageConfig && <Sparkles className="w-4 h-4 text-primary shrink-0" />}
                  </div>
                  <p className="text-zinc-500 text-xs mb-4 line-clamp-2">{camp.description}</p>
                  <div className="flex justify-between items-center border-t border-zinc-100 pt-3">
                     <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md ${camp.active ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {camp.active ? 'Ativa' : 'Inativa'}
                     </span>
                     <div className="flex gap-2">
                        <button onClick={() => { setEditingId(camp.id); setCurrent({ ...camp, needs: camp.needs?.join(', ') || '' }); setIsAdding(false); }} className="w-8 h-8 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-600 hover:bg-primary hover:text-white"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(camp.id)} className="w-8 h-8 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-600 hover:bg-rose-500 hover:text-white"><Trash2 className="w-4 h-4" /></button>
                     </div>
                  </div>
               </div>
            ))}
         </div>
      </div>
   );
}
