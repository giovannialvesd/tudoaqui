import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, setDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

export interface FavoriteItem {
  id?: string;
  userId: string;
  itemId: string;
  type: 'product' | 'merchant' | 'provider' | 'driver' | 'campaign';
  title: string;
  subtitle?: string;
  imageUrl?: string;
  url: string;
  createdAt?: any;
}

export function useFavorites() {
  const { currentUser } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFavorites = async () => {
    if (!currentUser) {
      setFavorites([]);
      setLoading(false);
      return;
    }
    
    try {
      const q = query(collection(db, 'favorites'), where('userId', '==', currentUser.uid));
      const snap = await getDocs(q);
      const favs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as FavoriteItem));
      // Sort in memory by createdAt descending
      favs.sort((a, b) => {
         const timeA = a.createdAt?.seconds || 0;
         const timeB = b.createdAt?.seconds || 0;
         return timeB - timeA;
      });
      setFavorites(favs);
    } catch (e) {
      console.error('Error fetching favorites:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, [currentUser]);

  const toggleFavorite = async (item: Omit<FavoriteItem, 'id' | 'userId' | 'createdAt'>) => {
    if (!currentUser) {
      toast.error('Você precisa estar logado para favoritar.');
      return false;
    }

    try {
      const existingIdx = favorites.findIndex(f => f.itemId === item.itemId && f.type === item.type);
      
      if (existingIdx >= 0) {
        // Remove Favorite
        const favId = favorites[existingIdx].id;
        if (favId) {
          await deleteDoc(doc(db, 'favorites', favId));
          setFavorites(prev => prev.filter(f => f.id !== favId));
          toast.success('Removido dos favoritos');
        }
        return false; // is not favorite anymore
      } else {
        // Add Favorite
        const newFavId = `fav_${currentUser.uid}_${item.itemId}`;
        const newFav: FavoriteItem = {
          ...item,
          userId: currentUser.uid,
          createdAt: serverTimestamp(),
        };
        await setDoc(doc(db, 'favorites', newFavId), newFav);
        
        // Optimistic update
        setFavorites(prev => [{...newFav, id: newFavId}, ...prev]);
        toast.success('Adicionado aos favoritos!');
        return true; // is favorite now
      }
    } catch (e) {
      console.error(e);
      toast.error('Erro ao atualizar favorito.');
      return false;
    }
  };

  const isFavorite = (itemId: string, type: string) => {
    return favorites.some(f => f.itemId === itemId && f.type === type);
  };

  return { favorites, loading, toggleFavorite, isFavorite, refresh: fetchFavorites };
}
