import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Users, Store, ShieldAlert, FileText, BarChart3, Activity, Check, X, Trash2, Megaphone, Briefcase, HelpCircle, Layers, Monitor, TrendingUp, MoreHorizontal, MousePointerClick, ExternalLink, UserPlus, Mail, Search, PawPrint, Globe, LayoutDashboard, PlusCircle, Lock } from 'lucide-react';
import { collection, query, where, getDocs, doc, updateDoc, setDoc, deleteDoc, serverTimestamp, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { toast } from 'sonner';
import { useConfirm } from '../hooks/useConfirm';
import { useCity } from '../contexts/CityContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

import DashboardLayout, { DashboardSidebarItem } from '../layouts/DashboardLayout';
import ImageUploader from '../components/ImageUploader';
import AdminCampaigns from './admin/AdminCampaigns';
import AdminSections from './admin/AdminSections';
import AdminCategories from './admin/AdminCategories';
import AdminMerchants from './admin/AdminMerchants';
import AdminProviders from './admin/AdminProviders';
import AdminDrivers from './admin/AdminDrivers';
import AdminCategoryRequests from './admin/AdminCategoryRequests';
import AdminBanners from './admin/AdminBanners';
import AdminJobs from './admin/AdminJobs';
import AdminGarbageCollection from './admin/AdminGarbageCollection';
import AdminAdoption from './admin/AdminAdoption';
import AdminAnimalReports from './admin/AdminAnimalReports';
import AdminCities from './admin/AdminCities';
import AIPageGenerator from '../components/AIPageGenerator';
import { createManagedUser } from '../firebase/adminUtils';
import { handleFirestoreError, OperationType } from '../firebase/errors';

export default function AdminDashboard() {
  const { userProfile, loading } = useAuth();
  const { cities } = useCity();
  
  if (loading) return (
    <div className="h-screen w-full flex items-center justify-center bg-bg-base">
      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
    </div>
  );
  
  const allowedRoles = ['admin', 'super_admin', 'city_admin', 'city_editor', 'city_support'];
  if (!userProfile || !allowedRoles.includes(userProfile.role)) {
    return <Navigate to="/" replace />;
  }

  const isSuperAdmin = userProfile.role === 'super_admin';
  const isAdminOrSuper = userProfile.role === 'super_admin' || userProfile.role === 'admin';
  const initialCityId = userProfile.cityId || localStorage.getItem('last_admin_city_id') || '';
  const [selectedCityId, setSelectedCityId] = useState(initialCityId);

  const [activeTab, setActiveTab] = useState('overview');
  const [roleRequests, setRoleRequests] = useState<any[]>([]);
  const [categoryRequests, setCategoryRequests] = useState<any[]>([]);
  const [animalReports, setAnimalReports] = useState<any[]>([]);

  const [stats, setStats] = useState({
     users: 0,
     merchants: 0,
     accesses: '0',
     today: '0'
   });

  useEffect(() => {
    if (isAdminOrSuper && selectedCityId) {
      localStorage.setItem('last_admin_city_id', selectedCityId);
    }
  }, [selectedCityId, isAdminOrSuper]);

  useEffect(() => {
    const isCityLimited = !isAdminOrSuper || selectedCityId;
    const cityToFilter = isAdminOrSuper ? selectedCityId : userProfile.cityId;

    const buildQuery = (collName: string, additionalConstraints: any[] = []) => {
      const constraints = [...additionalConstraints];
      if (isCityLimited && cityToFilter) {
        constraints.push(where('cityId', '==', cityToFilter));
      }
      return query(collection(db, collName), ...constraints);
    };

    const unsubAnimal = onSnapshot(buildQuery('animal_reports', [where('status', '==', 'pending')]), (snapshot) => {
       setAnimalReports(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => handleFirestoreError(err, OperationType.GET, 'animal_reports'));

    const unsubRole = onSnapshot(buildQuery('role_requests', [where('status', '==', 'pending')]), (snapshot) => {
       setRoleRequests(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => handleFirestoreError(err, OperationType.GET, 'role_requests'));

    const unsubCat = onSnapshot(buildQuery('category_requests', [where('status', '==', 'pending')]), (snapshot) => {
       setCategoryRequests(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => handleFirestoreError(err, OperationType.GET, 'category_requests'));

    // Real-time counter for users
    const unsubUsers = onSnapshot(buildQuery('users'), (snap) => {
      setStats(prev => ({ ...prev, users: snap.size }));
    });

    // Real-time counter for merchants
    const unsubMerchants = onSnapshot(buildQuery('business_profiles'), (snap) => {
      setStats(prev => ({ ...prev, merchants: snap.size }));
    });
    
    return () => {
       unsubAnimal();
       unsubRole();
       unsubCat();
       unsubUsers();
       unsubMerchants();
    }
  }, [userProfile, isSuperAdmin, userProfile.cityId, selectedCityId]);

  const fetchAnimalReports = async () => {};
  const fetchRoleRequests = async () => {};
  const fetchCategoryRequests = async () => {};

  const handleApproveRequest = async (request: any) => {
    try {
      // 1. Update user role
      await updateDoc(doc(db, 'users', request.userId), {
        role: request.requestedRole,
        updatedAt: serverTimestamp()
      });
      // 2. Update request status
      await updateDoc(doc(db, 'role_requests', request.id), {
        status: 'approved',
        updatedAt: serverTimestamp()
      });
      
      const form = request.formData || {};
      
      // 3. Create initial profile document
      if (request.requestedRole === 'merchant') {
         await setDoc(doc(db, 'business_profiles', request.userId), {
            userId: request.userId,
            cityId: request.cityId || '', // Inherit from request or user
            businessName: form.name || 'Novo Comércio',
            category: form.category || 'Geral',
            phone: form.phone || '',
            address: form.address || '',
            hours: form.hours || '',
            description: form.description || '',
            imageUrl: form.imageBase64 || null,
            acceptsDelivery: false,
            isOpen: false,
            rating: 5.0,
            updatedAt: serverTimestamp()
         });
      } else if (request.requestedRole === 'driver') {
         await setDoc(doc(db, 'driver_profiles', request.userId), {
            userId: request.userId,
            cityId: request.cityId || '',
            name: form.name || 'Novo Motorista',
            phone: form.phone || '',
            vehicle: form.vehicle || '',
            basePrice: form.basePrice || '',
            availability: form.availability || '',
            description: form.description || '',
            imageUrl: form.imageBase64 || null,
            rating: 5.0,
            isAvailable: false,
            updatedAt: serverTimestamp()
         });
      } else if (request.requestedRole === 'provider') {
         await setDoc(doc(db, 'provider_profiles', request.userId), {
            userId: request.userId,
            cityId: request.cityId || '',
            name: form.name || 'Novo Prestador',
            phone: form.phone || '',
            category: form.serviceType || 'Serviços Gerais',
            address: form.serviceArea || '',
            description: form.description || '',
            imageUrl: form.imageBase64 || null,
            rating: 5.0,
            isAvailable: true,
            updatedAt: serverTimestamp()
         });
      }
      toast.success('Solicitação aprovada com sucesso!');
      fetchRoleRequests();
    } catch (e) {
      toast.error("Erro ao aprovar solicitação");
      handleFirestoreError(e, OperationType.WRITE, null);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await updateDoc(doc(db, 'role_requests', requestId), {
        status: 'rejected',
        updatedAt: serverTimestamp()
      });
      toast.success('Solicitação rejeitada.');
      fetchRoleRequests();
    } catch (e) {
      toast.error("Erro ao rejeitar solicitação");
      handleFirestoreError(e, OperationType.WRITE, null);
    }
  };

  // Fallback: If not explicitly authorized, deny
  if (!userProfile || !allowedRoles.includes(userProfile.role)) return <Navigate to="/" replace />;
  
  const sidebarItems: DashboardSidebarItem[] = [
    { id: 'overview', label: 'Visão Geral', icon: BarChart3, section: 'Menu Principal' },
    { id: 'requests', label: 'Aprovações Pendentes', icon: Check, badge: roleRequests.length, section: 'Menu Principal' },
    
    ...(isSuperAdmin ? [{ id: 'cities', label: 'Gerenciar Cidades', icon: Globe, section: 'Administração Global' }] : []),
    { id: 'users', label: 'Todos os Usuários', icon: Users, section: 'Cadastros e Perfis' },
    { id: 'merchants', label: 'Comércios', icon: Store, section: 'Cadastros e Perfis' },
    { id: 'providers', label: 'Prestadores de Serviço', icon: Briefcase, section: 'Cadastros e Perfis' },
    { id: 'drivers', label: 'Motoristas', icon: Activity, section: 'Cadastros e Perfis' },

    { id: 'home', label: 'Layout Inicial', icon: Monitor, section: 'Interface e Conteúdo' },
    { id: 'banners', label: 'Banners Home', icon: Megaphone, section: 'Interface e Conteúdo' },
    { id: 'pages', label: 'Páginas Dinâmicas (IA)', icon: FileText, section: 'Interface e Conteúdo' },
    { id: 'jobs', label: 'Vagas de Emprego', icon: Briefcase, section: 'Interface e Conteúdo' },
    { id: 'categories', label: 'Categorias do App', icon: Layers, section: 'Interface e Conteúdo' },
    { id: 'category_req', label: 'Sugestões de Categoria', icon: HelpCircle, badge: categoryRequests.length, section: 'Interface e Conteúdo' },

    { id: 'campaigns', label: 'Campanhas / Eventos', icon: ShieldAlert, section: 'Ferramentas' },
    { id: 'bus', label: 'Horários de Ônibus', icon: Activity, section: 'Ferramentas' },
    { id: 'garbage', label: 'Coleta de Lixo', icon: Trash2, section: 'Ferramentas' },
    { id: 'adoption', label: 'Adoção de Animais', icon: PawPrint, section: 'Ferramentas' },
    { id: 'animal_reports', label: 'Denúncias de Animais', icon: ShieldAlert, badge: animalReports.length, section: 'Ferramentas' },
  ];

  const currentEffectiveCityId = isAdminOrSuper ? selectedCityId : userProfile.cityId;

  return (
     <DashboardLayout 
        title={sidebarItems.find(item => item.id === activeTab)?.label || 'Painel Administrativo'}
        subtitle={`Controle total da plataforma TudoAqui`}
        sidebarItems={sidebarItems}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        headerExtra={isAdminOrSuper && (
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-2 bg-zinc-100 px-3 py-2 rounded-xl border border-zinc-200">
                <Globe className="w-4 h-4 text-zinc-500" />
                <select 
                  value={selectedCityId} 
                  onChange={(e) => setSelectedCityId(e.target.value)}
                  className="bg-transparent text-sm font-black text-zinc-900 outline-none pr-2"
                >
                   <option value="">Todas as Cidades</option>
                   {cities.map(city => (
                     <option key={city.id} value={city.id}>{city.name}</option>
                   ))}
                </select>
             </div>
             {selectedCityId && (
               <button 
                 onClick={() => setSelectedCityId('')}
                 className="p-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-500 rounded-xl transition-colors"
                 title="Limpar seleção de cidade"
               >
                 <X className="w-4 h-4" />
               </button>
             )}
          </div>
        )}
     >
            
            {activeTab === 'overview' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Advanced Data Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                   <div className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-100 flex flex-col justify-between group hover:shadow-md transition-all">
                     <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                          <Users className="w-6 h-6" />
                        </div>
                        <span className="text-emerald-500 bg-emerald-50 text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1"><TrendingUp className="w-3 h-3" /> +12%</span>
                     </div>
                     <div>
                        <h3 className="text-zinc-500 text-sm font-bold tracking-tight mb-1">Usuários Ativos</h3>
                        <p className="text-4xl font-black text-zinc-900">{stats.users}</p>
                     </div>
                   </div>

                   <div className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-100 flex flex-col justify-between group hover:shadow-md transition-all cursor-pointer hover:border-primary/50" onClick={() => setActiveTab('requests')}>
                     <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500 group-hover:scale-110 transition-transform">
                          <Check className="w-6 h-6" />
                        </div>
                        {roleRequests.length > 0 && <span className="text-rose-500 bg-rose-50 text-xs font-bold px-2.5 py-1 rounded-lg animate-pulse">Ação Necessária</span>}
                     </div>
                     <div>
                        <h3 className="text-zinc-500 text-sm font-bold tracking-tight mb-1">Aprovações Pendentes</h3>
                        <div className="flex items-end justify-between">
                           <p className="text-4xl font-black text-zinc-900">{roleRequests.length}</p>
                           <span className="text-primary text-xs font-bold bg-primary/10 px-3 py-1.5 rounded-xl hover:bg-primary/20 transition-colors">Revisar Agora</span>
                        </div>
                     </div>
                   </div>

                   <div className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-100 flex flex-col justify-between group hover:shadow-md transition-all">
                     <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
                          <Store className="w-6 h-6" />
                        </div>
                        <span className="text-emerald-500 bg-emerald-50 text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1"><TrendingUp className="w-3 h-3" /> +4</span>
                     </div>
                     <div>
                        <h3 className="text-zinc-500 text-sm font-bold tracking-tight mb-1">Comércios Registrados</h3>
                        <p className="text-4xl font-black text-zinc-900">{stats.merchants}</p>
                     </div>
                   </div>

                   <div className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-100 flex flex-col justify-between group hover:shadow-md transition-all">
                     <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                          <MousePointerClick className="w-6 h-6" />
                        </div>
                     </div>
                     <div>
                        <h3 className="text-zinc-500 text-sm font-bold tracking-tight mb-1">Acessos Hoje</h3>
                        <p className="text-4xl font-black text-zinc-900">{stats.today}</p>
                     </div>
                   </div>
                </div>

                {/* Charts Area */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                   <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-zinc-100 flex flex-col items-center justify-center min-h-[400px] text-center">
                       <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-6">
                          <TrendingUp className="w-10 h-10" />
                       </div>
                       <h3 className="font-black text-2xl text-zinc-900 tracking-tight mb-2">Analytics em Coleta</h3>
                       <p className="text-zinc-500 font-medium max-w-md mx-auto mb-8">
                         Estamos começando a coletar dados de tráfego e interações. Em breve você terá gráficos detalhados sobre o uso da plataforma.
                       </p>
                       <div className="flex gap-4">
                          <div className="bg-zinc-50 px-6 py-4 rounded-2xl border border-zinc-100 italic text-zinc-400 font-medium text-sm">
                            Aguardando mais dados...
                          </div>
                       </div>
                    </div>

                   <div className="bg-white p-8 rounded-3xl shadow-sm border border-zinc-100 flex flex-col">
                      <div className="flex flex-col mb-8">
                         <h3 className="font-black text-xl text-zinc-900 tracking-tight">Atalhos Rápidos</h3>
                         <p className="text-sm text-zinc-500 font-medium mt-1">Ações frequentes do administrador</p>
                      </div>
                      <div className="flex-1 flex flex-col gap-3">
                         <button onClick={() => setActiveTab('banners')} className="w-full flex items-center justify-between p-4 rounded-2xl bg-zinc-50 hover:bg-primary/5 hover:text-primary transition-colors group border border-zinc-100 hover:border-primary/20 text-left">
                            <div className="flex items-center gap-3">
                               <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-zinc-200 flex items-center justify-center group-hover:border-primary/30 group-hover:shadow-primary/10 transition-all text-zinc-600 group-hover:text-primary">
                                  <Megaphone className="w-5 h-5" />
                               </div>
                               <div>
                                  <p className="font-bold text-zinc-900 group-hover:text-primary transition-colors">Atualizar Banners</p>
                                  <p className="text-xs font-medium text-zinc-500">Mude as promoções no topo</p>
                               </div>
                            </div>
                         </button>
                         <button onClick={() => setActiveTab('categories')} className="w-full flex items-center justify-between p-4 rounded-2xl bg-zinc-50 hover:bg-primary/5 hover:text-primary transition-colors group border border-zinc-100 hover:border-primary/20 text-left">
                            <div className="flex items-center gap-3">
                               <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-zinc-200 flex items-center justify-center group-hover:border-primary/30 group-hover:shadow-primary/10 transition-all text-zinc-600 group-hover:text-primary">
                                  <Layers className="w-5 h-5" />
                               </div>
                               <div>
                                  <p className="font-bold text-zinc-900 group-hover:text-primary transition-colors">Gerir Categorias</p>
                                  <p className="text-xs font-medium text-zinc-500">Edite menus do app</p>
                               </div>
                            </div>
                         </button>
                         <button onClick={() => setActiveTab('home')} className="w-full flex items-center justify-between p-4 rounded-2xl bg-zinc-50 hover:bg-primary/5 hover:text-primary transition-colors group border border-zinc-100 hover:border-primary/20 text-left">
                            <div className="flex items-center gap-3">
                               <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-zinc-200 flex items-center justify-center group-hover:border-primary/30 group-hover:shadow-primary/10 transition-all text-zinc-600 group-hover:text-primary">
                                  <Monitor className="w-5 h-5" />
                               </div>
                               <div>
                                  <p className="font-bold text-zinc-900 group-hover:text-primary transition-colors">Mudar Layout</p>
                                  <p className="text-xs font-medium text-zinc-500">Altere a estrutura inicial</p>
                               </div>
                            </div>
                         </button>
                         <button onClick={() => setActiveTab('requests')} className="w-full flex items-center justify-between p-4 rounded-2xl bg-zinc-50 hover:bg-primary/5 hover:text-primary transition-colors group border border-zinc-100 hover:border-primary/20 text-left">
                            <div className="flex items-center gap-3">
                               <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-zinc-200 flex items-center justify-center group-hover:border-primary/30 group-hover:shadow-primary/10 transition-all text-zinc-600 group-hover:text-primary">
                                  <Check className="w-5 h-5" />
                               </div>
                               <div>
                                  <p className="font-bold text-zinc-900 group-hover:text-primary transition-colors">Revisar Inscrições</p>
                                  <p className="text-xs font-medium text-zinc-500">{roleRequests.length} novos comerciantes</p>
                               </div>
                            </div>
                         </button>
                      </div>
                   </div>
                </div>

              </div>
            )}

            {activeTab === 'merchants' && <AdminMerchants cityId={currentEffectiveCityId} />}
            {activeTab === 'providers' && <AdminProviders cityId={currentEffectiveCityId} />}
            {activeTab === 'drivers' && <AdminDrivers cityId={currentEffectiveCityId} />}
            {activeTab === 'cities' && isSuperAdmin && <AdminCities />}
            {activeTab === 'category_req' && <AdminCategoryRequests cityId={currentEffectiveCityId} />}
            {activeTab === 'categories' && <AdminCategories cityId={currentEffectiveCityId} />}
            {activeTab === 'banners' && <AdminBanners cityId={currentEffectiveCityId} />}
            {activeTab === 'jobs' && <AdminJobs cityId={currentEffectiveCityId} />}
            {activeTab === 'campaigns' && <AdminCampaigns cityId={currentEffectiveCityId} />}
            {activeTab === 'home' && <AdminSections cityId={currentEffectiveCityId} />}
            {activeTab === 'pages' && <AIPageGenerator cityId={currentEffectiveCityId} />}

            {(activeTab === 'users') && (
              <div className="bg-white rounded-3xl shadow-sm border border-zinc-100 overflow-hidden mb-8">
                 <div className="px-8 py-6 border-b border-zinc-100 flex justify-between items-center bg-white">
                   <div>
                      <h3 className="font-black text-xl text-zinc-900">Gestão de Usuários</h3>
                      <p className="text-sm text-zinc-500">Controle todos os perfis cadastrados no sistema.</p>
                   </div>
                 </div>
                 <div className="p-0">
                    <UsersAdminList isSuperAdmin={isSuperAdmin} currentCityId={currentEffectiveCityId} />
                 </div>
              </div>
            )}

            {(activeTab === 'overview' || activeTab === 'requests') && (
              <div className="bg-white rounded-3xl shadow-sm border border-zinc-100 overflow-hidden mb-8">
                 <div className="px-8 py-6 border-b border-zinc-100 flex justify-between items-center bg-white">
                   <div>
                      <h3 className="font-black text-xl text-zinc-900">Aprovações Pendentes</h3>
                      <p className="text-sm text-zinc-500">Contas aguardando liberação para perfil comercial ou prestador.</p>
                   </div>
                 </div>
                 <div className="p-0 overflow-x-auto">
                   <table className="w-full text-left text-sm text-zinc-600">
                     <thead className="bg-zinc-50/50 text-xs uppercase font-bold text-zinc-500 tracking-wider">
                       <tr>
                         <th className="px-8 py-4">Requisitante</th>
                         <th className="px-8 py-4">Função Desejada</th>
                         <th className="px-8 py-4">Contato</th>
                         <th className="px-8 py-4 text-right">Ações</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-zinc-100">
                       {roleRequests.map((req, i) => (
                         <tr key={req.id} className="hover:bg-zinc-50/50 transition-colors">
                           <td className="px-8 py-5 font-bold text-zinc-900">
                              <div className="flex items-center gap-4">
                                 {req.formData?.imageBase64 ? (
                                   <img src={req.formData.imageBase64} className="w-12 h-12 rounded-xl object-cover bg-zinc-100 shadow-sm border border-zinc-200" />
                                 ) : (
                                   <div className="w-12 h-12 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center" />
                                 )}
                                 <div>
                                    <p className="text-base">{req.formData?.name || 'Não informado'}</p>
                                    {req.formData?.category && <span className="block text-xs font-medium text-zinc-500">{req.formData.category}</span>}
                                 </div>
                              </div>
                           </td>
                           <td className="px-8 py-5">
                             <span className="bg-orange-100 text-orange-700 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider">
                                {req.requestedRole}
                             </span>
                           </td>
                           <td className="px-8 py-5 text-sm font-medium text-zinc-600">
                              {req.formData?.phone || '-'}
                           </td>
                           <td className="px-8 py-5 text-right">
                             <div className="flex justify-end gap-2">
                               <button onClick={() => handleApproveRequest(req)} className="w-10 h-10 rounded-xl bg-green-100 text-green-600 flex items-center justify-center hover:bg-green-200 hover:scale-105 transition-all shadow-sm">
                                 <Check className="w-5 h-5" />
                               </button>
                               <button onClick={() => handleRejectRequest(req.id)} className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center hover:bg-rose-200 hover:scale-105 transition-all shadow-sm">
                                 <X className="w-5 h-5" />
                               </button>
                             </div>
                           </td>
                         </tr>
                       ))}
                       {roleRequests.length === 0 && (
                          <tr>
                             <td colSpan={4} className="px-8 py-12 text-center">
                                <div className="text-zinc-400 font-bold mb-1">Tudo limpo por aqui!</div>
                                <div className="text-zinc-500 text-sm">Nenhuma solicitação pendente no momento.</div>
                             </td>
                          </tr>
                       )}
                     </tbody>
                   </table>
                 </div>
              </div>
            )}

            {(activeTab === 'overview' || activeTab === 'home') && (
              <div className="bg-white rounded-3xl shadow-sm border border-zinc-100 overflow-hidden mb-8">
                 <div className="px-8 py-6 border-b border-zinc-100 flex justify-between items-center bg-white">
                   <div>
                       <h3 className="font-black text-xl text-zinc-900">Avaliações da Comunidade</h3>
                       <p className="text-sm text-zinc-500">Aprove os feedbacks para exibição na página inicial.</p>
                   </div>
                 </div>
                 <div className="p-0">
                    <FeedbackAdminList cityId={currentEffectiveCityId} />
                 </div>
              </div>
            )}

            {activeTab === 'bus' && (
              <div className="bg-white rounded-3xl shadow-sm border border-zinc-100 overflow-hidden mb-8">
                 <div className="px-8 py-6 border-b border-zinc-100 flex justify-between items-center bg-white">
                   <div>
                       <h3 className="font-black text-xl text-zinc-900">Gestão de Transporte</h3>
                       <p className="text-sm text-zinc-500">Adicione ou remova linhas de ônibus da cidade.</p>
                   </div>
                 </div>
                 <div className="p-8 space-y-6">
                    <BusScheduleAdminList cityId={currentEffectiveCityId} />
                 </div>
              </div>
            )}

            {activeTab === 'garbage' && <AdminGarbageCollection cityId={currentEffectiveCityId} />}
            {activeTab === 'adoption' && <AdminAdoption cityId={currentEffectiveCityId} />}
            {activeTab === 'animal_reports' && <AdminAnimalReports cityId={currentEffectiveCityId} />}

            {activeTab === 'home' && (
              <div className="bg-white rounded-3xl shadow-sm border border-zinc-100 overflow-hidden mb-8">
                 <div className="px-8 py-6 border-b border-zinc-100 flex justify-between items-center bg-white">
                   <div>
                       <h3 className="font-black text-xl text-zinc-900">Banners Destaques</h3>
                       <p className="text-sm text-zinc-500">Banners principais exibidos no topo da HomePage.</p>
                   </div>
                 </div>
                 <div className="p-8">
                    <BannersAdminList cityId={currentEffectiveCityId} />
                 </div>
              </div>
            )}

     </DashboardLayout>
  );
}

function BannersAdminList({ cityId: overrideCityId }: { cityId?: string }) {
   const { userProfile } = useAuth();
   const { confirm } = useConfirm();
   const [banners, setBanners] = useState<any[]>([]);
   const [adding, setAdding] = useState(false);
   const [newBanner, setNewBanner] = useState({ title: '', subtitle: '', imageUrl: '' });

   const isSuperAdmin = userProfile?.role === 'super_admin' || userProfile?.role === 'admin';
   const cityId = overrideCityId || userProfile?.cityId;

   useEffect(() => {
     const constraints: any[] = [];
     if (cityId) {
       constraints.push(where('cityId', '==', cityId));
     }
     const q = query(collection(db, 'banners'), ...constraints, orderBy('createdAt', 'desc'));
     const unsub = onSnapshot(q, (snapshot) => {
       setBanners(snapshot.docs.map(d => ({id: d.id, ...d.data()})));
     }, (err) => handleFirestoreError(err, OperationType.GET, 'banners'));
     return () => unsub();
   }, [isSuperAdmin, cityId]);

   const fetchBanners = async () => {}

   const handleAdd = async () => {
       if(!newBanner.title || !newBanner.imageUrl) return;
       try {
          const docId = `banner_${Date.now()}`;
          await setDoc(doc(db, 'banners', docId), {
             title: newBanner.title,
             subtitle: newBanner.subtitle,
             imageUrl: newBanner.imageUrl,
             active: true,
             pageEnabled: false,
             pageBlocks: [],
             type: 'global',
             cityId: !isSuperAdmin ? cityId : '', // Or a city selector for super admins
             createdBy: userProfile?.userId || '',
             createdAt: serverTimestamp()
          });
          setAdding(false);
          setNewBanner({title: '', subtitle: '', imageUrl: ''})
          fetchBanners();
       } catch(e) {
          handleFirestoreError(e, OperationType.WRITE, null);
       }
   }

   const toggleActive = async (id: string, active: boolean) => {
       try {
          await updateDoc(doc(db, 'banners', id), { active: !active });
          fetchBanners();
       } catch(e){}
   }
   
   const handleDelete = async (id: string) => {
       const isConfirmed = await confirm({
          title: 'Excluir Banner',
          description: 'Deseja remover este banner permanentemente?',
          type: 'danger',
          confirmText: 'Excluir'
       });
       if(isConfirmed) {
          try {
             await deleteDoc(doc(db, 'banners', id));
             toast.success('Banner excluído.');
             fetchBanners();
          } catch(e) {}
       }
   }
   
   return (
      <div>
         {!adding ? (
            <button onClick={() => setAdding(true)} className="mb-4 bg-primary text-white px-4 py-2 rounded-xl text-sm font-bold">
               + Novo Banner
            </button>
         ) : (
            <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 mb-4 space-y-3">
               <input type="text" placeholder="Título" value={newBanner.title} onChange={e => setNewBanner({...newBanner, title: e.target.value})} className="w-full px-3 py-2 border border-zinc-300 rounded-lg outline-none" />
               <input type="text" placeholder="Subtítulo" value={newBanner.subtitle} onChange={e => setNewBanner({...newBanner, subtitle: e.target.value})} className="w-full px-3 py-2 border border-zinc-300 rounded-lg outline-none" />
               <ImageUploader value={newBanner.imageUrl} onChange={val => setNewBanner({...newBanner, imageUrl: val || ''})} label="Imagem do Banner" />
               <div className="flex gap-2">
                  <button onClick={handleAdd} className="bg-primary text-white font-bold px-4 py-2 rounded-lg text-sm">Salvar Banner</button>
                  <button onClick={() => setAdding(false)} className="bg-zinc-200 text-zinc-700 font-bold px-4 py-2 rounded-lg text-sm">Cancelar</button>
               </div>
            </div>
         )}
         
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {banners.map(b => (
               <div key={b.id} className="group border border-zinc-200 rounded-xl overflow-hidden shadow-sm relative">
                  <img src={b.imageUrl} alt={b.title} className="w-full h-32 object-cover" />
                  <div className="p-3 bg-white">
                     <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                           <h4 className="font-bold text-zinc-800 text-sm truncate">{b.title}</h4>
                           <p className="text-[10px] text-zinc-500 truncate">{b.subtitle}</p>
                        </div>
                        <div className="flex items-center gap-2">
                           <button onClick={() => toggleActive(b.id, b.active)} className={`text-[10px] font-bold px-2 py-1 rounded-full ${b.active ? 'bg-green-100 text-green-700' : 'bg-zinc-200 text-zinc-600'}`}>
                              {b.active ? 'ATIVO' : 'OFF'}
                           </button>
                           <button onClick={() => handleDelete(b.id)} className="p-1.5 rounded-full bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100">
                              <Trash2 className="w-3 h-3" />
                           </button>
                        </div>
                     </div>
                  </div>
               </div>
            ))}
         </div>
      </div>
   )
}

function FeedbackAdminList({ cityId: overrideCityId }: { cityId?: string }) {
   const { userProfile } = useAuth();
   const [feedbacks, setFeedbacks] = useState<any[]>([]);
   const { confirm } = useConfirm();

   const isSuperAdmin = userProfile?.role === 'super_admin' || userProfile?.role === 'admin';
   const cityId = overrideCityId || userProfile?.cityId;

   useEffect(() => {
     const constraints: any[] = [where('approved', '==', false)];
     if (cityId) {
       constraints.push(where('cityId', '==', cityId));
     }
     const q = query(collection(db, 'feedbacks'), ...constraints);
     const unsub = onSnapshot(q, (snapshot) => {
       setFeedbacks(snapshot.docs.map(d => ({id: d.id, ...d.data()})));
     }, (err) => handleFirestoreError(err, OperationType.GET, 'feedbacks'));
     return () => unsub();
   }, [isSuperAdmin, cityId]);

   const fetchFeedbacks = async () => {}

   const approveFeedback = async (id: string) => {
     try {
       await updateDoc(doc(db, 'feedbacks', id), { approved: true });
       fetchFeedbacks();
     } catch(e) {}
   }

   const deleteFeedback = async (id: string) => {
     const isConfirmed = await confirm({
        title: 'Excluir Feedback',
        description: 'Tem certeza que deseja excluir esta avaliação da comunidade?',
        type: 'danger',
        confirmText: 'Sim, excluir',
     });
     if(isConfirmed) {
        try {
          await deleteDoc(doc(db, 'feedbacks', id));
          toast.success('Feedback excluído.');
          fetchFeedbacks();
        } catch(e) {}
     }
   }

   return (
      <table className="w-full text-left text-sm text-zinc-600">
         <thead className="bg-zinc-50 text-xs uppercase font-bold tracking-wider text-zinc-500">
            <tr>
               <th className="px-8 py-4">Usuário</th>
               <th className="px-8 py-4">Avaliação</th>
               <th className="px-8 py-4 w-1/2">Conteúdo</th>
               <th className="px-8 py-4 text-right">Ação</th>
            </tr>
         </thead>
         <tbody className="divide-y divide-zinc-100">
            {feedbacks.map(fb => (
               <tr key={fb.id} className="hover:bg-zinc-50/50 transition-colors">
                  <td className="px-8 py-5 font-bold text-zinc-900">{fb.userName}</td>
                  <td className="px-8 py-5 text-orange-500 font-black text-base">{fb.rating} ★</td>
                  <td className="px-8 py-5 max-w-xs"><p className="truncate" title={fb.content}>{fb.content}</p></td>
                  <td className="px-8 py-5 text-right">
                     <div className="flex justify-end gap-2">
                         <button onClick={() => approveFeedback(fb.id)} className="text-green-600 bg-green-100 px-4 py-2 text-xs font-black uppercase rounded-lg hover:bg-green-200 transition-colors">Aprovar</button>
                         <button onClick={() => deleteFeedback(fb.id)} className="text-rose-600 bg-rose-100 px-4 py-2 text-xs font-black uppercase rounded-lg hover:bg-rose-200 transition-colors">Deletar</button>
                     </div>
                  </td>
               </tr>
            ))}
            {feedbacks.length === 0 && (
               <tr><td colSpan={4} className="px-8 py-12 text-center text-zinc-500 font-medium">Nenhum feedback pendente</td></tr>
            )}
         </tbody>
      </table>
   )
}

function BusScheduleAdminList({ cityId: overrideCityId }: { cityId?: string }) {
   const { userProfile } = useAuth();
   const [schedules, setSchedules] = useState<any[]>([]);
   const [adding, setAdding] = useState(false);
   const [newSchedule, setNewSchedule] = useState({ routeName: '', stops: '', departureTimes: '', days: ['Segunda a Sexta'] });

   const isSuperAdmin = userProfile?.role === 'super_admin' || userProfile?.role === 'admin';
   const cityId = overrideCityId || userProfile?.cityId;

   const [confirmDelete, setConfirmDelete] = useState<{isOpen: boolean, id: string | null, routeName: string}>({isOpen: false, id: null, routeName: ''});

   useEffect(() => {
     const constraints: any[] = [];
     if (cityId) {
       constraints.push(where('cityId', '==', cityId));
     }
     const q = query(collection(db, 'bus_schedules'), ...constraints);
     const unsub = onSnapshot(q, (snapshot) => {
       setSchedules(snapshot.docs.map(d => ({id: d.id, ...d.data()})));
     }, (err) => handleFirestoreError(err, OperationType.GET, 'bus_schedules'));
     return () => unsub();
   }, [isSuperAdmin, cityId]);

   const fetchSchedules = async () => {}

   const handleAdd = async () => {
       if(!newSchedule.routeName) return;
       try {
          const docId = `bus_route_${Date.now()}`;
          const stopsArray = newSchedule.stops.split(',').map(s => s.trim()).filter(s => s);
          const timesArray = newSchedule.departureTimes.split(',').map(s => s.trim()).filter(s => s);
          await setDoc(doc(db, 'bus_schedules', docId), {
             routeName: newSchedule.routeName,
             stops: stopsArray,
             departureTimes: timesArray,
             days: newSchedule.days,
             active: true,
             cityId: !isSuperAdmin ? cityId : '',
          });
          setAdding(false);
          setNewSchedule({routeName: '', stops: '', departureTimes: '', days: ['Úteis']})
          fetchSchedules();
       } catch(e) { handleFirestoreError(e, OperationType.WRITE, null); }
   }

   const toggleDay = (day: string) => {
      const current = newSchedule.days;
      if (current.includes(day)) {
        setNewSchedule({ ...newSchedule, days: current.filter(d => d !== day) });
      } else {
        setNewSchedule({ ...newSchedule, days: [...current, day] });
      }
   };

   const toggleActive = async (id: string, active: boolean) => {
       try {
          await updateDoc(doc(db, 'bus_schedules', id), { active: !active });
          fetchSchedules();
       } catch(e){}
   }

   const requestDelete = (id: string, name: string) => {
      setConfirmDelete({isOpen: true, id, routeName: name});
   }

   const executeDelete = async () => {
      if(!confirmDelete.id) return;
      try {
         await deleteDoc(doc(db, 'bus_schedules', confirmDelete.id));
         setConfirmDelete({isOpen: false, id: null, routeName: ''});
         fetchSchedules();
      } catch(e) {}
   }

   return (
      <div>
         {!adding ? (
            <button onClick={() => setAdding(true)} className="mb-4 bg-primary text-white px-4 py-2 rounded-xl text-sm font-bold">
               + Nova Linha
            </button>
         ) : (
            <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 mb-4 space-y-3">
               <div><label className="text-xs font-bold text-zinc-500">Nome da Linha</label>
               <input type="text" placeholder="Ex: Linha 10 - Centro/Bairro" value={newSchedule.routeName} onChange={e => setNewSchedule({...newSchedule, routeName: e.target.value})} className="w-full px-3 py-2 border border-zinc-300 rounded-lg outline-none" /></div>
               
               <div><label className="text-xs font-bold text-zinc-500">Paradas (separadas por vírgula)</label>
               <input type="text" placeholder="Terminal, Praça, Bairro Novo..." value={newSchedule.stops} onChange={e => setNewSchedule({...newSchedule, stops: e.target.value})} className="w-full px-3 py-2 border border-zinc-300 rounded-lg outline-none" /></div>
               
               <div><label className="text-xs font-bold text-zinc-500">Horários (separados por vírgula)</label>
               <input type="text" placeholder="07:00, 08:30, 10:00..." value={newSchedule.departureTimes} onChange={e => setNewSchedule({...newSchedule, departureTimes: e.target.value})} className="w-full px-3 py-2 border border-zinc-300 rounded-lg outline-none" /></div>
               
               <div>
                  <label className="text-xs font-bold text-zinc-500 mb-2 block">Dias de Operação</label>
                  <div className="flex gap-2">
                     {['Segunda a Sexta', 'Sábado', 'Domingo', 'Feriados'].map(day => (
                        <button
                           key={day}
                           type="button"
                           onClick={() => toggleDay(day)}
                           className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${newSchedule.days.includes(day) ? 'bg-zinc-900 text-white border-zinc-900 shadow-lg shadow-black/10' : 'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-400'}`}
                        >
                           {day}
                        </button>
                     ))}
                  </div>
               </div>

               <div className="flex gap-2 pt-2">
                  <button onClick={handleAdd} className="bg-primary text-white font-bold px-4 py-2 rounded-lg text-sm">Salvar Linha</button>
                  <button onClick={() => setAdding(false)} className="bg-zinc-200 text-zinc-700 font-bold px-4 py-2 rounded-lg text-sm">Cancelar</button>
               </div>
            </div>
         )}
         
         <div className="space-y-3">
            {schedules.map(sch => (
               <div key={sch.id} className="border border-zinc-200 rounded-xl p-4 bg-white flex justify-between items-start">
                  <div>
                     <h4 className="font-bold text-zinc-800 text-sm mb-1">{sch.routeName}</h4>
                     <p className="text-xs text-zinc-500 mb-1"><span className="font-bold">Paradas:</span> {sch.stops?.join(', ')}</p>
                     <p className="text-xs text-zinc-500 mb-1"><span className="font-bold">Horários:</span> {sch.departureTimes?.join(', ')}</p>
                     <p className="text-[10px] text-primary font-black uppercase tracking-widest">DIAS: {sch.days?.join(', ') || 'Úteis'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                     <button onClick={() => toggleActive(sch.id, sch.active)} className={`text-[10px] font-bold px-2 py-1 rounded-full ${sch.active ? 'bg-green-100 text-green-700' : 'bg-zinc-100 text-zinc-500'}`}>
                        {sch.active ? 'ATIVO' : 'DESATIVADO'}
                     </button>
                     <button onClick={() => requestDelete(sch.id, sch.routeName)} className="text-xs text-rose-500 font-bold hover:underline">Excluir</button>
                  </div>
               </div>
            ))}
         </div>

         {/* CONFIRM DELETE MODAL */}
         {confirmDelete.isOpen && (
           <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="bg-white rounded-3xl p-6 w-full max-w-sm text-center">
                 <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trash2 className="w-8 h-8 text-rose-500" />
                 </div>
                 <h3 className="text-lg font-bold text-zinc-900 mb-2">Confirmar Exclusão</h3>
                 <p className="text-zinc-500 text-sm mb-6">Deseja realmente excluir a linha "{confirmDelete.routeName}"?</p>
                 <div className="flex gap-3">
                    <button onClick={() => setConfirmDelete({isOpen: false, id: null, routeName: ''})} className="flex-1 bg-zinc-100 font-bold px-4 py-3 rounded-xl hover:bg-zinc-200 text-zinc-700 transition-colors">
                       Cancelar
                    </button>
                    <button onClick={executeDelete} className="flex-1 bg-rose-500 text-white font-bold px-4 py-3 rounded-xl hover:bg-rose-600 transition-colors shadow-lg shadow-rose-500/20">
                       Excluir
                    </button>
                 </div>
              </div>
           </div>
         )}
      </div>
   )
}

function UsersAdminList({ isSuperAdmin, currentCityId }: { isSuperAdmin: boolean, currentCityId: string }) {
   const [users, setUsers] = useState<any[]>([]);
   const [searchTerm, setSearchTerm] = useState('');
   const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
   const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
   const [promoteData, setPromoteData] = useState({ email: '', role: 'merchant', cityId: currentCityId || '' });
   const [createData, setCreateData] = useState({ email: '', password: '', name: '', role: 'city_admin', cityId: currentCityId || '' });
   const [isCreating, setIsCreating] = useState(false);
   const { cities } = useCity();
   const { confirm } = useConfirm();

   useEffect(() => {
     const constraints: any[] = [];
     if (!isSuperAdmin && currentCityId) {
        constraints.push(where('cityId', '==', currentCityId));
     }
     const q = query(collection(db, 'users'), ...constraints);
     const unsub = onSnapshot(q, (snapshot) => {
       setUsers(snapshot.docs.map(d => ({id: d.id, ...d.data()})));
     }, (err) => handleFirestoreError(err, OperationType.GET, 'users'));
     return () => unsub();
   }, [isSuperAdmin, currentCityId]);

   const fetchUsers = async () => {}

   const handlePromoteUser = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!promoteData.email) return;

      try {
         // Find user by email
         const q = query(collection(db, 'users'), where('email', '==', promoteData.email));
         const snap = await getDocs(q);
         
         if (snap.empty) {
            toast.error('Usuário não encontrado com este email.');
            return;
         }

         const userDoc = snap.docs[0];
         await updateDoc(doc(db, 'users', userDoc.id), {
            role: promoteData.role,
            cityId: promoteData.cityId,
            updatedAt: serverTimestamp()
         });

         toast.success(`Usuário configurado com sucesso!`);
         setIsPromoteModalOpen(false);
         setPromoteData({ email: '', role: 'merchant', cityId: currentCityId || '' });
         fetchUsers();
      } catch (e) {
         toast.error('Erro ao configurar usuário.');
         handleFirestoreError(e, OperationType.WRITE, null);
      }
   };

   const handleCreateUser = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!createData.email || !createData.password || !createData.name) return;

      setIsCreating(true);
      try {
         await createManagedUser(
            createData.email,
            createData.password,
            createData.name,
            createData.role,
            createData.cityId
         );
         toast.success('Conta criada com sucesso!');
         setIsCreateModalOpen(false);
         setCreateData({ email: '', password: '', name: '', role: 'city_admin', cityId: currentCityId || '' });
      } catch (e: any) {
         console.error(e);
         if (e.code === 'auth/email-already-in-use') {
            toast.error('Este email já está em uso.');
         } else if (e.code === 'auth/weak-password') {
            toast.error('A senha deve ter pelo menos 6 caracteres.');
         } else {
            toast.error('Erro ao criar conta.');
         }
      } finally {
         setIsCreating(false);
      }
   };

   const deleteUser = async (id: string, role: string) => {
     const isConfirmed = await confirm({
        title: 'Excluir Usuário',
        description: 'Atenção: isto removerá apenas o documento "users". Recursos associados devem ser apagados manualmente para evitar orfandade. Prosseguir?',
        type: 'danger',
        confirmText: 'Sim, excluir'
     });

     if(isConfirmed) {
        try {
           await deleteDoc(doc(db, 'users', id));
           toast.success('Usuário removido com sucesso!');
           fetchUsers();
        } catch(e){
           toast.error('Erro ao excluir usuário');
        }
     }
   }

   const filteredUsers = users.filter(u => 
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.name?.toLowerCase().includes(searchTerm.toLowerCase())
   );

   return (
      <div className="space-y-6">
         <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 group">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 group-focus-within:text-emerald-500 transition-colors" />
               <input 
                  type="text" 
                  placeholder="Buscar por nome ou email..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 pl-12 pr-4 py-3.5 rounded-2xl outline-none focus:border-emerald-500 focus:bg-white transition-all font-medium"
               />
            </div>
            <div className="flex gap-2">
               <button 
                  onClick={() => setIsPromoteModalOpen(true)}
                  className="bg-zinc-100 text-zinc-900 px-6 py-3.5 rounded-2xl font-bold flex items-center gap-2 hover:bg-zinc-200 transition-all border border-zinc-200"
               >
                  <UserPlus className="w-5 h-5 text-zinc-500" /> Configurar Perfil
               </button>
               <button 
                  onClick={() => setIsCreateModalOpen(true)}
                  className="bg-emerald-600 text-white px-6 py-3.5 rounded-2xl font-bold flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20"
               >
                  <PlusCircle className="w-5 h-5" /> Criar Conta
               </button>
            </div>
         </div>

         {isPromoteModalOpen && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
               <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                  <div className="px-8 py-6 border-b border-zinc-100 flex items-center justify-between">
                     <h3 className="font-black text-xl text-zinc-900">Configurar Perfil</h3>
                     <button onClick={() => setIsPromoteModalOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                        <X className="w-6 h-6" />
                     </button>
                  </div>
                  <form onSubmit={handlePromoteUser} className="p-8 space-y-6">
                     <div className="space-y-4">
                        <div>
                           <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Email do Usuário Destino</label>
                           <div className="relative">
                              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                              <input 
                                 required
                                 type="email" 
                                 placeholder="ex: usuario@email.com" 
                                 value={promoteData.email}
                                 onChange={e => setPromoteData({...promoteData, email: e.target.value})}
                                 className="w-full bg-zinc-50 border border-zinc-200 pl-12 pr-4 py-3.5 rounded-xl outline-none focus:border-emerald-500 focus:bg-white font-medium"
                              />
                           </div>
                           <p className="text-[10px] text-zinc-400 mt-2">O usuário deve estar cadastrado na plataforma para mudar o layout.</p>
                        </div>
                        <div>
                           <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Novo Perfil / Layout</label>
                           <select 
                              value={promoteData.role}
                              onChange={e => setPromoteData({...promoteData, role: e.target.value})}
                              className="w-full bg-zinc-50 border border-zinc-200 px-4 py-3.5 rounded-xl outline-none focus:border-emerald-500 font-bold"
                           >
                              <option value="client">Cliente Padrão</option>
                              <option value="merchant">Comerciante (Vitrine Online)</option>
                              <option value="provider">Prestador de Serviços</option>
                              <option value="driver">Motorista Particular</option>
                              <option value="city_admin">Gestor de Cidade (Admin Local)</option>
                              {isSuperAdmin && (
                                <>
                                  <option value="admin">Administrador Geral</option>
                                  <option value="super_admin">Superior Admin</option>
                                </>
                              )}
                           </select>
                        </div>

                        {(promoteData.role === 'city_admin' || isSuperAdmin) && (
                          <div>
                             <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Cidade de Atuação</label>
                             <select 
                                value={promoteData.cityId}
                                onChange={e => setPromoteData({...promoteData, cityId: e.target.value})}
                                className="w-full bg-zinc-50 border border-zinc-200 px-4 py-3.5 rounded-xl outline-none focus:border-emerald-500 font-bold"
                             >
                                <option value="">Global / Todas</option>
                                {cities.map(city => (
                                  <option key={city.id} value={city.id}>{city.name}</option>
                                ))}
                             </select>
                             <p className="text-[10px] text-zinc-400 mt-2">Pode ser deixado vazio para administradores globais.</p>
                          </div>
                        )}
                     </div>
                     <button type="submit" className="w-full bg-emerald-600 text-white font-black py-4 rounded-xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-all uppercase tracking-widest text-sm">
                        Confirmar Mudança
                     </button>
                  </form>
               </div>
            </div>
         )}

         {isCreateModalOpen && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
               <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                  <div className="px-8 py-6 border-b border-zinc-100 flex items-center justify-between">
                     <h3 className="font-black text-xl text-zinc-900">Criar Nova Conta</h3>
                     <button onClick={() => setIsCreateModalOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                        <X className="w-6 h-6" />
                     </button>
                  </div>
                  <form onSubmit={handleCreateUser} className="p-8 space-y-6">
                     <div className="space-y-4">
                        <div>
                           <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Nome Completo</label>
                           <input 
                              required
                              type="text" 
                              placeholder="ex: João Silva" 
                              value={createData.name}
                              onChange={e => setCreateData({...createData, name: e.target.value})}
                              className="w-full bg-zinc-50 border border-zinc-200 px-4 py-3.5 rounded-xl outline-none focus:border-emerald-500 focus:bg-white font-medium"
                           />
                        </div>
                        <div>
                           <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 block">E-mail (Login)</label>
                           <input 
                              required
                              type="email" 
                              placeholder="ex: cidade@gmail.com" 
                              value={createData.email}
                              onChange={e => setCreateData({...createData, email: e.target.value})}
                              className="w-full bg-zinc-50 border border-zinc-200 px-4 py-3.5 rounded-xl outline-none focus:border-emerald-500 focus:bg-white font-medium"
                           />
                        </div>
                        <div>
                           <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Senha de Acesso</label>
                           <div className="relative">
                              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                              <input 
                                 required
                                 type="password" 
                                 minLength={6}
                                 placeholder="min. 6 caracteres" 
                                 value={createData.password}
                                 onChange={e => setCreateData({...createData, password: e.target.value})}
                                 className="w-full bg-zinc-50 border border-zinc-200 pl-12 pr-4 py-3.5 rounded-xl outline-none focus:border-emerald-500 focus:bg-white font-medium"
                              />
                           </div>
                        </div>
                        <div>
                           <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Função Inicial</label>
                           <select 
                              value={createData.role}
                              onChange={e => setCreateData({...createData, role: e.target.value})}
                              className="w-full bg-zinc-50 border border-zinc-200 px-4 py-3.5 rounded-xl outline-none focus:border-emerald-500 font-bold"
                           >
                              <option value="city_admin">Gestor de Cidade (Admin Local)</option>
                              <option value="city_editor">Editor de Cidade</option>
                              <option value="city_support">Suporte de Cidade</option>
                              <option value="client">Cliente</option>
                           </select>
                        </div>
                        <div>
                           <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Cidade Vinculada</label>
                           <select 
                              value={createData.cityId}
                              onChange={e => setCreateData({...createData, cityId: e.target.value})}
                              className="w-full bg-zinc-50 border border-zinc-200 px-4 py-3.5 rounded-xl outline-none focus:border-emerald-500 font-bold"
                           >
                              <option value="">Nenhuma (Global)</option>
                              {cities.map(city => (
                                <option key={city.id} value={city.id}>{city.name}</option>
                              ))}
                           </select>
                        </div>
                     </div>
                     <button 
                       type="submit" 
                       disabled={isCreating}
                       className="w-full bg-emerald-600 text-white font-black py-4 rounded-xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-all uppercase tracking-widest text-sm disabled:opacity-50"
                     >
                        {isCreating ? 'Criando Conta...' : 'Criar Conta Agora'}
                     </button>
                  </form>
               </div>
            </div>
         )}

         <div className="bg-white rounded-3xl border border-zinc-100 overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm text-zinc-600">
               <thead className="bg-zinc-50/50 text-xs uppercase font-bold tracking-wider text-zinc-500">
                  <tr>
                     <th className="px-8 py-5">Nome / Email</th>
                     <th className="px-8 py-5">Função</th>
                     <th className="px-8 py-5">Cadastro</th>
                     <th className="px-8 py-5 text-right">Ações Dashboard</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-zinc-100">
                  {filteredUsers.map(u => (
               <tr key={u.id} className="hover:bg-zinc-50/50 transition-colors">
                  <td className="px-8 py-4">
                     <div className="font-bold text-zinc-900 text-base">{u.name}</div>
                     <div className="text-zinc-500 text-sm mt-0.5">{u.email}</div>
                  </td>
                  <td className="px-8 py-4">
                     <span className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider ${
                        u.role === 'admin' ? 'bg-black text-white' :
                        u.role === 'merchant' ? 'bg-green-100 text-green-700' :
                        u.role === 'driver' ? 'bg-orange-100 text-orange-700' :
                        u.role === 'provider' ? 'bg-blue-100 text-blue-700' :
                        'bg-zinc-100 text-zinc-600'
                     }`}>
                        {u.role || 'client'}
                     </span>
                  </td>
                  <td className="px-8 py-4 text-sm font-medium">
                     {u.createdAt?.toDate ? u.createdAt.toDate().toLocaleDateString() : '-'}
                  </td>
                  <td className="px-8 py-4 text-right">
                     <div className="flex justify-end gap-2">
                        {u.role === 'merchant' && (
                           <button onClick={() => window.open(`/comerciante/painel?admin_view=${u.id}`, '_blank')} className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center hover:bg-green-200 transition-colors" title="Acessar Painel">
                              <ExternalLink className="w-5 h-5 text-green-600" />
                           </button>
                        )}
                        {u.role === 'provider' && (
                           <button onClick={() => window.open(`/prestador/painel?admin_view=${u.id}`, '_blank')} className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center hover:bg-blue-200 transition-colors" title="Acessar Painel">
                              <ExternalLink className="w-5 h-5 text-blue-600" />
                           </button>
                        )}
                        {u.role === 'driver' && (
                           <button onClick={() => window.open(`/motorista/painel?admin_view=${u.id}`, '_blank')} className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center hover:bg-orange-200 transition-colors" title="Acessar Painel">
                              <ExternalLink className="w-5 h-5 text-orange-600" />
                           </button>
                        )}
                        <button onClick={() => deleteUser(u.id, u.role)} className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center hover:bg-rose-200 transition-colors" title="Deletar Usuário">
                           <Trash2 className="w-5 h-5 text-rose-600" />
                        </button>
                     </div>
                  </td>
               </tr>
            ))}
         </tbody>
      </table>
    </div>
   </div>
   )
}

