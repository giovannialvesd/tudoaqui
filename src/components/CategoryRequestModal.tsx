import React, { useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { toast } from 'sonner';
import { X, Send } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function CategoryRequestModal({ isOpen, onClose, defaultType = 'merchant' }: { isOpen: boolean, onClose: () => void, defaultType?: string }) {
  const { currentUser, userProfile } = useAuth();
  const [suggestedName, setSuggestedName] = useState('');
  const [type, setType] = useState(defaultType);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suggestedName.trim()) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'category_requests'), {
        userId: currentUser?.uid,
        userName: userProfile?.name || 'Usuário',
        suggestedName: suggestedName.trim(),
        type,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      toast.success('Solicitação enviada! Nossa equipe analisará em breve.');
      onClose();
      setSuggestedName('');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao enviar solicitação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-zinc-100 flex justify-between items-center">
          <h2 className="text-xl font-black text-zinc-900">Sugerir Nova Categoria</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-100 transition-colors">
            <X className="w-5 h-5 text-zinc-500" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
           <p className="text-sm text-zinc-600 mb-4">
              Não encontrou a categoria ideal para o seu negócio? Sugira uma nova e nossa equipe irá avaliar.
           </p>

           <div>
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-2">Nome da Categoria</label>
              <input 
                type="text" 
                required
                value={suggestedName}
                onChange={e => setSuggestedName(e.target.value)}
                placeholder="Ex: Climatização, Peixaria..." 
                className="w-full bg-zinc-50 border border-zinc-200 px-5 py-3.5 rounded-2xl outline-none focus:border-emerald-500 focus:bg-white font-medium text-zinc-900 transition-colors"
              />
           </div>

           <div>
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-2">Área de Atuação</label>
              <select 
                 value={type} 
                 onChange={e => setType(e.target.value)}
                 className="w-full bg-zinc-50 border border-zinc-200 px-5 py-3.5 rounded-2xl outline-none focus:border-emerald-500 focus:bg-white font-medium text-zinc-900 transition-colors"
              >
                 <option value="merchant">Comércio / Loja</option>
                 <option value="service">Serviços Gerais</option>
              </select>
           </div>

           <div className="pt-4">
              <button 
                 type="submit" 
                 disabled={loading}
                 className="w-full bg-zinc-900 text-white font-bold px-6 py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-black transition-colors disabled:opacity-50"
              >
                 {loading ? 'Enviando...' : <><Send className="w-5 h-5" /> Enviar Solicitação</>}
              </button>
           </div>
        </form>
      </div>
    </div>
  );
}
