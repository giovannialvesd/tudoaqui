import React from 'react';
import { Heart, Instagram, Facebook, Twitter, MapPin, Mail, Phone, Store, Zap, Briefcase, ChevronRight } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { Logo } from './Logo';

export default function Footer() {
  const navigate = useNavigate();

  return (
    <footer className="bg-white border-t border-zinc-200 pt-16 pb-24 md:pb-12 mt-auto">
      <div className="max-w-screen-xl mx-auto px-4 md:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
        
        {/* Brand & Sobre */}
        <div className="space-y-5">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <Logo className="w-10 h-10" />
            <span className="font-black text-2xl text-zinc-900 tracking-tight">Tudo<span className="text-primary">Aqui</span></span>
          </div>
          <p className="text-sm text-zinc-500 leading-relaxed max-w-xs">
            A conexão perfeita entre pessoas e negócios locais. Feito para facilitar sua vida e impulsionar o comércio da região.
          </p>
          <div className="flex gap-3 pt-2">
            <a href="#" className="w-10 h-10 bg-zinc-50 rounded-full flex items-center justify-center text-zinc-500 hover:bg-primary hover:text-white transition-all transform hover:-translate-y-1"><Instagram className="w-5 h-5" /></a>
            <a href="#" className="w-10 h-10 bg-zinc-50 rounded-full flex items-center justify-center text-zinc-500 hover:bg-primary hover:text-white transition-all transform hover:-translate-y-1"><Facebook className="w-5 h-5" /></a>
            <a href="#" className="w-10 h-10 bg-zinc-50 rounded-full flex items-center justify-center text-zinc-500 hover:bg-primary hover:text-white transition-all transform hover:-translate-y-1"><Twitter className="w-5 h-5" /></a>
          </div>
        </div>

        {/* Explorar */}
        <div>
          <h3 className="font-black text-zinc-900 mb-6 uppercase tracking-wider text-sm flex items-center gap-2">Explorar Navegação</h3>
          <ul className="space-y-3">
            <li><Link to="/" className="text-zinc-500 hover:text-primary transition-colors flex items-center gap-2 font-medium text-sm group"><ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-primary transition-colors"/> Início</Link></li>
            <li><Link to="/busca" className="text-zinc-500 hover:text-primary transition-colors flex items-center gap-2 font-medium text-sm group"><ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-primary transition-colors"/> Buscar Tudo</Link></li>
            <li><Link to="/campanhas" className="text-zinc-500 hover:text-primary transition-colors flex items-center gap-2 font-medium text-sm group"><ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-primary transition-colors"/> Campanhas Sociais</Link></li>
            <li><Link to="/onibus" className="text-zinc-500 hover:text-primary transition-colors flex items-center gap-2 font-medium text-sm group"><ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-primary transition-colors"/> Horários de Ônibus</Link></li>
          </ul>
        </div>

        {/* Para Parceiros */}
        <div>
          <h3 className="font-black text-zinc-900 mb-6 uppercase tracking-wider text-sm flex items-center gap-2">Seja um Parceiro</h3>
          <ul className="space-y-3">
            <li><Link to="/perfil" className="text-zinc-500 hover:text-primary transition-colors flex items-center gap-2 font-medium text-sm group"><Store className="w-4 h-4 text-emerald-500"/> Cadastrar Comércio</Link></li>
            <li><Link to="/perfil" className="text-zinc-500 hover:text-primary transition-colors flex items-center gap-2 font-medium text-sm group"><Zap className="w-4 h-4 text-orange-500"/> Ser Motorista</Link></li>
            <li><Link to="/perfil" className="text-zinc-500 hover:text-primary transition-colors flex items-center gap-2 font-medium text-sm group"><Briefcase className="w-4 h-4 text-blue-500"/> Oferecer Serviços</Link></li>
            <li><Link to="/login" className="text-zinc-500 hover:text-primary transition-colors flex items-center gap-2 font-medium text-sm group"><ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-primary transition-colors"/> Login / Cadastro</Link></li>
          </ul>
        </div>

        {/* Contato */}
        <div>
          <h3 className="font-black text-zinc-900 mb-6 uppercase tracking-wider text-sm flex items-center gap-2">Centro de Ajuda</h3>
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
               <div className="w-8 h-8 rounded-lg bg-zinc-50 flex items-center justify-center shrink-0"><MapPin className="w-4 h-4 text-zinc-500" /></div>
               <span className="text-sm text-zinc-500 font-medium leading-tight pt-1.5">Nova Bréscia - RS</span>
            </li>
            <li className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-lg bg-zinc-50 flex items-center justify-center shrink-0"><Phone className="w-4 h-4 text-zinc-500" /></div>
               <span className="text-sm text-zinc-500 font-medium">51 981954464</span>
            </li>
            <li className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-lg bg-zinc-50 flex items-center justify-center shrink-0"><Mail className="w-4 h-4 text-zinc-500" /></div>
               <span className="text-sm text-zinc-500 font-medium">tudoaqui.juntos@gmail.com</span>
            </li>
          </ul>
        </div>
        
      </div>
      
      {/* Bottom Bar */}
      <div className="max-w-screen-xl mx-auto px-4 md:px-8 mt-12 pt-8 border-t border-zinc-200/60 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-sm font-medium text-zinc-400">© {new Date().getFullYear()} TudoAqui Plataforma. Todos os direitos reservados.</p>
        <p className="text-sm font-bold flex items-center text-zinc-500">
          Feito com <Heart className="w-4 h-4 text-rose-500 mx-1.5 fill-rose-500 animate-pulse" /> conectando pessoas
        </p>
      </div>
    </footer>
  );
}
