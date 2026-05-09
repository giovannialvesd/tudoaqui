import { GoogleGenAI } from "@google/genai";
import { toast } from 'sonner';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export interface AIPageBlock {
  type: 'Hero' | 'Features' | 'Products' | 'Testimonials' | 'FAQ' | 'CTA' | 'Gallery' | 'Text';
  content: any;
}

export interface AIPageConfig {
  title: string;
  path: string;
  themeColor: string;
  blocks: AIPageBlock[];
}

const SYSTEM_PROMPT = `You are an expert Frontend Architect and Design Lead. 
Your task is to generate a beautiful, modern, page configuration JSON based on the user's description.
The page MUST follow the existing visual identity of "TudoAqui" (modern, rounded corners, clean, Tailwind styling conventions).

You can use the following block types:
- "Hero": { title: string, subtitle: string, imageUrl: string, buttonText?: string, buttonLink?: string }
- "Features": { title: string, subtitle?: string, items: Array<{ title: string, description: string, iconName: string }> } // iconName must be a valid Lucide icon name (e.g. "Store", "Heart", "Star")
- "Products": { title: string, subtitle?: string, items: Array<{ name: string, price: string, imageUrl: string }> } // Fake products to show as example
- "Testimonials": { title: string, items: Array<{ name: string, role: string, content: string }> }
- "FAQ": { title: string, items: Array<{ question: string, answer: string }> }
- "CTA": { title: string, subtitle: string, buttonText: string, buttonLink: string }
- "Gallery": { title: string, images: string[] }
- "Text": { title?: string, content: string } // Markdown allowed in content

Guidelines:
1. Always return ONLY a valid JSON object matching the requested schema. No markdown wrapping.
2. Use high quality Unsplash placeholders for images (e.g. https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1200&q=80).
3. Keep the content localized to Portuguese (Brazil).
4. Extract an appropriate URL path from the title (e.g., "/p/promocao-inverno").
5. themeColor should be a valid tailwind color name (e.g., "blue", "rose", "emerald", "amber").
`;

export async function generatePageFromDescription(description: string): Promise<AIPageConfig | null> {
    try {
        console.log("Generating page via AI...");
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: description,
            config: {
                systemInstruction: SYSTEM_PROMPT,
                responseMimeType: "application/json",
                responseSchema: {
                    type: "OBJECT",
                    properties: {
                        title: { type: "STRING" },
                        path: { type: "STRING" },
                        themeColor: { type: "STRING" },
                        blocks: {
                            type: "ARRAY",
                            items: {
                                type: "OBJECT",
                                properties: {
                                    type: { type: "STRING" },
                                    content: { type: "OBJECT" } // We leave it as open object for simplicity in schema
                                },
                                required: ["type", "content"]
                            }
                        }
                    },
                    required: ["title", "path", "themeColor", "blocks"]
                }
            }
        });

        if (response.text) {
             return JSON.parse(response.text) as AIPageConfig;
        }
        return null;
    } catch (error) {
        console.error("AI Generation Error:", error);
        toast.error("Erro na inteligência artificial ao gerar a página.");
        return null;
    }
}
