import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Home, Search, Heart, User, LayoutDashboard, Bell } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import SmartTopBar from '../components/SmartTopBar';
import CitySelector from '../components/CitySelector';
import Footer from '../components/Footer';
import { Toaster } from 'sonner';
import { Logo } from '../components/Logo';

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { userProfile, currentUser } = useAuth();

  const handleMySpace = () => {
    if (!userProfile) {
      navigate('/login');
      return;
    }
    const isCityAdmin = ['city_admin', 'city_editor', 'city_support'].includes(userProfile.role);
    const isGlobalAdmin = userProfile.role === 'admin' || userProfile.role === 'super_admin';
    const isAdmin = isGlobalAdmin || isCityAdmin;

    if (isAdmin) navigate('/admin');
    else if (userProfile.role === 'merchant') navigate('/comerciante/painel');
    else if (userProfile.role === 'driver') navigate('/motorista/painel');
    else if (userProfile.role === 'provider') navigate('/prestador/painel');
    else navigate('/perfil');
  };

  const isCityAdmin = ['city_admin', 'city_editor', 'city_support'].includes(userProfile?.role || '');
  const isGlobalAdmin = userProfile?.role === 'admin' || userProfile?.role === 'super_admin';
  const isAdmin = isGlobalAdmin || isCityAdmin;
  const showMySpace = userProfile && userProfile.role !== 'client';

  const NAV_ITEMS = [
    { id: 'home', title: 'Início', icon: Home, path: '/' },
    { id: 'search', title: 'Busca', icon: Search, path: '/busca' },
    ...(showMySpace ? [{ id: 'myspace', title: isAdmin ? 'Painel Admin' : 'Meu Espaço', icon: LayoutDashboard, action: handleMySpace }] : []),
    { id: 'favorites', title: 'Favoritos', icon: Heart, path: '/favoritos' },
    { id: 'profile', title: 'Perfil', icon: User, path: '/perfil' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-bg-base pb-16 md:pb-0">
      <SmartTopBar />
      
      {/* Desktop Topbar */}
      <header className="hidden md:flex items-center justify-between px-8 py-4 bg-white border-b border-zinc-100 shadow-sm sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <Logo className="w-10 h-10" />
            <span className="font-black text-2xl text-zinc-900 tracking-tight">Tudo<span className="text-primary">Aqui</span></span>
          </div>
          
          <div className="h-8 w-px bg-zinc-100 hidden lg:block"></div>
          
          <CitySelector />
        </div>
        
        <div className="flex-1 max-w-xl px-8">
           <div 
             className="relative flex items-center bg-zinc-50 px-5 py-3 rounded-2xl border border-zinc-200 hover:border-primary/30 hover:bg-white hover:shadow-md transition-all cursor-pointer group"
             onClick={() => navigate('/busca')}
           >
             <Search className="w-5 h-5 text-zinc-400 mr-3 group-hover:text-primary transition-colors" />
             <span className="text-zinc-500 font-medium text-sm">O que você está procurando hoje?</span>
             <div className="absolute right-3 bg-zinc-200 text-zinc-500 px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-widest uppercase">Pesquisar</div>
           </div>
        </div>

        <div className="flex items-center gap-2">
          {showMySpace && (
            <button onClick={handleMySpace} className="hidden lg:flex px-4 py-2 bg-zinc-900 text-white font-bold rounded-xl hover:bg-black hover:shadow-lg transition-all items-center gap-2 mr-2">
               <LayoutDashboard className="w-4 h-4" />
               {isAdmin ? 'Painel Admin' : 'Meu Espaço'}
            </button>
          )}
          
          <div className="flex items-center gap-3 cursor-pointer p-1.5 pl-3 pr-4 rounded-full border border-zinc-200 hover:border-primary/30 bg-zinc-50 hover:bg-white transition-all group" onClick={() => navigate('/perfil')}>
            <div className="flex flex-col items-end">
               <span className="text-sm font-bold text-zinc-900 leading-tight group-hover:text-primary transition-colors">{userProfile?.name?.split(' ')[0] || 'Entrar'}</span>
               {userProfile && (
                  <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">{isAdmin ? 'Administrador' : userProfile.role === 'client' ? 'Cliente' : 'Parceiro'}</span>
               )}
            </div>
            <div className="w-9 h-9 bg-zinc-200 rounded-full flex items-center justify-center text-zinc-600 font-black shadow-inner">
               {userProfile?.name?.charAt(0) || <User className="w-4 h-4" />}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-screen-xl mx-auto overflow-x-hidden pt-4 md:pt-8 min-h-[70vh]">
        <Outlet />
      </main>
      
      <Footer />

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 w-full bg-white border-t border-zinc-100 z-50 px-2 py-2 flex justify-around items-center pb-safe">
        {NAV_ITEMS.map(item => {
          const isActive = item.path ? (location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path))) : false;
          const isMySpace = item.id === 'myspace';

          return (
            <button 
              key={item.id} 
              onClick={item.action || (() => navigate(item.path || '/'))}
              className={cn("flex flex-col items-center justify-center w-16 h-12 transition-colors relative", isActive ? "text-primary" : "text-zinc-400")}
            >
               {isMySpace ? (
                 <>
                   <div className="absolute -top-5 w-12 h-12 bg-zinc-900 rounded-full flex items-center justify-center text-white shadow-lg shadow-zinc-900/30">
                     <item.icon className="w-5 h-5" />
                   </div>
                   <span className="text-[10px] font-bold text-zinc-800 absolute bottom-1 whitespace-nowrap mt-8">{item.title}</span>
                 </>
               ) : (
                 <>
                   <item.icon className={cn("w-6 h-6 mb-1", isActive && "fill-primary/10")} />
                   <span className="text-[10px] font-medium">{item.title}</span>
                 </>
               )}
            </button>
          )
        })}
      </nav>
    <Toaster position="top-center" richColors />
    </div>
  );
}
