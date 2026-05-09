import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { BlocksRenderer } from '../components/AIPageBlocks';
import { Loader2 } from 'lucide-react';

export default function DynamicPage() {
    const { "*": dynamicPath } = useParams();
    const location = useLocation();
    const [pageConfig, setPageConfig] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPage = async () => {
            setLoading(true);
            try {
                // Since react-router splat routes just give the rest of the path, we reconstruct it:
                const fullPath = location.pathname;
                
                const q = query(collection(db, 'generated_pages'), where('path', '==', fullPath));
                const snapshot = await getDocs(q);
                
                if (!snapshot.empty) {
                    setPageConfig(snapshot.docs[0].data());
                } else {
                    setPageConfig(null);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        fetchPage();
    }, [location.pathname]);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-bg-base">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
    }

    if (!pageConfig) {
        return <div className="min-h-screen flex flex-col items-center justify-center bg-bg-base">
            <h1 className="text-4xl font-black text-zinc-900 mb-2">404</h1>
            <p className="text-zinc-500 font-medium">Página não encontrada.</p>
        </div>
    }

    return (
        <div className="min-h-screen bg-bg-base pb-20">
            <BlocksRenderer blocks={pageConfig.blocks} themeColor={pageConfig.themeColor || 'primary'} />
        </div>
    );
}
