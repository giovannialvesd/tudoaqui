import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, updateDoc, deleteDoc, setDoc, orderBy, serverTimestamp, onSnapshot, where } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { toast } from 'sonner';
import { useConfirm } from '../../hooks/useConfirm';
import { Check, X, Layers, Clock } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../../firebase/errors';

export default function AdminCategoryRequests({ cityId }: { cityId?: string }) {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { confirm } = useConfirm();

  useEffect(() => {
    const constraints: any[] = [];
    if (cityId) {
      constraints.push(where('cityId', '==', cityId));
    }
    const q = query(collection(db, 'category_requests'), ...constraints, orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      setRequests(snapshot.docs.map(d => ({id: d.id, ...d.data()})));
      setLoading(false);
    }, (error) => {
      toast.error('Erro ao carregar solicitações.');
      handleFirestoreError(error, OperationType.GET, 'category_requests');
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const fetchRequests = async () => {};

  const handleApprove = async (req: any) => {
    try {
      // Create new category
      const catId = `cat_${Date.now()}`;
      await setDoc(doc(db, 'categories', catId), {
         name: req.suggestedName,
         type: req.type,
         active: true,
         createdAt: serverTimestamp()
      });
      // Mark as approved
      await updateDoc(doc(db, 'category_requests', req.id), { status: 'approved' });
      toast.success(`Categoria "${req.suggestedName}" criada e aprovada!`);
      fetchRequests();
    } catch(e) {
      toast.error('Erro ao aprovar.');
    }
  };

  const handleReject = async (reqId: string) => {
    const isConfirmed = await confirm({
       title: 'Rejeitar Solicitação',
       description: 'Tem certeza que deseja recusar esta categoria?',
       type: 'danger',
       confirmText: 'Sim, recusar'
    });
    if (isConfirmed) {
      try {
        await updateDoc(doc(db, 'category_requests', reqId), { status: 'rejected' });
        toast.success('Solicitação recusada.');
        fetchRequests();
      } catch(e) {
        toast.error('Erro ao recusar.');
      }
    }
  };

  if (loading) return <div className="p-8 text-center text-zinc-500">Carregando solicitações...</div>;

  return (
    <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-zinc-100 h-full flex flex-col">
       <div className="flex justify-between items-center mb-8 border-b border-zinc-100 pb-5">
         <div>
            <h2 className="text-2xl font-black text-zinc-900 tracking-tight">Sugestões de Categoria</h2>
            <p className="text-zinc-500 font-medium">Avalie as categorias pedidas pelos trabalhadores e comerciantes.</p>
         </div>
       </div>

       {requests.length === 0 ? (
          <div className="text-center py-20 bg-zinc-50 rounded-3xl border border-zinc-100">
             <Layers className="w-16 h-16 text-zinc-300 mx-auto mb-4" />
             <h3 className="text-xl font-bold text-zinc-800">Sem solicitações no momento</h3>
          </div>
       ) : (
          <div className="flex flex-col gap-4">
             {requests.map(req => (
               <div key={req.id} className="flex flex-col md:flex-row md:items-center justify-between p-5 rounded-2xl border border-zinc-200 bg-zinc-50/50 hover:bg-white hover:border-blue-200 transition-colors gap-4">
                  <div>
                     <div className="flex items-center gap-3 mb-1">
                        <span className="font-bold text-zinc-900 text-lg">{req.suggestedName}</span>
                        <span className="text-[10px] uppercase tracking-wider font-bold bg-zinc-200 text-zinc-700 px-2 py-0.5 rounded-full">
                           {req.type === 'merchant' ? 'LOJA' : 'SERVIÇO'}
                        </span>
                     </div>
                     <p className="text-sm text-zinc-500 font-medium">Solicitado por: <span className="text-zinc-800">{req.userName}</span></p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                     {req.status === 'pending' ? (
                       <>
                         <button onClick={() => handleApprove(req)} className="bg-emerald-100 text-emerald-700 hover:bg-emerald-500 hover:text-white px-4 py-2.5 flex items-center justify-center gap-2 rounded-xl font-bold transition-colors">
                            <Check className="w-5 h-5" /> Aprovar e Criar
                         </button>
                         <button onClick={() => handleReject(req.id)} className="bg-rose-100 text-rose-700 hover:bg-rose-500 hover:text-white px-4 py-2.5 flex items-center justify-center gap-2 rounded-xl font-bold transition-colors">
                            <X className="w-5 h-5" /> Recusar
                         </button>
                       </>
                     ) : req.status === 'approved' ? (
                        <span className="flex items-center gap-2 text-emerald-600 font-bold bg-emerald-50 px-4 py-2 rounded-xl"><Check className="w-5 h-5" /> Aprovada</span>
                     ) : (
                        <span className="flex items-center gap-2 text-rose-600 font-bold bg-rose-50 px-4 py-2 rounded-xl"><X className="w-5 h-5" /> Recusada</span>
                     )}
                  </div>
               </div>
             ))}
          </div>
       )}
    </div>
  )
}
