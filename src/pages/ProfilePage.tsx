import React, { useState, useEffect } from 'react';
import { useAuth, UserRole } from '../contexts/AuthContext';
import { LogOut, User, Store, Car, Wrench, ChevronRight, Settings, HelpCircle, FileText, Pickaxe, CheckCircle, Info, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { Heart } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { toast } from 'sonner';
import { useCity } from '../contexts/CityContext';
import { MapPin } from 'lucide-react';

import ImageUploader from '../components/ImageUploader';

export default function ProfilePage() {
  const { userProfile, currentUser, logout, requestRoleUpgrade } = useAuth();
  const { cities } = useCity();
  const navigate = useNavigate();
  const [pendingRole, setPendingRole] = useState<string | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [formData, setFormData] = useState<any>({ name: '', phone: '', category: '', imageBase64: null });

  useEffect(() => {
    if (currentUser) {
       getDoc(doc(db, 'role_requests', currentUser.uid))
         .then(d => {
            if(d.exists() && d.data().status === 'pending') {
               setPendingRole(d.data().requestedRole);
            }
         });
    }
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (e) {
      toast.error('Erro ao sair da conta.');
    }
  };

  const isCityAdmin = ['city_admin', 'city_editor', 'city_support'].includes(userProfile?.role || '');
  const isGlobalAdmin = userProfile?.role === 'admin' || userProfile?.role === 'super_admin';
  const isAdmin = isGlobalAdmin || isCityAdmin;

  const handleAccessDashboard = () => {
    if (isAdmin) navigate('/admin');
    else if (userProfile?.role === 'merchant') navigate('/comerciante/painel');
    else if (userProfile?.role === 'driver') navigate('/motorista/painel');
    else if (userProfile?.role === 'provider') navigate('/prestador/painel');
    else toast.error('Painel não disponível para sua conta.');
  }

  const handleRoleSelect = (role: UserRole) => {
    if(role === 'client' || role === userProfile?.role) return;
    if(pendingRole) return;
    setSelectedRole(role);
    setShowRoleModal(true);
  }

  const handleSubmitRoleRequest = async () => {
     if(!selectedRole) return;
     if(!formData.name || !formData.phone) {
         toast.error("Por favor, preencha o Nome e WhatsApp obrigatoriamente.");
         return;
     }
     try {
       await requestRoleUpgrade(selectedRole, formData);
       setPendingRole(selectedRole);
       setShowRoleModal(false);
       setFormData({ name: '', phone: '', category: '' });
       toast.success("Solicitação enviada com sucesso!");
     } catch(e) {
       toast.error("Erro ao enviar solicitação.");
     }
  }

  const PROFILES = [
    { id: 'client', title: 'Cliente', icon: User, color: 'text-zinc-600 bg-zinc-100' },
    { id: 'merchant', title: 'Painel do Comerciante', icon: Store, color: 'text-green-600 bg-green-100' },
    { id: 'driver', title: 'Painel do Motorista', icon: Car, color: 'text-orange-600 bg-orange-100' },
    { id: 'provider', title: 'Painel do Prestador', icon: Wrench, color: 'text-blue-600 bg-blue-100' },
  ] as const;

  const currentProfileInfo = PROFILES.find(p => p.id === userProfile?.role) || PROFILES[0];
  
  const userCity = cities.find(c => c.id === userProfile?.cityId);

  return (
    <div className="min-h-screen bg-bg-base">
       {/* Header */}
       <div className="bg-white px-4 py-8 border-b border-zinc-100 flex items-center gap-4 sticky top-0 z-10">
         <button onClick={() => navigate('/')} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-zinc-100 mr-2 md:hidden">
            <ArrowLeft className="w-6 h-6 text-zinc-600" />
         </button>
         <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-2xl font-bold text-primary">{userProfile?.name?.charAt(0) || 'U'}</span>
         </div>
         <div>
           <div className="flex items-center gap-2 mb-1">
             <h1 className="text-xl font-bold text-zinc-800">{userProfile?.name}</h1>
             {userProfile?.role === 'client' ? (
               <div className="flex items-center gap-1 bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">
                 <Heart className="w-3 h-3" /> Verificado
               </div>
             ) : (
               <div className="flex items-center gap-1 bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">
                 <CheckCircle className="w-3 h-3" /> Confiável
               </div>
             )}
           </div>
           <div className="flex flex-col gap-1">
             <p className="text-sm text-zinc-500">{userProfile?.email}</p>
             {userCity && (
               <div className="flex items-center gap-1.5 text-zinc-600">
                 <MapPin className="w-3.5 h-3.5 text-primary" />
                 <span className="text-xs font-semibold">{userCity.name} - {userCity.state}</span>
               </div>
             )}
           </div>
         </div>
       </div>

       <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6">
         
         {/* Current Profile Actions */}
         <div className="bg-white rounded-2xl p-4 shadow-sm border border-zinc-100">
            <div className="flex items-center gap-3 mb-4">
               {isAdmin ? (
                 <div className="w-10 h-10 rounded-full flex items-center justify-center bg-black text-white">
                   <Settings className="w-5 h-5" />
                 </div>
               ) : (
                 <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", currentProfileInfo.color)}>
                   <currentProfileInfo.icon className="w-5 h-5" />
                 </div>
               )}
               <div>
                  <h2 className="font-bold text-zinc-800">Modo Ativo: {isGlobalAdmin ? 'Administrador Global' : isCityAdmin ? 'Painel da Cidade' : currentProfileInfo.title}</h2>
                  <p className="text-xs text-zinc-500">Mude seu perfil abaixo para acessar outras áreas.</p>
               </div>
            </div>

            {userProfile?.role !== 'client' && (
              <button 
                onClick={handleAccessDashboard}
                className="w-full py-3 bg-primary text-white rounded-xl font-bold text-sm"
              >
                Acessar {isAdmin ? 'Painel Administrativo' : 'Meu Painel'}
              </button>
            )}
         </div>

         {/* Switch Roles */}
         <section>
           <h3 className="font-bold text-zinc-500 uppercase text-xs tracking-wider mb-3 px-2">Trocar Perfil / Solicitar Nova Função</h3>
           
           {pendingRole && (
             <div className="bg-orange-50 border border-orange-200 text-orange-800 p-4 rounded-2xl mb-4 flex gap-3 text-sm">
                <Info className="w-5 h-5 shrink-0 text-orange-500" />
                <p>Sua solicitação para ser <b>{PROFILES.find(p=>p.id===pendingRole)?.title}</b> está em análise pelo administrador. Você será notificado em breve.</p>
             </div>
           )}

           <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden divide-y divide-zinc-100">
              {PROFILES.map(p => (
                <div 
                  key={p.id}
                  onClick={() => p.id !== 'client' && p.id !== userProfile?.role ? handleRoleSelect(p.id as UserRole) : null}
                  className={cn("flex items-center justify-between p-4 transition-colors", 
                     p.id !== 'client' && p.id !== userProfile?.role ? "cursor-pointer hover:bg-zinc-50" : "opacity-80")}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", p.color)}>
                      <p.icon className="w-5 h-5" />
                    </div>
                    <span className="font-medium text-zinc-800 pr-2">
                       {p.title}
                       {userProfile?.role === p.id && <span className="ml-2 bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">Ativo</span>}
                    </span>
                  </div>
                  {userProfile?.role === p.id ? (
                     <CheckCircle className="w-5 h-5 text-primary" />
                  ) : pendingRole === p.id ? (
                     <span className="text-xs font-bold text-orange-500 bg-orange-100 px-2 py-1 rounded-md">Pendente</span>
                  ) : p.id !== 'client' ? (
                     <ChevronRight className="w-5 h-5 text-zinc-400" />
                  ) : null}
                </div>
              ))}
              
              {isAdmin && (
                <div 
                  className="flex items-center justify-between p-4 cursor-pointer bg-zinc-50"
                  onClick={() => navigate('/admin')}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", isGlobalAdmin ? "bg-black text-white" : "bg-primary text-white")}>
                      <Settings className="w-5 h-5" />
                    </div>
                    <span className="font-medium text-zinc-800">{isGlobalAdmin ? 'Administrador Global' : 'Painel da Cidade'}</span>
                  </div>
                  <CheckCircle className="w-5 h-5 text-primary" />
                </div>
              )}
           </div>
         </section>

         {/* General Options */}
         <section>
           <h3 className="font-bold text-zinc-500 uppercase text-xs tracking-wider mb-3 px-2">Geral</h3>
           <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden divide-y divide-zinc-100">
              {[
                { icon: Heart, label: 'Meus Favoritos', color: 'text-rose-500' },
                { icon: Settings, label: 'Configurações', color: 'text-zinc-600' },
                { icon: HelpCircle, label: 'Central de Ajuda', color: 'text-zinc-600' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-4 cursor-pointer hover:bg-zinc-50">
                  <div className="flex items-center gap-3">
                    <item.icon className={cn("w-5 h-5", item.color)} />
                    <span className="font-medium text-zinc-800">{item.label}</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-zinc-400" />
                </div>
              ))}
           </div>
         </section>

         <button 
           onClick={handleLogout}
           className="w-full py-4 text-rose-500 font-bold flex items-center justify-center gap-2 bg-white rounded-2xl border border-rose-100 hover:bg-rose-50 transition-colors"
         >
           <LogOut className="w-5 h-5" /> Sair da conta
         </button>

       </div>

       {/* Role Request Modal */}
       {showRoleModal && selectedRole && (
         <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 w-full max-w-md">
               <h2 className="text-xl font-bold text-zinc-900 mb-2">Solicitar Perfil: {PROFILES.find(p=>p.id===selectedRole)?.title}</h2>
               <p className="text-sm text-zinc-500 mb-6">Preencha os dados abaixo para enviar sua solicitação de mudança de perfil para análise.</p>
               
               <div className="space-y-4 mb-6 max-h-[60vh] overflow-y-auto px-1">
                 <div>
                   <label className="text-xs font-bold text-zinc-500 uppercase">Nome Completo / Razão Social</label>
                   <input 
                     type="text" 
                     className="w-full bg-zinc-100 border border-transparent focus:border-primary/50 focus:bg-white rounded-xl py-3 px-4 mt-1 outline-none" 
                     value={formData.name}
                     onChange={e => setFormData({...formData, name: e.target.value})}
                   />
                 </div>
                 
                 <div>
                   <label className="text-xs font-bold text-zinc-500 uppercase">WhatsApp (Obrigatorio)</label>
                   <input 
                     type="text" 
                     required
                     className="w-full bg-zinc-100 border border-transparent focus:border-primary/50 focus:bg-white rounded-xl py-3 px-4 mt-1 outline-none" 
                     value={formData.phone}
                     onChange={e => setFormData({...formData, phone: e.target.value})}
                   />
                 </div>

                 {selectedRole !== 'client' && (
                     <div className="py-2">
                       <ImageUploader 
                         value={formData.imageBase64} 
                         onChange={(val) => setFormData({...formData, imageBase64: val})} 
                         label="Foto de Perfil / Estabelecimento / Veículo"
                         recommendedText="Tamanho ideal: 800x800px (Quadrado)"
                       />
                     </div>
                 )}

                 {selectedRole === 'merchant' && (
                   <>
                     <div>
                       <label className="text-xs font-bold text-zinc-500 uppercase">Categoria Principal</label>
                       <input 
                         type="text" 
                         placeholder="Ex: Restaurante, Mercado, etc"
                         className="w-full bg-zinc-100 border border-transparent focus:border-primary/50 focus:bg-white rounded-xl py-3 px-4 mt-1 outline-none" 
                         value={formData.category}
                         onChange={e => setFormData({...formData, category: e.target.value})}
                       />
                     </div>
                     <div>
                       <label className="text-xs font-bold text-zinc-500 uppercase">Endereço Completo</label>
                       <input 
                         type="text"
                         className="w-full bg-zinc-100 border border-transparent focus:border-primary/50 focus:bg-white rounded-xl py-3 px-4 mt-1 outline-none" 
                         onChange={e => setFormData({...formData, address: e.target.value})}
                       />
                     </div>
                     <div>
                       <label className="text-xs font-bold text-zinc-500 uppercase">Horário de Funcionamento</label>
                       <input 
                         type="text"
                         placeholder="Ex: Segunda à Sexta, 08h às 18h"
                         className="w-full bg-zinc-100 border border-transparent focus:border-primary/50 focus:bg-white rounded-xl py-3 px-4 mt-1 outline-none" 
                         onChange={e => setFormData({...formData, hours: e.target.value})}
                       />
                     </div>
                   </>
                 )}

                 {selectedRole === 'driver' && (
                   <>
                     <div>
                       <label className="text-xs font-bold text-zinc-500 uppercase">Veículo e Marca/Modelo</label>
                       <input 
                         type="text" 
                         placeholder="Ex: Fiat Uno 2015"
                         className="w-full bg-zinc-100 border border-transparent focus:border-primary/50 focus:bg-white rounded-xl py-3 px-4 mt-1 outline-none" 
                         onChange={e => setFormData({...formData, vehicle: e.target.value})}
                       />
                     </div>
                     <div>
                       <label className="text-xs font-bold text-zinc-500 uppercase">Preço Base Ex: (R$ / km)</label>
                       <input 
                         type="text" 
                         className="w-full bg-zinc-100 border border-transparent focus:border-primary/50 focus:bg-white rounded-xl py-3 px-4 mt-1 outline-none" 
                         onChange={e => setFormData({...formData, basePrice: e.target.value})}
                       />
                     </div>
                     <div>
                       <label className="text-xs font-bold text-zinc-500 uppercase">Disponibilidade</label>
                       <input 
                         type="text" 
                         className="w-full bg-zinc-100 border border-transparent focus:border-primary/50 focus:bg-white rounded-xl py-3 px-4 mt-1 outline-none" 
                         onChange={e => setFormData({...formData, availability: e.target.value})}
                       />
                     </div>
                   </>
                 )}

                 {selectedRole === 'provider' && (
                   <>
                     <div>
                       <label className="text-xs font-bold text-zinc-500 uppercase">Tipo de Serviço</label>
                       <input 
                         type="text" 
                         placeholder="Ex: Encanador, Eletricista, Pintor"
                         className="w-full bg-zinc-100 border border-transparent focus:border-primary/50 focus:bg-white rounded-xl py-3 px-4 mt-1 outline-none" 
                         onChange={e => setFormData({...formData, serviceType: e.target.value})}
                       />
                     </div>
                     <div>
                       <label className="text-xs font-bold text-zinc-500 uppercase">Área de Atuação</label>
                       <input 
                         type="text" 
                         className="w-full bg-zinc-100 border border-transparent focus:border-primary/50 focus:bg-white rounded-xl py-3 px-4 mt-1 outline-none" 
                         onChange={e => setFormData({...formData, serviceArea: e.target.value})}
                       />
                     </div>
                   </>
                 )}
                 
                 <div>
                   <label className="text-xs font-bold text-zinc-500 uppercase">Descrição Breve</label>
                   <textarea
                     rows={3}
                     className="w-full bg-zinc-100 border border-transparent focus:border-primary/50 focus:bg-white rounded-xl py-3 px-4 mt-1 outline-none resize-none" 
                     onChange={e => setFormData({...formData, description: e.target.value})}
                   ></textarea>
                 </div>
               </div>

               <div className="flex gap-3">
                 <button onClick={() => setShowRoleModal(false)} className="flex-1 py-3 text-zinc-600 bg-zinc-100 rounded-xl font-bold hover:bg-zinc-200">Cancelar</button>
                 <button 
                   onClick={handleSubmitRoleRequest}
                   className="flex-1 py-3 text-white bg-primary rounded-xl font-bold hover:bg-primary-dark"
                 >
                   Enviar
                 </button>
               </div>
            </div>
         </div>
       )}

    </div>
  );
}
