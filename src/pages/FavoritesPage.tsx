import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Heart, Store, ChevronLeft, Package, User, ExternalLink, Trash2, Car } from 'lucide-react';
import { useFavorites } from '../hooks/useFavorites';

export default function FavoritesPage() {
  const navigate = useNavigate();
  const { favorites, loading, toggleFavorite } = useFavorites();

  const getIcon = (type: string) => {
     switch(type) {
        case 'product': return <Package className="w-5 h-5" />;
        case 'merchant': return <Store className="w-5 h-5" />;
        case 'provider': return <User className="w-5 h-5" />;
        case 'driver': return <Car className="w-5 h-5" />; // Need to import Car
        default: return <Store className="w-5 h-5" />;
     }
  };

  return (
    <div className="min-h-screen bg-bg-base flex flex-col md:pt-4">
      <div className="bg-white p-4 sticky top-0 z-10 border-b border-zinc-100 md:hidden">
         <div className="flex items-center gap-3 mb-4">
            <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-zinc-100 transition-colors">
               <ChevronLeft className="w-6 h-6 text-zinc-600" />
            </button>
            <h1 className="text-xl font-bold text-zinc-900">Favoritos</h1>
         </div>
      </div>

      <div className="px-4 py-8 md:px-8 max-w-screen-xl mx-auto w-full">
         <div className="hidden md:flex items-center gap-4 mb-8">
            <h1 className="text-3xl font-black text-zinc-900">Meus Favoritos</h1>
            <span className="bg-rose-100 text-rose-600 font-bold px-3 py-1 rounded-full text-sm">
               {favorites.length} salvos
            </span>
         </div>
         
         {loading ? (
             <div className="flex items-center justify-center py-20">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
             </div>
         ) : favorites.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-zinc-100 max-w-md mx-auto py-20 text-center">
               <Heart className="w-16 h-16 text-rose-500/20 mx-auto mb-6" />
               <h2 className="text-2xl font-black text-zinc-900 mb-3">Nenhum favorito ainda</h2>
               <p className="text-zinc-500 font-medium mb-8">Você ainda não salvou nenhum comércio ou serviço nos seus favoritos.</p>
               <button onClick={() => navigate('/busca')} className="bg-zinc-900 text-white font-bold px-8 py-3.5 rounded-full shadow-lg hover:bg-zinc-800 transition-colors w-full flex items-center justify-center gap-2">
                  <Store className="w-5 h-5" />
                  Explorar Lojas
               </button>
            </div>
         ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               {favorites.map(fav => (
                  <div key={fav.id} className="bg-white rounded-3xl p-4 shadow-sm border border-zinc-100 flex gap-4 group">
                     {fav.imageUrl ? (
                        <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0 bg-zinc-100">
                           <img src={fav.imageUrl} alt={fav.title} className="w-full h-full object-cover" />
                        </div>
                     ) : (
                        <div className="w-24 h-24 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                           {getIcon(fav.type)}
                        </div>
                     )}
                     <div className="flex-1 flex flex-col justify-center">
                        <div className="flex justify-between items-start">
                           <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500 mb-1 block">
                              {fav.type === 'product' ? 'Produto' : fav.type === 'merchant' ? 'Loja' : 'Serviço'}
                           </span>
                           <button 
                             onClick={(e) => {
                                e.preventDefault();
                                toggleFavorite({ itemId: fav.itemId, type: fav.type, title: fav.title, url: fav.url });
                             }}
                             className="text-zinc-300 hover:text-rose-500 transition-colors"
                             title="Remover dos favoritos"
                           >
                              <Heart className="w-5 h-5 fill-rose-500 text-rose-500" />
                           </button>
                        </div>
                        <Link to={fav.url} className="hover:text-primary transition-colors">
                           <h3 className="font-bold text-zinc-900 leading-tight line-clamp-2">{fav.title}</h3>
                        </Link>
                        {fav.subtitle && <p className="text-zinc-500 text-xs mt-1 line-clamp-1">{fav.subtitle}</p>}
                        
                        <div className="mt-3">
                           <Link to={fav.url} className="text-xs font-bold text-zinc-900 bg-zinc-100 px-3 py-1.5 rounded-lg inline-flex flex-row items-center gap-1 hover:bg-zinc-200 transition-colors">
                              Acessar <ExternalLink className="w-3 h-3" />
                           </Link>
                        </div>
                     </div>
                  </div>
               ))}
            </div>
         )}
      </div>
    </div>
  );
}
