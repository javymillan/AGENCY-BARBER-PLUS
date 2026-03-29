import React from 'react';
import { Service } from '../../../types';
import { Clock, DollarSign, Tag } from 'lucide-react';
import { calculateServicePrice } from '../../../lib/promotions';

interface ServiceSelectorProps {
  services: Service[];
  onServiceSelect: (service: Service) => void;
  selectedService: Service | null;
}

const ServiceSelector: React.FC<ServiceSelectorProps> = ({
  services,
  onServiceSelect,
  selectedService
}) => {
  return (
    <div className="service-selector">
      <h3>Selecciona el servicio que deseas</h3>

      <div className="services-grid">
        {services.map(service => (
          <div
            key={service.id}
            className={`service-option ${selectedService?.id === service.id ? 'selected' : ''}`}
            onClick={() => onServiceSelect(service)}
          >
            <div className="service-header">
              <h4>{service.name}</h4>
            </div>

            {service.description && (
              <p className="service-description">{service.description}</p>
            )}

            <div className="service-details">
              <div className="service-detail">
                <Clock size={16} />
                <span>{service.duration} min</span>
              </div>
              <div className="service-detail">
                <DollarSign size={16} />
                {(() => {
                  const { finalPrice, originalPrice, discountApplied } = calculateServicePrice(service);
                  if (discountApplied) {
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: '1.2' }}>
                        <span style={{ textDecoration: 'line-through', fontSize: '0.8em', opacity: 0.7 }}>${originalPrice}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ color: 'var(--success-color)', fontWeight: 'bold' }}>${finalPrice}</span>
                          <span style={{
                            backgroundColor: 'var(--success-color)',
                            color: 'white',
                            fontSize: '0.7em',
                            padding: '2px 6px',
                            borderRadius: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '2px'
                          }}>
                            <Tag size={10} />
                            Oferta
                          </span>
                        </div>
                      </div>
                    );
                  }
                  return <span>${service.price}</span>;
                })()}
              </div>
            </div>

            <button className="select-service-btn">
              Seleccionar
            </button>
          </div>
        ))}
      </div>

      {services.length === 0 && (
        <div className="no-services">
          <p>No hay servicios disponibles en este momento.</p>
        </div>
      )}
    </div>
  );
};

export default ServiceSelector;
