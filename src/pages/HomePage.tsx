import React, { useEffect, useState } from 'react';
import { Search, MapPin, ChevronRight, Store, CarFront, Wrench, Bus, MessageSquareHeart, Map, Calendar, Briefcase, HeartHandshake, ArrowRight, Star, Trash2, PawPrint, CloudSun, Clock } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCity } from '../contexts/CityContext';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/errors';
import HomeSectionBlock from '../components/HomeSectionBlock';
import { toast } from 'sonner';
import { Logo } from '../components/Logo';

import RecommendedProducts from '../components/RecommendedProducts';
import RecommendedDrivers from '../components/RecommendedDrivers';
import RecommendedJobs from '../components/RecommendedJobs';

// Categories with modern design
const MAIN_CATEGORIES = [
  { id: '1', name: 'Lojas & Mercados', icon: Store, color: 'bg-emerald-50 text-emerald-600', path: '/comercios' },
  { id: '2', name: 'Serviços & Profissionais', icon: Wrench, color: 'bg-blue-50 text-blue-600', path: '/servicos' },
  { id: '3', name: 'Motoristas', icon: CarFront, color: 'bg-orange-50 text-orange-600', path: '/motoristas' },
  { id: '4', name: 'Horário de Ônibus', icon: Bus, color: 'bg-purple-50 text-purple-600', path: '/onibus' },
  { id: '5', name: 'Empregos', icon: Briefcase, color: 'bg-amber-50 text-amber-600', path: '/empregos' },
  { id: '6', name: 'Coleta de Lixo', icon: Trash2, color: 'bg-rose-50 text-rose-600', path: '/coleta' },
  { id: '7', name: 'Adoção', icon: PawPrint, color: 'bg-red-50 text-red-600', path: '/adocao' },
];

const HIGHLIGHTS = [
  { id: 'store1', name: 'Burguer House', type: 'Lanchonete', time: '20-30 min', rating: 4.8, img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80', tag: 'Destaque' },
  { id: 'store2', name: 'Super Central', type: 'Mercado', time: '40-50 min', rating: 4.6, img: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=400&q=80', tag: 'Oferta' },
  { id: 'store3', name: 'Mecânica do João', type: 'Serviço Auto', time: 'Aberto', rating: 4.9, img: 'https://images.unsplash.com/photo-1530046339160-ce3e530c7d2f?auto=format&fit=crop&w=400&q=80', tag: '' },
];

const NEARBY_SERVICES = [
  { id: 'store4', name: 'Farmácia Saúde', type: 'Saúde', open: true, rating: 4.7, img: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=400&q=80' },
  { id: 'store5', name: 'Petshop Cão Feliz', type: 'Pets', open: true, rating: 4.9, img: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=400&q=80' },
  { id: 'store6', name: 'Pizzaria Bella', type: 'Pizzaria', open: false, rating: 4.5, img: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=400&q=80' },
];

export default function HomePage() {
   const { userProfile, currentUser } = useAuth();
   const { currentCity, setCurrentCityBySlug, cityName, temperature } = useCity();
   const { slug } = useParams();
   const navigate = useNavigate();

   useEffect(() => {
     if (slug) {
       setCurrentCityBySlug(slug);
     }
   }, [slug, setCurrentCityBySlug]);

   const [emblaRef] = useEmblaCarousel({ loop: true, align: 'start' }, [Autoplay({ delay: 5000, stopOnInteraction: false, stopOnMouseEnter: true })]);
  const [banners, setBanners] = useState<any[]>([]);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [homeSections, setHomeSections] = useState<any[]>([]);

  const [currentTime, setCurrentTime] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const [feedbackName, setFeedbackName] = useState(userProfile?.name || '');
  
  useEffect(() => {
     if (userProfile?.name && !feedbackName) {
        setFeedbackName(userProfile.name);
     }
  }, [userProfile]);

  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackContent, setFeedbackContent] = useState('');
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
       navigate('/login');
       return;
    }
    
    setFeedbackSubmitting(true);
    try {
      await import('firebase/firestore').then(async ({ addDoc, collection, serverTimestamp }) => {
          await addDoc(collection(db, 'feedbacks'), {
            userId: currentUser.uid,
            userName: feedbackName || userProfile?.name || 'Anônimo',
            content: feedbackContent,
            rating: feedbackRating,
            approved: false,
            cityId: currentCity?.id || null,
            createdAt: serverTimestamp()
          });
      });
      setFeedbackSuccess(true);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao enviar feedback. Tente novamente mais tarde.');
    } finally {
      setFeedbackSubmitting(false);
    }
  };

   const [merchants, setMerchants] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);

  useEffect(() => {
     const cityId = currentCity?.id;

     const fetchBanners = async () => {
       try {
         const constraints: any[] = [where('active', '==', true)];
         if (cityId) constraints.push(where('cityId', '==', cityId));
         const q = query(collection(db, 'banners'), ...constraints);
         const snapshot = await getDocs(q);
         if (!snapshot.empty) {
           const data = snapshot.docs.map(d => ({id: d.id, ...d.data()})) as any[];
           data.sort((a, b) => {
             const orderA = typeof a.order === 'number' ? a.order : 999;
             const orderB = typeof b.order === 'number' ? b.order : 999;
             return orderA - orderB;
           });
           setBanners(data);
         } else {
           setBanners([]);
         }
       } catch(e) {
         console.warn("Failed to fetch banners", e);
       }
     }
     
     const fetchMerchants = async () => {
         try {
            const constraints: any[] = [];
            if (cityId) constraints.push(where('cityId', '==', cityId));
            const q = query(collection(db, 'business_profiles'), ...constraints);
            const mSnap = await getDocs(q);
            setMerchants(mSnap.docs.map(d => ({id: d.id, ...d.data()})));
         } catch(e) {
            handleFirestoreError(e, OperationType.LIST, 'business_profiles');
         }
     }
     
     const fetchFeedbacks = async () => {
       try {
         const constraints: any[] = [where('approved', '==', true)];
         if (cityId) constraints.push(where('cityId', '==', cityId));
         const q = query(collection(db, 'feedbacks'), ...constraints);
         const snapshot = await getDocs(q);
         if (!snapshot.empty) {
           setFeedbacks(snapshot.docs.map(d => ({id: d.id, ...d.data()})));
         } else {
           setFeedbacks([]);
         }
       } catch(e) {
         console.warn("Failed to fetch feedbacks", e);
       }
     }

     const fetchSections = async () => {
       try {
         const constraints: any[] = [where('active', '==', true)];
         if (cityId) constraints.push(where('cityId', '==', cityId));
         const q = query(collection(db, 'home_sections'), ...constraints, orderBy('order', 'asc'));
         const snapshot = await getDocs(q);
         if (!snapshot.empty) {
            setHomeSections(snapshot.docs.map(d => ({id: d.id, ...d.data()})));
         } else {
           setHomeSections([]);
         }
       } catch(e) {
         console.warn("Failed to fetch home sections", e);
       }
     }

     setLoading(true);
     Promise.all([
        fetchBanners(),
        fetchMerchants(),
        fetchFeedbacks(),
        fetchSections()
     ]).finally(() => {
        setLoading(false);
     });
  }, [currentCity]);

  return (
    <div className="flex flex-col w-full pb-10 bg-zinc-50 min-h-screen">
      
      {/* 1. Header & Location (Mobile mostly, desktop handled by AppLayout) */}
      <div className="bg-white px-5 pt-7 pb-5 rounded-b-[2rem] shadow-sm z-10 sticky top-0 md:hidden border-b border-zinc-100">
         <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
               <Logo className="w-10 h-10" />
               <span className="font-black tracking-tighter text-2xl text-zinc-900">Tudo<span className="text-primary">Aqui</span></span>
            </div>
            <div onClick={() => navigate('/perfil')} className="w-11 h-11 rounded-full bg-zinc-100 flex items-center justify-center cursor-pointer hover:bg-zinc-200 transition-colors border border-zinc-200/50">
               <span className="font-bold text-zinc-600 text-sm">{userProfile?.name?.charAt(0) || 'U'}</span>
            </div>
         </div>

         <div className="flex items-center justify-between mb-5 px-1">
            <div className="flex flex-col">
               <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Localização</span>
               <div className="flex items-center gap-1.5 font-bold text-[13px] md:text-sm text-zinc-800">
                  <MapPin className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="truncate max-w-[150px]">{cityName}</span>
               </div>
            </div>
            
            <div className="flex items-center gap-3">
               <div className="flex flex-col items-end">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Clima</span>
                  <div className="flex items-center gap-1.5 font-bold text-[13px] md:text-sm text-zinc-800">
                     <CloudSun className="w-4 h-4 text-amber-500" />
                     {temperature || '--°C'}
                  </div>
               </div>
               
               <div className="h-8 w-px bg-zinc-200"></div>

               <div className="flex flex-col items-end">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Hora</span>
                  <div className="flex items-center gap-1.5 font-bold text-[13px] md:text-sm text-zinc-800">
                     <Clock className="w-4 h-4 text-blue-500" />
                     {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
               </div>
            </div>
         </div>

         <div className="relative">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
           <input 
             type="text" 
             placeholder="Buscar lojas, serviços, produtos..." 
             onClick={() => navigate('/busca')}
             readOnly
             className="w-full bg-zinc-50 rounded-2xl py-3.5 pl-12 pr-4 outline-none text-zinc-800 text-sm font-semibold transition-all border border-zinc-200/60 focus:border-emerald-500/50 focus:bg-white cursor-pointer shadow-sm hover:border-zinc-300"
           />
         </div>
      </div>

      <div className="px-4 md:px-8 mt-5 md:mt-8 space-y-12">
        
        {/* 2. Banner Principal (Hero Carousel - Rolo Infinito) */}
        {banners.length > 0 && (
          <section className="relative overflow-hidden -mx-4 px-4 md:mx-0 md:px-0">
            <div ref={emblaRef} className="cursor-grab active:cursor-grabbing overflow-hidden">
              <div className="flex touch-pan-y gap-4">
                {banners.map((banner, index) => {
                  const handleBannerClick = () => {
                     if (banner.actionType) {
                       switch(banner.actionType) {
                         case 'ai_page':
                           navigate(`/banner/${banner.id}`);
                           break;
                         case 'product':
                         case 'service':
                         case 'merchant':
                           if (banner.actionTarget) navigate(`/comercio/${banner.actionTarget}`);
                           break;
                         case 'job':
                           navigate(`/empregos`);
                           break;
                         case 'external':
                           window.open(banner.actionTarget, '_blank');
                           break;
                         case 'search':
                           navigate(`/busca?q=${encodeURIComponent(banner.actionTarget || '')}`);
                           break;
                         default:
                           if (banner.pageEnabled) navigate(`/banner/${banner.id}`);
                           else navigate('/busca');
                       }
                     } else {
                       // Legacy Support
                       if (banner.pageEnabled) {
                          navigate(`/banner/${banner.id}`);
                       } else if (banner.actionUrl) {
                          if (banner.actionUrl.startsWith('http')) {
                             window.open(banner.actionUrl, '_blank');
                          } else {
                             navigate(banner.actionUrl);
                          }
                       } else {
                          navigate('/busca');
                       }
                     }
                  };

                  return (
                    <div key={banner.id || index} onClick={handleBannerClick} className="flex-[0_0_100%] cursor-pointer relative h-[220px] md:h-[350px] rounded-[2.5rem] overflow-hidden group bg-zinc-900 border border-zinc-100 shadow-xl transition-all">
                     <img 
                       src={banner.imageUrl || 'https://placehold.co/1200x480/zinc/white?text=Banner'} 
                       alt={banner.title} 
                       loading="lazy"
                       onError={(e) => {
                         e.currentTarget.onerror = null;
                         e.currentTarget.src = 'https://placehold.co/1200x480/e4e4e7/a1a1aa?text=Banner';
                       }}
                       className="w-full h-full object-cover object-center group-hover:scale-[1.02] transition-transform duration-1000" 
                     />
                     <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/30 to-transparent pointer-events-none"></div>
                     <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors duration-500"></div>
                    <div className="absolute inset-0 p-6 md:p-10 flex flex-col justify-center max-w-[85%] md:max-w-[70%]">
                       <h2 className="text-white font-black text-2xl md:text-4xl mb-2.5 leading-tight tracking-tight drop-shadow-md">{banner.title}</h2>
                       <p className="text-white/80 text-sm md:text-base mb-5 font-medium leading-relaxed drop-shadow">{banner.subtitle}</p>
                       <div>
                         <button className="bg-white text-zinc-900 px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-2 group/btn">
                            {banner.actionText || 'Ver Agora'} <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                         </button>
                       </div>
                    </div>
                  </div>
                 );
                })}
              </div>
            </div>
          </section>
        )}

        {/* 3. Categorias Principais (Estilo Minimalista e Harmônico) */}
        <section>
          <div className="flex items-start gap-3 md:gap-5 justify-start overflow-x-auto no-scrollbar pb-4 -mx-4 px-4 md:mx-0 md:px-0">
            {MAIN_CATEGORIES.map(cat => (
              <div 
                 key={cat.id} 
                 onClick={() => navigate(cat.path)}
                 className="flex flex-col items-center gap-3 cursor-pointer group shrink-0 w-[4.5rem] md:w-20"
              >
                <div className={`w-[3rem] h-[3rem] md:w-14 md:h-14 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:-translate-y-1.5 group-active:scale-95 shadow-sm border border-zinc-100 hover:border-black/5 hover:shadow-lg ${cat.color} bg-opacity-70 group-hover:bg-opacity-100`}>
                  <cat.icon className="w-5 h-5 md:w-6 md:h-6 transition-transform duration-300 group-hover:scale-110" strokeWidth={1.75} />
                </div>
                <span className="text-[11px] md:text-xs font-semibold text-zinc-600 text-center leading-tight tracking-tight group-hover:text-zinc-900 transition-colors w-full break-words px-0.5">{cat.name}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Recommended Products */}
        <RecommendedProducts />

        {/* Recommended Drivers */}
        <RecommendedDrivers />

        {/* Recommended Jobs */}
        <RecommendedJobs />

        {/* 4. Mercados e Lojas (Seção Dinâmica) */}
        <section>
           <div className="flex items-end justify-between mb-6">
              <div>
                 <h2 className="font-black text-2xl text-zinc-900 tracking-tight">Mercados e Lojas</h2>
                 <p className="text-zinc-500 font-medium">Os melhores estabelecimentos da sua cidade</p>
              </div>
              <button onClick={() => navigate('/comercios')} className="text-emerald-600 font-bold text-sm bg-emerald-50 px-5 py-2.5 rounded-xl hover:bg-emerald-100 transition-colors">
                 Ver Todos
              </button>
           </div>
           
           <div className="flex gap-5 overflow-x-auto no-scrollbar pb-6 -mx-4 px-4 md:mx-0 md:px-0 scroll-smooth">
              {merchants.length === 0 && !loading ? (
                  <div className="w-full text-center py-10 bg-white rounded-3xl border border-zinc-100"><p className="text-zinc-500 font-medium text-sm">Nenhum comércio cadastrado ainda.</p></div>
              ) : (
                 merchants.slice(0, 5).map(item => (
                  <div key={item.id} onClick={() => navigate(`/comercio/${item.id}`)} className="min-w-[280px] md:min-w-[320px] bg-white rounded-[2.5rem] p-3 shadow-xl shadow-zinc-200/20 border border-zinc-100/50 hover:-translate-y-1.5 transition-all duration-500 cursor-pointer shrink-0 group">
                    <div className="w-full h-44 rounded-[2rem] overflow-hidden relative mb-4 bg-zinc-950 shadow-inner">
                       {item.bannerImage ? (
                          <img 
                            src={item.bannerImage} 
                            alt={item.businessName} 
                            loading="lazy"
                            className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-1000 opacity-90 group-hover:opacity-100" 
                          />
                       ) : item.logoImage ? (
                          <div className="w-full h-full relative flex items-center justify-center p-8">
                             <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-teal-500/20"></div>
                             <img 
                               src={item.logoImage} 
                               alt={item.businessName} 
                               loading="lazy"
                               className="w-full h-full object-contain relative z-10 drop-shadow-2xl" 
                             />
                          </div>
                       ) : (
                          <div className="w-full h-full flex items-center justify-center font-black text-2xl text-zinc-300 bg-zinc-100">{(item.businessName || 'L')[0]}</div>
                       )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent opacity-100 transition-opacity duration-300"></div>
                      
                      {item.isOpen && (
                         <div className="absolute top-3 right-3 bg-zinc-900/80 backdrop-blur-md text-white text-[10px] uppercase tracking-widest font-black px-2.5 py-1.5 rounded-lg shadow-sm">
                           Aberto
                         </div>
                      )}

                      {/* Store Profile Image Inserted on Banner */}
                      {item.logoImage && item.bannerImage && (
                          <div className="absolute bottom-3 left-3 w-12 h-12 rounded-xl overflow-hidden border-2 border-white shadow-md bg-white">
                             <img src={item.logoImage} alt="Logo" loading="lazy" className="w-full h-full object-cover" />
                          </div>
                      )}

                      <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-sm px-2.5 py-1.5 rounded-xl text-xs font-bold text-zinc-800 shadow-sm flex items-center gap-1.5">
                         <Star className="w-3.5 h-3.5 text-orange-400 fill-orange-400" /> {item.rating || '4.9'}
                      </div>
                   </div>
                   <div className="px-2 pb-1">
                      <div className="flex justify-between items-start mb-1.5">
                         <h3 className="font-bold text-zinc-900 text-lg truncate pr-2">{item.businessName}</h3>
                      </div>
                      <p className="text-sm text-zinc-500 font-medium">{item.category || 'Comércio Local'}</p>
                   </div>
                </div>
                ))
              )}
           </div>
        </section>

        {/* 5. Seção Local (Inteligente) */}
        {merchants.length > 5 && (
        <section>
           <h2 className="font-black text-2xl text-zinc-900 tracking-tight mb-6">Perto de Você</h2>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {merchants.slice(5).map(store => (
                <div key={store.id} onClick={() => navigate(`/comercio/${store.id}`)} className="flex items-center bg-white p-4 rounded-3xl border border-zinc-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer group">
                   <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0 bg-zinc-100 relative">
                      {store.logoImage ? (
                         <img 
                           src={store.logoImage} 
                           alt={store.businessName} 
                           className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                         />
                      ) : (
                         <div className="w-full h-full flex items-center justify-center font-black text-2xl text-zinc-300 bg-zinc-100">{(store.businessName || 'L')[0]}</div>
                      )}
                   </div>
                   <div className="ml-5 flex-1 min-w-0">
                      <h3 className="font-bold text-zinc-900 text-lg truncate mb-0.5">{store.businessName}</h3>
                      <p className="text-sm text-zinc-500 font-medium truncate">{store.category || 'Comércio Local'}</p>
                      <div className="flex items-center gap-3 mt-3 text-xs font-bold">
                         <span className="flex items-center text-zinc-700 bg-zinc-50 px-2 py-1 rounded-md border border-zinc-100"><Star className="w-3.5 h-3.5 mr-1 text-orange-400 fill-orange-400" /> {store.rating || '4.9'}</span>
                         <span className={`px-2 py-1 rounded-md ${store.isOpen ? 'bg-emerald-50 text-emerald-600' : 'bg-zinc-100 text-zinc-500'}`}>{store.isOpen ? 'Aberto Agora' : 'Fechado'}</span>
                      </div>
                   </div>
                   <div className="w-10 h-10 rounded-full bg-zinc-50 flex items-center justify-center mr-2 group-hover:bg-emerald-50 transition-colors">
                     <ChevronRight className="w-5 h-5 text-zinc-400 group-hover:text-emerald-500 transition-colors" />
                   </div>
                </div>
              ))}
           </div>
        </section>
        )}

        {/* Dynamic Sections */}
        {homeSections.map(sec => (
           <HomeSectionBlock key={sec.id} section={sec} />
        ))}

        {/* Avaliações Públicas */}
        {feedbacks.length > 0 && (
          <section>
             <h2 className="font-black text-2xl text-zinc-900 tracking-tight mb-6">Voz da Comunidade</h2>
             <div className="flex gap-5 overflow-x-auto no-scrollbar pb-6 -mx-4 px-4 md:mx-0 md:px-0">
                {feedbacks.map(fb => (
                  <div key={fb.id} className="min-w-[300px] max-w-[320px] bg-white p-6 rounded-3xl shadow-sm border border-zinc-100 hover:shadow-xl hover:shadow-zinc-200/40 hover:-translate-y-1 transition-all duration-300 shrink-0">
                     <div className="flex text-orange-400 mb-4 gap-0.5">
                        {Array.from({length: fb.rating || 5}).map((_, idx) => <Star key={idx} className="w-4 h-4 fill-current" />)}
                     </div>
                     <p className="text-sm text-zinc-700 italic mb-6 leading-relaxed">"{fb.content}"</p>
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center font-bold text-emerald-600 text-sm shadow-sm">{fb.userName.charAt(0)}</div>
                        <span className="font-bold text-sm text-zinc-900">{fb.userName}</span>
                     </div>
                  </div>
                ))}
             </div>
          </section>
        )}

        {/* 7. CTA: Cadastre-se */}
        <section className="pb-8">
           <div className="bg-primary/5 border border-primary/10 rounded-3xl p-6 md:p-10 text-center">
              <h2 className="text-2xl font-black text-primary mb-3">Tem um Negócio ou Serviço?</h2>
              <p className="text-zinc-600 mb-6 max-w-lg mx-auto">Cadastre sua loja, dirija com a gente ou ofereça seus serviços na maior plataforma da região. É rápido e prático.</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                 <button onClick={() => navigate('/perfil')} className="bg-primary text-white font-bold py-3 px-8 rounded-full shadow-lg shadow-primary/20 hover:scale-105 transition-transform w-full sm:w-auto">
                    Tornar-se Parceiro
                 </button>
                 <button onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="bg-white text-zinc-800 font-bold py-3 px-8 rounded-full border border-zinc-200 hover:bg-zinc-50 transition-colors w-full sm:w-auto">
                    Explorar Lojas
                 </button>
              </div>
           </div>
        </section>

        {/* 8. Deixe seu Feedback */}
        <section className="pt-4 border-t border-zinc-200/60 pb-8">
           <div className="bg-white rounded-3xl p-8 border border-zinc-100 shadow-sm flex flex-col lg:flex-row items-stretch justify-between gap-10">
              <div className="flex-1 flex flex-col justify-center">
                 <div className="w-16 h-16 bg-pink-50 text-pink-500 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                    <MessageSquareHeart className="w-8 h-8" />
                 </div>
                 <h2 className="text-3xl font-black text-zinc-900 mb-3 tracking-tight">Como está sendo sua experiência?</h2>
                 <p className="text-zinc-500 mb-8 max-w-md text-lg">Seu feedback nos ajuda a melhorar a plataforma para toda a comunidade. Leva só um minutinho!</p>
                 
                 <div className="flex items-center gap-2 mb-3">
                    <Star className="w-6 h-6 text-orange-400 fill-orange-400" />
                    <Star className="w-6 h-6 text-orange-400 fill-orange-400" />
                    <Star className="w-6 h-6 text-orange-400 fill-orange-400" />
                    <Star className="w-6 h-6 text-orange-400 fill-orange-400" />
                    <Star className="w-6 h-6 text-orange-400 fill-orange-400" />
                 </div>
                 <p className="font-bold text-zinc-900 text-lg">Junte-se a dezenas de usuários</p>
                 <p className="text-zinc-500">que já avaliaram o TudoAqui.</p>
              </div>
              <div className="hidden lg:block w-[1px] bg-zinc-100"></div>
              <div className="flex-1 w-full max-w-xl">
                 {!feedbackSuccess ? (
                    <form onSubmit={handleFeedbackSubmit} className="space-y-5">
                       <div>
                          <label className="block text-sm font-bold text-zinc-700 mb-3">Sua Avaliação</label>
                          <div className="flex gap-2">
                             {[1, 2, 3, 4, 5].map((star) => (
                               <button 
                                 type="button" 
                                 key={star} 
                                 onClick={() => setFeedbackRating(star)}
                                 className="transition-transform hover:scale-110 p-1"
                               >
                                 <Star className={`w-8 h-8 ${feedbackRating >= star ? "fill-orange-400 text-orange-400" : "text-zinc-200 fill-zinc-100"}`} />
                               </button>
                             ))}
                          </div>
                       </div>
                       <div>
                         <label className="block text-sm font-bold text-zinc-700 mb-2">Qual seu nome?</label>
                         <input 
                           type="text"
                           value={feedbackName}
                           onChange={e => setFeedbackName(e.target.value)}
                           required
                           placeholder={currentUser ? "Seu nome..." : "Faça login para avaliar a plataforma..."}
                           className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl p-4 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all mb-4"
                         />
                       </div>
                       <div>
                         <label className="block text-sm font-bold text-zinc-700 mb-2">Comentário</label>
                         <textarea 
                           rows={4}
                           value={feedbackContent}
                           onChange={e => setFeedbackContent(e.target.value)}
                           required
                           maxLength={1000}
                           placeholder={currentUser ? "Conte-nos o que achou ou como podemos melhorar..." : "Faça login para avaliar a plataforma..."}
                           className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl p-4 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 resize-none transition-all"
                         />
                       </div>
                       <button 
                         type="submit" 
                         disabled={feedbackSubmitting || (!currentUser) || feedbackContent.length < 5}
                         className="w-full py-4 rounded-2xl bg-zinc-900 hover:bg-black text-white font-bold transition-all disabled:opacity-50"
                       >
                         {!currentUser ? 'Faça login para enviar' : feedbackSubmitting ? 'Enviando...' : 'Enviar Feedback'}
                       </button>
                    </form>
                 ) : (
                    <div className="h-full flex flex-col items-center justify-center p-8 bg-green-50 rounded-3xl border border-green-100">
                       <div className="w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center mb-4 shadow-lg shadow-green-500/30">
                         <Star className="w-8 h-8 fill-current" />
                       </div>
                       <h3 className="text-xl font-black text-green-900 mb-2 text-center">Muito obrigado!</h3>
                       <p className="text-green-700 text-center font-medium">Seu feedback foi enviado e será lido pela nossa equipe.</p>
                    </div>
                 )}
              </div>
           </div>
        </section>

      </div>
    </div>
  );
}

