import React, { useState } from 'react';
import { useAuth, UserRole } from '../contexts/AuthContext';
import { useCity } from '../contexts/CityContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Store, User, Car, Wrench, CheckCircle2, MapPin, ChevronRight, ArrowLeft } from 'lucide-react';
import { cn } from '../lib/utils';
import { Logo } from '../components/Logo';

const ROLES: { id: UserRole; title: string; desc: string; icon: any }[] = [
  { id: 'client', title: 'Comprar e Pedir', desc: 'Quero pedir comida, produtos e serviços.', icon: User },
  { id: 'merchant', title: 'Vender Produtos', desc: 'Quero cadastrar minha loja ou restaurante.', icon: Store },
  { id: 'driver', title: 'Ser Motorista', desc: 'Quero oferecer caronas e entregas.', icon: Car },
  { id: 'provider', title: 'Prestar Serviços', desc: 'Quero oferecer serviços profissionais.', icon: Wrench },
];

export default function OnboardingPage() {
  const { userProfile, completeOnboarding } = useAuth();
  const { cities } = useCity();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [selectedCityId, setSelectedCityId] = useState<string>('');
  const [loading, setLoading] = useState(false);

  if (userProfile?.role && userProfile?.cityId) {
     return <Navigate to="/" replace />;
  }

  const handleComplete = async () => {
    if (!selectedRole || !selectedCityId) return;
    setLoading(true);
    try {
      await completeOnboarding({ 
        role: selectedRole,
        cityId: selectedCityId
      });
      navigate('/');
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center p-4 sm:p-8 font-sans">
      <div className="mb-8">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <Logo className="w-10 h-10" />
          <span className="text-2xl font-black text-primary tracking-tight">TudoAqui</span>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full bg-white rounded-[24px] shadow-sm p-6 sm:p-10 border border-zinc-100"
      >
        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <div className="text-center mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 mb-2">
                  Como você quer usar o app?
                </h1>
                <p className="text-zinc-500 text-sm max-w-sm mx-auto">
                  Escolha o seu perfil principal. Você poderá usar outras funções depois.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
                {ROLES.map((role) => {
                  const Icon = role.icon;
                  const isSelected = selectedRole === role.id;
                  
                  return (
                    <button
                      key={role.id}
                      onClick={() => setSelectedRole(role.id)}
                      className={cn(
                        "flex flex-col items-start p-5 rounded-[20px] border-2 transition-all duration-200 text-left relative",
                        isSelected 
                          ? "border-primary bg-primary/5 shadow-sm scale-[1.02]" 
                          : "border-zinc-100 hover:border-zinc-200 bg-white"
                      )}
                    >
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors",
                        isSelected ? "bg-primary text-white" : "bg-zinc-100 text-zinc-600"
                      )}>
                        <Icon className="w-6 h-6" />
                      </div>
                      
                      <h3 className="font-bold text-lg mb-1 text-zinc-900">{role.title}</h3>
                      <p className="text-sm text-zinc-500 leading-snug">{role.desc}</p>
                      
                      {isSelected && (
                        <motion.div 
                          initial={{ scale: 0 }} animate={{ scale: 1 }}
                          className="absolute top-5 right-5 text-primary"
                        >
                          <CheckCircle2 fill="currentColor" className="text-white w-6 h-6" />
                        </motion.div>
                      )}
                    </button>
                  )
                })}
              </div>

              <div className="flex justify-center">
                  <button
                    onClick={() => setStep(2)}
                    disabled={!selectedRole}
                    className={cn(
                      "w-full sm:w-auto px-10 py-3.5 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2",
                      selectedRole 
                        ? "bg-primary text-white hover:bg-primary-dark" 
                        : "bg-zinc-100 text-zinc-400 cursor-not-allowed"
                    )}
                  >
                    Próximo Passo <ChevronRight className="w-4 h-4" />
                  </button>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <button 
                onClick={() => setStep(1)}
                className="flex items-center text-sm font-bold text-zinc-500 hover:text-zinc-800 mb-6 transition-colors"
                disabled={loading}
              >
                 <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
              </button>

              <div className="text-center mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 mb-2">
                  Onde você está?
                </h1>
                <p className="text-zinc-500 text-sm max-w-sm mx-auto">
                  Selecione sua cidade para ver o conteúdo personalizado para você.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10 overflow-y-auto max-h-[300px] p-1 pr-2 no-scrollbar">
                {cities.map((city) => (
                  <button
                    key={city.id}
                    onClick={() => setSelectedCityId(city.id)}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left",
                      selectedCityId === city.id
                        ? "border-primary bg-primary/5"
                        : "border-zinc-100 hover:border-zinc-200 bg-white"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                      selectedCityId === city.id ? "bg-primary text-white" : "bg-zinc-100 text-zinc-400"
                    )}>
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-zinc-900">{city.name}</h4>
                      <p className="text-xs text-zinc-500 font-bold uppercase">{city.state}</p>
                    </div>
                    {selectedCityId === city.id && (
                      <CheckCircle2 className="w-5 h-5 text-primary ml-auto" />
                    )}
                  </button>
                ))}
                
                {cities.length === 0 && (
                  <div className="col-span-full py-12 text-center bg-zinc-50 rounded-2xl border-2 border-dashed border-zinc-200">
                    <MapPin className="w-8 h-8 text-zinc-300 mx-auto mb-2 opacity-50" />
                    <p className="text-zinc-400 text-sm font-medium italic">Ainda não há cidades cadastradas...</p>
                  </div>
                )}
              </div>

              <div className="flex justify-center">
                  <button
                    onClick={handleComplete}
                    disabled={!selectedCityId || loading}
                    className={cn(
                      "w-full sm:w-auto px-10 py-3.5 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2",
                      selectedCityId 
                        ? "bg-primary text-white hover:bg-primary-dark shadow-lg shadow-primary/20" 
                        : "bg-zinc-100 text-zinc-400 cursor-not-allowed"
                    )}
                  >
                    {loading ? "Configurando..." : "Finalizar Cadastro"}
                  </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
