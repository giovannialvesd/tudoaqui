import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Car, MapPin, LayoutDashboard, Settings, History, ToggleLeft, ToggleRight } from 'lucide-react';
import { collection, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import DashboardLayout from '../layouts/DashboardLayout';
import ImageUploader from '../components/ImageUploader';
import { toast } from 'sonner';

export default function DriverDashboard() {
  const { userProfile, currentUser, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Admin View Logic
  const queryParams = new URLSearchParams(location.search);
  const adminViewId = queryParams.get('admin_view');
  const isCityAdmin = ['city_admin', 'city_editor', 'city_support'].includes(userProfile?.role || '');
  const isGlobalAdmin = userProfile?.role === 'admin' || userProfile?.role === 'super_admin';
  const isAdmin = isGlobalAdmin || isCityAdmin;
  const effectiveUserId = (isAdmin && adminViewId) ? adminViewId : currentUser?.uid;
  
  const [activeTab, setActiveTab] = useState('Visão Geral');
  const [profile, setProfile] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (effectiveUserId) {
      fetchData();
    }
  }, [effectiveUserId]);

  const fetchData = async () => {
    if (!effectiveUserId) return;
    try {
      // Profile
      const profSnap = await getDoc(doc(db, 'driver_profiles', effectiveUserId));
      if (profSnap.exists()) {
          setProfile(profSnap.data());
      } else {
          setProfile({ isOnline: false });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!effectiveUserId) return;
    setSaving(true);
    try {
      await setDoc(doc(db, 'driver_profiles', effectiveUserId), {
        ...profile,
        updatedAt: serverTimestamp()
      }, { merge: true });
      toast.success('Perfil atualizado com sucesso!');
    } catch(e) {
      console.error(e);
      toast.error('Erro ao atualizar perfil.');
    } finally {
      setSaving(false);
    }
  };

  const toggleOnline = async () => {
    if(!effectiveUserId || !profile) return;
    try {
      const newState = !profile.isOnline;
      await setDoc(doc(db, 'driver_profiles', effectiveUserId), { isOnline: newState, updatedAt: serverTimestamp() }, { merge: true });
      setProfile({...profile, isOnline: newState});
    } catch(e) {}
  };

  if (loading) return null;
  if (!userProfile || (userProfile.role !== 'driver' && !isAdmin)) return <Navigate to="/" replace />;
  
  const sidebarItems = [
    { id: 'Visão Geral', label: 'Visão Geral', icon: LayoutDashboard },
    { id: 'Histórico', label: 'Histórico', icon: History },
    { id: 'Dados do Veículo', label: 'Dados do Veículo', icon: Car },
    { id: 'Ajustes', label: 'Ajustes', icon: Settings },
  ];

  return (
     <DashboardLayout
        title={activeTab}
        subtitle="Painel Exclusivo para Motoristas"
        sidebarItems={sidebarItems}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
     >
         <div className="flex-1 space-y-6">
            
            {activeTab === 'Visão Geral' && (
              <>
                {/* Status Toggle */}
                <div className={`rounded-3xl p-6 md:p-10 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 transition-colors ${profile?.isOnline ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' : 'bg-gradient-to-br from-zinc-700 to-zinc-900'}`}>
                  <div>
                    <h3 className="font-black text-3xl mb-2">{profile?.isOnline ? 'Status: Online' : 'Você está Offline'}</h3>
                    <p className={`font-medium ${profile?.isOnline ? 'text-emerald-100' : 'text-zinc-300'}`}>
                      {profile?.isOnline ? 'Seu radar está ligado. Aguardando chamados de passageiros nas proximidades.' : 'Ligue o radar para começar a receber solicitações de corrida na sua região.'}
                    </p>
                  </div>
                  <div 
                    onClick={toggleOnline}
                    className="flex items-center gap-3 cursor-pointer bg-black/20 hover:bg-black/30 transition-colors px-6 py-4 rounded-2xl shrink-0"
                  >
                     <span className="font-bold">{profile?.isOnline ? 'Ficar Offline' : 'Ligar Radar'}</span>
                     {profile?.isOnline ? <ToggleRight className="w-8 h-8 text-emerald-300" /> : <ToggleLeft className="w-8 h-8 opacity-50" />}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-100 flex items-center justify-between">
                    <div>
                        <span className="text-zinc-500 text-sm font-bold uppercase tracking-wider">Corridas (Hoje)</span>
                        <p className="text-4xl font-black text-zinc-900 mt-2">0</p>
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-100 flex items-center justify-between">
                    <div>
                        <span className="text-zinc-500 text-sm font-bold uppercase tracking-wider">Ganhos (Simulado)</span>
                        <p className="text-4xl font-black text-green-600 mt-2">R$ 0,00</p>
                    </div>
                  </div>
                </div>

                {profile?.isOnline && (
                   <div className="bg-white border-2 border-emerald-100 rounded-3xl p-8 shadow-sm flex flex-col items-center justify-center text-center py-16">
                      <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6 relative">
                         <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-20"></div>
                         <MapPin className="w-10 h-10 text-emerald-500 relative z-10" />
                      </div>
                      <h3 className="font-black text-2xl text-zinc-900 mb-2">Procurando passageiros...</h3>
                      <p className="text-base text-zinc-500 max-w-sm">Mantenha o aplicativo aberto em segundo plano para ser notificado imediatamente de novas corridas.</p>
                   </div>
                )}
              </>
            )}

            {activeTab === 'Histórico' && (
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-zinc-100 text-center py-20">
                 <History className="w-16 h-16 text-zinc-200 mx-auto mb-6" />
                 <h3 className="font-bold text-xl text-zinc-800">Nenhuma corrida recente</h3>
                 <p className="text-zinc-500 text-base mt-2">Assim que você completar sua primeira corrida, ela aparecerá aqui no seu histórico.</p>
              </div>
            )}

            {activeTab === 'Dados do Veículo' && profile && (
               <form onSubmit={handleProfileSave} className="bg-white rounded-3xl p-8 shadow-sm border border-zinc-100 space-y-6">
                 <h2 className="font-black text-2xl text-zinc-900 border-b border-zinc-100 pb-4">Informações do Veículo</h2>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div><label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-2">Marca/Modelo</label>
                    <input required type="text" placeholder="Ex: Chevrolet Onix" value={profile.vehicleModel || ''} onChange={e => setProfile({...profile, vehicleModel: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 px-5 py-3.5 rounded-2xl outline-none focus:border-emerald-500 focus:bg-white font-medium text-zinc-900 transition-colors" /></div>
                    
                    <div><label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-2">Cor do Veículo</label>
                    <input type="text" placeholder="Prata" value={profile.color || ''} onChange={e => setProfile({...profile, color: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 px-5 py-3.5 rounded-2xl outline-none focus:border-emerald-500 focus:bg-white font-medium text-zinc-900 transition-colors" /></div>
                    
                    <div className="md:col-span-2"><label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-2">Placa de Identificação</label>
                    <input required type="text" placeholder="ABC-1234" value={profile.licensePlate || ''} onChange={e => setProfile({...profile, licensePlate: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 px-5 py-3.5 rounded-2xl outline-none focus:border-emerald-500 focus:bg-white font-black text-zinc-900 text-lg transition-colors uppercase" /></div>
                 </div>

                 <div className="py-4 border border-zinc-200 bg-zinc-50/50 p-6 rounded-2xl">
                    <ImageUploader value={profile.imageUrl || null} onChange={val => setProfile({...profile, imageUrl: val || ''})} label="Foto do Veículo (Evita cancelamentos)" />
                 </div>

                 <div className="pt-6 border-t border-zinc-100">
                    <button disabled={saving} type="submit" className="w-full md:w-auto bg-emerald-600 text-white font-bold px-10 py-4 rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 shadow-lg shadow-emerald-500/20">
                       {saving ? 'Guardando...' : 'Salvar Detalhes do Veículo'}
                    </button>
                 </div>
               </form>
            )}

            {activeTab === 'Ajustes' && profile && (
               <form onSubmit={handleProfileSave} className="bg-white rounded-3xl p-8 shadow-sm border border-zinc-100 space-y-6">
                 <h2 className="font-black text-2xl text-zinc-900 border-b border-zinc-100 pb-4">Configurações Pessoais</h2>
                 
                 <div className="space-y-6">
                    <div>
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-2">Sua Chave Pix (Para repasses)</label>
                      <input type="text" placeholder="CPF, Email, Telefone..." value={profile.pixKey || ''} onChange={e => setProfile({...profile, pixKey: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 px-5 py-3.5 rounded-2xl outline-none focus:border-emerald-500 focus:bg-white font-medium transition-colors" />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-2">Telefone com WhatsApp</label>
                      <input type="text" placeholder="(00) 00000-0000" value={profile.phone || ''} onChange={e => setProfile({...profile, phone: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 px-5 py-3.5 rounded-2xl outline-none focus:border-emerald-500 focus:bg-white font-medium transition-colors" />
                    </div>
                 </div>

                 <div className="pt-6 border-t border-zinc-100">
                    <button disabled={saving} type="submit" className="w-full md:w-auto bg-zinc-900 text-white font-bold px-10 py-4 rounded-xl hover:bg-black transition-colors disabled:opacity-50">
                       {saving ? 'Salvando...' : 'Atualizar Dados Conta'}
                    </button>
                 </div>
               </form>
            )}
         </div>
     </DashboardLayout>
  );
}
