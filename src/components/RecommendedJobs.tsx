import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, limit, orderBy, getDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/errors';
import { Briefcase, MapPin, DollarSign, ChevronRight, Store } from 'lucide-react';

export default function RecommendedJobs() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const q = query(
          collection(db, 'jobs'), 
          orderBy('createdAt', 'desc'),
          limit(20) // Get more to filter locally
        );
        const snapshot = await getDocs(q);
        
        const rawJobs = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as any));
        const filteredJobs = rawJobs.filter((j: any) => j.status === 'active').slice(0, 6);

        const jobsData = await Promise.all(filteredJobs.map(async (data: any) => {
          if (data.merchantId) {
            const mSnap = await getDoc(doc(db, 'business_profiles', data.merchantId));
            if (mSnap.exists()) {
              data.merchant = mSnap.data();
            }
          }
          return data;
        }));

        setJobs(jobsData);
      } catch (e) {
        handleFirestoreError(e, OperationType.LIST, 'jobs');
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  if (loading) return null;
  if (jobs.length === 0) return null;

  return (
    <section className="mt-12">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h2 className="font-black text-2xl text-zinc-900 tracking-tight">Vagas de Emprego</h2>
          <p className="text-zinc-500 font-medium">Oportunidades no comércio local</p>
        </div>
        <button 
          onClick={() => navigate('/empregos')} 
          className="text-amber-600 font-bold text-sm bg-amber-50 px-5 py-2.5 rounded-xl hover:bg-amber-100 transition-colors"
        >
          Ver Todas
        </button>
      </div>

      <div className="flex gap-5 overflow-x-auto no-scrollbar pb-6 -mx-4 px-4 md:mx-0 md:px-0">
        {jobs.map(job => (
          <div 
            key={job.id} 
            onClick={() => navigate('/empregos')}
            className="min-w-[280px] md:min-w-[320px] bg-white rounded-3xl p-5 border border-zinc-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group shrink-0"
          >
            <div className="flex gap-4 items-center mb-4">
              <div className="w-12 h-12 bg-zinc-50 rounded-xl flex items-center justify-center shrink-0 border border-zinc-100 overflow-hidden">
                {job.merchant?.logoImage ? (
                  <img src={job.merchant.logoImage} alt="" loading="lazy" className="w-full h-full object-cover" />
                ) : (
                  <Store className="w-6 h-6 text-zinc-300" />
                )}
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-zinc-900 text-sm line-clamp-1">{job.title}</h3>
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest truncate">{job.merchant?.businessName || 'Comércio Parceiro'}</p>
              </div>
            </div>

            <p className="text-zinc-500 text-xs mb-5 line-clamp-2 leading-relaxed h-8">
              {job.description}
            </p>

            <div className="flex flex-wrap gap-2 mt-auto">
               <div className="flex items-center gap-1.5 text-[10px] font-black text-zinc-500 bg-zinc-100 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                  <DollarSign className="w-3 h-3 text-emerald-500" /> {job.salary || 'A combinar'}
               </div>
               {job.merchant?.address && (
                 <div className="flex items-center gap-1.5 text-[10px] font-black text-zinc-500 bg-zinc-100 px-2.5 py-1 rounded-lg uppercase tracking-wider max-w-[150px]">
                    <MapPin className="w-3 h-3 text-rose-400" /> <span className="truncate">{job.merchant.address}</span>
                 </div>
               )}
            </div>

            <div className="mt-5 pt-4 border-t border-zinc-50 flex items-center justify-between">
               <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg uppercase tracking-widest">Inscrições Abertas</span>
               <div className="w-8 h-8 rounded-full bg-zinc-50 flex items-center justify-center group-hover:bg-amber-50 transition-colors">
                 <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-amber-500 transition-colors" />
               </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
