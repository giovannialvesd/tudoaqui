import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, MessageSquareHeart } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { cn } from '../lib/utils';
import { handleFirestoreError, OperationType } from '../firebase/errors';
import { toast } from 'sonner';

export default function FeedbackPage() {
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();
  
  const [name, setName] = useState(userProfile?.name || '');
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'feedbacks'), {
        userId: currentUser.uid,
        userName: name || userProfile?.name || 'Anônimo',
        content,
        rating,
        approved: false,
        createdAt: serverTimestamp()
      }).catch(e => handleFirestoreError(e, OperationType.CREATE, 'feedbacks'));
      setSuccess(true);
      toast.success('Feedback enviado. Obrigado!');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao enviar feedback. Tente novamente mais tarde.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-base flex flex-col">
      <div className="bg-white px-4 py-4 border-b border-zinc-100 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => navigate('/')} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-zinc-100">
          <ArrowLeft className="w-6 h-6 text-zinc-600" />
        </button>
        <h1 className="font-bold text-zinc-800 text-lg">Deixar Feedback</h1>
      </div>

      <div className="flex-1 p-6 max-w-xl mx-auto w-full flex flex-col items-center">
        {!success ? (
          <>
             <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                <MessageSquareHeart className="w-8 h-8 text-primary" />
             </div>
             <h2 className="text-2xl font-black text-zinc-900 mb-2 text-center">Como foi sua experiência?</h2>
             <p className="text-zinc-500 text-center mb-8">Sua opinião ajuda a melhorar a plataforma TudoAqui para toda a comunidade.</p>

             <form onSubmit={handleSubmit} className="w-full space-y-6 flex flex-col">
               <div className="flex justify-center gap-2 mb-4">
                 {[1, 2, 3, 4, 5].map((star) => (
                   <button 
                     type="button" 
                     key={star} 
                     onClick={() => setRating(star)}
                     className="transition-transform hover:scale-110"
                   >
                     <Star className={cn("w-10 h-10", rating >= star ? "fill-orange-400 text-orange-400" : "text-zinc-300")} />
                   </button>
                 ))}
               </div>

               <div>
                  <label className="block text-sm font-bold text-zinc-700 mb-2">Seu Nome</label>
                  <input 
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    placeholder="Como quer ser identificado?"
                    className="w-full bg-white border border-zinc-200 rounded-2xl p-4 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-bold"
                  />
               </div>

               <div>
                 <textarea 
                   rows={5}
                   value={content}
                   onChange={e => setContent(e.target.value)}
                   required
                   maxLength={1000}
                   placeholder="Conte-nos o que achou ou como podemos melhorar..."
                   className="w-full bg-white border border-zinc-200 rounded-2xl p-4 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 resize-none"
                 />
                 <div className="text-right mt-1 text-xs text-zinc-400 font-medium">
                   {content.length}/1000
                 </div>
               </div>

               <button 
                 type="submit" 
                 disabled={submitting || content.length < 5}
                 className="w-full py-4 rounded-2xl bg-primary text-white font-bold disabled:opacity-50 transition-opacity"
               >
                 {submitting ? 'Enviando...' : 'Enviar Feedback'}
               </button>
             </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center pt-10">
             <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
               <span className="text-3xl">🎉</span>
             </div>
             <h2 className="text-2xl font-black text-center mb-2">Muito obrigado!</h2>
             <p className="text-zinc-500 text-center mb-8">Seu feedback foi recebido e nos ajudará a criar um produto ainda melhor.</p>
             <button onClick={() => navigate('/')} className="bg-zinc-100 text-zinc-800 font-bold px-8 py-3 rounded-full hover:bg-zinc-200">
               Voltar para o Início
             </button>
          </div>
        )}
      </div>
    </div>
  );
}
