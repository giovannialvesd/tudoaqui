import React, { useRef, useState } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import imageCompression from 'browser-image-compression';
import { toast } from 'sonner';

interface ImageUploaderProps {
  value: string | null;
  onChange: (base64: string | null) => void;
  label?: string;
  className?: string;
  aspectRatio?: 'square' | 'video' | 'auto';
  recommendedText?: string;
}

export default function ImageUploader({ value, onChange, label, className, aspectRatio = 'auto', recommendedText }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem válida (JPEG, PNG, WebP).');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      toast.error('Imagem muito grande. O limite máximo é 20MB.');
      return;
    }

    setIsCompressing(true);
    try {
      const options = {
        maxSizeMB: 0.4, // Increased from 0.15 to 0.4 for better quality
        maxWidthOrHeight: 1600, // Increased from 800 to 1600 for high-res banners
        useWebWorker: true,
        initialQuality: 0.8 // Increased from 0.7 to 0.8
      };

      const compressedFile = await imageCompression(file, options);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        onChange(e.target?.result as string);
      };
      reader.readAsDataURL(compressedFile);
      toast.success('Imagem otimizada com sucesso!');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao processar imagem.');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className={cn("w-full", className)}>
      <div className="flex justify-between items-end mb-2">
         {label && <label className="text-xs font-bold text-zinc-600 uppercase">{label}</label>}
         {recommendedText && <span className="text-[10px] text-primary font-bold">{recommendedText}</span>}
      </div>
      
      {!value ? (
        <div 
          onClick={() => !isCompressing && inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={cn(
            "w-full border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-colors relative overflow-hidden",
            aspectRatio === 'square' ? 'aspect-square' : aspectRatio === 'video' ? 'aspect-video' : 'h-32',
            isDragging ? "border-primary bg-primary/5" : "border-zinc-300 hover:border-primary/50 bg-zinc-50",
            isCompressing && "opacity-70 pointer-events-none"
          )}
        >
          {isCompressing ? (
             <div className="flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
                <span className="text-sm font-bold text-primary">Otimizando imagem...</span>
             </div>
          ) : (
             <>
               <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-3">
                 <Upload className="w-6 h-6 text-zinc-400" />
               </div>
               <span className="text-sm font-bold text-zinc-700">Clique ou arraste uma foto</span>
               <span className="text-xs text-zinc-400 mt-1 font-medium">JPEG, PNG, WebP (até 20MB)</span>
             </>
          )}
        </div>
      ) : (
        <div className={cn("relative w-full rounded-2xl overflow-hidden border border-zinc-200 bg-zinc-100 shadow-sm group", 
             aspectRatio === 'square' ? 'aspect-square' : aspectRatio === 'video' ? 'aspect-video' : 'h-32')}>
          <img src={value} alt="Preview" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
          <button 
            onClick={() => onChange(null)}
            className="absolute top-2 right-2 w-8 h-8 bg-white hover:bg-rose-50 text-rose-500 rounded-full flex items-center justify-center shadow-md transition-colors opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100"
            title="Remover imagem"
          >
            <X className="w-5 h-5 font-bold" />
          </button>
        </div>
      )}
      <input 
        type="file" 
        accept="image/jpeg, image/png, image/webp" 
        ref={inputRef} 
        onChange={(e) => {
           if(e.target.files && e.target.files.length > 0) {
              handleFile(e.target.files[0]);
              // Reset input so the same file can be selected again
              e.target.value = '';
           }
        }} 
        className="hidden" 
      />
    </div>
  );
}
