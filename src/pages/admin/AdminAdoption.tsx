import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, updateDoc, deleteDoc, orderBy, setDoc, serverTimestamp, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { toast } from 'sonner';
import { useConfirm } from '../../hooks/useConfirm';
import { Check, X, Trash2, PawPrint, ExternalLink, Plus, Camera } from 'lucide-react';
import ImageUploader from '../../components/ImageUploader';
import { useAuth } from '../../contexts/AuthContext';
import { handleFirestoreError, OperationType } from '../../firebase/errors';

export default function AdminAdoption({ cityId: overrideCityId }: { cityId?: string }) {
  const { userProfile } = useAuth();
  const isSuperAdmin = userProfile?.role === 'super_admin' || userProfile?.role === 'admin';
  const cityId = overrideCityId || userProfile?.cityId;

  const [pets, setPets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newPet, setNewPet] = useState({
    name: '',
    species: '',
    breed: '',
    age: '',
    description: '',
    location: '',
    imageUrl: '',
    ownerPhone: ''
  });
  const { confirm } = useConfirm();

  useEffect(() => { 
    const unsubCats = onSnapshot(query(collection(db, 'categories'), where('type', '==', 'adoption'), where('active', '==', true)), (snap) => {
       setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => handleFirestoreError(err, OperationType.GET, 'categories'));

    const constraints: any[] = [];
    if (cityId) {
      constraints.push(where('cityId', '==', cityId));
    }

    const unsubPets = onSnapshot(query(collection(db, 'adoption_pets'), ...constraints, orderBy('createdAt', 'desc')), (snapshot) => {
       setPets(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
       setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.GET, 'adoption_pets'));

    return () => {
       unsubCats();
       unsubPets();
    }
  }, [isSuperAdmin, cityId]);

  const fetchCategories = async () => {};

  const fetchPets = async () => {};

  const handleCreatePet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPet.name || !newPet.species || !newPet.imageUrl) {
      toast.error('Preencha os campos obrigatórios (Nome, Espécie e Foto)');
      return;
    }

    try {
      const petId = `pet_${Date.now()}`;
      await setDoc(doc(db, 'adoption_pets', petId), {
        ...newPet,
        cityId: cityId || '',
        ownerId: userProfile?.userId,
        ownerName: 'Administrador',
        status: 'approved',
        createdAt: serverTimestamp()
      });
      toast.success('Animal cadastrado com sucesso!');
      setIsAdding(false);
      setNewPet({
        name: '',
        species: '',
        breed: '',
        age: '',
        description: '',
        location: '',
        imageUrl: '',
        ownerPhone: ''
      });
      fetchPets();
    } catch (e) {
      toast.error('Erro ao cadastrar animal.');
      handleFirestoreError(e, OperationType.WRITE, null);
    }
  };

  const handleAction = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'adoption_pets', id), { status });
      toast.success(status === 'approved' ? 'Pet aprovado!' : 'Pet rejeitado.');
      fetchPets();
    } catch (e) {
      toast.error('Erro ao processar.');
    }
  };

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm({
      title: 'Excluir Pet',
      description: 'Deseja remover este pet permanentemente?',
      type: 'danger',
      confirmText: 'Excluir'
    });
    if (isConfirmed) {
      await deleteDoc(doc(db, 'adoption_pets', id));
      toast.success('Pet excluído.');
      fetchPets();
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-zinc-100 overflow-hidden mb-8">
      <div className="px-8 py-6 border-b border-zinc-100 flex justify-between items-center bg-white">
        <div>
          <h3 className="font-black text-xl text-zinc-900">Adoção de Animais</h3>
          <p className="text-sm text-zinc-500">Aprove ou gerencie os pedidos de adoção.</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all ${
            isAdding ? 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200' : 'bg-rose-500 text-white hover:bg-rose-600 shadow-lg shadow-rose-200'
          }`}
        >
          {isAdding ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {isAdding ? 'Cancelar' : 'Novo Animal'}
        </button>
      </div>

      <div className="p-8">
        {isAdding && (
          <form onSubmit={handleCreatePet} className="mb-12 bg-zinc-50 rounded-[2.5rem] p-8 border border-zinc-100 animate-in fade-in slide-in-from-top-4 duration-300">
            <h4 className="font-black text-lg text-zinc-900 mb-6 flex items-center gap-2">
              <Camera className="w-5 h-5 text-rose-500" /> Cadastrar Novo Pet
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label className="text-xs font-black text-zinc-400 uppercase tracking-widest block mb-2">Nome do Animal *</label>
                  <input 
                    required 
                    type="text" 
                    value={newPet.name} 
                    onChange={e => setNewPet({...newPet, name: e.target.value})}
                    placeholder="Ex: Tobby, Mel, Pipoca..."
                    className="w-full bg-white border border-zinc-200 px-5 py-4 rounded-2xl outline-none focus:border-rose-500 transition-all font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-black text-zinc-400 uppercase tracking-widest block mb-2">Espécie *</label>
                    <select 
                      required 
                      value={newPet.species} 
                      onChange={e => setNewPet({...newPet, species: e.target.value})}
                      className="w-full bg-white border border-zinc-200 px-5 py-4 rounded-2xl outline-none focus:border-rose-500 transition-all font-bold appearance-none"
                    >
                      <option value="">Selecione...</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                      ))}
                      <option value="Cachorro">Cachorro</option>
                      <option value="Gato">Gato</option>
                      <option value="Outros">Outros</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-black text-zinc-400 uppercase tracking-widest block mb-2">Idade</label>
                    <input 
                      type="text" 
                      value={newPet.age} 
                      onChange={e => setNewPet({...newPet, age: e.target.value})}
                      placeholder="Ex: 2 anos, Filhote..."
                      className="w-full bg-white border border-zinc-200 px-5 py-4 rounded-2xl outline-none focus:border-rose-500 transition-all font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-black text-zinc-400 uppercase tracking-widest block mb-2">Raça (Opcional)</label>
                  <input 
                    type="text" 
                    value={newPet.breed} 
                    onChange={e => setNewPet({...newPet, breed: e.target.value})}
                    placeholder="Ex: Poodle, Vira-lata..."
                    className="w-full bg-white border border-zinc-200 px-5 py-4 rounded-2xl outline-none focus:border-rose-500 transition-all font-bold"
                  />
                </div>
                
                <div>
                  <label className="text-xs font-black text-zinc-400 uppercase tracking-widest block mb-2">WhatsApp para Contato</label>
                  <input 
                    type="text" 
                    value={newPet.ownerPhone} 
                    onChange={e => setNewPet({...newPet, ownerPhone: e.target.value})}
                    placeholder="Ex: 51988887777"
                    className="w-full bg-white border border-zinc-200 px-5 py-4 rounded-2xl outline-none focus:border-rose-500 transition-all font-bold"
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-xs font-black text-zinc-400 uppercase tracking-widest block mb-2">Foto *</label>
                  <ImageUploader 
                    value={newPet.imageUrl} 
                    onChange={val => setNewPet({...newPet, imageUrl: val || ''})} 
                    label="Clique para enviar foto"
                  />
                </div>
                
                <div>
                  <label className="text-xs font-black text-zinc-400 uppercase tracking-widest block mb-2">Localização</label>
                  <input 
                    type="text" 
                    value={newPet.location} 
                    onChange={e => setNewPet({...newPet, location: e.target.value})}
                    placeholder="Ex: Centro, Porto Alegre..."
                    className="w-full bg-white border border-zinc-200 px-5 py-4 rounded-2xl outline-none focus:border-rose-500 transition-all font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-black text-zinc-400 uppercase tracking-widest block mb-2">Descrição / História</label>
                  <textarea 
                    rows={4}
                    value={newPet.description} 
                    onChange={e => setNewPet({...newPet, description: e.target.value})}
                    placeholder="Conte um pouco sobre o animal..."
                    className="w-full bg-white border border-zinc-200 px-5 py-4 rounded-2xl outline-none focus:border-rose-500 transition-all font-bold resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-zinc-200 flex justify-end">
              <button 
                type="submit"
                className="bg-zinc-900 text-white px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-black/10"
              >
                Publicar Animal
              </button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {pets.map(pet => (
            <div key={pet.id} className="border border-zinc-100 rounded-2xl overflow-hidden flex flex-col sm:flex-row group transition-all hover:bg-zinc-50">
              <div className="w-full sm:w-32 h-32 relative">
                <img src={pet.imageUrl} className="w-full h-full object-cover" />
                <div className={`absolute top-2 left-2 px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                  pet.status === 'approved' ? 'bg-green-500 text-white' : 
                  pet.status === 'pending' ? 'bg-amber-500 text-white' : 'bg-red-500 text-white'
                }`}>
                  {pet.status === 'approved' ? 'Visível' : pet.status === 'pending' ? 'Pendente' : 'Rejeitado'}
                </div>
              </div>
              <div className="p-4 flex-1">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-bold text-zinc-900">{pet.name}</h4>
                    <p className="text-[10px] text-zinc-500 uppercase font-black">{pet.species} • {pet.age}</p>
                  </div>
                  <div className="flex gap-1">
                    {pet.status === 'pending' && (
                      <>
                        <button onClick={() => handleAction(pet.id, 'approved')} className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100"><Check className="w-4 h-4" /></button>
                        <button onClick={() => handleAction(pet.id, 'rejected')} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"><X className="w-4 h-4" /></button>
                      </>
                    )}
                    <button onClick={() => handleDelete(pet.id)} className="p-2 bg-zinc-50 text-zinc-400 rounded-lg hover:bg-zinc-100"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">{pet.description}</p>
                <div className="mt-3 pt-3 border-t border-zinc-100 flex items-center justify-between">
                   <div className="text-[10px] text-zinc-400 font-bold">Por: {pet.ownerName}</div>
                   <div className="flex gap-2">
                      <a href={pet.imageUrl} target="_blank" className="p-1 text-zinc-400 hover:text-zinc-600 transition-colors"><ExternalLink className="w-3.5 h-3.5" /></a>
                   </div>
                </div>
              </div>
            </div>
          ))}
          {pets.length === 0 && (
            <div className="col-span-full text-center py-12">
              <PawPrint className="w-12 h-12 text-zinc-200 mx-auto mb-4" />
              <p className="text-zinc-400 font-medium">Nenhum animal cadastrado ainda.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
