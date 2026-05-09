import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, ArrowLeft } from 'lucide-react';
import { Logo } from '../components/Logo';

export default function AuthPage() {
  const { currentUser, signInWithGoogle, signInWithEmail, registerWithEmail, loading } = useAuth();
  const navigate = useNavigate();
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-bg-surface">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }
  if (currentUser) return <Navigate to="/" replace />;

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsSubmitting(true);
    try {
      if (isRegistering) {
        await registerWithEmail(email, password);
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setAuthError('E-mail ou senha incorretos.');
      } else if (err.code === 'auth/email-already-in-use') {
         setAuthError('Este e-mail já está em uso.');
      } else if (err.code === 'auth/weak-password') {
         setAuthError('A senha deve ter pelo menos 6 caracteres.');
      } else if (err.code === 'auth/operation-not-allowed') {
         setAuthError('O login por e-mail/senha ainda não está habilitado no console do Firebase. Por favor, use o login com Google.');
      } else {
        setAuthError(`Erro: ${err.message || 'Ocorreu um erro na autenticação.'}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="min-h-screen w-full flex bg-bg-surface font-sans">
      {/* Left side - Content */}
      <div className="w-full lg:w-[45%] flex flex-col p-8 lg:p-16 relative z-10 bg-white">
        
        <div className="mb-auto">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
             <Logo className="w-10 h-10" />
            <span className="text-2xl font-black text-primary tracking-tight">TudoAqui</span>
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full my-auto"
        >
          <h1 className="text-3xl lg:text-4xl font-bold text-text-main leading-tight mb-4">
            A sua cidade, <br/>na palma da mão.
          </h1>
          <p className="text-text-muted text-lg mb-10 max-w-sm">
            Comida, transporte, serviços, e tudo que você precisa, rápido e fácil.
          </p>

          <AnimatePresence mode="wait">
            {!showEmailForm ? (
              <motion.div key="social" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <button 
                  onClick={signInWithGoogle}
                  className="w-full bg-zinc-100 hover:bg-zinc-200 transition-colors text-text-main rounded-xl py-4 px-6 flex items-center justify-center gap-4 text-sm font-semibold shadow-sm mb-4"
                >
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                  <span>Continuar com Google</span>
                </button>
                
                <div className="relative flex py-5 items-center">
                   <div className="flex-grow border-t border-zinc-200"></div>
                   <span className="flex-shrink-0 mx-4 text-zinc-400 text-sm">ou</span>
                   <div className="flex-grow border-t border-zinc-200"></div>
                </div>
                
                <button onClick={() => setShowEmailForm(true)} className="w-full border-2 border-zinc-200 hover:border-zinc-300 transition-colors text-text-main rounded-xl py-4 px-6 flex items-center justify-center text-sm font-semibold mb-6">
                  <Mail className="w-5 h-5 mr-3 text-zinc-500" />
                  Entrar com E-mail e Senha
                </button>
              </motion.div>
            ) : (
              <motion.div key="email" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <button onClick={() => { setShowEmailForm(false); setAuthError(''); }} className="flex items-center text-sm font-bold text-zinc-500 hover:text-zinc-800 mb-6 transition-colors">
                   <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
                </button>
                
                <form onSubmit={handleEmailSubmit} className="space-y-4">
                   {authError && (
                      <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100">
                         {authError}
                      </div>
                   )}
                   <div>
                      <label className="block text-sm font-bold text-zinc-700 mb-1.5">E-mail</label>
                      <div className="relative">
                         <Mail className="w-5 h-5 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2" />
                         <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-3 pl-12 pr-4 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium" placeholder="seu@email.com" />
                      </div>
                   </div>
                   <div>
                      <label className="block text-sm font-bold text-zinc-700 mb-1.5">Senha</label>
                      <div className="relative">
                         <Lock className="w-5 h-5 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2" />
                         <input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-3 pl-12 pr-4 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium" placeholder="••••••••" />
                      </div>
                   </div>
                   
                   <button type="submit" disabled={isSubmitting} className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl mt-2 disabled:opacity-50 transition-all">
                      {isSubmitting ? 'Aguarde...' : (isRegistering ? 'Criar Conta' : 'Entrar')}
                   </button>
                   
                   <div className="text-center mt-4 pt-4 border-t border-zinc-100">
                      <button type="button" onClick={() => { setIsRegistering(!isRegistering); setAuthError(''); }} className="text-sm font-bold text-primary hover:text-primary/80">
                         {isRegistering ? 'Já tem uma conta? Entre aqui' : 'Não tem conta? Cadastre-se'}
                      </button>
                   </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
          
        </motion.div>
        
        <div className="mt-auto">
          <p className="text-text-muted text-[11px] font-medium text-center lg:text-left">
            Ao continuar, você concorda com nossos <span className="underline cursor-pointer">Termos de Serviço</span> e <span className="underline cursor-pointer">Política de Privacidade</span>.
          </p>
        </div>
      </div>

      {/* Right side - Image */}
      <div className="hidden lg:block flex-1 relative bg-zinc-100">
        <img 
          src="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=2000&q=80" 
          alt="Food and Services" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
        <div className="absolute bottom-16 left-16 text-white max-w-lg">
           <h2 className="text-4xl font-bold mb-2">Tudo fresquinho para você.</h2>
           <p className="text-lg text-white/90">Apoie o comércio local e receba onde estiver.</p>
        </div>
      </div>
    </div>
  );
}
