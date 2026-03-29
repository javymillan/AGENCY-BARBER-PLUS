import React from 'react';
import { Tag } from 'lucide-react';
import { ServicePromotion, Service } from '../types';

interface PromotionsSectionProps {
    promotions: ServicePromotion[];
    services: Service[];
    onSelectPromotion: (serviceId: string, promotionId?: string) => void;
}

export function PromotionsSection({ promotions, services, onSelectPromotion }: PromotionsSectionProps) {
    if (promotions.length === 0) return null;

    return (
        <div className="mb-12 animate-fadeIn">
            <div className="flex items-center gap-3 mb-10 justify-center">
                <div className="p-3 bg-brand/10 rounded-2xl border border-brand/20">
                    <Tag className="w-8 h-8 text-brand" />
                </div>
                <h2 className="text-4xl font-black text-white tracking-tight uppercase italic">OFERTAS EXCLUSIVAS</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {promotions.map((promo) => {
                    const service = services.find(s => s.id === promo.service_id);
                    if (!service) return null;

                    const discountText = promo.discount_type === 'percentage'
                        ? `${promo.discount_value}% OFF`
                        : `$${promo.discount_value} de descuento`;

                    const finalPrice = promo.discount_type === 'percentage'
                        ? service.price * (1 - promo.discount_value / 100)
                        : service.price - promo.discount_value;

                    return (
                        <div
                            key={promo.id}
                            onClick={() => onSelectPromotion(promo.service_id, promo.id)}
                            className="bg-brand-card border border-brand/20 backdrop-blur-xl rounded-3xl p-8 cursor-pointer hover:border-brand/60 transition-all duration-500 transform hover:-translate-y-2 shadow-2xl relative overflow-hidden group"
                        >
                            {/* Decorative Brand Accent */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 rounded-full blur-3xl -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity" />

                            <div className="absolute top-4 right-4 bg-brand text-brand-text text-[10px] font-black px-3 py-1.5 rounded-full tracking-[0.2em] uppercase shadow-lg shadow-brand/20 z-10">
                                OFERTA
                            </div>

                            <h3 className="text-2xl font-black text-white mb-2 group-hover:text-brand transition-colors tracking-tight uppercase">
                                {promo.name}
                            </h3>

                            <div className="text-white/60 font-medium text-lg mb-6 flex items-center gap-2">
                                <span className="w-1 h-4 bg-brand/40 rounded-full" />
                                {service.name}
                            </div>

                            <div className="flex items-center gap-3 mb-8">
                                <div className="p-2 bg-green-500/10 rounded-lg border border-green-500/20">
                                    <Tag className="w-5 h-5 text-green-500" />
                                </div>
                                <span className="text-green-400 font-bold text-xl tracking-tight">
                                    {discountText}
                                </span>
                            </div>

                            <div className="mt-4 pt-6 border-t border-white/5 flex justify-between items-end">
                                <div className="space-y-1">
                                    <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold">Precio Regular</p>
                                    <div className="text-lg line-through text-white/20 font-medium">
                                        ${service.price}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] uppercase tracking-widest text-brand font-bold">Precio Especial</p>
                                    <div className="text-4xl font-black text-white tracking-tighter">
                                        ${finalPrice}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
