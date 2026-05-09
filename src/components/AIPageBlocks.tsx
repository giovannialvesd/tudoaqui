import React from 'react';
import * as Icons from 'lucide-react';

const COLORS: Record<string, any> = {
    primary: {
        bg: 'bg-primary text-white',
        bgLight: 'bg-primary/10',
        bgDark: 'bg-primary/90',
        text: 'text-primary',
        from: 'from-primary/90',
        to: 'to-primary/50',
        shadow: 'shadow-primary/20',
        blur: 'bg-primary/20',
    },
    blue: {
        bg: 'bg-blue-600 text-white',
        bgLight: 'bg-blue-50',
        bgDark: 'bg-blue-900',
        text: 'text-blue-600',
        from: 'from-blue-900/90',
        to: 'to-blue-600/50',
        shadow: 'shadow-blue-500/20',
        blur: 'bg-blue-500/20',
    },
    emerald: {
        bg: 'bg-emerald-600 text-white',
        bgLight: 'bg-emerald-50',
        bgDark: 'bg-emerald-900',
        text: 'text-emerald-600',
        from: 'from-emerald-900/90',
        to: 'to-emerald-600/50',
        shadow: 'shadow-emerald-500/20',
        blur: 'bg-emerald-500/20',
    },
    rose: {
        bg: 'bg-rose-600 text-white',
        bgLight: 'bg-rose-50',
        bgDark: 'bg-rose-900',
        text: 'text-rose-600',
        from: 'from-rose-900/90',
        to: 'to-rose-600/50',
        shadow: 'shadow-rose-500/20',
        blur: 'bg-rose-500/20',
    },
    amber: {
        bg: 'bg-amber-500 text-white',
        bgLight: 'bg-amber-50',
        bgDark: 'bg-amber-900',
        text: 'text-amber-500',
        from: 'from-amber-900/90',
        to: 'to-amber-500/50',
        shadow: 'shadow-amber-500/20',
        blur: 'bg-amber-500/20',
    }
};

const getThemeVars = (theme: string) => COLORS[theme] || COLORS.primary;

// Utility to render Lucide Icons dynamically
const DynamicIcon = ({ name, className }: { name: string, className?: string }) => {
    const Icon = (Icons as any)[name] || Icons.HelpCircle;
    return <Icon className={className} />;
};

export const HeroBlock = ({ content, themeColor }: any) => {
    const theme = getThemeVars(themeColor);
    return (
        <section className={`${theme.bg} rounded-[2rem] p-8 md:p-16 mb-12 relative overflow-hidden`}>
            <div className="absolute inset-0 z-0 bg-black">
                <img src={content.imageUrl} alt={content.title} className="w-full h-full object-cover opacity-30" />
                <div className={`absolute inset-0 bg-gradient-to-r ${theme.from} ${theme.to} mix-blend-multiply`}></div>
            </div>
            <div className="relative z-10 max-w-2xl">
                <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tight text-white">{content.title}</h1>
                <p className="text-lg md:text-2xl font-medium text-white/90 mb-8">{content.subtitle}</p>
                {content.buttonText && (
                    <a href={content.buttonLink || '#'} className="inline-block bg-white text-black px-8 py-4 rounded-xl font-bold hover:scale-105 transition-transform shadow-xl">
                        {content.buttonText}
                    </a>
                )}
            </div>
        </section>
    );
};

export const FeaturesBlock = ({ content, themeColor }: any) => {
    const theme = getThemeVars(themeColor);
    return (
        <section className="mb-16">
            <div className="text-center mb-10">
                <h2 className="text-3xl font-black text-zinc-900">{content.title}</h2>
                {content.subtitle && <p className="text-zinc-500 font-medium mt-3">{content.subtitle}</p>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {content.items?.map((item: any, i: number) => (
                    <div key={i} className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-100 flex flex-col items-start hover:border-zinc-300 transition-colors group">
                        <div className={`w-12 h-12 rounded-2xl ${theme.bgLight} flex items-center justify-center ${theme.text} mb-4 group-hover:scale-110 transition-transform`}>
                            <DynamicIcon name={item.iconName} className="w-6 h-6" />
                        </div>
                        <h3 className="font-bold text-lg text-zinc-900 mb-2">{item.title}</h3>
                        <p className="text-zinc-500 text-sm leading-relaxed">{item.description}</p>
                    </div>
                ))}
            </div>
        </section>
    );
};

export const ProductsBlock = ({ content, themeColor }: any) => {
    const theme = getThemeVars(themeColor);
    return (
        <section className="mb-16">
            <div className="text-center mb-10">
                <h2 className="text-3xl font-black text-zinc-900">{content.title}</h2>
                {content.subtitle && <p className="text-zinc-500 font-medium mt-3">{content.subtitle}</p>}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {content.items?.map((item: any, i: number) => (
                    <div key={i} className="bg-white rounded-3xl overflow-hidden border border-zinc-100 shadow-sm group">
                        <div className="aspect-square w-full relative overflow-hidden bg-zinc-100">
                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        </div>
                        <div className="p-4 md:p-5">
                            <h3 className="font-bold text-zinc-900 text-sm md:text-base line-clamp-2">{item.name}</h3>
                            <p className={`font-black ${theme.text} text-lg mt-2`}>{item.price}</p>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export const GalleryBlock = ({ content }: any) => {
    return (
        <section className="mb-16">
            <h2 className="text-3xl font-black text-zinc-900 text-center mb-10">{content.title}</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {content.images?.map((url: string, i: number) => (
                    <div key={i} className="aspect-square w-full relative overflow-hidden rounded-3xl cursor-pointer group">
                        <img src={url} alt="Gallery" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[800ms]" />
                    </div>
                ))}
            </div>
        </section>
    );
};

export const CTABlock = ({ content, themeColor }: any) => {
    const theme = getThemeVars(themeColor);
    return (
        <section className={`bg-zinc-900 text-white rounded-[2rem] p-10 md:p-16 text-center mb-16 relative overflow-hidden`}>
            <div className={`absolute top-0 right-0 w-64 h-64 ${theme.blur} rounded-full blur-3xl -translate-y-1/2 translate-x-1/2`}></div>
            <div className="relative z-10 flex flex-col items-center">
                <h2 className="text-3xl md:text-5xl font-black mb-6 tracking-tight">{content.title}</h2>
                <p className="text-zinc-400 font-medium mb-10 max-w-2xl md:text-xl">{content.subtitle}</p>
                <a href={content.buttonLink || '#'} className={`${theme.bg} px-10 py-5 rounded-xl font-bold transition-transform hover:scale-105 shadow-xl ${theme.shadow} text-lg`}>
                    {content.buttonText}
                </a>
            </div>
        </section>
    );
};

export const TestimonialsBlock = ({ content, themeColor }: any) => {
    const theme = getThemeVars(themeColor);
    return (
        <section className="mb-16">
            <h2 className="text-3xl font-black text-zinc-900 text-center mb-10">{content.title}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {content.items?.map((item: any, i: number) => (
                    <div key={i} className="bg-zinc-50 rounded-3xl p-8 relative">
                        <Icons.Quote className={`w-10 h-10 ${theme.text} opacity-20 absolute top-6 right-6`} />
                        <p className="text-lg text-zinc-700 font-medium italic mb-6 relative z-10">"{item.content}"</p>
                        <div className="flex items-center gap-4 mt-auto">
                            <div className={`w-12 h-12 rounded-full ${theme.bgLight} ${theme.text} flex items-center justify-center font-bold text-xl`}>
                                {item.name.charAt(0)}
                            </div>
                            <div>
                                <h4 className="font-bold text-zinc-900 leading-tight">{item.name}</h4>
                                <p className="text-sm text-zinc-500">{item.role}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export const FAQBlock = ({ content, themeColor }: any) => {
    return (
        <section className="mb-16 max-w-3xl mx-auto">
            <h2 className="text-3xl font-black text-zinc-900 text-center mb-10">{content.title}</h2>
            <div className="space-y-4">
                {content.items?.map((item: any, i: number) => (
                    <div key={i} className="bg-white border border-zinc-100 rounded-2xl p-6 shadow-sm">
                        <h4 className="font-bold text-lg text-zinc-900 mb-2">{item.question}</h4>
                        <p className="text-zinc-600 font-medium leading-relaxed">{item.answer}</p>
                    </div>
                ))}
            </div>
        </section>
    );
};

export const TextBlock = ({ content, themeColor }: any) => {
    return (
        <section className="mb-16 max-w-4xl mx-auto bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-zinc-100">
            {content.title && <h2 className="text-3xl font-black text-zinc-900 mb-6">{content.title}</h2>}
            <div className="prose prose-zinc prose-lg max-w-none">
                {content.content?.split('\n').map((paragraph: string, i: number) => (
                    paragraph.trim() ? <p key={i}>{paragraph}</p> : <br key={i} />
                ))}
            </div>
        </section>
    );
};

export const BlocksRenderer = ({ blocks, themeColor }: { blocks: any[], themeColor: string }) => {
    return (
        <div className="w-full max-w-6xl mx-auto px-4 mt-8 pb-12">
            {blocks.map((block, idx) => {
                switch(block.type) {
                    case 'Hero': return <HeroBlock key={idx} content={block.content} themeColor={themeColor} />;
                    case 'Features': return <FeaturesBlock key={idx} content={block.content} themeColor={themeColor} />;
                    case 'Products': return <ProductsBlock key={idx} content={block.content} themeColor={themeColor} />;
                    case 'Gallery': return <GalleryBlock key={idx} content={block.content} themeColor={themeColor} />;
                    case 'Testimonials': return <TestimonialsBlock key={idx} content={block.content} themeColor={themeColor} />;
                    case 'FAQ': return <FAQBlock key={idx} content={block.content} themeColor={themeColor} />;
                    case 'Text': return <TextBlock key={idx} content={block.content} themeColor={themeColor} />;
                    case 'CTA': return <CTABlock key={idx} content={block.content} themeColor={themeColor} />;
                    default: return null;
                }
            })}
        </div>
    );
};
