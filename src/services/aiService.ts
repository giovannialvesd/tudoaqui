import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function suggestIcons(categoryName: string): Promise<string[]> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
         {
            role: "user",
            parts: [{ text: `Sugira 5 nomes de ícones EXATOS da biblioteca 'lucide-react' para uma categoria chamada "${categoryName}". 
Os ícones devem ser os mais apropriados possíveis para essa categoria.
Regras:
- Retorne SOMENTE OS NOMES dos ícones separados por vírgula (Exemplo: ShoppingCart, Scissors, Wrench, Utensils, Star).
- Respeite o PascalCase do Lucide.
- Nenhuma outra palavra, sem aspas, sem pontuação, sem markdown. Apenas a string com os nomes separados por vírgula.` }]
         }
      ]
    });
    
    const text = response.text?.trim() || "Star";
    return text.split(',').map(s => s.trim()).filter(Boolean);
  } catch (error) {
    console.error("AI Icon Generation Error", error);
    return ["Star"];
  }
}

export async function generateLandingPage(prompt: string): Promise<any[]> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
         {
            role: "user",
            parts: [{ text: `Você é um Web Designer Sênior especialista em conversão, UX e UI Premium.
Você está gerando uma página para a plataforma "TudoAqui". A IDENTIDADE VISUAL É OBRIGATÓRIA.
Regras de Design do TudoAqui:
- Cantos arredondados suaves (bordas arredondadas e amigáveis)
- Tipografia limpa, com muito contraste nas chamadas principais.
- Nada de cores misturadas aleatórias. Use as propriedades de 'style' para que o motor renderize no padrão ('primary', 'dark', 'light'). 
- Se o usuário pedir cores explícitas (ex: "tema azul e branco"), use estilo 'custom' e envie tailwind classes como 'bg-blue-600' e 'text-white'.

Crie a estrutura da página baseada neste pedido: "${prompt}".

A resposta DEVE ser estritamente UM ARRAY JSON válido (sem \`\`\`json ou markdown).
Estrutura:
[
  {
    "id": "uuid (será sobrescrito)",
    "type": "tipo_do_bloco",
    "config": { ... }
  }
]

Tipos de Blocos e Configs Permitidos:
- hero: { headline: string, subheadline?: string, buttonText?: string, layout: 'center'|'left', style: 'primary'|'dark'|'light'|'custom', customBgClass?: 'bg-blue-600', customTextClass?: 'text-white' }
- features: { title?: string, subtitle?: string, items: [{ title, description, icon?: 'Star'|'Compass'|'CheckCircle2'|... }], style: 'default'|'cards'|'minimal' }
- products: { title?: string, subtitle?: string, count: number, layout: 'grid'|'carousel' } 
- text: { content: string (markdown), alignment: 'left'|'center', style: 'default'|'boxed' }
- video: { url?: string, title?: string, subtitle?: string }
- callToAction: { title, subtitle, buttonText, style: 'primary'|'dark'|'light'|'custom', customBgClass?: string, customTextClass?: string }
- testimonials: { title?: string, subtitle?: string, items: [{ name, role, quote }], style: 'default'|'cards' }
- gallery: { title?: string, subtitle?: string, items: [{ url: string (pode deixar vazio ou placeholder imgs), caption?: string }], layout: 'grid'|'masonry' }
- faq: { title?: string, subtitle?: string, items: [{ question, answer }] }

Sempre crie uma página rica com múltiplos blocos (mínimo 3) que façam sentido juntos. NÃO utilize estilos CSS inline. Use propriedades customBgClass apenas com classes utilitárias do Tailwind (ex: bg-indigo-600).
Retorne SOMENTE ARRAY JSON.` }]
         }
      ]
    });

    const text = response.text || "[]";
    const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const blocks = JSON.parse(cleanedText);
    
    // Add unique IDs to the generated blocks
    return blocks.map((b: any, index: number) => ({
      ...b,
      id: `block_${Date.now()}_${index}`,
    }));
  } catch (error) {
    console.error("AI Generation Error", error);
    throw error;
  }
}
