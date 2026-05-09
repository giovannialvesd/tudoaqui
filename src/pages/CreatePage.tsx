import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, CarFront, Wrench, ChevronLeft, ArrowRight, UserCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function CreatePage() {
  const navigate = useNavigate();
  const { userProfile } = useAuth();

  return (
    <div className="min-h-screen bg-bg-base flex flex-col md:pt-4">
      <div className="bg-white p-4 sticky top-0 z-10 border-b border-zinc-100 md:hidden">
         <div className="flex items-center gap-3 mb-4">
            <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-zinc-100 transition-colors">
               <ChevronLeft className="w-6 h-6 text-zinc-600" />
            </button>
            <h1 className="text-xl font-bold text-zinc-900">Anunciar</h1>
         </div>
      </div>

      <div className="px-4 py-6 md:px-8 max-w-screen-xl mx-auto w-full">
         <div className="text-center mb-8 mt-4 md:mt-10">
            <h1 className="text-3xl font-black text-zinc-900 mb-3 tracking-tight">O que você deseja anunciar?</h1>
            <p className="text-zinc-500 font-medium max-w-lg mx-auto">Escolha uma das categorias abaixo para começar a oferecer seus serviços ou produtos na plataforma.</p>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            <div onClick={() => navigate('/perfil')} className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-sm hover:border-primary hover:shadow-lg transition-all cursor-pointer group flex flex-col h-full">
               <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Store className="w-7 h-7 text-emerald-600" />
               </div>
               <h3 className="text-xl font-bold text-zinc-900 mb-2">Comércio / Loja</h3>
               <p className="text-sm text-zinc-500 mb-6 flex-1">Venda produtos, comidas, roupas e outros itens cadastrando seu próprio comércio.</p>
               <div className="flex items-center text-primary font-bold text-sm">
                  Começar agora <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
               </div>
            </div>

            <div onClick={() => navigate('/perfil')} className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-sm hover:border-primary hover:shadow-lg transition-all cursor-pointer group flex flex-col h-full">
               <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <CarFront className="w-7 h-7 text-orange-600" />
               </div>
               <h3 className="text-xl font-bold text-zinc-900 mb-2">Motorista</h3>
               <p className="text-sm text-zinc-500 mb-6 flex-1">Cadastre seu veículo e ofereça corridas ou fretes para a comunidade.</p>
               <div className="flex items-center text-primary font-bold text-sm">
                  Começar agora <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
               </div>
            </div>

            <div onClick={() => navigate('/perfil')} className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-sm hover:border-primary hover:shadow-lg transition-all cursor-pointer group flex flex-col h-full">
               <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Wrench className="w-7 h-7 text-blue-600" />
               </div>
               <h3 className="text-xl font-bold text-zinc-900 mb-2">Prestador de Serviço</h3>
               <p className="text-sm text-zinc-500 mb-6 flex-1">Ofereça serviços de manutenção, beleza, aulas, limpeza e muito mais.</p>
               <div className="flex items-center text-primary font-bold text-sm">
                  Começar agora <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
               </div>
            </div>
         </div>

         {!userProfile && (
            <div className="mt-12 bg-primary/10 rounded-3xl p-6 border border-primary/20 flex flex-col md:flex-row items-center justify-between gap-6 max-w-4xl mx-auto">
               <div className="flex items-center gap-4">
                  <UserCircle className="w-12 h-12 text-primary" />
                  <div>
                     <h4 className="font-bold text-zinc-900">Você precisa de uma conta</h4>
                     <p className="text-sm text-zinc-600">Crie sua conta para poder gerenciar seus anúncios.</p>
                  </div>
               </div>
               <button onClick={() => navigate('/login')} className="bg-primary text-white font-bold px-8 py-3 rounded-full hover:bg-primary/90 transition-colors w-full md:w-auto">
                  Fazer Login
               </button>
            </div>
         )}
      </div>
    </div>
  );
}
