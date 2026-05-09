import React, { useState, useEffect } from 'react';
import { ArrowLeft, Heart, Info, Camera, Send, CheckCircle2, MapPin, PawPrint, Search, ShieldAlert, Gavel, MessageSquare, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { useCity } from '../contexts/CityContext';
import { toast } from 'sonner';
import ImageUploader from '../components/ImageUploader';

export default function AdoptionPage() {
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();
  const { currentCity } = useCity();

  const [pets, setPets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [newPet, setNewPet] = useState({ name: '', species: 'Cachorro', breed: '', age: '', description: '', imageUrl: '', location: '', phone: userProfile?.phone || '' });
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState('Todos');
  const [isReporting, setIsReporting] = useState(false);
  const [reportContent, setReportContent] = useState('');
  const [reportingSubmitting, setReportingSubmitting] = useState(false);

  useEffect(() => {
    if (userProfile?.phone && !newPet.phone) {
       setNewPet(prev => ({ ...prev, phone: userProfile.phone || '' }));
    }
  }, [userProfile]);

  useEffect(() => {
    fetchPets();
    fetchCategories();
  }, [currentCity]);

  const fetchCategories = async () => {
     try {
        const q = query(collection(db, 'categories'), where('type', '==', 'adoption'), where('active', '==', true));
        const snap = await getDocs(q);
        setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() })));
     } catch (e) {
        console.error(e);
     }
  };

  const fetchPets = async () => {
    try {
      const cityId = currentCity?.id;
      const constraints: any[] = [where('status', '==', 'approved'), orderBy('createdAt', 'desc')];
      if (cityId) constraints.push(where('cityId', '==', cityId));
      
      const q = query(collection(db, 'adoption_pets'), ...constraints);
      const snapshot = await getDocs(q);
      setPets(snapshot.docs.map(d => ({id: d.id, ...d.data()})));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
       toast.error('Você precisa estar logado para cadastrar um animal.');
       return;
    }
    if (!newPet.imageUrl) {
       toast.error('Por favor, adicione uma foto do animal.');
       return;
    }

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'adoption_pets'), {
        ...newPet,
        cityId: currentCity?.id || '',
        ownerId: currentUser.uid,
        ownerName: userProfile?.name || 'Anônimo',
        ownerPhone: newPet.phone || userProfile?.phone || '',
        status: 'pending',
        createdAt: serverTimestamp()
      });
      toast.success('Animal cadastrado! Aguardando aprovação do administrador.');
      setIsAdding(false);
      setNewPet({ name: '', species: 'Cachorro', breed: '', age: '', description: '', imageUrl: '', location: '', phone: userProfile?.phone || '' });
    } catch (e) {
      console.error(e);
      toast.error('Erro ao cadastrar animal.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportContent.trim()) {
      toast.error('Descreva os maus-tratos ou o abandono.');
      return;
    }

    setReportingSubmitting(true);
    try {
      await addDoc(collection(db, 'animal_reports'), {
        content: reportContent,
        cityId: currentCity?.id || '',
        userId: currentUser?.uid || 'anonymous',
        userName: userProfile?.name || 'Anônimo',
        userPhone: userProfile?.phone || '',
        status: 'pending',
        createdAt: serverTimestamp()
      });
      toast.success('Denúncia enviada ao administrador. Obrigado por ajudar!');
      setIsReporting(false);
      setReportContent('');
    } catch (e) {
      console.error(e);
      toast.error('Erro ao enviar denúncia.');
    } finally {
      setReportingSubmitting(false);
    }
  };

  const filteredPets = filter === 'Todos' ? pets : pets.filter(p => p.species === filter);

  return (
    <div className="min-h-screen bg-zinc-50 pb-20">
      <div className="bg-white border-b border-zinc-100 sticky top-0 z-20">
         <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
               <button onClick={() => navigate('/')} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-zinc-100 transition-colors">
                  <ArrowLeft className="w-6 h-6 text-zinc-600" />
               </button>
               <h1 className="font-black text-xl text-zinc-900">Adoção de Animais</h1>
            </div>
            <button 
               onClick={() => setIsAdding(true)}
               className="bg-primary text-white font-bold px-4 py-2 rounded-xl text-sm shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
            >
               + Doar Animal
            </button>
         </div>
          <div className="max-w-7xl mx-auto px-4 py-3 flex gap-2 overflow-x-auto no-scrollbar">
            {['Todos', ...categories.map(c => c.name), 'Cachorro', 'Gato', 'Outros'].reduce((acc: string[], curr) => {
               if(!acc.includes(curr)) acc.push(curr);
               return acc;
            }, []).map(cat => (
               <button 
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors whitespace-nowrap ${filter === cat ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}
               >
                  {cat}
               </button>
            ))}
          </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-6">
         {/* Report CTA */}
         <div className="bg-rose-50 border border-rose-100 rounded-3xl p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-center md:text-left">
               <div className="w-12 h-12 bg-rose-500 text-white rounded-2xl flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-6 h-6" />
               </div>
               <div>
                  <h3 className="font-black text-rose-900 leading-tight">Viu algum animal sofrendo maus-tratos ou abandonado?</h3>
                  <p className="text-rose-700 text-sm font-medium mt-1">Sua denúncia é anônima e ajuda a salvar vidas.</p>
               </div>
            </div>
            <button 
               onClick={() => setIsReporting(true)}
               className="bg-rose-500 text-white font-black px-6 py-3 rounded-2xl hover:bg-rose-600 transition-colors shadow-lg shadow-rose-200 whitespace-nowrap"
            >
               Fazer Denúncia
            </button>
         </div>

         {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
               {[1,2,3,4].map(n => <div key={n} className="h-64 bg-zinc-200 animate-pulse rounded-3xl" />)}
            </div>
         ) : filteredPets.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-zinc-200">
               <PawPrint className="w-16 h-16 text-zinc-300 mx-auto mb-4" />
               <h3 className="font-bold text-zinc-800 text-lg">Nenhum pet para adoção</h3>
               <p className="text-zinc-500 max-w-xs mx-auto mt-2">Que tal ser o primeiro a cadastrar um animalzinho precisando de um lar?</p>
            </div>
         ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
               {filteredPets.map(pet => (
                  <div key={pet.id} className="bg-white rounded-3xl overflow-hidden border border-zinc-100 shadow-sm hover:shadow-xl transition-all group">
                     <div className="relative h-48 overflow-hidden">
                        <img src={pet.imageUrl} alt={pet.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider text-zinc-700 shadow-sm">
                           {pet.species}
                        </div>
                     </div>
                     <div className="p-4">
                        <h3 className="font-black text-zinc-900 text-lg mb-1">{pet.name}</h3>
                        <div className="flex items-center gap-1.5 text-zinc-500 text-xs font-bold mb-3">
                           <MapPin className="w-3.5 h-3.5" /> {pet.location || 'Bagé, RS'}
                        </div>
                        <p className="text-zinc-600 text-xs line-clamp-2 mb-4 leading-relaxed">{pet.description}</p>
                        <div className="pt-4 border-t border-zinc-50 flex items-center justify-between">
                           <span className="text-[10px] font-bold text-zinc-400">{pet.breed || 'SRD'} • {pet.age}</span>
                           {pet.ownerPhone ? (
                              <a 
                                 href={`https://wa.me/55${(pet.ownerPhone || '').toString().replace(/\D/g, '')}`} 
                                 target="_blank" 
                                 rel="noreferrer"
                                 className="text-xs font-black text-rose-500 bg-rose-50 px-3 py-2 rounded-xl hover:bg-rose-500 hover:text-white transition-colors"
                              >
                                 Adotar
                              </a>
                           ) : (
                              <span className="text-[10px] text-zinc-400 font-bold italic">Contato não informado</span>
                           )}
                        </div>
                     </div>
                  </div>
               ))}
            </div>
         )}
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-16 mb-12">
         <div className="bg-white rounded-[2.5rem] border border-zinc-100 p-8 md:p-12 shadow-sm text-center md:text-left">
            <div className="flex flex-col md:flex-row items-center gap-8">
               <div className="w-24 h-24 bg-amber-50 text-amber-600 rounded-[2rem] flex items-center justify-center shrink-0">
                  <Gavel className="w-12 h-12" />
               </div>
               <div>
                  <h2 className="text-3xl font-black text-zinc-900 mb-2">Leis de Proteção Animal</h2>
                  <p className="text-zinc-500 font-medium max-w-2xl">Conheça seus direitos e deveres para garantir a segurança dos nossos animais. Maltratar animais é crime!</p>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
               <div className="bg-zinc-50 p-6 rounded-3xl border border-zinc-100 hover:border-amber-200 transition-colors">
                  <h4 className="font-black text-zinc-900 mb-3 flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full bg-amber-500" /> Lei Sansão
                  </h4>
                  <p className="text-zinc-600 text-sm leading-relaxed">Pena de reclusão de dois a cinco anos, além de multa e proibição de guarda para quem praticar abuso, maus-tratos, ferir ou mutilar cães ou gatos.</p>
               </div>
               <div className="bg-zinc-50 p-6 rounded-3xl border border-zinc-100 hover:border-amber-200 transition-colors">
                  <h4 className="font-black text-zinc-900 mb-3 flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full bg-amber-500" /> Abandono é Crime
                  </h4>
                  <p className="text-zinc-600 text-sm leading-relaxed">O abandono de animais em locais públicos ou privados é considerado uma forma de maus-tratos e está sujeito às mesmas penalidades da Lei Sansão.</p>
               </div>
               <div className="bg-zinc-50 p-6 rounded-3xl border border-zinc-100 hover:border-amber-200 transition-colors">
                  <h4 className="font-black text-zinc-900 mb-3 flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full bg-amber-500" /> Denúncia Silenciosa
                  </h4>
                  <p className="text-zinc-600 text-sm leading-relaxed">Você pode denunciar através do 190 (Polícia Militar) ou no Linha Direta da Polícia Civil. Sua identidade será preservada em casos de denúncia anônima.</p>
               </div>
            </div>
         </div>
      </div>

      {isReporting && (
         <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
            <form onSubmit={handleReport} className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-md animate-in zoom-in-95 duration-200">
               <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center shrink-0">
                     <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                     <h2 className="text-xl font-black text-zinc-900">Denunciar Maus-Tratos</h2>
                     <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">A sua denúncia é sigilosa</p>
                  </div>
               </div>

               <div className="space-y-4">
                  <p className="text-sm text-zinc-600 leading-relaxed">
                     Descreva detalhadamente o ocorrido, local (endereço ou ponto de referência) e, se possível, características da pessoa envolvida.
                  </p>
                  <textarea 
                     required 
                     value={reportContent} 
                     onChange={e => setReportContent(e.target.value)} 
                     className="w-full px-4 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl outline-none focus:border-rose-500 font-medium resize-none min-h-[150px]" 
                     placeholder="Ex: No endereço tal, vi um cachorro sendo mantido sem água e comida..." 
                  />
                  
                  <div className="flex gap-3 pt-2">
                     <button 
                        type="button" 
                        onClick={() => setIsReporting(false)} 
                        className="flex-1 py-4 font-bold text-zinc-500 bg-zinc-100 rounded-2xl hover:bg-zinc-200"
                     >
                        Cancelar
                     </button>
                     <button 
                        type="submit" 
                        disabled={reportingSubmitting} 
                        className="flex-1 py-4 font-bold text-white bg-rose-500 rounded-2xl shadow-lg shadow-rose-200 disabled:opacity-50 flex items-center justify-center gap-2"
                     >
                        {reportingSubmitting ? 'Enviando...' : <><Send className="w-4 h-4" /> Enviar</>}
                     </button>
                  </div>
               </div>
            </form>
         </div>
      )}

      {isAdding && (
         <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
            <form onSubmit={handleAddPet} className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-xl my-8">
               <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-black text-zinc-900">Doar um Animal</h2>
                  <button type="button" onClick={() => setIsAdding(false)} className="text-zinc-400 hover:text-zinc-600">✕</button>
               </div>

               <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <label className="text-xs font-bold text-zinc-500 uppercase block mb-1">Nome do Pet</label>
                        <input required type="text" value={newPet.name} onChange={e => setNewPet({...newPet, name: e.target.value})} className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl outline-none focus:border-primary font-bold" />
                     </div>
                     <div>
                        <label className="text-xs font-bold text-zinc-500 uppercase block mb-1">Espécie</label>
                        <select value={newPet.species} onChange={e => setNewPet({...newPet, species: e.target.value})} className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl outline-none focus:border-primary font-bold">
                           {categories.length > 0 ? (
                              categories.map(cat => (
                                 <option key={cat.id} value={cat.name}>{cat.name}</option>
                              ))
                           ) : (
                              <>
                                 <option>Cachorro</option>
                                 <option>Gato</option>
                                 <option>Outros</option>
                              </>
                           )}
                        </select>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <label className="text-xs font-bold text-zinc-500 uppercase block mb-1">Raça (ou SRD)</label>
                        <input type="text" value={newPet.breed} onChange={e => setNewPet({...newPet, breed: e.target.value})} className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl outline-none focus:border-primary font-bold" />
                     </div>
                     <div>
                        <label className="text-xs font-bold text-zinc-500 uppercase block mb-1">Idade Aprox.</label>
                        <input type="text" value={newPet.age} onChange={e => setNewPet({...newPet, age: e.target.value})} className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl outline-none focus:border-primary font-bold" placeholder="Ex: 2 meses, 1 ano" />
                     </div>
                  </div>

                  <div>
                     <label className="text-xs font-bold text-zinc-500 uppercase block mb-1">Localização</label>
                     <input type="text" value={newPet.location} onChange={e => setNewPet({...newPet, location: e.target.value})} className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl outline-none focus:border-primary font-bold" placeholder="Bairro / Cidade" />
                  </div>

                  <div>
                     <label className="text-xs font-bold text-zinc-500 uppercase block mb-1">Descrição / História</label>
                     <textarea required value={newPet.description} onChange={e => setNewPet({...newPet, description: e.target.value})} className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl outline-none focus:border-primary font-medium resize-none" rows={3} placeholder="Conte um pouco sobre o animal..." />
                  </div>

                  <div>
                     <label className="text-xs font-bold text-zinc-500 uppercase block mb-1">Seu WhatsApp de Contato</label>
                     <input required type="text" value={newPet.phone} onChange={e => setNewPet({...newPet, phone: e.target.value})} className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl outline-none focus:border-primary font-bold" placeholder="(00) 00000-0000" />
                     <p className="text-[10px] text-zinc-400 mt-1 font-bold">Importante: As pessoas entrarão em contato por este número para adotar.</p>
                  </div>

                  <div className="p-4 bg-zinc-50 border border-dashed border-zinc-300 rounded-2xl">
                     <ImageUploader value={newPet.imageUrl} onChange={val => setNewPet({...newPet, imageUrl: val || ''})} label="Foto do Pet (Obrigatório)" />
                  </div>

                  <div className="pt-4 flex gap-3">
                     <button type="button" onClick={() => setIsAdding(false)} className="flex-1 py-4 font-bold text-zinc-500 bg-zinc-100 rounded-2xl hover:bg-zinc-200">Cancelar</button>
                     <button type="submit" disabled={submitting} className="flex-1 py-4 font-bold text-white bg-primary rounded-2xl shadow-lg shadow-primary/20 disabled:opacity-50">
                        {submitting ? 'Cadastrando...' : 'Enviar para Adoção'}
                     </button>
                  </div>
               </div>
            </form>
         </div>
      )}
    </div>
  );
}
