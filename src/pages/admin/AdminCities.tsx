import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, setDoc, updateDoc, deleteDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { toast } from 'sonner';
import { Plus, Search, Edit2, Trash2, Globe, Settings, Check, X } from 'lucide-react';
import { useConfirm } from '../../hooks/useConfirm';
import { handleFirestoreError, OperationType } from '../../firebase/errors';
import ImageUploader from '../../components/ImageUploader';

export default function AdminCities() {
  const [cities, setCities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [currentCity, setCurrentCity] = useState<any>(null);
  const { confirm } = useConfirm();

  const fetchCities = async () => {
    try {
      const q = query(collection(db, 'cities'), orderBy('name', 'asc'));
      const snapshot = await getDocs(q);
      setCities(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, 'cities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCities();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const cityData = {
        ...currentCity,
        slug: currentCity.slug.toLowerCase().replace(/\s+/g, '-'),
        updatedAt: serverTimestamp(),
      };

      if (currentCity.id) {
        await updateDoc(doc(db, 'cities', currentCity.id), cityData);
        toast.success('Cidade atualizada com sucesso!');
      } else {
        const newId = `city_${Date.now()}`;
        await setDoc(doc(db, 'cities', newId), {
          ...cityData,
          id: newId,
          active: true,
          createdAt: serverTimestamp(),
        });
        toast.success('Cidade criada com sucesso!');
      }
      setIsEditing(false);
      fetchCities();
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'cities');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const isConfirmed = await confirm({
      title: 'Excluir Cidade',
      description: `Tem certeza que deseja remover a cidade ${name}? Isso pode afetar dados vinculados.`,
      type: 'danger',
      confirmText: 'Excluir permanentemente'
    });

    if (isConfirmed) {
      try {
        await deleteDoc(doc(db, 'cities', id));
        toast.success('Cidade removida.');
        fetchCities();
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, 'cities');
      }
    }
  };

  const filteredCities = cities.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-8 text-center">Carregando cidades...</div>;

  return (
    <div className="space-y-6">
      {isEditing ? (
        <form onSubmit={handleSave} className="bg-white p-8 rounded-3xl border border-zinc-100 shadow-sm space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-black text-2xl text-zinc-900 tracking-tight">
              {currentCity?.id ? 'Editar Cidade' : 'Nova Cidade'}
            </h3>
            <button type="button" onClick={() => setIsEditing(false)} className="p-2 rounded-full hover:bg-zinc-100 transition-colors">
              <X className="w-6 h-6 text-zinc-400" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700">Nome da Cidade</label>
              <input 
                required
                type="text" 
                value={currentCity?.name || ''} 
                onChange={e => setCurrentCity({...currentCity, name: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-primary outline-none transition-all font-medium"
                placeholder="Ex: Rio de Janeiro"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700">Sigla do Estado</label>
              <input 
                required
                type="text" 
                maxLength={2}
                value={currentCity?.state || ''} 
                onChange={e => setCurrentCity({...currentCity, state: e.target.value.toUpperCase()})}
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-primary outline-none transition-all font-medium"
                placeholder="Ex: RJ"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700">URL Slug (identificador único)</label>
              <input 
                required
                type="text" 
                value={currentCity?.slug || ''} 
                onChange={e => setCurrentCity({...currentCity, slug: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-primary outline-none transition-all font-medium"
                placeholder="Ex: rio-de-janeiro"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700">Status</label>
              <select 
                value={currentCity?.active ? 'true' : 'false'}
                onChange={e => setCurrentCity({...currentCity, active: e.target.value === 'true'})}
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-primary outline-none transition-all font-medium"
              >
                <option value="true">Ativa</option>
                <option value="false">Inativa</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ImageUploader 
              label="Logo da Cidade (Brazeão)" 
              value={currentCity?.logoUrl || ''} 
              onChange={val => setCurrentCity({...currentCity, logoUrl: val || ''})} 
            />
            <ImageUploader 
              label="Banner de Fundo (HomePage)" 
              value={currentCity?.bannerUrl || ''} 
              onChange={val => setCurrentCity({...currentCity, bannerUrl: val || ''})} 
            />
          </div>

          <div className="flex gap-4 pt-4 border-t border-zinc-100">
            <button type="submit" className="flex-1 bg-primary text-white font-black py-4 rounded-2xl hover:shadow-lg hover:shadow-primary/20 transition-all">
              {currentCity?.id ? 'Salvar Alterações' : 'Criar Cidade'}
            </button>
            <button type="button" onClick={() => setIsEditing(false)} className="flex-1 bg-zinc-100 text-zinc-600 font-bold py-4 rounded-2xl hover:bg-zinc-200 transition-all">
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input 
                type="text" 
                placeholder="Buscar cidades..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-zinc-200 rounded-2xl py-3 pl-12 pr-4 text-sm font-medium focus:border-primary outline-none transition-all shadow-sm"
              />
            </div>
            <button 
              onClick={() => {
                setCurrentCity({ name: '', state: '', slug: '', active: true });
                setIsEditing(true);
              }}
              className="w-full md:w-auto bg-zinc-900 text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-black transition-all shadow-lg shadow-zinc-900/10"
            >
              <Plus className="w-5 h-5" />
              Adicionar Cidade
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCities.map(city => (
              <div key={city.id} className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden group hover:shadow-xl hover:border-primary/20 transition-all relative">
                <div className="h-24 bg-zinc-50 relative overflow-hidden">
                  {city.bannerUrl && <img src={city.bannerUrl} className="w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform duration-500" />}
                  <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setCurrentCity(city); setIsEditing(true); }} className="p-2 bg-white rounded-xl shadow-md text-zinc-600 hover:text-primary transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(city.id, city.name)} className="p-2 bg-white rounded-xl shadow-md text-zinc-600 hover:text-rose-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="p-6 pt-0 -mt-8 relative z-10 flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-white rounded-2xl shadow-lg border border-zinc-100 flex items-center justify-center mb-3">
                    {city.logoUrl ? (
                      <img src={city.logoUrl} className="w-12 h-12 object-contain" />
                    ) : (
                      <Globe className="w-8 h-8 text-zinc-200" />
                    )}
                  </div>
                  <h4 className="font-black text-xl text-zinc-900 tracking-tight">{city.name}</h4>
                  <p className="text-zinc-500 font-bold text-xs uppercase tracking-widest mb-4">{city.state}</p>
                  
                  <div className="flex items-center gap-2 w-full pt-4 border-t border-zinc-50">
                    <div className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${city.active ? 'bg-emerald-50 text-emerald-600' : 'bg-zinc-100 text-zinc-500'}`}>
                      {city.active ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                      {city.active ? 'Ativa' : 'Inativa'}
                    </div>
                    <a 
                      href={`/cidade/${city.slug}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2 bg-zinc-50 rounded-xl text-zinc-400 hover:bg-primary/10 hover:text-primary transition-all"
                      title="Ver portal da cidade"
                    >
                      <Globe className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredCities.length === 0 && (
            <div className="py-20 text-center bg-zinc-50 rounded-3xl border-2 border-dashed border-zinc-200">
              <Globe className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
              <p className="text-zinc-500 font-bold">Nenhuma cidade encontrada.</p>
              <button 
                onClick={() => {
                  setCurrentCity({ name: '', state: '', slug: '', active: true });
                  setIsEditing(true);
                }}
                className="mt-4 text-primary font-bold hover:underline"
              >
                Cadastrar primeira cidade agora
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
