import React, { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Bell, Menu, X, ArrowLeft, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { toast } from 'sonner';
import { Logo } from '../components/Logo';

export interface DashboardSidebarItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
  section?: string;
}

interface DashboardLayoutProps {
  title: string;
  subtitle?: string;
  sidebarItems: DashboardSidebarItem[];
  activeTab: string;
  setActiveTab: (id: string) => void;
  children: ReactNode;
  headerExtra?: ReactNode;
}

export default function DashboardLayout({ title, subtitle, sidebarItems, activeTab, setActiveTab, children, headerExtra }: DashboardLayoutProps) {
  const { userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const queryParams = new URLSearchParams(location.search);
  const adminViewId = queryParams.get('admin_view');
  const isCityAdmin = ['city_admin', 'city_editor', 'city_support'].includes(userProfile?.role || '');
  const isAdmin = userProfile?.role === 'admin' || userProfile?.role === 'super_admin' || isCityAdmin;

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      toast.error('Erro ao sair da conta');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50/50 flex font-sans">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside 
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 w-72 bg-zinc-950 text-zinc-300 flex flex-col transition-transform duration-300 shadow-2xl lg:shadow-none border-r border-zinc-900",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="p-6 md:p-8 flex items-center justify-between">
           <div>
              <div className="flex items-center gap-2 mb-1 cursor-pointer" onClick={() => navigate('/')}>
                 <Logo className="w-8 h-8" />
                 <h1 className="text-white font-bold text-xl tracking-tight">TudoAqui</h1>
              </div>
              <p className="text-xs text-zinc-500 font-medium">Painel Corporativo v2.0</p>
           </div>
           <button onClick={() => setMobileMenuOpen(false)} className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg bg-zinc-800 text-zinc-400">
              <X className="w-5 h-5" />
           </button>
        </div>

        <nav className="flex-1 px-4 space-y-6 overflow-y-auto no-scrollbar pb-6 mt-4">
          {Object.entries(
            sidebarItems.reduce((acc, item) => {
              const sec = item.section || 'Menu Principal';
              if (!acc[sec]) acc[sec] = [];
              acc[sec].push(item);
              return acc;
            }, {} as Record<string, DashboardSidebarItem[]>)
          ).map(([sectionName, items]) => (
            <div key={sectionName} className="space-y-1.5">
              {sectionName !== 'Menu Principal' && (
                 <div className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-3 px-4">{sectionName}</div>
              )}
              {items.map((item) => (
                <button 
                   key={item.id} 
                   onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); }}
                   className={cn(
                     "w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all group",
                     activeTab === item.id 
                       ? "bg-primary/10 text-primary font-bold" 
                       : "hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200"
                   )}
                >
                  <div className="flex items-center gap-3">
                      <item.icon className={cn("w-5 h-5 transition-colors", activeTab === item.id ? "text-primary" : "text-zinc-500 group-hover:text-zinc-300")} strokeWidth={activeTab === item.id ? 2.5 : 2} />
                      {item.label}
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                     <span className={cn(
                        "min-w-6 text-center text-[10px] font-black rounded-full px-1.5 py-0.5",
                        activeTab === item.id ? "bg-primary text-white" : "bg-rose-500 text-white"
                     )}>
                        {item.badge}
                     </span>
                  )}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-zinc-900">
           <div className="flex items-center gap-3 px-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center font-bold text-white shrink-0">
                 {userProfile?.name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                 <p className="text-sm font-bold text-white truncate">{userProfile?.name}</p>
                 <p className="text-xs text-zinc-500 uppercase tracking-wider font-bold">
                    {userProfile?.role === 'merchant' ? 'Comerciante' :
                     userProfile?.role === 'driver' ? 'Motorista' :
                     userProfile?.role === 'provider' ? 'Prestador' :
                     userProfile?.role === 'super_admin' ? 'Super Admin' :
                     userProfile?.role === 'admin' ? 'Administrador' : 
                     isCityAdmin ? 'Painel da Cidade' : 'Usuário'}
                 </p>
              </div>
           </div>
           
           <button onClick={() => navigate('/')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 transition-colors">
              <ArrowLeft className="w-5 h-5 text-zinc-500" />
              Voltar ao Site
           </button>
           
           <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium hover:bg-rose-500/10 text-zinc-400 hover:text-rose-500 transition-colors mt-1">
              <LogOut className="w-5 h-5" />
              Sair da Conta
           </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 min-h-screen">
         {isAdmin && adminViewId && (
            <div className="h-10 bg-amber-500 text-amber-950 px-6 py-2 text-[10px] md:text-xs font-black uppercase tracking-wider flex items-center justify-between gap-4 sticky top-0 z-[60] shadow-sm border-b border-amber-600/20">
               <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-amber-950/10 rounded-lg flex items-center justify-center animate-pulse text-amber-950">
                     <ShieldAlert className="w-4 h-4" />
                  </div>
                  <span>Você está visualizando o painel como <span className="underline decoration-amber-950/30 font-extrabold">ID: {adminViewId}</span></span>
               </div>
               <button 
                  onClick={() => {
                    const params = new URLSearchParams(location.search);
                    params.delete('admin_view');
                    navigate({
                      pathname: location.pathname,
                      search: params.toString()
                    });
                    if (location.pathname.includes('painel')) navigate('/admin');
                  }} 
                  className="bg-amber-950 text-white px-4 py-1.5 rounded-lg text-[10px] font-black hover:bg-black transition-all shadow-sm"
               >
                  SAIR DA EMULAÇÃO
               </button>
            </div>
         )}

         {/* Top Header */}
         <header className={cn(
            "h-20 bg-white border-b border-zinc-200 flex items-center justify-between px-6 lg:px-10 shrink-0 sticky z-30 shadow-sm transition-all",
            isAdmin && adminViewId ? "top-10" : "top-0"
         )}>
            <div className="flex items-center gap-4">
               <button onClick={() => setMobileMenuOpen(true)} className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-100 text-zinc-600">
                  <Menu className="w-5 h-5" />
               </button>
               <div>
                  <h2 className="text-xl md:text-2xl font-black text-zinc-900 tracking-tight leading-none">{title}</h2>
                  {subtitle && <p className="text-sm text-zinc-500 font-medium mt-1">{subtitle}</p>}
               </div>
            </div>
            
            <div className="flex items-center gap-4">
               {headerExtra}
            </div>
         </header>

         {/* Content Area */}
         <div className="flex-1 p-6 lg:p-10 overflow-y-auto w-full max-w-[1600px] mx-auto">
            {children}
         </div>
      </main>
    </div>
  );
}
