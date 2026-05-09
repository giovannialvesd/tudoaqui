import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Wrench, Settings, Briefcase, Star, ToggleLeft, ToggleRight, LayoutDashboard, HelpCircle, ImageIcon, Plus, Trash2, Camera, MapPin, Clock, Phone, DollarSign } from 'lucide-react';
import { collection, doc, getDoc, getDocs, query, where, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import DashboardLayout from '../layouts/DashboardLayout';
import ImageUploader from '../components/ImageUploader';
import CategoryRequestModal from '../components/CategoryRequestModal';
import { toast } from 'sonner';

export default function ProviderDashboard() {
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
  const [validCategories, setValidCategories] = useState<any[]>([]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (effectiveUserId) {
      fetchData();
    }
  }, [effectiveUserId]);

  const fetchData = async () => {
    if (!effectiveUserId) return;
    try {
      const profSnap = await getDoc(doc(db, 'provider_profiles', effectiveUserId));
      if (profSnap.exists()) {
          setProfile(profSnap.data());
      } else {
          setProfile({ isAvailable: true, category: '', portfolioImages: [] });
      }

      const catQ = query(collection(db, 'categories'), where('type', '==', 'service'), where('active', '==', true));
      const catSnap = await getDocs(catQ);
      setValidCategories(catSnap.docs.map(d => ({id: d.id, ...d.data()})));
    } catch (e) {
      console.error(e);
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!effectiveUserId) return;
    setSaving(true);
    try {
      await setDoc(doc(db, 'provider_profiles', effectiveUserId), {
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

  const toggleAvailability = async () => {
    if(!effectiveUserId || !profile) return;
    try {
      const newState = !profile.isAvailable;
      await setDoc(doc(db, 'provider_profiles', effectiveUserId), { isAvailable: newState, updatedAt: serverTimestamp() }, { merge: true });
      setProfile({...profile, isAvailable: newState});
      toast.success(newState ? 'Perfil agora está visível nas buscas.' : 'Perfil ocultado com sucesso.');
    } catch(e) {}
  };

  // Portfolio helpers
  const handleAddPortfolioImage = (url: string) => {
    if (!url) return;
    const currentImages = profile.portfolioImages || [];
    setProfile({...profile, portfolioImages: [...currentImages, url]});
  };

  const handleRemovePortfolioImage = (index: number) => {
    const currentImages = [...(profile.portfolioImages || [])];
    currentImages.splice(index, 1);
    setProfile({...profile, portfolioImages: currentImages});
  };

  if (loading) return null;
  if (!userProfile || (userProfile.role !== 'provider' && !isAdmin)) return <Navigate to="/" replace />;
  
  const sidebarItems = [
    { id: 'Visão Geral', label: 'Visão Geral', icon: LayoutDashboard },
    { id: 'Perfil Profissional', label: 'Meu Perfil', icon: Briefcase },
    { id: 'Portfólio', label: 'Meus Trabalhos', icon: ImageIcon },
    { id: 'Configurações', label: 'Ajustes', icon: Settings },
  ];

  return (
    <>
     <DashboardLayout
        title={activeTab}
        subtitle="Seu painel de controle de serviços"
        sidebarItems={sidebarItems}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
     >
         <div className="flex-1 space-y-8">
            
            {activeTab === 'Visão Geral' && (
              <>
                <div className={`rounded-3xl p-8 md:p-12 text-white shadow-xl relative overflow-hidden transition-all duration-500 flex flex-col justify-between min-h-[300px] ${profile?.isAvailable ? 'bg-indigo-600' : 'bg-zinc-800'}`}>
                  {/* Decorative Elements */}
                  <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-5 rounded-full blur-3xl -mr-20 -mt-20"></div>
                  
                  <div className="relative z-10">
                     <div className="flex items-center gap-4 mb-4">
                        <div className={`w-4 h-4 rounded-full shadow-lg ${profile?.isAvailable ? 'bg-green-400 animate-pulse' : 'bg-red-500'}`}></div>
                        <span className="font-bold uppercase tracking-widest text-sm opacity-80">
                           Status do Perfil
                        </span>
                     </div>
                     <h3 className="font-black text-4xl md:text-5xl mb-4 leading-tight tracking-tight">
                        {profile?.isAvailable ? 'Você está visível e disponível' : 'Seu perfil está oculto'}
                     </h3>
                     <p className={`font-medium text-lg max-w-2xl leading-relaxed ${profile?.isAvailable ? 'text-indigo-100' : 'text-zinc-400'}`}>
                        {profile?.isAvailable ? 'Clientes podem te encontrar nas pesquisas e entrar em contato com você diretamente. Mantenha seu portfólio atualizado para mais chances.' : 'Você não aparecerá nas buscas da plataforma e não receberá novos contatos. Ative quando puder aceitar novos serviços.'}
                     </p>
                  </div>
                  
                  <div className="mt-10 relative z-10 flex flex-col sm:flex-row items-center gap-4">
                     <button 
                       onClick={toggleAvailability}
                       className={`flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-bold text-lg shadow-xl hover:scale-105 transition-all w-full sm:w-auto ${profile?.isAvailable ? 'bg-white text-indigo-600' : 'bg-white text-zinc-900'}`}
                     >
                        {profile?.isAvailable ? (
                           <>Pausar Contatos <ToggleRight className="w-6 h-6" /></>
                        ) : (
                           <>Ativar Perfil <ToggleLeft className="w-6 h-6 text-zinc-400" /></>
                        )}
                     </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Stats Cards */}
                  <div className="bg-white p-8 rounded-3xl shadow-sm border border-zinc-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
                    <div className="relative z-10">
                        <span className="text-zinc-500 text-sm font-bold uppercase tracking-widest mb-2 block flex items-center gap-2">
                           <LayoutDashboard className="w-4 h-4" /> Cliques no Perfil
                        </span>
                        <p className="text-5xl font-black text-zinc-900 mt-4">0<span className="text-lg text-zinc-400 font-medium ml-2">este mês</span></p>
                    </div>
                  </div>

                  <div className="bg-white p-8 rounded-3xl shadow-sm border border-zinc-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
                    <div className="relative z-10">
                        <span className="text-zinc-500 text-sm font-bold uppercase tracking-widest mb-2 block flex items-center gap-2">
                           <Phone className="w-4 h-4" /> Cliques no WhatsApp
                        </span>
                        <p className="text-5xl font-black text-zinc-900 mt-4">0<span className="text-lg text-zinc-400 font-medium ml-2">este mês</span></p>
                    </div>
                  </div>

                  <div className="bg-white p-8 rounded-3xl shadow-sm border border-zinc-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
                    <div className="relative z-10">
                        <span className="text-zinc-500 text-sm font-bold uppercase tracking-widest mb-2 block flex items-center gap-2">
                           <Star className="w-4 h-4" /> Avaliação Média
                        </span>
                        <div className="flex items-end gap-2 mt-4">
                           <p className="text-5xl font-black text-zinc-900">5.0</p>
                           <div className="flex pb-2">
                              <Star className="w-5 h-5 text-amber-400 fill-current" />
                              <Star className="w-5 h-5 text-amber-400 fill-current" />
                              <Star className="w-5 h-5 text-amber-400 fill-current" />
                              <Star className="w-5 h-5 text-amber-400 fill-current" />
                              <Star className="w-5 h-5 text-amber-400 fill-current" />
                           </div>
                        </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'Perfil Profissional' && profile && (
               <form onSubmit={handleProfileSave} className="bg-white rounded-3xl p-8 lg:p-10 shadow-sm border border-zinc-100">
                 <div className="mb-8">
                     <h2 className="font-black text-3xl text-zinc-900 mb-2">Seu Perfil Profissional</h2>
                     <p className="text-zinc-500 font-medium text-lg">Estas informações serão exibidas para quem busca pelos seus serviços na plataforma.</p>
                 </div>
                 
                 <div className="space-y-8">
                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div>
                           <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-3">Especialidade Principal</label>
                           <div className="flex gap-2">
                              <select required value={profile.category || ''} onChange={e => setProfile({...profile, category: e.target.value})} className="flex-1 bg-zinc-50 border border-zinc-200 px-5 py-4 rounded-2xl outline-none focus:border-indigo-500 focus:bg-white font-bold text-lg text-zinc-900 transition-colors shadow-inner">
                                 <option value="" disabled>Ex: Eletricista, Encanador, TI...</option>
                                 {validCategories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                              </select>
                              <button type="button" onClick={() => setIsCategoryModalOpen(true)} className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 w-16 rounded-2xl font-bold flex items-center justify-center transition-colors border border-zinc-200" title="Sugerir nova especialidade">
                                 <HelpCircle className="w-6 h-6" />
                              </button>
                           </div>
                           {!profile.category && <p className="text-sm text-red-500 font-medium mt-3 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500"></div> Você precisa escolher sua especialidade.</p>}
                        </div>
                        
                        <div>
                           <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-3">WhatsApp Profissional</label>
                           <div className="relative">
                              <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                              <input required type="text" placeholder="(DD) 90000-0000" value={profile.phone || ''} onChange={e => setProfile({...profile, phone: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 pl-14 pr-5 py-4 rounded-2xl outline-none focus:border-indigo-500 focus:bg-white font-bold text-lg text-zinc-900 transition-colors shadow-inner" />
                           </div>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div>
                           <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-3">Valor / Taxa (Opcional)</label>
                           <div className="relative">
                              <DollarSign className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                              <input type="text" placeholder="Ex: R$ 50/hora ou Sob Orçamento" value={profile.price || ''} onChange={e => setProfile({...profile, price: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 pl-14 pr-5 py-4 rounded-2xl outline-none focus:border-indigo-500 focus:bg-white font-medium text-lg text-zinc-900 transition-colors shadow-inner" />
                           </div>
                        </div>
                        
                        <div>
                           <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-3">Nome / Marca Profissional</label>
                           <input type="text" placeholder="Seu nome ou nome da sua empresa" value={profile.businessName || ''} onChange={e => setProfile({...profile, businessName: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 px-5 py-4 rounded-2xl outline-none focus:border-indigo-500 focus:bg-white font-medium text-lg text-zinc-900 transition-colors shadow-inner" />
                        </div>
                     </div>

                     <div>
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-3">Apresentação: Por que o cliente deve te escolher?</label>
                        <textarea rows={6} placeholder="Conte sua experiência, diferencial, quanto tempo atua na área..." value={profile.description || ''} onChange={e => setProfile({...profile, description: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 px-5 py-4 rounded-2xl outline-none focus:border-indigo-500 focus:bg-white font-medium text-lg text-zinc-900 transition-colors resize-none shadow-inner leading-relaxed" />
                     </div>

                     <div className="pt-8 border-t border-zinc-100 flex justify-end">
                        <button disabled={saving} type="submit" className="w-full md:w-auto bg-indigo-600 text-white font-bold px-12 py-5 rounded-xl hover:bg-indigo-700 transition-all hover:scale-105 disabled:opacity-50 shadow-xl shadow-indigo-500/20 text-lg">
                           {saving ? 'Salvando...' : 'Salvar Alterações'}
                        </button>
                     </div>
                 </div>
               </form>
            )}

            {activeTab === 'Portfólio' && profile && (
               <div className="bg-white rounded-3xl p-8 lg:p-10 shadow-sm border border-zinc-100">
                 <div className="mb-8">
                     <h2 className="font-black text-3xl text-zinc-900 mb-2">Suas Fotos de Trabalho</h2>
                     <p className="text-zinc-500 font-medium text-lg">Mostre as fotos dos serviços que você já realizou. Clientes adoram ver exemplos!</p>
                 </div>

                 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
                    {/* Imagens do portfólio */}
                    {(profile.portfolioImages || []).map((imgUrl: string, idx: number) => (
                       <div key={idx} className="group aspect-square rounded-2xl bg-zinc-100 border border-zinc-200 relative overflow-hidden">
                          <img src={imgUrl} alt={`Trabalho ${idx+1}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                             <button onClick={() => handleRemovePortfolioImage(idx)} className="bg-red-500 hover:bg-red-600 text-white p-3 rounded-full shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-all">
                                <Trash2 className="w-5 h-5" />
                             </button>
                          </div>
                       </div>
                    ))}
                    
                    {/* Add new image placeholder. Limit to 8 images for example */}
                    {(profile.portfolioImages || []).length < 8 && (
                       <div className="aspect-square">
                          <div className="w-full h-full flex flex-col justify-center items-center h-full bg-zinc-50 hover:bg-zinc-100 border-2 border-dashed border-zinc-300 hover:border-indigo-400 rounded-2xl transition-colors p-4 text-center cursor-pointer relative overflow-hidden group">
                             <ImageUploader 
                                value={null} 
                                onChange={handleAddPortfolioImage} 
                                label="" 
                             />
                             <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center opacity-70 group-hover:opacity-100 group-hover:text-indigo-600 transition-colors">
                                <Plus className="w-10 h-10 mb-2 mx-auto" />
                                <span className="font-bold text-sm">Adicionar Foto</span>
                             </div>
                          </div>
                       </div>
                    )}
                 </div>
                 
                 <div className="pt-8 border-t border-zinc-100 flex justify-end">
                     <button disabled={saving} onClick={handleProfileSave} className="w-full md:w-auto bg-indigo-600 text-white font-bold px-12 py-5 rounded-xl hover:bg-indigo-700 transition-all hover:scale-105 disabled:opacity-50 shadow-xl shadow-indigo-500/20 text-lg">
                        {saving ? 'Salvando...' : 'Salvar Portfólio'}
                     </button>
                 </div>
               </div>
            )}

            {activeTab === 'Configurações' && profile && (
               <form onSubmit={handleProfileSave} className="bg-white rounded-3xl p-8 lg:p-10 shadow-sm border border-zinc-100">
                 <div className="mb-8">
                     <h2 className="font-black text-3xl text-zinc-900 mb-2">Ajustes da Conta</h2>
                     <p className="text-zinc-500 font-medium text-lg">Configure sua foto de perfil, onde e quando você atende.</p>
                 </div>
                 
                 <div className="space-y-8">
                    <div className="flex flex-col md:flex-row gap-8 items-start">
                        {/* Avatar / Profile Image */}
                        <div className="w-full md:w-1/3 p-6 bg-zinc-50 border border-zinc-200 rounded-3xl flex flex-col items-center text-center">
                           <div className="w-32 h-32 mb-4 bg-zinc-200 rounded-full border-4 border-white shadow-xl overflow-hidden relative">
                              <div className="absolute inset-0 opacity-0 relative z-10 w-full h-full cursor-pointer">
                                 <ImageUploader value={profile.imageUrl || null} onChange={val => setProfile({...profile, imageUrl: val || ''})} label="" />
                              </div>
                              <div className="absolute inset-0 z-0 pointer-events-none">
                                 {profile.imageUrl ? (
                                    <img src={profile.imageUrl} className="w-full h-full object-cover" />
                                 ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-100 text-zinc-400">
                                       <Camera className="w-8 h-8 opacity-50 mb-1" />
                                    </div>
                                 )}
                              </div>
                           </div>
                           <h4 className="font-bold text-zinc-900 mb-1 text-lg">Sua Foto de Perfil</h4>
                           <p className="text-sm text-zinc-500 font-medium leading-relaxed">Uma foto clara e sorridente aumenta a confiança do cliente em até 80%.</p>
                        </div>
                        
                        <div className="flex-1 space-y-8 w-full">
                           <div>
                             <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-3">Região que você atende</label>
                             <div className="relative">
                                <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                                <input type="text" placeholder="Ex: Toda a cidade, Apenas Bairro X" value={profile.address || ''} onChange={e => setProfile({...profile, address: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 pl-14 pr-5 py-4 rounded-2xl outline-none focus:border-indigo-500 focus:bg-white font-bold text-lg transition-colors shadow-inner text-zinc-900" />
                             </div>
                           </div>

                           <div>
                             <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-3">Seus Horários</label>
                             <div className="relative">
                                <Clock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                                <input type="text" placeholder="Ex: Segunda à Sábado das 8h às 18h" value={profile.workingHours || ''} onChange={e => setProfile({...profile, workingHours: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 pl-14 pr-5 py-4 rounded-2xl outline-none focus:border-indigo-500 focus:bg-white font-bold text-lg transition-colors shadow-inner text-zinc-900" />
                             </div>
                           </div>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-zinc-100 flex justify-end">
                       <button disabled={saving} type="submit" className="w-full md:w-auto bg-zinc-900 text-white font-bold px-12 py-5 rounded-xl hover:bg-black transition-all hover:scale-105 disabled:opacity-50 shadow-xl shadow-zinc-900/20 text-lg">
                          {saving ? 'Guardando Ajustes...' : 'Atualizar Conta'}
                       </button>
                    </div>
                 </div>
               </form>
            )}
         </div>
     </DashboardLayout>

     <CategoryRequestModal 
         isOpen={isCategoryModalOpen} 
         onClose={() => setIsCategoryModalOpen(false)} 
         defaultType="service" 
     />
    </>
  );
}

