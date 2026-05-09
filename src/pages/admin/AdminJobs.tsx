import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc, addDoc, serverTimestamp, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { useConfirm } from '../../hooks/useConfirm';
import { Check, X, Trash2, Briefcase, Plus, Building2, MapPin } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../../firebase/errors';

export default function AdminJobs({ cityId: overrideCityId }: { cityId?: string }) {
  const { userProfile } = useAuth();
  const isSuperAdmin = userProfile?.role === 'super_admin' || userProfile?.role === 'admin';
  const cityId = overrideCityId || userProfile?.cityId;

  const [jobs, setJobs] = useState<any[]>([]);
  const [merchants, setMerchants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newJob, setNewJob] = useState({ 
    title: '', 
    company: '', 
    merchantId: '', 
    location: '', 
    salary: '', 
    description: '', 
    requirements: '', 
    type: 'Efetivo',
    hours: ''
  });
  const { confirm } = useConfirm();

  useEffect(() => { 
    const isCityLimited = !isSuperAdmin || cityId;
    const cityToFilter = cityId;

    const buildQuery = (collName: string, additionalConstraints: any[] = []) => {
      const constraints = [...additionalConstraints];
      if (cityToFilter) {
        constraints.push(where('cityId', '==', cityToFilter));
      }
      return query(collection(db, collName), ...constraints);
    };

    const unsubJobs = onSnapshot(buildQuery('jobs', [orderBy('createdAt', 'desc')]), (snapshot) => {
       setJobs(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
       setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.GET, 'jobs'));

    const unsubMerchants = onSnapshot(buildQuery('business_profiles'), (snapshot) => {
       setMerchants(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => handleFirestoreError(err, OperationType.GET, 'business_profiles'));

    return () => {
       unsubJobs();
       unsubMerchants();
    }
  }, [isSuperAdmin, cityId]);

  const fetchMerchants = async () => {};

  const fetchJobs = async () => {};

  const handleAction = async (id: string, status: 'active' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'jobs', id), { status });
      toast.success(status === 'active' ? 'Vaga aprovada!' : 'Vaga rejeitada.');
      fetchJobs();
    } catch (e) {
      toast.error('Erro ao processar.');
    }
  };

  const deleteJob = async (id: string) => {
    const isConfirmed = await confirm({
      title: 'Excluir Vaga',
      description: 'Tem certeza que deseja excluir esta vaga permanentemente?',
      type: 'danger',
      confirmText: 'Sim, excluir'
    });
    if (isConfirmed) {
      try {
        await deleteDoc(doc(db, 'jobs', id));
        toast.success('Vaga excluída com sucesso.');
        fetchJobs();
      } catch (e) {
        toast.error('Erro ao excluir vaga.');
      }
    }
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJob.title || (!newJob.merchantId && !newJob.company)) {
      toast.error('Preencha os dados obrigatórios.');
      return;
    }

    try {
      const selectedMerchant = merchants.find(m => m.id === newJob.merchantId);
      await addDoc(collection(db, 'jobs'), {
        ...newJob,
        status: 'active',
        cityId: cityId || (selectedMerchant?.cityId || ''),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        company: newJob.company || (selectedMerchant?.name || 'Empresa Local')
      });
      toast.success('Vaga criada com sucesso!');
      setIsAdding(false);
      setNewJob({ title: '', company: '', merchantId: '', location: '', salary: '', description: '', requirements: '', type: 'Efetivo', hours: '' });
      fetchJobs();
    } catch (e) {
      toast.error('Erro ao criar vaga.');
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-zinc-100 overflow-hidden mb-8">
      <div className="px-8 py-6 border-b border-zinc-100 flex justify-between items-center bg-white">
        <div>
          <h3 className="font-black text-xl text-zinc-900">Gestão de Vagas</h3>
          <p className="text-sm text-zinc-500">Aprove ou crie novas oportunidades de emprego.</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-primary text-white font-bold px-4 py-2 rounded-xl text-sm flex items-center gap-2"
        >
          {isAdding ? 'Cancelar' : <><Plus className="w-4 h-4" /> Nova Vaga</>}
        </button>
      </div>

      <div className="p-8">
        {isAdding && (
          <form onSubmit={handleCreateJob} className="bg-zinc-50 p-6 rounded-2xl border border-zinc-200 mb-8 space-y-4 animate-in fade-in slide-in-from-top-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase block mb-1">Título da Vaga</label>
                <input required type="text" value={newJob.title} onChange={e => setNewJob({...newJob, title: e.target.value})} className="w-full px-4 py-2 border rounded-xl outline-none focus:border-primary" placeholder="Ex: Vendedor" />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase block mb-1">Empresa Destino</label>
                <select value={newJob.merchantId} onChange={e => setNewJob({...newJob, merchantId: e.target.value})} className="w-full px-4 py-2 border rounded-xl outline-none focus:border-primary">
                  <option value="">Outra Empresa (Manualmente)</option>
                  {merchants.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
            </div>

            {!newJob.merchantId && (
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase block mb-1">Nome da Empresa</label>
                <input required type="text" value={newJob.company} onChange={e => setNewJob({...newJob, company: e.target.value})} className="w-full px-4 py-2 border rounded-xl outline-none focus:border-primary" placeholder="Nome da empresa parceira" />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <div>
                <label className="text-xs font-bold text-zinc-500 uppercase block mb-1">Localização</label>
                <input type="text" value={newJob.location} onChange={e => setNewJob({...newJob, location: e.target.value})} className="w-full px-4 py-2 border rounded-xl outline-none focus:border-primary" placeholder="Ex: Centro, Bagé" />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase block mb-1">Horário / Turno</label>
                <input type="text" value={newJob.hours} onChange={e => setNewJob({...newJob, hours: e.target.value})} className="w-full px-4 py-2 border rounded-xl outline-none focus:border-primary" placeholder="Ex: 08h às 18h" />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase block mb-1">Salário (Opcional)</label>
                <input type="text" value={newJob.salary} onChange={e => setNewJob({...newJob, salary: e.target.value})} className="w-full px-4 py-2 border rounded-xl outline-none focus:border-primary" placeholder="Ex: R$ 1.500" />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase block mb-1">Descrição</label>
              <textarea value={newJob.description} onChange={e => setNewJob({...newJob, description: e.target.value})} className="w-full px-4 py-2 border rounded-xl resize-none outline-none focus:border-primary" rows={3}></textarea>
            </div>

            <div className="flex justify-end">
              <button type="submit" className="bg-primary text-white font-bold px-8 py-2 rounded-xl">Criar Vaga</button>
            </div>
          </form>
        )}

        <div className="overflow-x-auto -mx-8 sm:mx-0">
          <table className="w-full text-left text-sm text-zinc-600">
            <thead className="bg-zinc-50/50 text-xs uppercase font-bold tracking-wider text-zinc-500 border-b border-zinc-100">
              <tr>
                <th className="px-8 py-4">Vaga</th>
                <th className="px-8 py-4">Empresa</th>
                <th className="px-8 py-4">Status</th>
                <th className="px-8 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {jobs.map(job => (
                <tr key={job.id} className="hover:bg-zinc-50/50 transition-colors">
                  <td className="px-8 py-4">
                    <p className="font-bold text-zinc-900 text-base mb-1">{job.title}</p>
                    <p className="text-xs text-zinc-500">{job.type} • {job.hours}</p>
                  </td>
                  <td className="px-8 py-4">
                    <p className="font-semibold text-zinc-700 flex items-center gap-1.5 capitalize">
                       <Building2 className="w-3.5 h-3.5 text-zinc-400" />
                       {job.company}
                    </p>
                    <p className="text-xs text-zinc-400 flex items-center gap-1 mt-0.5">
                       <MapPin className="w-3 h-3" /> {job.location || 'Não informado'}
                    </p>
                  </td>
                  <td className="px-8 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      job.status === 'active' ? 'bg-emerald-50 text-emerald-600' :
                      job.status === 'pending' ? 'bg-amber-50 text-amber-600' :
                      'bg-rose-50 text-rose-600'
                    }`}>
                      {job.status === 'active' ? 'Ativa' : job.status === 'pending' ? 'Pendente' : 'Inativa'}
                    </span>
                  </td>
                  <td className="px-8 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {job.status === 'pending' && (
                        <>
                          <button onClick={() => handleAction(job.id, 'active')} className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100" title="Aprovar"><Check className="w-4 h-4" /></button>
                          <button onClick={() => handleAction(job.id, 'rejected')} className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100" title="Rejeitar"><X className="w-4 h-4" /></button>
                        </>
                      )}
                      <button onClick={() => deleteJob(job.id)} className="p-2 text-zinc-400 hover:text-rose-500 rounded-lg hover:bg-zinc-50" title="Excluir"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {jobs.length === 0 && (
                <tr><td colSpan={4} className="px-8 py-12 text-center text-zinc-500 font-medium italic">Nenhuma vaga cadastrada.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
