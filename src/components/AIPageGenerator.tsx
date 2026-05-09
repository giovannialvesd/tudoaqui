import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { generatePageFromDescription, AIPageConfig } from '../services/aiPageGeneration';
import { BlocksRenderer } from './AIPageBlocks';
import { Sparkles, Save, Edit3, Trash2, Eye, Link as LinkIcon, Loader2, FileText } from 'lucide-react';
import { collection, doc, setDoc, getDocs, deleteDoc, serverTimestamp, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { toast } from 'sonner';
import { handleFirestoreError, OperationType } from '../firebase/errors';

export default function AIPageGenerator({ cityId: overrideCityId }: { cityId?: string }) {
    const { userProfile, currentUser } = useAuth();
    const cityId = overrideCityId || userProfile?.cityId;
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedPage, setGeneratedPage] = useState<AIPageConfig | null>(null);
    const [savedPages, setSavedPages] = useState<any[]>([]);
    const [view, setView] = useState<'list' | 'create' | 'preview' | 'edit'>('list');
    const [editingPage, setEditingPage] = useState<any | null>(null);

    useEffect(() => {
        if (currentUser) {
            fetchPages();
        }
    }, [currentUser, userProfile]);

    const fetchPages = async () => {
        if (!currentUser) return;
        try {
            let q;
            const constraints: any[] = [];
            if (cityId) constraints.push(where('cityId', '==', cityId));

            if (userProfile?.role === 'admin' || userProfile?.role === 'super_admin') {
                q = query(collection(db, 'generated_pages'), ...constraints);
            } else {
                q = query(collection(db, 'generated_pages'), where('createdBy', '==', currentUser.uid), ...constraints);
            }
            const snapshot = await getDocs(q);
            setSavedPages(snapshot.docs.map(d => ({id: d.id, ...(d.data() as any)})));
        } catch(e) {
            handleFirestoreError(e, OperationType.WRITE, null);
        }
    }

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        setIsGenerating(true);
        const config = await generatePageFromDescription(prompt);
        if (config) {
            // Give it a safe path if none was generated properly
            if (!config.path || !config.path.startsWith('/p/')) {
                config.path = '/p/' + (config.title || 'nova-pagina').toLowerCase().replace(/[^a-z0-9]+/g, '-');
            }
            if (!config.themeColor) config.themeColor = 'primary';
            setGeneratedPage(config);
            setView('preview');
        }
        setIsGenerating(false);
    };

    const handleSave = async (pageToSave: any = generatedPage) => {
        if (!pageToSave || !currentUser) return;
        try {
            const docId = pageToSave.id || pageToSave.path.replace('/p/', '').replace(/\//g, '-');
            await setDoc(doc(db, 'generated_pages', docId), {
                ...pageToSave,
                cityId: cityId || '',
                createdBy: currentUser.uid,
                updatedAt: serverTimestamp(),
                createdAt: pageToSave.createdAt || serverTimestamp()
            });
            toast.success('Página salva com sucesso!');
            setGeneratedPage(null);
            setEditingPage(null);
            setPrompt('');
            fetchPages();
            setView('list');
        } catch(e) {
            toast.error('Erro ao salvar página.');
      handleFirestoreError(e, OperationType.WRITE, null);
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm("Deseja realmente excluir esta página?")) {
            await deleteDoc(doc(db, 'generated_pages', id));
            fetchPages();
        }
    }

    const handleEditBlockContent = (blockIndex: number, field: string, value: any) => {
        if (!editingPage) return;
        const newBlocks = [...editingPage.blocks];
        newBlocks[blockIndex].content[field] = value;
        setEditingPage({ ...editingPage, blocks: newBlocks });
    };

    const handleEditBlockArrayItem = (blockIndex: number, arrayField: string, itemIndex: number, itemField: string, value: any) => {
        if (!editingPage) return;
        const newBlocks = [...editingPage.blocks];
        newBlocks[blockIndex].content[arrayField][itemIndex][itemField] = value;
        setEditingPage({ ...editingPage, blocks: newBlocks });
    };

    if (view === 'list') {
        return (
            <div className="space-y-6 animate-in fade-in">
                <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
                    <div>
                        <h2 className="text-xl font-black text-zinc-900">Páginas Inteligentes</h2>
                        <p className="text-zinc-500 font-medium">Crie páginas dinâmicas com IA baseadas em descrição de texto.</p>
                    </div>
                    <button onClick={() => setView('create')} className="bg-primary text-white px-5 py-3 rounded-full font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all flex items-center gap-2">
                        <Sparkles className="w-5 h-5" /> Criar com IA
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {savedPages.map(page => (
                        <div key={page.id} className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm flex flex-col justify-between">
                            <div>
                                <div className="w-12 h-12 bg-zinc-100 rounded-2xl flex items-center justify-center mb-4 text-zinc-400">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <h3 className="font-bold text-lg text-zinc-900 mb-1">{page.title}</h3>
                                <div className="flex items-center gap-1 text-primary text-sm font-bold bg-primary/5 px-2 py-1 rounded-lg w-fit mb-4">
                                    <LinkIcon className="w-3.5 h-3.5" /> {page.path}
                                </div>
                                <p className="text-xs text-zinc-500 mb-4">{page.blocks?.length || 0} seções geradas</p>
                            </div>
                            <div className="flex justify-between items-center">
                                <a href={page.path} target="_blank" rel="noreferrer" className="text-zinc-500 hover:text-primary flex items-center gap-1 font-bold text-sm bg-zinc-50 px-3 py-1.5 rounded-xl">
                                    <Eye className="w-4 h-4" /> Ver Página
                                </a>
                                <div className="flex items-center gap-1">
                                    <button onClick={() => { setEditingPage(page); setView('edit'); }} className="text-indigo-500 hover:bg-indigo-50 p-2 rounded-xl transition-colors">
                                        <Edit3 className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleDelete(page.id)} className="text-rose-500 hover:bg-rose-50 p-2 rounded-xl transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {savedPages.length === 0 && (
                        <div className="col-span-full text-center py-12 border-2 border-dashed border-zinc-200 rounded-3xl">
                            <Sparkles className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
                            <p className="font-bold text-zinc-600">Nenhuma página gerada ainda.</p>
                            <p className="text-zinc-500 text-sm mt-1">Clique no botão acima para criar a primeira.</p>
                        </div>
                    )}
                </div>
            </div>
        )
    }

    if (view === 'edit' && editingPage) {
        return (
            <div className="space-y-6">
                <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm flex items-center justify-between sticky top-20 z-40">
                    <div>
                        <h2 className="font-black text-xl text-zinc-900">Editor de Página <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded-md ml-2 align-middle">100% Customizável</span></h2>
                        <p className="text-sm text-zinc-500">{editingPage.title}</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => { setView('list'); setEditingPage(null); }} className="bg-zinc-100 text-zinc-700 font-bold px-4 py-2 rounded-xl hover:bg-zinc-200">
                            Cancelar Voltar
                        </button>
                        <button onClick={() => handleSave(editingPage)} className="bg-indigo-600 text-white font-bold px-5 py-2 rounded-xl hover:bg-indigo-700 flex items-center gap-2 shadow-lg shadow-indigo-600/20">
                            <Save className="w-4 h-4" /> Salvar Alterações
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* JSON / Content Editor */}
                    <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm overflow-y-auto max-h-[80vh] custom-scrollbar">
                        <h3 className="font-bold text-zinc-800 border-b border-zinc-100 pb-4 mb-4">Dados da Página</h3>
                        
                        <div className="space-y-4 mb-8">
                            <div>
                                <label className="text-xs font-bold text-zinc-500 uppercase">Título da Página</label>
                                <input type="text" value={editingPage.title || ''} onChange={e => setEditingPage({...editingPage, title: e.target.value})} className="w-full mt-1 bg-zinc-50 border border-zinc-200 px-4 py-2 rounded-xl outline-none text-sm" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-zinc-500 uppercase">Caminho (Path)</label>
                                <input type="text" value={editingPage.path || ''} onChange={e => setEditingPage({...editingPage, path: e.target.value})} className="w-full mt-1 bg-zinc-50 border border-zinc-200 px-4 py-2 rounded-xl outline-none text-sm" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-zinc-500 uppercase">Cor do Tema</label>
                                <select value={editingPage.themeColor || 'primary'} onChange={e => setEditingPage({...editingPage, themeColor: e.target.value})} className="w-full mt-1 bg-zinc-50 border border-zinc-200 px-4 py-2 rounded-xl outline-none text-sm">
                                    <option value="primary">Vermelho (Primary)</option>
                                    <option value="blue">Azul (Blue)</option>
                                    <option value="emerald">Verde (Emerald)</option>
                                    <option value="rose">Rosa (Rose)</option>
                                    <option value="amber">Amarelo (Amber)</option>
                                </select>
                            </div>
                        </div>

                        <h3 className="font-bold text-zinc-800 border-b border-zinc-100 pb-4 mb-4">Editando Blocos</h3>
                        <div className="space-y-8">
                            {editingPage.blocks?.map((block: any, idx: number) => (
                                <div key={idx} className="bg-zinc-50 rounded-2xl p-4 border border-zinc-200">
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="font-bold text-zinc-700 bg-white px-3 py-1 rounded-lg shadow-sm border border-zinc-100 text-xs uppercase tracking-wider">{block.type}</h4>
                                    </div>
                                    <div className="space-y-3">
                                        {Object.keys(block.content).map(field => {
                                            const value = block.content[field];
                                            if (Array.isArray(value)) {
                                                return (
                                                    <div key={field} className="mt-4 border-t border-zinc-200 pt-4">
                                                        <label className="text-xs font-bold text-zinc-500 uppercase mb-2 block">{field}</label>
                                                        {value.map((item, itemIdx) => (
                                                            <div key={itemIdx} className="bg-white p-3 rounded-xl border border-zinc-200 mb-2 space-y-2">
                                                                {Object.keys(item).map(itemField => (
                                                                    <div key={itemField}>
                                                                        <label className="text-[10px] font-bold text-zinc-400 uppercase">{itemField}</label>
                                                                        {itemField.includes('description') || itemField.includes('content') || itemField.includes('answer') ? (
                                                                            <textarea rows={2} value={item[itemField]} onChange={e => handleEditBlockArrayItem(idx, field, itemIdx, itemField, e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 px-3 py-2 rounded-lg outline-none text-xs resize-none" />
                                                                        ) : (
                                                                            <input type="text" value={item[itemField]} onChange={e => handleEditBlockArrayItem(idx, field, itemIdx, itemField, e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 px-3 py-2 rounded-lg outline-none text-xs" />
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ))}
                                                    </div>
                                                );
                                            }
                                            if (typeof value === 'object') return null; // Fallback
                                            return (
                                                <div key={field}>
                                                    <label className="text-[10px] font-bold text-zinc-500 uppercase">{field}</label>
                                                    {field.includes('Url') || field.includes('Link') ? (
                                                        <input type="text" value={value} onChange={e => handleEditBlockContent(idx, field, e.target.value)} className="w-full mt-1 bg-white border border-zinc-200 px-3 py-2 rounded-xl outline-none text-xs" />
                                                    ) : field.includes('subtitle') || field.includes('content') ? (
                                                        <textarea rows={3} value={value} onChange={e => handleEditBlockContent(idx, field, e.target.value)} className="w-full mt-1 bg-white border border-zinc-200 px-3 py-2 rounded-xl outline-none text-xs resize-none" />
                                                    ) : (
                                                        <input type="text" value={value} onChange={e => handleEditBlockContent(idx, field, e.target.value)} className="w-full mt-1 bg-white border border-zinc-200 px-3 py-2 rounded-xl outline-none text-xs font-medium" />
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Live Preview */}
                    <div className="bg-bg-base border border-zinc-200 rounded-[2.5rem] overflow-hidden shadow-xl relative max-h-[80vh] flex flex-col">
                        <div className="bg-zinc-100 px-4 py-3 flex items-center gap-2 border-b border-zinc-200 shrink-0">
                            <div className="w-3 h-3 rounded-full bg-rose-400"></div>
                            <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                            <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                            <div className="ml-4 bg-white px-3 py-1 rounded-md text-xs text-zinc-500 font-mono flex-1 text-center border border-zinc-200 truncate">
                                tudoaqui.com{editingPage.path}
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto no-scrollbar pb-20">
                            <BlocksRenderer blocks={editingPage.blocks} themeColor={editingPage.themeColor} />
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (view === 'create') {
        return (
            <div className="bg-white rounded-3xl shadow-sm border border-zinc-100 p-8 space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-black text-zinc-900">Descreva a Página</h2>
                        <p className="text-zinc-500 font-medium">Use linguagem natural para dizer o que você quer.</p>
                    </div>
                    <button onClick={() => setView('list')} className="text-zinc-500 hover:bg-zinc-100 px-4 py-2 rounded-xl font-bold">Cancelar</button>
                </div>

                <div className="bg-zinc-50 p-6 rounded-2xl border border-zinc-200">
                    <label className="block text-sm font-bold text-zinc-700 mb-2">Seu Prompt / Descrição:</label>
                    <textarea 
                        value={prompt}
                        onChange={e => setPrompt(e.target.value)}
                        placeholder="Ex: Quero uma página moderna para promoção de inverno, com banner grande no topo, produtos destacados de frio, depoimentos, nas cores azul e branco..."
                        className="w-full h-40 px-4 py-3 bg-white border border-zinc-300 rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
                    />
                </div>

                <button 
                    onClick={handleGenerate} 
                    disabled={isGenerating || !prompt.trim()}
                    className="w-full bg-black text-white hover:bg-zinc-800 disabled:opacity-50 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-colors shadow-lg"
                >
                    {isGenerating ? <><Loader2 className="w-5 h-5 animate-spin" /> Gerando Layout...</> : <><Sparkles className="w-5 h-5 text-primary" /> Gerar Página com IA</>}
                </button>
            </div>
        )
    }

    if (view === 'preview' && generatedPage) {
        return (
            <div className="space-y-6">
                <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm flex items-center justify-between sticky top-20 z-40">
                    <div>
                        <h2 className="font-black text-lg text-zinc-900">Pré-visualização</h2>
                        <p className="text-sm text-zinc-500">Caminho: {generatedPage.path}</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setView('create')} className="bg-zinc-100 text-zinc-700 font-bold px-4 py-2 rounded-xl hover:bg-zinc-200">
                            Refazer
                        </button>
                        <button onClick={handleSave} className="bg-primary text-white font-bold px-5 py-2 rounded-xl hover:bg-primary/90 flex items-center gap-2 shadow-lg shadow-primary/20">
                            <Save className="w-4 h-4" /> Aprovar e Salvar
                        </button>
                    </div>
                </div>

                <div className="bg-bg-base border border-zinc-200 rounded-[2.5rem] overflow-hidden shadow-2xl relative">
                     <div className="bg-zinc-100 px-4 py-2 flex items-center gap-2 border-b border-zinc-200">
                        <div className="w-3 h-3 rounded-full bg-rose-400"></div>
                        <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                        <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                        <div className="ml-4 bg-white px-3 py-1 rounded-md text-xs text-zinc-500 font-mono w-64 text-center border border-zinc-200 truncate">
                            tudoaqui.com{generatedPage.path}
                        </div>
                     </div>
                     <div className="h-[600px] overflow-y-auto no-scrollbar pb-20">
                         <BlocksRenderer blocks={generatedPage.blocks} themeColor={generatedPage.themeColor} />
                     </div>
                </div>
            </div>
        )
    }

    return null;
}
