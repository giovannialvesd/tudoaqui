import React, { useState, useEffect, useRef } from 'react';
import ExcelJS from 'exceljs';
import Papa from 'papaparse';
import { GoogleGenAI } from "@google/genai";
import { useAuth } from '../contexts/AuthContext';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Store, Package, PlusCircle, LayoutDashboard, Settings, Image as ImageIcon, ArrowLeft, Trash2, Edit2, TrendingUp, Users, Activity, HelpCircle, Star, UploadCloud, CheckSquare, FileText, ExternalLink, Sparkles, Loader2 } from 'lucide-react';
import { collection, doc, getDoc, getDocs, query, where, setDoc, updateDoc, deleteDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { toast } from 'sonner';
import { useConfirm } from '../hooks/useConfirm';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

import { generatePageFromDescription } from '../services/aiPageGeneration';
import { cn } from '../lib/utils';
import DashboardLayout from '../layouts/DashboardLayout';
import ImageUploader from '../components/ImageUploader';
import CategoryRequestModal from '../components/CategoryRequestModal';
import AiPageBuilder from '../components/AiPageBuilder';

const mockChartData = []; // Removed mock data

export default function MerchantDashboard() {
  const { userProfile, currentUser, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { confirm } = useConfirm();

  // Admin View Logic
  const queryParams = new URLSearchParams(location.search);
  const adminViewId = queryParams.get('admin_view');
  const isCityAdmin = ['city_admin', 'city_editor', 'city_support'].includes(userProfile?.role || '');
  const isGlobalAdmin = userProfile?.role === 'admin' || userProfile?.role === 'super_admin';
  const isAdmin = isGlobalAdmin || isCityAdmin;
  const effectiveUserId = (isAdmin && adminViewId) ? adminViewId : currentUser?.uid;
  
  const [activeTab, setActiveTab] = useState('Visão Geral');
  const [profile, setProfile] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [merchantCategories, setMerchantCategories] = useState<any[]>([]);
  const [productCategories, setProductCategories] = useState<any[]>([]);

  // Modals / Forms
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<any>({});
  
  const [isEditingBanner, setIsEditingBanner] = useState(false);
  const [currentBanner, setCurrentBanner] = useState<any>({});

  const [isEditingJob, setIsEditingJob] = useState(false);
  const [currentJob, setCurrentJob] = useState<any>({});
  
  const [isGeneratingPage, setIsGeneratingPage] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [requestType, setRequestType] = useState<'merchant' | 'product'>('merchant');
  const [useAIEnrichment, setUseAIEnrichment] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (effectiveUserId && (userProfile?.role === 'merchant' || isAdmin)) {
      fetchData();
    }
  }, [userProfile, currentUser, effectiveUserId]);

  const fetchData = async () => {
    if (!effectiveUserId) return;
    try {
      // Profile
      const profSnap = await getDoc(doc(db, 'business_profiles', effectiveUserId));
      if (profSnap.exists()) {
         setProfile(profSnap.data());
      } else {
         setProfile({ isOpen: true, category: '' });
      }
      
      // Products
      const prodQ = query(collection(db, 'products'), where('merchantId', '==', effectiveUserId));
      const prodSnap = await getDocs(prodQ);
      setProducts(prodSnap.docs.map(d => ({id: d.id, ...d.data()})));

      // Banners
      const banQ = query(collection(db, 'banners'), where('createdBy', '==', effectiveUserId), orderBy('createdAt', 'desc'));
      const banSnap = await getDocs(banQ);
      setBanners(banSnap.docs.map(d => ({id: d.id, ...d.data()})));

      // Jobs
      const jobQ = query(collection(db, 'jobs'), where('merchantId', '==', effectiveUserId), orderBy('createdAt', 'desc'));
      const jobSnap = await getDocs(jobQ);
      setJobs(jobSnap.docs.map(d => ({id: d.id, ...d.data()})));

      // Categories
      const catSnap = await getDocs(query(collection(db, 'categories'), where('active', '==', true)));
      const allCats = catSnap.docs.map(d => ({id: d.id, ...d.data()}));
      setMerchantCategories(allCats.filter((c: any) => c.type === 'merchant'));
      setProductCategories(allCats.filter((c: any) => c.type === 'product'));
    } catch (e) {
      console.error(e);
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!effectiveUserId) return;
    
    // Check total size to avoid Firestore 1MB limit error
    const size = new Blob([JSON.stringify(profile)]).size;
    if (size > 900000) { // 900kb safe limit
       toast.error('Erro: As imagens escolhidas são muito grandes. Por favor, reenvie as fotos da loja.');
       return;
    }
    
    setSaving(true);
    try {
      await setDoc(doc(db, 'business_profiles', effectiveUserId), {
        ...profile,
        userId: effectiveUserId,
        updatedAt: serverTimestamp()
      }, { merge: true });
      toast.success('Perfil atualizado com sucesso!');
    } catch(e) {
      console.error(e);
      toast.error('Erro ao atualizar perfil.');
    } finally {
      setSaving(false);
    }
  };

  const toggleStoreOpen = async () => {
    if(!effectiveUserId || !profile) return;
    try {
      const newState = !profile.isOpen;
      await setDoc(doc(db, 'business_profiles', effectiveUserId), { userId: effectiveUserId, isOpen: newState, updatedAt: serverTimestamp() }, { merge: true });
      setProfile({...profile, isOpen: newState});
    } catch(e) {}
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !effectiveUserId) return;
    
    setSaving(true);
    setImportProgress({ current: 0, total: 0 });

    const isExcel = file.name.endsWith('.xlsx');
    
    const processData = async (data: any[]) => {
      const total = data.length;
      if (total === 0) {
         toast.error('O arquivo parece estar vazio ou não tem o formato correto.');
         setSaving(false);
         return;
      }

      setImportProgress({ current: 0, total });
      
      let ai: any = null;
      let mapping: any = null;

      try {
         const key = process.env.GEMINI_API_KEY;
         if (key) {
            ai = new GoogleGenAI({ apiKey: key });
            
            // AI mapping: Send headers and a sample to get the mapping
            const headers = Object.keys(data[0]);
            const sample = data.slice(0, 3);
            
            const mappingPrompt = `
               Você é um especialista em processamento de dados. Recebi uma planilha de produtos e preciso mapear as colunas para o meu sistema.
               Colunas disponíveis: ${headers.join(', ')}
               Amostra de dados: ${JSON.stringify(sample)}
               
               Responda APENAS com um JSON puro contendo o mapeamento para as seguintes chaves: "name", "price", "description", "category", "imageUrl".
               Se uma coluna não existir, use null.
               Ignore colunas irrelevantes.
               
               Exemplo de resposta:
               {"name": "Nome do Produto", "price": "Valor Unitário", "description": "Detalhes", "category": "Setor", "imageUrl": null}
            `;

            try {
               const result = await ai.models.generateContent({
                  model: "gemini-3-flash-preview",
                  contents: mappingPrompt,
                  config: { responseMimeType: "application/json" }
               });
               const text = result.text;
               if (text) {
                  mapping = JSON.parse(text);
               }
            } catch (mappingErr) {
               console.error('AI Mapping failed, falling back to heuristic', mappingErr);
            }
         }
      } catch (err) {
         console.error('AI initialization failed', err);
      }

      let successCount = 0;

      try {
        for (let i = 0; i < data.length; i++) {
          const row: any = data[i];
          
          // Helper function for flexible field mapping
          const getField = (keywords: string[], aiKey?: string) => {
             // 1. Try AI mapping if available
             if (mapping && aiKey && mapping[aiKey] && row[mapping[aiKey]]) {
                return row[mapping[aiKey]];
             }
             
             // 2. Fallback to heuristic keywords
             const matchingKey = Object.keys(row).find(k => {
                const normalizedKey = k.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
                return keywords.some(kw => normalizedKey.includes(kw));
             });
             return matchingKey ? row[matchingKey] : undefined;
          };

          const name = getField(['name', 'nome', 'product', 'produto', 'titulo', 'title', 'item'], 'name');
          const priceRaw = getField(['price', 'preco', 'valor', 'custo', 'venda', 'unidade', 'rate', 'valor'], 'price');
          
          if (!name) continue;

          let parsedPrice = 0;
          if (priceRaw !== undefined && priceRaw !== null) {
            if (typeof priceRaw === 'number') parsedPrice = priceRaw;
            else if (typeof priceRaw === 'string') {
                let p = priceRaw.replace(/[R$\s]/g, '').trim();
                const hasComma = p.includes(',');
                const hasDot = p.includes('.');
                if (hasComma && hasDot) {
                    p = p.replace(/\./g, '').replace(',', '.');
                } else if (hasComma) {
                    p = p.replace(',', '.');
                }
                parsedPrice = parseFloat(p) || 0;
            }
          }

          let description = getField(['description', 'descricao', 'info', 'detalhes', 'body'], 'description') || '';
          const rawCategory = getField(['category', 'categoria', 'setor', 'grupo'], 'category') || '';
          let finalCategory = '';
          
          if (rawCategory) {
            const matchingCat = productCategories.find(c => c.name.toLowerCase() === String(rawCategory).toLowerCase());
            if (matchingCat) {
              finalCategory = matchingCat.name;
            }
          }

          let imageUrl = getField(['imageurl', 'image_url', 'imagem', 'url', 'foto', 'image'], 'imageUrl') || '';

          // AI Enrichment for Description or missing fields
          if (ai && (useAIEnrichment || !description || String(description).length < 5)) {
             try {
                const prompt = description 
                   ? `Melhore esta descrição de produto para torná-la mais atraente para vendas: "${description}". Produto: "${name}". Máximo 150 caracteres.`
                   : `Crie uma descrição curta e atraente para um produto chamado "${name}" vendido em um comércio local. Máximo 150 caracteres.`;
                
                const response = await ai.models.generateContent({
                   model: "gemini-3-flash-preview",
                   contents: prompt,
                });
                description = response.text?.trim() || description;
             } catch (aiErr) {
                console.error('AI Enrichment failed for', name, aiErr);
             }
          }

          // Real Image Search - Improved for "Exact Real Photos"
          // If no image URL is provided in the spreadsheet, we ALWAYS try to find a real one
          if (ai && !imageUrl) {
             try {
                const searchPrompt = `Encontre a URL direta (link da imagem .jpg, .png ou .webp) de uma foto REAL e EXATA do produto: "${name}". Prefira fotos de catálogo ou embalagem original. Responda APENAS com a URL da imagem. Se não encontrar uma URL real e pública, responda "NOT_FOUND".`;
                const searchResponse = await ai.models.generateContent({
                   model: "gemini-3-flash-preview",
                   contents: searchPrompt,
                   config: {
                      tools: [{ googleSearch: {} }]
                   }
                });
                const foundUrl = searchResponse.text?.trim();
                if (foundUrl && foundUrl.startsWith('http') && !foundUrl.includes('NOT_FOUND')) {
                   imageUrl = foundUrl;
                }
             } catch (imgErr) {
                console.error('Real image search failed for', name, imgErr);
             }
          }

          const docId = `prod_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 7)}`;
          
          await setDoc(doc(db, 'products', docId), {
            merchantId: effectiveUserId,
            merchantName: profile?.businessName || '',
            name: String(name).substring(0, 140).trim(),
            price: parsedPrice,
            description: String(description).substring(0, 990).trim(),
            imageUrl: String(imageUrl).trim(), // Removed fictitious fallback via pollination
            category: finalCategory,
            isAvailable: true,
            isPromotion: false,
            createdAt: serverTimestamp()
          });

          successCount++;
          setImportProgress({ current: i + 1, total });
        }
        
        if (successCount > 0) {
           toast.success(`Importação concluída: ${successCount} produtos adicionados.`);
           fetchData();
        } else {
           toast.error('Nenhum produto válido foi encontrado no arquivo.');
        }
      } catch (e: any) {
        console.error('[Import Error]', e);
        const errorMsg = e?.message?.includes('permission') || e?.code === 'permission-denied'
           ? 'Erro de permissão: O administrador não tem autorização para salvar produtos para este comércio.'
           : 'Erro ao salvar produtos. Verifique se o formato do arquivo está correto.';
        toast.error(errorMsg);
      } finally {
        setSaving(false);
        setImportProgress({ current: 0, total: 0 });
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    if (isExcel) {
       const reader = new FileReader();
       reader.onload = async (evt) => {
          try {
             const buffer = evt.target?.result as ArrayBuffer;
             const workbook = new ExcelJS.Workbook();
             await workbook.xlsx.load(buffer);
             const worksheet = workbook.getWorksheet(1);
             
             if (!worksheet) {
                throw new Error('Nenhuma planilha encontrada no arquivo.');
             }

             const data: any[] = [];
             // Map headers from the first row
             const headerRow = worksheet.getRow(1);
             const headerMapping: { [key: number]: string } = {};
             
             headerRow.eachCell((cell, colNumber) => {
                const headerText = cell.text?.trim();
                if (headerText) {
                   headerMapping[colNumber] = headerText;
                }
             });

             // Process data rows
             worksheet.eachRow((row, rowNumber) => {
                if (rowNumber === 1) return; // skip headers
                const rowData: any = {};
                row.eachCell((cell, colNumber) => {
                   const key = headerMapping[colNumber];
                   if (key) {
                      // Extract value, handling different cell types (formulas, numbers, etc)
                      let value = cell.value;
                      if (value && typeof value === 'object' && 'result' in value) {
                         value = value.result; // handle formulas
                      }
                      rowData[key] = value;
                   }
                });
                if (Object.keys(rowData).length > 0) {
                   data.push(rowData);
                }
             });

             processData(data);
          } catch (err) {
             console.error('Excel parse error', err);
             toast.error('Erro ao ler arquivo Excel. Tente converter para CSV.');
             setSaving(false);
          }
       };
       reader.readAsArrayBuffer(file);
    } else {
       Papa.parse(file, {
         header: true,
         skipEmptyLines: 'greedy',
         complete: (results) => processData(results.data),
         error: () => {
            toast.error('Erro ao ler arquivo CSV');
            setSaving(false);
         }
       });
    }
  };

  const handleProductSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!effectiveUserId || !currentProduct.name || !currentProduct.price) return;
    
    const size = new Blob([JSON.stringify(currentProduct)]).size;
    if (size > 900000) {
       toast.error('Erro: A foto do produto é muito grande. Reenvie a imagem.');
       return;
    }

    setSaving(true);
    let finalImageUrl = currentProduct.imageUrl;

    try {
      // If no image provided, try real search
      if (!finalImageUrl) {
        try {
          const key = process.env.GEMINI_API_KEY;
          if (key) {
            const ai = new GoogleGenAI({ apiKey: key });
            const searchPrompt = `Encontre a URL direta (link da imagem .jpg, .png ou .webp) de uma foto REAL e EXATA do produto: "${currentProduct.name}". Prefira fotos de catálogo ou embalagem original. Responda APENAS com a URL da imagem. Se não encontrar uma URL real e pública, responda "NOT_FOUND".`;
            const searchResponse = await ai.models.generateContent({
              model: "gemini-3-flash-preview",
              contents: searchPrompt,
              config: {
                tools: [{ googleSearch: {} }]
              }
            });
            const foundUrl = searchResponse.text?.trim();
            if (foundUrl && foundUrl.startsWith('http') && !foundUrl.includes('NOT_FOUND')) {
              finalImageUrl = foundUrl;
            }
          }
        } catch (imgErr) {
          console.error('Real image search failed in manual save', imgErr);
        }
      }

      if (currentProduct.id) {
        await updateDoc(doc(db, 'products', currentProduct.id), {
          ...currentProduct,
          price: Number(currentProduct.price),
          imageUrl: finalImageUrl
        });
      } else {
        const docId = `prod_${Date.now()}`;
        await setDoc(doc(db, 'products', docId), {
          merchantId: effectiveUserId,
          merchantName: profile?.businessName || '',
          name: currentProduct.name,
          price: Number(currentProduct.price),
          description: currentProduct.description || '',
          imageUrl: finalImageUrl,
          category: currentProduct.category || '',
          isAvailable: true,
          isPromotion: currentProduct.isPromotion || false,
          createdAt: serverTimestamp()
        });
      }
      setIsEditingProduct(false);
      setCurrentProduct({});
      fetchData();
      toast.success('Produto salvo com sucesso!');
    } catch(e) {
      console.error(e);
      toast.error('Erro ao salvar produto.');
    } finally {
      setSaving(false);
    }
  };

  const requestDeleteProduct = async (id: string, name: string) => {
    const isConfirmed = await confirm({
       title: 'Confirmar Exclusão',
       description: `Deseja realmente excluir o produto "${name}"?`,
       type: 'danger',
       confirmText: 'Sim, excluir'
    });
    if (isConfirmed) {
      await deleteDoc(doc(db, 'products', id));
      toast.success('Produto excluído.');
      setSelectedProductIds(prev => prev.filter(pId => pId !== id));
      fetchData();
    }
  };

  const handleBulkDeleteProducts = async () => {
    if (selectedProductIds.length === 0) return;
    
    const isConfirmed = await confirm({
      title: 'Exclusão em Massa',
      description: `Deseja excluir permanentemente os ${selectedProductIds.length} produtos selecionados?`,
      type: 'danger',
      confirmText: 'Sim, excluir todos'
    });

    if (isConfirmed) {
      setSaving(true);
      try {
        const deletePromises = selectedProductIds.map(id => deleteDoc(doc(db, 'products', id)));
        await Promise.all(deletePromises);
        toast.success(`${selectedProductIds.length} produtos excluídos.`);
        setSelectedProductIds([]);
        fetchData();
      } catch (e) {
        console.error(e);
        toast.error('Erro ao excluir produtos em massa.');
      } finally {
        setSaving(false);
      }
    }
  };

  const toggleProductSelection = (id: string) => {
    setSelectedProductIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAllProducts = () => {
    if (selectedProductIds.length === products.length) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(products.map(p => p.id));
    }
  };

  const handleBannerSave = async (e: React.FormEvent) => {
     e.preventDefault();
     if(!currentUser || !currentBanner.title || !currentBanner.imageUrl) return;
     
     const size = new Blob([JSON.stringify(currentBanner)]).size;
     if (size > 900000) {
        toast.error('Erro: A foto é muito grande. Reenvie a imagem com tamanho menor.');
        return;
     }

     setSaving(true);
     try {
       const bannerData = {
          title: currentBanner.title || '',
          subtitle: currentBanner.subtitle || '',
          imageUrl: currentBanner.imageUrl || '',
          actionText: currentBanner.actionText || '',
          actionTarget: currentBanner.actionTarget || '',
          actionType: currentBanner.actionType || 'ai_page',
          themeColor: currentBanner.themeColor || 'bg-rose-600',
          pageEnabled: currentBanner.actionType === 'ai_page' ? true : (currentBanner.pageEnabled || false),
          pageBlocks: currentBanner.pageBlocks || [],
          selectedProducts: currentBanner.selectedProducts || [],
          updatedAt: serverTimestamp()
       };

       if (currentBanner.id) {
          await updateDoc(doc(db, 'banners', currentBanner.id), bannerData);
       } else {
          const docId = `banner_${Date.now()}`;
          await setDoc(doc(db, 'banners', docId), {
             ...bannerData,
             active: true,
             createdBy: effectiveUserId,
             createdAt: serverTimestamp()
          });
       }
       setIsEditingBanner(false);
       setCurrentBanner({});
       fetchData();
       toast.success('Banner salvo com sucesso!');
     } catch(e) { 
       console.error(e); 
       toast.error('Erro ao salvar banner.');
     }
     finally { setSaving(false); }
  };

  const handleGenerateBannerAI = async () => {
    if (!currentBanner.title) {
      toast.error('Dê um título ao banner primeiro para a IA usar como base.');
      return;
    }
    setIsGeneratingPage(true);
    try {
      const prompt = `Crie uma página promocional para o banner: "${currentBanner.title}". 
      Subtítulo: "${currentBanner.subtitle || ''}". 
      Comércio: "${profile?.businessName || ''}". 
      Crie seções atraentes de oferta, benefícios e depoimentos fictícios positivos.`;
      
      const config = await generatePageFromDescription(prompt);
      if (config) {
        setCurrentBanner({
          ...currentBanner,
          pageBlocks: config.blocks,
          themeColor: `bg-${config.themeColor}-600`,
          actionType: 'ai_page',
          pageEnabled: true
        });
        toast.success('Página gerada com sucesso pela IA!');
      }
    } catch (e) {
      console.error(e);
      toast.error('Erro ao gerar página com IA.');
    } finally {
      setIsGeneratingPage(false);
    }
  };

  const requestDeleteBanner = async (id: string, title: string) => {
    const isConfirmed = await confirm({
       title: 'Confirmar Exclusão',
       description: `Deseja realmente excluir o banner "${title}"?`,
       type: 'danger',
       confirmText: 'Sim, excluir'
    });
    if (isConfirmed) {
       await deleteDoc(doc(db, 'banners', id));
       toast.success('Banner excluído.');
       fetchData();
    }
  };

  const handleJobSave = async (e: React.FormEvent) => {
     e.preventDefault();
     if(!currentUser || !currentJob.title || !currentJob.description) return;
     setSaving(true);
     try {
       if (currentJob.id) {
          await updateDoc(doc(db, 'jobs', currentJob.id), { ...currentJob, updatedAt: serverTimestamp() });
       } else {
          const docId = `job_${Date.now()}`;
          await setDoc(doc(db, 'jobs', docId), {
             merchantId: effectiveUserId,
             title: currentJob.title,
             description: currentJob.description,
             salary: currentJob.salary || '',
             hours: currentJob.hours || '',
             requirements: currentJob.requirements || '',
             contactInfo: currentJob.contactInfo || profile?.phone || '',
             status: 'pending',
             createdAt: serverTimestamp()
          });
       }
       setIsEditingJob(false);
       setCurrentJob({});
       fetchData();
       toast.success(currentJob.id ? 'Vaga salva com sucesso!' : 'Vaga enviada para aprovação!');
     } catch(e) { 
       console.error(e); 
       toast.error('Erro ao salvar vaga.');
     }
     finally { setSaving(false); }
  }

  const requestDeleteJob = async (id: string, title: string) => {
    const isConfirmed = await confirm({
       title: 'Confirmar Exclusão',
       description: `Deseja realmente excluir a vaga "${title}"?`,
       type: 'danger',
       confirmText: 'Sim, excluir'
    });
    if (isConfirmed) {
       await deleteDoc(doc(db, 'jobs', id));
       toast.success('Vaga excluída.');
       fetchData();
    }
  };

   const toggleProductPromotion = async (prod: any) => {
     try {
        await updateDoc(doc(db, 'products', prod.id), { isPromotion: !prod.isPromotion });
        fetchData();
        toast.success(prod.isPromotion ? 'Removido das ofertas' : 'Adicionado às ofertas!');
     } catch(e) {}
  };

  if (loading) return null;
  if (!userProfile || (userProfile.role !== 'merchant' && !isAdmin)) return <Navigate to="/" replace />;
  
  const sidebarItems = [
    { id: 'Visão Geral', label: 'Visão Geral', icon: LayoutDashboard },
    { id: 'Meus Produtos', label: 'Meus Produtos', icon: Package, badge: products.length },
    { id: 'Campanhas', label: 'Banners Exclusivos', icon: ImageIcon },
    { id: 'Vagas', label: 'Vagas de Emprego', icon: Users, badge: jobs.length },
    { id: 'Dados da Loja', label: 'Dados da Loja', icon: Store },
  ];

  return (
    <>
     <DashboardLayout
        title={activeTab}
        subtitle={profile?.businessName || 'Painel de Gestão do Comércio'}
        sidebarItems={sidebarItems}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
     >
          <div className="flex-1 space-y-6">
            
            {activeTab === 'Visão Geral' && (
              <>
                 {/* Action Banner */}
                 <div className={`rounded-3xl p-8 md:p-12 text-white shadow-xl relative overflow-hidden transition-all duration-500 flex flex-col justify-between min-h-[250px] ${profile?.isOpen ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : 'bg-gradient-to-br from-zinc-700 to-zinc-900'}`}>
                   <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                   
                   <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                     <div>
                       <div className="flex items-center gap-3 mb-4">
                          <div className={`w-4 h-4 rounded-full shadow-lg ${profile?.isOpen ? 'bg-emerald-300 animate-pulse' : 'bg-zinc-400'}`}></div>
                          <span className="font-bold uppercase tracking-widest text-sm opacity-90">Status da Loja</span>
                       </div>
                       <h3 className="font-black text-4xl md:text-5xl mb-4 tracking-tight leading-tight">{profile?.isOpen ? 'Loja Aberta!' : 'Loja Fechada'}</h3>
                       <p className={`font-medium text-lg max-w-2xl leading-relaxed ${profile?.isOpen ? 'text-emerald-50' : 'text-zinc-300'}`}>
                         {profile?.isOpen ? 'Seu catálogo está visível e você pode receber contatos de clientes.' : 'Sua loja está oculta no momento. Abra para começar a aparecer no aplicativo.'}
                       </p>
                     </div>
                     <div 
                       onClick={toggleStoreOpen}
                       className={`w-24 h-12 rounded-full flex items-center px-1.5 cursor-pointer transition-colors shadow-inner shrink-0 relative ${profile?.isOpen ? 'bg-emerald-400' : 'bg-zinc-800'}`}
                     >
                       <div className={`w-10 h-10 bg-white rounded-full transform transition-transform shadow-lg ${profile?.isOpen ? 'translate-x-[48px]' : 'translate-x-0'}`}></div>
                     </div>
                   </div>
                 </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-8 rounded-3xl shadow-sm border border-zinc-100 relative overflow-hidden group">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
                     <div className="relative z-10">
                        <h3 className="text-zinc-500 text-sm font-bold uppercase tracking-widest mb-2 flex items-center gap-2"><Activity className="w-4 h-4" /> Views da Loja</h3>
                        <p className="text-5xl font-black text-zinc-900 mt-4">--<span className="text-lg text-zinc-400 font-medium ml-2">coletando dados</span></p>
                     </div>
                  </div>
                  
                  <div className="bg-white p-8 rounded-3xl shadow-sm border border-zinc-100 relative overflow-hidden group cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setActiveTab('Meus Produtos')}>
                     <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
                     <div className="relative z-10">
                        <h3 className="text-zinc-500 text-sm font-bold uppercase tracking-widest mb-2 flex items-center gap-2"><Package className="w-4 h-4" /> Produtos Ativos</h3>
                        <div className="flex items-end justify-between mt-4">
                           <p className="text-5xl font-black text-zinc-900">{products.length}</p>
                           <span className="text-primary text-xs font-bold bg-primary/10 px-4 py-2 rounded-xl">Gerenciar</span>
                        </div>
                     </div>
                  </div>

                  <div className="bg-white p-8 rounded-3xl shadow-sm border border-zinc-100 relative overflow-hidden group cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setActiveTab('Dados da Loja')}>
                     <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
                     <div className="relative z-10">
                        <h3 className="text-zinc-500 text-sm font-bold uppercase tracking-widest mb-2 flex items-center gap-2"><Star className="w-4 h-4 text-orange-500" /> Avaliação</h3>
                        <div className="flex items-end gap-2 mt-4">
                           <p className="text-5xl font-black text-zinc-900">{profile?.rating?.toFixed(1) || '5.0'}</p>
                           <div className="flex pb-2">
                              <Star className="w-5 h-5 text-amber-400 fill-current" />
                           </div>
                        </div>
                     </div>
                  </div>
                </div>

                <div className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-zinc-100 mt-6 hidden md:block">
                   <div className="mb-6">
                      <h3 className="font-black text-xl text-zinc-900 flex items-center gap-2">Analytics <TrendingUp className="w-5 h-5 text-primary" /></h3>
                      <p className="text-sm text-zinc-500">O gráfico de visualizações aparecerá aqui quando houver tráfego suficiente.</p>
                   </div>
                   <div className="h-48 w-full flex items-center justify-center border-2 border-dashed border-zinc-100 rounded-3xl text-zinc-400 font-bold">
                      Sem dados suficientes para gerar gráficos ainda.
                   </div>
                </div>
              </>
            )}

            {activeTab === 'Meus Produtos' && (
              <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-zinc-100">
                 <div className="px-8 py-6 border-b border-zinc-100 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-white">
                   <div className="flex items-center gap-4">
                     {products.length > 0 && (
                       <input 
                         type="checkbox" 
                         className="w-5 h-5 rounded-lg border-zinc-300 accent-primary cursor-pointer"
                         checked={products.length > 0 && selectedProductIds.length === products.length}
                         onChange={toggleSelectAllProducts}
                       />
                     )}
                     <div>
                       <h2 className="font-black text-xl text-zinc-900">Catálogo de Produtos</h2>
                       <p className="text-sm text-zinc-500 font-medium">Os produtos em oferta ganham destaque especial na Home.</p>
                     </div>
                   </div>
                   <div className="flex flex-wrap items-center gap-4">
                     {selectedProductIds.length > 0 ? (
                       <button 
                         onClick={handleBulkDeleteProducts}
                         className="bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white px-5 py-3 rounded-full text-sm font-bold flex items-center gap-2 transition-all border border-rose-200"
                       >
                         <Trash2 className="w-5 h-5" /> Excluir Selecionados ({selectedProductIds.length})
                       </button>
                     ) : (
                       <>
                         <div className="flex items-center gap-3 bg-zinc-50 border border-zinc-200 px-4 py-2 rounded-2xl">
                            <div className="flex items-center gap-2">
                              <input 
                                 type="checkbox" 
                                 id="useAI" 
                                 checked={useAIEnrichment} 
                                 onChange={(e) => setUseAIEnrichment(e.target.checked)}
                                 className="w-4 h-4 rounded accent-primary"
                              />
                              <label htmlFor="useAI" className="text-xs font-black text-zinc-600 uppercase tracking-wider cursor-pointer flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-primary" /> Enriquecer com IA
                              </label>
                            </div>
                            {importProgress.total > 0 && (
                              <div className="flex items-center gap-2 pl-3 border-l border-zinc-200">
                                <Loader2 className="w-3 h-3 animate-spin text-primary" />
                                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{importProgress.current}/{importProgress.total}</span>
                              </div>
                            )}
                         </div>
                         <button onClick={() => fileInputRef.current?.click()} className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 px-5 py-3 rounded-full text-sm font-bold flex items-center gap-2 transition-all shrink-0 border border-zinc-200">
                           <UploadCloud className="w-5 h-5" /> Importar Planilha
                         </button>
                         <input type="file" accept=".csv,.xlsx" ref={fileInputRef} onChange={handleImportFile} className="hidden" />
                       </>
                     )}
                     <button onClick={() => { setIsEditingProduct(true); setCurrentProduct({}); }} className="bg-primary hover:scale-105 text-white px-5 py-3 rounded-full text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-primary/20 shrink-0">
                       <PlusCircle className="w-5 h-5" /> Adicionar
                     </button>
                   </div>
                 </div>
                 
                 <div className="p-8">
                    {products.length === 0 ? (
                      <div className="text-center py-16 border-2 border-dashed border-zinc-200 rounded-3xl bg-zinc-50">
                         <Package className="w-16 h-16 text-zinc-300 mx-auto mb-4" />
                         <h3 className="font-bold text-zinc-700 text-lg">Catálogo Vazio</h3>
                         <p className="text-zinc-500 mt-2 max-w-sm mx-auto">Adicione produtos ao seu catálogo para que os clientes possam visualizar suas ofertas.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {products.map(prod => (
                           <div key={prod.id} 
                             onClick={() => toggleProductSelection(prod.id)}
                             className={`border rounded-2xl p-4 flex gap-4 bg-white group transition-all cursor-pointer relative ${selectedProductIds.includes(prod.id) ? 'border-primary ring-2 ring-primary/20 bg-primary/5' : prod.isPromotion ? 'border-primary/40 shadow-sm bg-primary/5' : 'border-zinc-200 hover:border-zinc-300'}`}
                           >
                             <div className="absolute top-3 right-3 z-10" onClick={(e) => e.stopPropagation()}>
                               <input 
                                 type="checkbox" 
                                 checked={selectedProductIds.includes(prod.id)}
                                 onChange={() => toggleProductSelection(prod.id)}
                                 className="w-5 h-5 rounded border-zinc-300 accent-primary cursor-pointer"
                               />
                             </div>

                             {prod.imageUrl ? (
                                <img src={prod.imageUrl} alt={prod.name} className="w-24 h-24 rounded-xl object-cover bg-zinc-100 shrink-0 border border-zinc-200/50" />
                             ) : (
                                <div className="w-24 h-24 rounded-xl bg-zinc-100 border border-zinc-200/50 flex items-center justify-center shrink-0">
                                   <Package className="w-8 h-8 text-zinc-300" />
                                </div>
                             )}
                             <div className="flex-1 min-w-0 flex flex-col">
                                <div className="flex items-start justify-between pr-8">
                                   <h4 className="font-bold text-zinc-900 text-base line-clamp-2 group-hover:text-primary transition-colors pr-2 leading-tight">{prod.name}</h4>
                                </div>
                                <p className="font-black text-primary text-lg mt-1 tracking-tight">R$ {prod.price?.toFixed(2)}</p>
                                
                                <div className="mt-auto flex items-center justify-between pt-3" onClick={(e) => e.stopPropagation()}>
                                   <button 
                                      onClick={() => toggleProductPromotion(prod)} 
                                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-colors ${prod.isPromotion ? 'bg-primary text-white border-primary' : 'bg-transparent text-zinc-500 border-zinc-300 hover:bg-zinc-100'}`}
                                   >
                                      {prod.isPromotion ? 'EM OFERTA' : 'PROMOVER'}
                                   </button>
                                   <div className="flex gap-1.5">
                                      <button onClick={() => { setCurrentProduct(prod); setIsEditingProduct(true); }} className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center hover:bg-zinc-200 text-zinc-600"><Edit2 className="w-4 h-4" /></button>
                                      <button onClick={() => requestDeleteProduct(prod.id, prod.name)} className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center hover:bg-rose-100 text-rose-500"><Trash2 className="w-4 h-4" /></button>
                                   </div>
                                </div>
                             </div>
                           </div>
                        ))}
                      </div>
                    )}
                 </div>
              </div>
            )}

            {activeTab === 'Campanhas' && (
              <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-zinc-100">
                 <div className="px-8 py-8 border-b border-zinc-100 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-white">
                   <div>
                     <h2 className="font-black text-2xl text-zinc-900 mb-2">Campanhas & Páginas Exclusivas</h2>
                     <p className="text-base text-zinc-500 font-medium">Crie banners promocionais e Landing Pages geradas por IA para destacar sua loja.</p>
                   </div>
                   <button onClick={() => { setIsEditingBanner(true); setCurrentBanner({}); }} className="bg-primary hover:scale-105 text-white px-6 py-4 rounded-xl text-base font-bold flex items-center gap-2 transition-all shadow-lg shadow-primary/20 shrink-0">
                     <PlusCircle className="w-5 h-5" /> Nova Campanha
                   </button>
                 </div>
                 
                 <div className="p-8">
                    {banners.length === 0 ? (
                      <div className="text-center py-20 border-2 border-dashed border-zinc-200 rounded-3xl bg-zinc-50">
                         <ImageIcon className="w-20 h-20 text-zinc-300 mx-auto mb-4" />
                         <h3 className="font-black text-zinc-900 text-2xl mb-2">Sem campanhas ativas</h3>
                         <p className="text-zinc-500 text-lg">Crie sua primeira página promocional.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {banners.map(ban => (
                           <div key={ban.id} className="border border-zinc-200 rounded-3xl overflow-hidden group shadow-sm hover:shadow-md transition-shadow">
                              <div className="relative h-40">
                                 <img src={ban.imageUrl} alt={ban.title} className="w-full h-full object-cover bg-zinc-100 group-hover:scale-105 transition-transform duration-500" />
                                 <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                 <div className="absolute bottom-4 left-4">
                                    <h4 className="font-bold text-white text-lg drop-shadow">{ban.title}</h4>
                                 </div>
                                 <div className="absolute top-4 right-4 flex gap-2">
                                    <button onClick={() => { setCurrentBanner(ban); setIsEditingBanner(true); }} className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/40 shadow-sm"><Edit2 className="w-5 h-5" /></button>
                                    <button onClick={() => requestDeleteBanner(ban.id, ban.title)} className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-rose-500 hover:text-white shadow-sm transition-colors"><Trash2 className="w-5 h-5" /></button>
                                 </div>
                              </div>
                           </div>
                        ))}
                      </div>
                    )}
                 </div>
              </div>
            )}

            {activeTab === 'Vagas' && (
              <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-zinc-100">
                 <div className="px-8 py-6 border-b border-zinc-100 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-white">
                   <div>
                     <h2 className="font-black text-xl text-zinc-900">Vagas e Oportunidades</h2>
                     <p className="text-sm text-zinc-500 font-medium">Anuncie vagas de emprego abertas no seu comércio para a comunidade.</p>
                   </div>
                   <button onClick={() => { setIsEditingJob(true); setCurrentJob({}); }} className="bg-zinc-900 hover:bg-black hover:scale-105 text-white px-5 py-3 rounded-full text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-black/20 shrink-0">
                     <PlusCircle className="w-5 h-5" /> Nova Vaga
                   </button>
                 </div>
                 
                 <div className="p-8">
                    {jobs.length === 0 ? (
                      <div className="text-center py-16 border-2 border-dashed border-zinc-200 rounded-3xl bg-zinc-50">
                         <Users className="w-16 h-16 text-zinc-300 mx-auto mb-4" />
                         <h3 className="font-bold text-zinc-700 text-lg">Nenhuma vaga publicada</h3>
                         <p className="text-zinc-500 mt-2 max-w-sm mx-auto">Anuncie vagas para sua loja e receba contatos diretamente no WhatsApp ou E-mail.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {jobs.map(job => (
                           <div key={job.id} className="border border-zinc-200 rounded-3xl p-6 bg-white hover:border-zinc-300 transition-colors shadow-sm">
                              <div className="flex justify-between items-start mb-4">
                                 <div>
                                   <div className="flex items-center gap-2 mb-1">
                                     <span className={`w-2.5 h-2.5 rounded-full ${job.status === 'active' ? 'bg-green-500' : job.status === 'pending' ? 'bg-amber-500' : 'bg-rose-500'}`}></span>
                                     <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{job.status === 'active' ? 'Ativa' : job.status === 'pending' ? 'Pausada' : 'Fechada'}</span>
                                   </div>
                                   <h4 className="font-black text-zinc-900 text-lg leading-tight">{job.title}</h4>
                                 </div>
                              </div>
                              <p className="text-zinc-600 font-medium text-sm line-clamp-3 mb-5 leading-relaxed">{job.description}</p>
                              <div className="flex items-center justify-between border-t border-zinc-100 pt-4 mt-auto">
                                 <p className="text-xs font-bold text-zinc-500 bg-zinc-100 px-3 py-1.5 rounded-full">{job.salary || 'A Combinar'}</p>
                                 <div className="flex gap-2">
                                    <button onClick={() => { setCurrentJob(job); setIsEditingJob(true); }} className="w-9 h-9 rounded-xl bg-zinc-100 flex items-center justify-center hover:bg-zinc-200 text-zinc-600 transition-colors"><Edit2 className="w-4 h-4" /></button>
                                    <button onClick={() => requestDeleteJob(job.id, job.title)} className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center hover:bg-rose-100 text-rose-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                 </div>
                              </div>
                           </div>
                        ))}
                      </div>
                    )}
                 </div>
              </div>
            )}

            {activeTab === 'Dados da Loja' && profile && (
               <form onSubmit={handleProfileSave} className="bg-white rounded-3xl p-8 lg:p-10 shadow-sm border border-zinc-100">
                 <div className="mb-8">
                     <h2 className="font-black text-3xl text-zinc-900 mb-2">Dados da sua Loja</h2>
                     <p className="text-zinc-500 font-medium text-lg">Atualize as informações públicas da sua vitrine.</p>
                 </div>
                 
                 <div className="space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div>
                           <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-3">Nome Comercial</label>
                           <input required type="text" value={profile.businessName || ''} onChange={e => setProfile({...profile, businessName: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 px-5 py-4 rounded-2xl outline-none focus:border-primary font-bold text-lg text-zinc-900 shadow-inner transition-colors" />
                        </div>
                        
                        <div>
                           <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-3">Categoria Principal</label>
                           <div className="flex gap-2">
                              <select required value={profile.category || ''} onChange={e => setProfile({...profile, category: e.target.value})} className="flex-1 bg-zinc-50 border border-zinc-200 px-5 py-4 rounded-2xl outline-none focus:border-primary font-bold text-lg text-zinc-900 shadow-inner transition-colors">
                                 <option value="" disabled>Selecione uma categoria...</option>
                                 {merchantCategories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                              </select>
                              <button type="button" onClick={() => { setRequestType('merchant'); setIsCategoryModalOpen(true); }} className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 w-16 rounded-2xl font-bold flex items-center justify-center transition-colors border border-zinc-200" title="Sugerir Categoria">
                                 <HelpCircle className="w-6 h-6" />
                              </button>
                           </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div>
                           <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-3">WhatsApp de Vendas</label>
                           <input type="text" value={profile.phone || ''} onChange={e => setProfile({...profile, phone: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 px-5 py-4 rounded-2xl outline-none focus:border-primary font-bold text-lg text-zinc-900 shadow-inner transition-colors" placeholder="(00) 00000-0000" />
                        </div>
                        <div>
                           <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-3">Endereço Principal</label>
                           <input type="text" value={profile.address || ''} onChange={e => setProfile({...profile, address: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 px-5 py-4 rounded-2xl outline-none focus:border-primary font-bold text-lg text-zinc-900 shadow-inner transition-colors" placeholder="Av. Principal, 100" />
                        </div>
                    </div>

                    <div className="bg-zinc-50 p-8 rounded-[2rem] border border-zinc-200">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest block mb-4">Dias de Funcionamento</label>
                        <div className="flex flex-wrap gap-2">
                           {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'].map(day => (
                              <button 
                                 key={day}
                                 type="button"
                                 onClick={() => {
                                    const current = profile.openingDays || [];
                                    const next = current.includes(day) ? current.filter((d: string) => d !== day) : [...current, day];
                                    setProfile({...profile, openingDays: next});
                                 }}
                                 className={cn(
                                    "px-5 py-3 rounded-xl font-bold transition-all border",
                                    (profile.openingDays || []).includes(day) 
                                       ? "bg-zinc-900 text-white border-zinc-900 shadow-lg shadow-zinc-900/10" 
                                       : "bg-white text-zinc-400 border-zinc-200 hover:border-zinc-300"
                                 )}
                              >
                                 {day}
                              </button>
                           ))}
                        </div>
                        <div className="mt-6">
                           <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest block mb-2">Horário de Funcionamento</label>
                           <input 
                              type="text" 
                              value={profile.openingHours || ''} 
                              onChange={e => setProfile({...profile, openingHours: e.target.value})} 
                              className="w-full max-w-xs bg-white border border-zinc-200 px-5 py-4 rounded-2xl outline-none focus:border-primary font-bold text-zinc-900 shadow-sm" 
                              placeholder="Ex: 08:00 - 18:00" 
                           />
                        </div>
                    </div>
                    
                    <div>
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-3">Descrição da Loja</label>
                        <textarea rows={4} value={profile.description || ''} onChange={e => setProfile({...profile, description: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 px-5 py-4 rounded-2xl outline-none focus:border-primary font-medium text-lg text-zinc-900 shadow-inner resize-none transition-colors leading-relaxed" placeholder="Como você descreveria sua loja para novos clientes?" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="rounded-2xl border border-zinc-200 p-6 bg-zinc-50/50 hover:border-primary/30 transition-colors">
                           <h4 className="font-bold text-zinc-900 mb-1 text-center">Logotipo</h4>
                           <p className="text-[10px] text-zinc-500 text-center mb-4 uppercase tracking-widest font-black">Alta Resolução (1:1)</p>
                           <ImageUploader value={profile.logoImage || null} onChange={val => setProfile({...profile, logoImage: val || ''})} label="Logotipo" recommendedText="Fundo limpo recomendado" />
                        </div>
                        <div className="rounded-2xl border border-zinc-200 p-6 bg-zinc-50/50 hover:border-primary/30 transition-colors">
                           <h4 className="font-bold text-zinc-900 mb-1 text-center">Capa da Loja</h4>
                           <p className="text-[10px] text-zinc-500 text-center mb-4 uppercase tracking-widest font-black">Qualidade Premium (Banners)</p>
                           <ImageUploader value={profile.bannerImage || null} onChange={val => setProfile({...profile, bannerImage: val || ''})} label="Capa" recommendedText="Resolução 1600px+" />
                        </div>
                    </div>

                    <div className="flex items-center gap-4 bg-primary/5 p-6 rounded-2xl border border-primary/20">
                        <input type="checkbox" id="delivery" checked={profile.acceptsDelivery || false} onChange={e => setProfile({...profile, acceptsDelivery: e.target.checked})} className="w-6 h-6 rounded-md accent-primary" />
                        <div>
                           <label htmlFor="delivery" className="font-bold text-zinc-900 text-lg block cursor-pointer">Realizamos Entregas</label>
                           <p className="text-sm text-zinc-600 mt-1 font-medium">Deixe marcado se sua loja envia os produtos até o cliente.</p>
                        </div>
                    </div>

                    <div className="pt-8 mt-8 border-t border-zinc-100 flex justify-end">
                       <button disabled={saving} type="submit" className="w-full md:w-auto bg-primary text-white font-bold px-12 py-5 rounded-xl hover:bg-primary-dark transition-all hover:scale-105 shadow-xl shadow-primary/20 disabled:opacity-50 text-lg">
                          {saving ? 'Guardando...' : 'Salvar Configurações'}
                       </button>
                    </div>
                 </div>
               </form>
            )}

         </div>

       {/* PRODUCT MODAL */}
       {isEditingProduct && (
         <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
            <form onSubmit={handleProductSave} className="bg-white rounded-[2rem] p-8 w-full max-w-lg space-y-5 shadow-2xl">
              <div className="flex justify-between items-center mb-2">
                 <h2 className="text-2xl font-black text-zinc-900">{currentProduct.id ? 'Editar Produto' : 'Novo Produto'}</h2>
              </div>
              
              <div><label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Nome do Produto</label>
              <input required type="text" value={currentProduct.name || ''} onChange={e => setCurrentProduct({...currentProduct, name: e.target.value})} className="w-full font-bold text-zinc-900 bg-zinc-50 focus:bg-white border focus:border-primary px-4 py-3.5 rounded-2xl mt-1 outline-none transition-colors duration-200" placeholder="Ex: Hambúrguer Clássico" /></div>
              
              <div><label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Preço (R$)</label>
              <input required type="number" step="0.01" min="0" value={currentProduct.price || ''} onChange={e => setCurrentProduct({...currentProduct, price: e.target.value})} className="w-full font-bold text-zinc-900 bg-zinc-50 focus:bg-white border focus:border-primary px-4 py-3.5 rounded-2xl mt-1 outline-none transition-colors duration-200" placeholder="0.00" /></div>

              <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-2">Categoria do Produto</label>
                  <div className="flex gap-2">
                     <select 
                        required 
                        value={currentProduct.category || ''} 
                        onChange={e => setCurrentProduct({...currentProduct, category: e.target.value})} 
                        className="flex-1 font-bold text-zinc-900 bg-zinc-50 focus:bg-white border focus:border-primary px-4 py-3.5 rounded-2xl outline-none transition-colors duration-200"
                     >
                        <option value="" disabled>Selecione uma categoria...</option>
                        {productCategories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                     </select>
                     <button type="button" onClick={() => { setRequestType('product'); setIsCategoryModalOpen(true); }} className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 w-14 rounded-2xl font-bold flex items-center justify-center transition-colors border border-zinc-200" title="Sugerir Categoria">
                        <HelpCircle className="w-5 h-5" />
                     </button>
                  </div>
               </div>

              <div><label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Descrição Detalhada</label>
              <textarea value={currentProduct.description || ''} onChange={e => setCurrentProduct({...currentProduct, description: e.target.value})} className="w-full bg-zinc-50 focus:bg-white border focus:border-primary px-4 py-3.5 rounded-2xl mt-1 outline-none font-medium resize-none transition-colors duration-200" rows={3} placeholder="Escreva os ingredientes, detalhes ou variações..." /></div>

              <div className="p-4 rounded-2xl border border-zinc-200 bg-zinc-50/50">
                 <ImageUploader value={currentProduct.imageUrl || null} onChange={val => setCurrentProduct({...currentProduct, imageUrl: val || ''})} label="Foto do Produto" recommendedText="Foto nítida (1:1)" />
              </div>

              <div className="flex items-center gap-3 bg-rose-50 p-4 rounded-xl">
                 <input type="checkbox" id="promo" checked={currentProduct.isPromotion || false} onChange={e => setCurrentProduct({...currentProduct, isPromotion: e.target.checked})} className="w-5 h-5 accent-rose-500" />
                 <label htmlFor="promo" className="font-bold text-rose-800 cursor-pointer">Colocar em Oferta e Destacar na Home</label>
              </div>

              <div className="flex gap-4 pt-4 border-t border-zinc-100">
                 <button type="button" onClick={() => setIsEditingProduct(false)} className="flex-1 bg-zinc-100 font-bold px-4 py-4 rounded-2xl hover:bg-zinc-200 text-zinc-700 transition-colors">Cancelar</button>
                 <button type="submit" disabled={saving} className="flex-1 bg-primary text-white font-bold px-4 py-4 rounded-2xl hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20">Salvar Produto</button>
              </div>
            </form>
         </div>
       )}

        {/* BANNER MODAL */}
        {isEditingBanner && (
          <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
             <form onSubmit={handleBannerSave} className="bg-white rounded-3xl p-8 w-full max-w-2xl shadow-2xl my-8">
                <h3 className="text-2xl font-black text-zinc-900 mb-6 border-b border-zinc-100 pb-4">{currentBanner.id ? 'Editar Banner' : 'Novo Banner'}</h3>
                
                <div className="space-y-6">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                     <div>
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-2">Título do Banner</label>
                        <input required type="text" value={currentBanner.title || ''} onChange={e => setCurrentBanner({...currentBanner, title: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 px-5 py-3.5 rounded-2xl outline-none focus:border-primary font-bold text-zinc-900 transition-colors" placeholder="Ex: Promoção de Inverno" />
                     </div>
                     <div>
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-2">Subtítulo (Opcional)</label>
                        <input type="text" value={currentBanner.subtitle || ''} onChange={e => setCurrentBanner({...currentBanner, subtitle: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 px-5 py-3.5 rounded-2xl outline-none focus:border-primary font-medium text-zinc-900 transition-colors" placeholder="Descrição curta" />
                     </div>
                   </div>

                   <div className="grid grid-cols-1 gap-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                         <div className="space-y-5">
                            <div>
                               <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-2">Ação ao clicar</label>
                               <select value={currentBanner.actionType || 'ai_page'} onChange={e => {
                                  const val = e.target.value;
                                  setCurrentBanner({...currentBanner, actionType: val, pageEnabled: val === 'ai_page', actionUrl: val === 'ai_page' ? '' : currentBanner.actionUrl})
                               }} className="w-full bg-zinc-50 border border-zinc-200 px-5 py-3.5 rounded-2xl outline-none focus:border-primary font-bold text-zinc-900 transition-colors">
                                  <option value="ai_page">Página Exclusiva (Criada por IA)</option>
                                  <option value="product">Página de Produto</option>
                                  <option value="external">Site Externo / URL</option>
                               </select>
                            </div>
                            
                            {currentBanner.actionType !== 'ai_page' && (
                               <div>
                                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-2">Destino (URL ou ID do Produto)</label>
                                  <input required type="text" value={currentBanner.actionTarget || ''} onChange={e => setCurrentBanner({...currentBanner, actionTarget: e.target.value})} className="w-full bg-white border border-zinc-200 px-5 py-3.5 rounded-2xl outline-none focus:border-primary font-medium text-zinc-900 transition-colors" placeholder={currentBanner.actionType === 'external' ? 'https://...' : 'ID do Produto'} />
                               </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                               <div>
                                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-2">Txt do Botão</label>
                                  <input type="text" value={currentBanner.actionText || ''} onChange={e => setCurrentBanner({...currentBanner, actionText: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 px-5 py-3.5 rounded-2xl outline-none focus:border-primary font-medium text-zinc-900 transition-colors" placeholder="Comprar" />
                               </div>
                               <div>
                                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-2">Cor Tema</label>
                                  <select value={currentBanner.themeColor || 'bg-rose-600'} onChange={e => setCurrentBanner({...currentBanner, themeColor: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 px-5 py-3.5 rounded-2xl outline-none focus:border-primary font-bold text-zinc-900 transition-colors">
                                     <option value="bg-rose-600">Vermelho (Rose)</option>
                                     <option value="bg-blue-600">Azul (Blue)</option>
                                     <option value="bg-emerald-600">Verde (Emerald)</option>
                                     <option value="bg-purple-600">Roxo (Purple)</option>
                                     <option value="bg-amber-500">Amarelo (Amber)</option>
                                     <option value="bg-zinc-900">Preto (Zinc)</option>
                                  </select>
                               </div>
                            </div>
                         </div>

                         <div>
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-2">Imagem do Banner</label>
                            <ImageUploader value={currentBanner.imageUrl || null} onChange={val => setCurrentBanner({...currentBanner, imageUrl: val || ''})} label="Imagem em Paisagem" recommendedText="Tamanho ideal: 1200x500px (Aspecto 21:9)" />
                         </div>
                      </div>
                   </div>

                   {(currentBanner.actionType === 'ai_page' || currentBanner.pageEnabled) && (
                      <div className="p-6 bg-zinc-50/50 rounded-2xl border border-zinc-200 space-y-6">
                         <div className="flex items-center justify-between gap-4">
                            <div>
                               <h3 className="font-black text-zinc-900 flex items-center gap-2 mb-1">
                                  Página Promocional (Layout Exclusivo)
                               </h3>
                               <p className="text-sm text-zinc-500 font-medium">Configure a página que será exibida ao clicar no banner.</p>
                            </div>
                            <button 
                               type="button" 
                               onClick={handleGenerateBannerAI}
                               disabled={isGeneratingPage}
                               className="bg-black text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-zinc-800 transition-colors shadow-lg shadow-black/10 shrink-0"
                            >
                               {isGeneratingPage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-emerald-400" />}
                               Gerar com IA
                            </button>
                         </div>
                         
                         <AiPageBuilder 
                            blocks={currentBanner.pageBlocks || []} 
                            onChange={(blocks) => setCurrentBanner({...currentBanner, pageBlocks: blocks})}
                         />

                         <div className="mt-6 pt-6 border-t border-zinc-200">
                            <h4 className="font-bold text-zinc-900 mb-3">Produtos em Destaque na Página</h4>
                            {products.length === 0 ? (
                               <p className="text-zinc-500 text-sm">Cadastre produtos primeiro para selecioná-los aqui.</p>
                            ) : (
                               <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
                                  {products.map(prod => (
                                     <label key={prod.id} className="flex items-center gap-3 p-3 rounded-xl border border-zinc-200 bg-white cursor-pointer hover:border-primary transition-colors">
                                        <input 
                                           type="checkbox" 
                                           className="w-5 h-5 rounded border-zinc-300 text-primary focus:ring-primary"
                                           checked={(currentBanner.selectedProducts || []).includes(prod.id)}
                                           onChange={(e) => {
                                              const current = currentBanner.selectedProducts || [];
                                              if (e.target.checked) {
                                                 setCurrentBanner({...currentBanner, selectedProducts: [...current, prod.id]});
                                              } else {
                                                 setCurrentBanner({...currentBanner, selectedProducts: current.filter((id: string) => id !== prod.id)});
                                              }
                                           }}
                                        />
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                           {prod.imageUrl ? (
                                              <img src={prod.imageUrl} className="w-10 h-10 rounded-lg object-cover bg-zinc-100 shrink-0" />
                                           ) : (
                                              <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0">
                                                 <Package className="w-5 h-5 text-zinc-400" />
                                              </div>
                                           )}
                                           <div>
                                              <p className="font-bold text-zinc-900 text-sm line-clamp-1">{prod.name}</p>
                                              <p className="text-primary font-bold text-xs">R$ {prod.price}</p>
                                           </div>
                                        </div>
                                     </label>
                                  ))}
                               </div>
                            )}
                         </div>
                      </div>
                   )}
                </div>

                <div className="flex gap-4 pt-8 border-t border-zinc-100 mt-6">
                   <button type="button" onClick={() => setIsEditingBanner(false)} className="flex-1 bg-zinc-100 font-bold px-4 py-4 rounded-2xl hover:bg-zinc-200 text-zinc-700 transition-colors">Cancelar</button>
                   <button type="submit" disabled={saving} className="flex-1 bg-primary text-white font-bold px-4 py-4 rounded-2xl hover:bg-primary-dark shadow-lg shadow-primary/20 transition-all">Publicar Banner</button>
                </div>
             </form>
          </div>
        )}

       {isEditingJob && (
         <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
            <form onSubmit={handleJobSave} className="bg-white rounded-[2rem] p-8 w-full max-w-xl shadow-2xl my-8">
              <h2 className="text-2xl font-black text-zinc-900 mb-6">{currentJob.id ? 'Editar Vaga' : 'Criar Nova Vaga'}</h2>
              
              <div className="space-y-5">
                 <div>
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-2">Título da Vaga</label>
                    <input required type="text" value={currentJob.title || ''} onChange={e => setCurrentJob({...currentJob, title: e.target.value})} className="w-full font-bold text-zinc-900 bg-zinc-50 focus:bg-white border focus:border-primary px-4 py-3.5 rounded-2xl outline-none transition-colors" placeholder="Ex: Atendente de Balcão" />
                 </div>
                 
                 <div>
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-2">Descrição da Vaga</label>
                    <textarea required rows={4} value={currentJob.description || ''} onChange={e => setCurrentJob({...currentJob, description: e.target.value})} className="w-full bg-zinc-50 focus:bg-white border focus:border-primary px-4 py-3.5 rounded-2xl outline-none font-medium resize-none transition-colors" placeholder="Fale sobre as atividades, ambiente de trabalho, etc." />
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                       <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-2">Salário/Remuneração</label>
                       <input type="text" value={currentJob.salary || ''} onChange={e => setCurrentJob({...currentJob, salary: e.target.value})} className="w-full text-zinc-900 bg-zinc-50 focus:bg-white border focus:border-primary px-4 py-3.5 rounded-2xl outline-none transition-colors" placeholder="Ex: R$ 1.500,00" />
                    </div>
                    <div>
                       <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-2">Horário</label>
                       <input type="text" value={currentJob.hours || ''} onChange={e => setCurrentJob({...currentJob, hours: e.target.value})} className="w-full text-zinc-900 bg-zinc-50 focus:bg-white border focus:border-primary px-4 py-3.5 rounded-2xl outline-none transition-colors" placeholder="Ex: Seg a Sex, 08h às 18h" />
                    </div>
                 </div>

                 <div>
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-2">Requisitos</label>
                    <textarea rows={3} value={currentJob.requirements || ''} onChange={e => setCurrentJob({...currentJob, requirements: e.target.value})} className="w-full bg-zinc-50 focus:bg-white border focus:border-primary px-4 py-3.5 rounded-2xl outline-none font-medium resize-none transition-colors" placeholder="Descreva as qualificações necessárias" />
                 </div>

                 <div>
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-2">Contato para Currículos</label>
                    <input type="text" value={currentJob.contactInfo || ''} onChange={e => setCurrentJob({...currentJob, contactInfo: e.target.value})} className="w-full text-zinc-900 bg-zinc-50 focus:bg-white border focus:border-primary px-4 py-3.5 rounded-2xl outline-none transition-colors" placeholder="E-mail ou WhatsApp" />
                 </div>

                 <div className="flex items-center gap-4 bg-zinc-50 p-4 rounded-2xl border border-zinc-200">
                    <input type="checkbox" id="jobActive" checked={currentJob.status !== 'inactive'} onChange={e => setCurrentJob({...currentJob, status: e.target.checked ? 'active' : 'inactive'})} className="w-6 h-6 rounded-md accent-primary" />
                    <div>
                       <label htmlFor="jobActive" className="font-bold text-zinc-900 block cursor-pointer">Vaga Recebendo Candidaturas</label>
                    </div>
                 </div>
              </div>

              <div className="flex gap-4 pt-6 mt-6 border-t border-zinc-100">
                 <button type="button" onClick={() => setIsEditingJob(false)} className="flex-1 bg-zinc-100 font-bold px-4 py-4 rounded-2xl hover:bg-zinc-200 text-zinc-700">Cancelar</button>
                 <button type="submit" disabled={saving} className="flex-1 bg-zinc-900 text-white font-bold px-4 py-4 rounded-2xl hover:bg-black shadow-lg shadow-black/10">Salvar Vaga</button>
              </div>
            </form>
         </div>
       )}

       <CategoryRequestModal 
         isOpen={isCategoryModalOpen} 
         onClose={() => setIsCategoryModalOpen(false)} 
         defaultType={requestType} 
       />
     </DashboardLayout>
    </>
  );
}
