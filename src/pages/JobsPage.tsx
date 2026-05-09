import React, { useState, useEffect } from 'react';
import { query, where, getDocs, orderBy, getDoc, doc, collection } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Users, Briefcase, Clock, DollarSign, Send, Store, MapPin } from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';

import { useCity } from '../contexts/CityContext';

export default function JobsPage() {
   const [jobs, setJobs] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);
   const navigate = useNavigate();
   const { currentCity } = useCity();

   useEffect(() => {
      const fetchJobs = async () => {
         try {
            const cityId = currentCity?.id;
            const constraints: any[] = [orderBy('createdAt', 'desc')];
            if (cityId) constraints.push(where('cityId', '==', cityId));
            
            const q = query(collection(db, 'jobs'), ...constraints);
            const snap = await getDocs(q);
            
            const rawJobs = snap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as any));
            const filteredJobs = rawJobs.filter((j: any) => j.status === 'active');

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
         } catch(e) {
            console.error(e);
         } finally {
            setLoading(false);
         }
      };
      
      fetchJobs();
   }, [currentCity]);

   return (
      <div className="min-h-screen bg-bg-base flex flex-col pb-20">
         <div className="bg-zinc-900 border-b border-zinc-800">
            <div className="max-w-screen-xl mx-auto px-4 md:px-8 py-16 text-center">
               <Briefcase className="w-16 h-16 text-primary mx-auto mb-6" />
               <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight drop-shadow-md">TudoAqui Empregos</h1>
               <p className="text-zinc-400 font-medium text-lg max-w-2xl mx-auto">Encontre a sua próxima oportunidade de trabalho direto no comércio local da sua região.</p>
            </div>
         </div>

         <div className="flex-1 max-w-screen-xl mx-auto w-full px-4 md:px-8 py-12">
            {loading ? (
               <div className="col-span-full py-20 flex justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent animate-spin rounded-full"></div></div>
            ) : jobs.length === 0 ? (
               <div className="text-center py-20">
                  <Users className="w-16 h-16 text-zinc-300 mx-auto mb-4" />
                  <h3 className="font-bold text-zinc-700 text-xl">Nenhuma vaga aberta no momento</h3>
                  <p className="text-zinc-500 mt-2">Os comércios locais não publicaram nenhuma oportunidade recentemente.</p>
               </div>
            ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {jobs.map((job, idx) => (
                     <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        key={job.id} 
                        className="bg-white rounded-[2rem] border border-zinc-100 p-6 sm:p-8 flex flex-col hover:border-primary/30 transition-colors shadow-sm group"
                     >
                        <div className="flex gap-4 items-center mb-6">
                           <div className="w-14 h-14 bg-zinc-100 rounded-2xl flex items-center justify-center shrink-0 border border-zinc-200/50 overflow-hidden">
                              {job.merchant?.logoImage ? (
                                 <img src={job.merchant.logoImage} className="w-full h-full object-cover" />
                              ) : (
                                 <Store className="w-7 h-7 text-zinc-400" />
                              )}
                           </div>
                           <div>
                              <p className="font-black text-zinc-400 text-xs uppercase tracking-wider mb-0.5">{job.merchant?.businessName || 'Comércio Local'}</p>
                              <h3 className="font-bold text-zinc-900 leading-tight line-clamp-1">{job.title}</h3>
                           </div>
                        </div>

                        <p className="text-zinc-500 text-sm mb-6 flex-1 line-clamp-3 leading-relaxed">{job.description}</p>
                        
                        <div className="space-y-3 mb-6 bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
                           {job.salary && (
                              <div className="flex items-center gap-2 text-sm text-zinc-700 font-medium">
                                 <DollarSign className="w-4 h-4 text-emerald-500 shrink-0" />
                                 <span className="line-clamp-1">{job.salary}</span>
                              </div>
                           )}
                           {job.hours && (
                              <div className="flex items-center gap-2 text-sm text-zinc-700 font-medium">
                                 <Clock className="w-4 h-4 text-blue-500 shrink-0" />
                                 <span className="line-clamp-1">{job.hours}</span>
                              </div>
                           )}
                           {job.merchant?.address && (
                              <div className="flex items-center gap-2 text-sm text-zinc-700 font-medium">
                                 <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
                                 <span className="line-clamp-1">{job.merchant.address}</span>
                              </div>
                           )}
                        </div>

                        <div className="flex flex-col gap-2 mt-auto">
                           {job.contactInfo && (
                               <a 
                                 className="w-full bg-zinc-900 border border-zinc-800 text-white font-bold py-3.5 rounded-xl text-center text-sm shadow-md hover:bg-black transition-all flex justify-center items-center gap-2"
                                 href={job.contactInfo.includes('@') ? `mailto:${job.contactInfo}` : `https://wa.me/55${job.contactInfo.replace(/\D/g, '')}`}
                                 target="_blank" rel="noreferrer"
                               >
                                 <Send className="w-4 h-4" /> Enviar Currículo
                               </a>
                           )}
                           {job.merchant && (
                              <button onClick={() => navigate(`/comercio/${job.merchantId}`)} className="w-full bg-zinc-100 text-zinc-700 font-bold py-3 rounded-xl text-center text-sm hover:bg-zinc-200 transition-colors">
                                 Ver Empresa
                              </button>
                           )}
                        </div>
                     </motion.div>
                  ))}
               </div>
            )}
         </div>
      </div>
   );
}