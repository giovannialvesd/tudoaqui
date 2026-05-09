import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs, doc, updateDoc, deleteDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { ShieldAlert, Trash2, MessageSquare, Send, ExternalLink, Clock, User, Phone, CheckCircle2 } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../../firebase/errors';

export default function AdminAnimalReports({ cityId: overrideCityId }: { cityId?: string }) {
  const { userProfile } = useAuth();
  const isSuperAdmin = userProfile?.role === 'super_admin' || userProfile?.role === 'admin';
  const cityId = overrideCityId || userProfile?.cityId;

  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const constraints: any[] = [];
    if (cityId) {
      constraints.push(where('cityId', '==', cityId));
    }
    const q = query(collection(db, 'animal_reports'), ...constraints, orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      setReports(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (error) => {
      toast.error('Erro ao carregar denúncias.');
      handleFirestoreError(error, OperationType.GET, 'animal_reports');
      setLoading(false);
    });
    return () => unsub();
  }, [isSuperAdmin, cityId]);

  const fetchReports = async () => {};

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await updateDoc(doc(db, 'animal_reports', id), {
        status,
        updatedAt: serverTimestamp()
      });
      toast.success('Status atualizado!');
      fetchReports();
    } catch (e) {
      toast.error('Erro ao atualizar status.');
      handleFirestoreError(e, OperationType.WRITE, null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta denúncia?')) return;
    try {
      await deleteDoc(doc(db, 'animal_reports', id));
      toast.success('Denúncia excluída.');
      fetchReports();
    } catch (e) {
      toast.error('Erro ao excluir.');
      handleFirestoreError(e, OperationType.WRITE, null);
    }
  };

  const forwardToWhatsApp = (report: any) => {
    const text = `*DENÚNCIA DE MAUS-TRATOS - TUDOAQUI*\n\n` +
                 `*Relato:* ${report.content}\n\n` +
                 `*Denunciante:* ${report.userName || 'Anônimo'}\n` +
                 `*Data:* ${report.createdAt?.toDate ? report.createdAt.toDate().toLocaleString() : 'N/A'}`;
    
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-zinc-100">
        <div className="w-12 h-12 border-4 border-zinc-100 border-t-rose-500 rounded-full animate-spin mb-4" />
        <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Carregando Denúncias...</p>
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-zinc-200">
        <ShieldAlert className="w-16 h-16 text-zinc-200 mx-auto mb-4" />
        <h3 className="font-bold text-zinc-800 text-lg">Nenhuma denúncia no momento</h3>
        <p className="text-zinc-500 max-w-xs mx-auto mt-2 font-medium">Tudo parece estar em ordem com os animais da cidade.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6">
        {reports.map((report) => (
          <div key={report.id} className={`bg-white rounded-3xl border ${report.status === 'resolved' ? 'border-emerald-100 bg-emerald-50/10' : 'border-zinc-100'} p-6 shadow-sm hover:shadow-md transition-all group`}>
            <div className="flex flex-col md:flex-row justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    report.status === 'pending' ? 'bg-rose-100 text-rose-600' : 
                    report.status === 'investigating' ? 'bg-amber-100 text-amber-600' :
                    'bg-emerald-100 text-emerald-600'
                  }`}>
                    {report.status === 'pending' ? 'Pendente' : 
                     report.status === 'investigating' ? 'Em Investigação' : 
                     'Resolvido'}
                  </span>
                  <div className="flex items-center gap-1.5 text-zinc-400 text-xs font-bold">
                    <Clock className="w-3.5 h-3.5" />
                    {report.createdAt?.toDate ? report.createdAt.toDate().toLocaleString('pt-BR') : 'Data Indisponível'}
                  </div>
                </div>

                <div className="bg-zinc-50 p-5 rounded-2xl border border-zinc-100 mb-6">
                  <div className="flex gap-3">
                     <MessageSquare className="w-5 h-5 text-zinc-400 shrink-0 mt-1" />
                     <p className="text-zinc-800 font-medium leading-relaxed italic">"{report.content}"</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-6">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-zinc-100 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-zinc-500" />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Denunciante</div>
                      <div className="text-sm font-bold text-zinc-700">{report.userName || 'Anônimo'}</div>
                    </div>
                  </div>
                  {report.userPhone && (
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-emerald-50 rounded-full flex items-center justify-center">
                        <Phone className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">WhatsApp</div>
                        <a href={`https://wa.me/55${report.userPhone.replace(/\D/g, '')}`} target="_blank" className="text-sm font-bold text-emerald-600 hover:underline">
                          {report.userPhone}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>

                <div className="flex flex-row md:flex-col gap-2 shrink-0 md:border-l md:border-zinc-100 md:pl-6 justify-end">
                   <button 
                      onClick={() => {
                        const text = `*DENÚNCIA DE MAUS-TRATOS - TUDOAQUI*\n\n` +
                                    `*Relato:* ${report.content}\n\n` +
                                    `*Denunciante:* ${report.userName || 'Anônimo'}\n` +
                                    `*Data:* ${report.createdAt?.toDate ? report.createdAt.toDate().toLocaleString() : 'N/A'}`;
                        navigator.clipboard.writeText(text);
                        toast.success('Copiado para a área de transferência!');
                      }}
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-zinc-100 text-zinc-600 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider hover:bg-zinc-200 transition-colors"
                   >
                     Copiar Texto
                   </button>
                <button 
                  onClick={() => forwardToWhatsApp(report)}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-600 text-white px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-100"
                >
                  <Send className="w-4 h-4" /> Encaminhar Zap
                </button>
                <div className="flex gap-2">
                  {report.status !== 'resolved' ? (
                     <button 
                        onClick={() => handleStatusUpdate(report.id, 'resolved')}
                        className="w-12 h-12 flex items-center justify-center bg-white border border-zinc-200 text-zinc-400 hover:text-emerald-500 hover:bg-emerald-50 hover:border-emerald-200 rounded-2xl transition-all"
                        title="Marcar como Resolvido"
                     >
                        <CheckCircle2 className="w-6 h-6" />
                     </button>
                  ) : (
                     <button 
                        onClick={() => handleStatusUpdate(report.id, 'pending')}
                        className="w-12 h-12 flex items-center justify-center bg-white border border-zinc-200 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 hover:border-rose-200 rounded-2xl transition-all"
                        title="Reabrir Denúncia"
                     >
                        <Clock className="w-6 h-6" />
                     </button>
                  )}
                  <button 
                    onClick={() => handleDelete(report.id)}
                    className="w-12 h-12 flex items-center justify-center bg-white border border-zinc-200 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 rounded-2xl transition-all"
                    title="Excluir Denúncia"
                  >
                    <Trash2 className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
