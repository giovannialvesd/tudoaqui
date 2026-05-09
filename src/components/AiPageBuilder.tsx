import React, { useState } from 'react';
import { generateLandingPage } from '../services/aiService';
import { Wand2, Plus, GripVertical, Trash2, Edit2, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { motion, Reorder } from 'motion/react';
import BlockFormEditor from './BlockFormEditor';

interface AiPageBuilderProps {
  blocks: any[];
  onChange: (blocks: any[]) => void;
}

export default function AiPageBuilder({ blocks = [], onChange }: AiPageBuilderProps) {
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [editingBlock, setEditingBlock] = useState<any | null>(null);

  const handleGenerate = async () => {
    if (!prompt) return;
    setGenerating(true);
    try {
       const newBlocks = await generateLandingPage(prompt);
       onChange(newBlocks);
       toast.success('Página gerada com sucesso pela IA!');
       setPrompt('');
    } catch(e) {
       toast.error('Ocorreu um erro ao gerar a página.');
    } finally {
       setGenerating(false);
    }
  };

  const removeBlock = (id: string) => {
     onChange(blocks.filter(b => b.id !== id));
  };

  const moveBlockUp = (index: number) => {
     if (index === 0) return;
     const newBlocks = [...blocks];
     const temp = newBlocks[index - 1];
     newBlocks[index - 1] = newBlocks[index];
     newBlocks[index] = temp;
     onChange(newBlocks);
  };

  const moveBlockDown = (index: number) => {
     if (index === blocks.length - 1) return;
     const newBlocks = [...blocks];
     const temp = newBlocks[index + 1];
     newBlocks[index + 1] = newBlocks[index];
     newBlocks[index] = temp;
     onChange(newBlocks);
  };

  const saveBlockConfig = (newConfig: any) => {
     if (!editingBlock) return;
     const newBlocks = blocks.map(b => b.id === editingBlock.id ? { ...b, config: newConfig } : b);
     onChange(newBlocks);
     setEditingBlock(null);
  };

  return (
    <div className="space-y-6">
       <div className="bg-indigo-50 border border-indigo-100 p-5 md:p-6 rounded-2xl shadow-inner relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-20 rounded-full blur-3xl -mr-10 -mt-10"></div>
          <h3 className="font-bold text-indigo-900 mb-2 flex items-center gap-2 relative z-10"><Wand2 className="w-5 h-5 text-indigo-500" /> IA - Gerador de Layout</h3>
          <p className="text-sm text-indigo-700 mb-4 font-medium relative z-10">Descreva com detalhes o objetivo da sua página. A nossa IA usará isso para criar a estrutura perfeita com textos e espaços para imagens.</p>
          
          <div className="flex flex-col gap-3 relative z-10">
             <textarea 
                disabled={generating} 
                rows={4}
                value={prompt} 
                onChange={e => setPrompt(e.target.value)} 
                placeholder="Exemplo: Crie uma página promocional para o Dia das Mães. Quero uma seção em destaque (hero) com tom emocional, uma lista de presentes até R$ 100,00 e uma seção final focada em flores... Ou apenas escolha um Layout Pronto abaixo!" 
                className="w-full bg-white border border-indigo-200 outline-none px-4 py-4 rounded-xl focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all font-medium text-indigo-900 resize-none leading-relaxed text-sm" 
             />
             
             <div className="flex flex-col md:flex-row items-stretch justify-between gap-4 mt-2">
                <div className="flex flex-wrap gap-2 flex-1">
                   <div className="w-full text-xs font-black text-indigo-400 uppercase tracking-widest mb-1">Layouts Prontos para Gerar:</div>
                   {[
                       { label: 'Show / Evento', prompt: 'Crie uma página de Show ou Evento. Comece com um Hero bem dinâmico e escuro (style "dark") com o nome do Artista. Adicione uma seção de "features" com informações importantes (Data, Local, Classificação). Adicione uma seção de texto com o cronograma detalhado, seções de FAQ e termine com um callToAction forte para vender ingresso.' },
                       { label: 'Promoção (Produtos)', prompt: 'Crie uma forte campanha de promoção (Queima de Estoque). Use um Hero agressivo (style "primary"). Adicione features mostrando os maiores descontos, um bloco de products para a lista de itens, e um callToAction de urgência.' },
                       { label: 'Lançamento', prompt: 'Página de lançamento de novo produto ou coleção. Tema minimalista (style "light") no Hero, features para os diferenciais do que está sendo lançado, galeria de imagens para fotos, e um callToAction para reserva.' },
                       { label: 'Cardápio Digital', prompt: 'Página com layout de food / restaurante. Hero acolhedor apresentando o prato principal. Features mostrando os diferenciais (entrega rápida, prêmios). Blocos de texto indicando categorias do cardápio e um callToAction.' }
                    ].map((item) => (
                      <button 
                         key={item.label}
                         onClick={() => setPrompt(item.prompt)}
                         className="text-xs bg-indigo-100/60 hover:bg-indigo-300/50 text-indigo-800 font-bold px-4 py-2 rounded-xl transition-all shadow-sm border border-indigo-200/50"
                         title={item.prompt}
                      >
                         + {item.label}
                      </button>
                   ))}
                </div>

                <button disabled={generating || !prompt} onClick={handleGenerate} className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 transition-all shrink-0 self-end md:self-center h-12 mt-4 md:mt-0">
                   {generating ? <span className="w-5 h-5 border-2 border-white/30 border-t-white animate-spin rounded-full"></span> : <Wand2 className="w-5 h-5" />}
                   {generating ? 'Criando a Magia...' : 'Gerar Página'}
                </button>
             </div>
          </div>
       </div>

       {blocks.length > 0 && (
         <div className="space-y-3 mt-8">
            <h4 className="font-bold text-zinc-800 flex items-center gap-2"><div className="w-2 h-6 bg-primary rounded-full"></div> Blocos da Página</h4>
            
            <div className="space-y-3">
               {blocks.map((block, idx) => (
                 <div key={block.id} className="bg-white border border-zinc-200 rounded-xl p-4 flex items-center justify-between group hover:border-zinc-300 hover:shadow-md transition-all">
                    <div className="flex items-center gap-4">
                       <div className="flex flex-col gap-1 items-center justify-center text-zinc-300">
                          <button type="button" onClick={() => moveBlockUp(idx)} disabled={idx === 0} className="hover:text-zinc-600 disabled:opacity-30">▲</button>
                          <GripVertical className="w-4 h-4 text-zinc-300" />
                          <button type="button" onClick={() => moveBlockDown(idx)} disabled={idx === blocks.length - 1} className="hover:text-zinc-600 disabled:opacity-30">▼</button>
                       </div>
                       <div>
                          <div className="flex items-center gap-2">
                            <span className="bg-zinc-100 text-zinc-600 uppercase text-[10px] font-black px-2 py-0.5 rounded-md">{block.type}</span>
                          </div>
                          <p className="text-zinc-500 font-medium text-sm mt-1 line-clamp-1 max-w-sm">
                             {block.config?.headline || block.config?.title || 'Bloco de conteúdo'}
                          </p>
                       </div>
                    </div>
                    <div className="flex items-center gap-2">
                       <button type="button" onClick={() => setEditingBlock(block)} className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center hover:bg-indigo-100 transition-colors"><Edit2 className="w-4 h-4" /></button>
                       <button type="button" onClick={() => removeBlock(block.id)} className="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center hover:bg-rose-100 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                 </div>
               ))}
            </div>
         </div>
       )}

       {editingBlock && (
          <div className="fixed inset-0 z-[200] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto pt-24 pb-12">
             <div className="bg-white rounded-3xl p-6 w-full max-w-3xl shadow-2xl my-auto">
                <h3 className="text-xl font-black text-zinc-900 mb-2">Configurar Bloco: <span className="uppercase text-indigo-600">{editingBlock.type}</span></h3>
                <p className="text-sm text-zinc-500 mb-6">Ajuste os textos, estilos e itens deste bloco sem precisar de código.</p>
                
                <div className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar space-y-6">
                   <BlockFormEditor 
                      block={editingBlock} 
                      onChange={(newConfig) => setEditingBlock({ ...editingBlock, config: newConfig })} 
                   />
                </div>

                <div className="flex gap-4 mt-8 pt-6 border-t border-zinc-100">
                   <button type="button" onClick={() => setEditingBlock(null)} className="flex-1 font-bold py-3 md:py-4 text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-colors">Cancelar</button>
                   <button type="button" onClick={() => saveBlockConfig(editingBlock.config)} className="flex-1 font-bold py-3 md:py-4 text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg transition-all shadow-indigo-200">Salvar Alterações</button>
                </div>
             </div>
          </div>
       )}
    </div>
  );
}
