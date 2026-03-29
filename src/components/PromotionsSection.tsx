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
            <div className="flex items-center gap-2 mb-6 justify-center">
                <Tag className="w-8 h-8 text-primary" />
                <h2 className="text-3xl font-bold text-default text-center">Ofertas Especiales</h2>
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
                            className="bg-gradient-to-br from-accent to-accent/50 border border-primary/20 rounded-xl p-6 cursor-pointer hover:border-primary transition-all duration-300 transform hover:-translate-y-1 shadow-lg relative overflow-hidden group"
                        >
                            <div className="absolute top-0 right-0 bg-primary text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                                OFERTA
                            </div>

                            <h3 className="text-xl font-bold text-primary mb-2 group-hover:text-primary-hover transition-colors">
                                {promo.name}
                            </h3>

                            <div className="text-default font-medium text-lg mb-4">
                                {service.name}
                            </div>

                            <div className="flex flex-col gap-2 text-sm text-secondary">
                                <div className="flex items-center gap-2">
                                    <Tag className="w-4 h-4" />
                                    <span className="text-green-400 font-bold text-lg">
                                        {discountText}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-default/10 flex justify-between items-center">
                                <div className="text-sm line-through text-secondary">
                                    ${service.price}
                                </div>
                                <div className="text-2xl font-bold text-default">
                                    ${finalPrice}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
