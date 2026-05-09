import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import ImageUploader from './ImageUploader';

export default function BlockFormEditor({ block, onChange }: { block: any, onChange: (config: any) => void }) {
  const config = block.config || {};

  const handleFieldChange = (key: string, value: any) => {
    onChange({ ...config, [key]: value });
  };

  const handleArrayChange = (key: string, idx: number, subKey: string, value: any) => {
    const list = [...(config[key] || [])];
    if (!list[idx]) list[idx] = {};
    list[idx] = { ...list[idx], [subKey]: value };
    handleFieldChange(key, list);
  };

  const addArrayItem = (key: string, defaultItem: any = {}) => {
    const list = [...(config[key] || [])];
    list.push(defaultItem);
    handleFieldChange(key, list);
  };

  const removeArrayItem = (key: string, idx: number) => {
    const list = [...(config[key] || [])];
    list.splice(idx, 1);
    handleFieldChange(key, list);
  };

  const renderBasicInput = (key: string, label: string, type: string = 'text') => {
    if (type === 'textarea') {
       return (
          <div key={key} className="space-y-1">
             <label className="text-xs font-black text-zinc-500 uppercase tracking-widest">{label}</label>
             <textarea rows={4} value={config[key] || ''} onChange={e => handleFieldChange(key, e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 font-medium"></textarea>
          </div>
       );
    }
    if (type === 'image') {
       return (
          <div key={key} className="space-y-1">
             <label className="text-xs font-black text-zinc-500 uppercase tracking-widest">{label}</label>
             <ImageUploader value={config[key] || ''} onChange={v => handleFieldChange(key, v)} />
          </div>
       );
    }
    return (
       <div key={key} className="space-y-1">
          <label className="text-xs font-black text-zinc-500 uppercase tracking-widest">{label}</label>
          <input type={type} value={config[key] || ''} onChange={e => handleFieldChange(key, e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 font-medium" />
       </div>
    );
  };

  const renderSelect = (key: string, label: string, options: string[]) => (
    <div key={key} className="space-y-1">
       <label className="text-xs font-black text-zinc-500 uppercase tracking-widest">{label}</label>
       <select value={config[key] || ''} onChange={e => handleFieldChange(key, e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 font-medium appearance-none">
          <option value="">Padrão</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
       </select>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-zinc-50/50 border border-zinc-100 rounded-2xl p-5 space-y-4">
         <h4 className="font-bold text-zinc-800 text-sm border-b border-zinc-200 pb-2">Configurações Gerais</h4>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderBasicInput('headline', 'Título Principal (Headline)')}
            {renderBasicInput('title', 'Título do Bloco (Title)')}
            {renderBasicInput('subheadline', 'Subtítulo (Subheadline)')}
            {renderBasicInput('subtitle', 'Subtítulo do Bloco (Subtitle)')}
            {renderBasicInput('buttonText', 'Texto do Botão')}
            {renderBasicInput('buttonUrl', 'Link do Botão')}
         </div>
         {block.type === 'text' && renderBasicInput('content', 'Conteúdo Markdown', 'textarea')}
         
         {block.type === 'hero' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-zinc-100">
               {renderSelect('layout', 'Layout', ['center', 'left', 'split'])}
               {renderSelect('style', 'Estilo', ['primary', 'dark', 'light', 'custom'])}
               {renderBasicInput('customBgClass', 'Fundo Custom. (Tailwind)')}
               {renderBasicInput('customTextClass', 'Texto Custom. (Tailwind)')}
               {renderBasicInput('imageUrl', 'Url da Imagem', 'image')}
            </div>
         )}
         
         {(block.type === 'features' || block.type === 'gallery' || block.type === 'testimonials') && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-zinc-100">
               {renderSelect('style', 'Estilo do Bloco', ['default', 'cards', 'minimal', 'grid', 'masonry'])}
               {renderBasicInput('customBgClass', 'Cor de Fundo (Tailwind)')}
            </div>
         )}
      </div>

      {Array.isArray(config.items) && (
         <div className="space-y-4">
            <h4 className="font-bold text-zinc-800 text-sm flex items-center justify-between">
               Itens da Lista
               <button type="button" onClick={() => addArrayItem('items')} className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 hover:bg-indigo-100"><Plus className="w-3 h-3" /> Adicionar</button>
            </h4>
            <div className="space-y-3">
               {config.items.map((item: any, idx: number) => (
                  <div key={idx} className="bg-white border border-zinc-200 rounded-xl p-4 relative group">
                     <button type="button" onClick={() => removeArrayItem('items', idx)} className="absolute -top-2 -right-2 w-8 h-8 bg-rose-100 text-rose-500 rounded-full items-center justify-center hidden group-hover:flex shadow-sm"><Trash2 className="w-4 h-4" /></button>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                           <label className="text-[10px] uppercase font-bold text-zinc-400">Título / Nome</label>
                           <input type="text" value={item.title || item.name || item.question || ''} onChange={e => {
                              const v = e.target.value;
                              if (block.type === 'faq') handleArrayChange('items', idx, 'question', v);
                              else if (block.type === 'testimonials') handleArrayChange('items', idx, 'name', v);
                              else handleArrayChange('items', idx, 'title', v);
                           }} className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500" />
                        </div>
                        <div className="space-y-1">
                           <label className="text-[10px] uppercase font-bold text-zinc-400">{block.type === 'faq' ? 'Resposta' : block.type === 'gallery' ? 'URL Imagem' : 'Descrição/Subtitle'}</label>
                           <input type="text" value={item.description || item.answer || item.url || item.role || ''} onChange={e => {
                              const v = e.target.value;
                              if (block.type === 'faq') handleArrayChange('items', idx, 'answer', v);
                              else if (block.type === 'gallery') handleArrayChange('items', idx, 'url', v);
                              else if (block.type === 'testimonials') handleArrayChange('items', idx, 'role', v);
                              else handleArrayChange('items', idx, 'description', v);
                           }} className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500" />
                        </div>
                        {block.type === 'features' && (
                           <div className="space-y-1 sm:col-span-2">
                              <label className="text-[10px] uppercase font-bold text-zinc-400">Ícone (Nome Lucide)</label>
                              <input type="text" value={item.icon || ''} onChange={e => handleArrayChange('items', idx, 'icon', e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500" />
                           </div>
                        )}
                        {block.type === 'testimonials' && (
                           <div className="space-y-1 sm:col-span-2">
                              <label className="text-[10px] uppercase font-bold text-zinc-400">Depoimento</label>
                              <textarea rows={2} value={item.quote || ''} onChange={e => handleArrayChange('items', idx, 'quote', e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500"></textarea>
                           </div>
                        )}
                     </div>
                  </div>
               ))}
               {config.items.length === 0 && (
                  <div className="text-center p-6 bg-zinc-50 rounded-xl border border-dashed border-zinc-200 text-sm font-medium text-zinc-400">
                     Nenhum item adicionado ainda.
                  </div>
               )}
            </div>
         </div>
      )}
    </div>
  )
}
