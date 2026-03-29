import React, { useState } from 'react';
import { Service } from '../../../types';
import { Plus, Tag } from 'lucide-react';
import PromotionModal from './PromotionModal';

interface ServiceManagementProps {
  services: Service[];
  onAddService: (service: Omit<Service, 'id'>) => Promise<void>;
  onUpdateService: (service: Service) => Promise<void>;
  onDeleteService: (serviceId: string) => Promise<void>;
  isAdminAuthenticated: boolean; // Mantenemos el prop pero no lo usamos para restricciones
}

const ServiceManagement: React.FC<ServiceManagementProps> = ({
  services,
  onAddService,
  onUpdateService,
  onDeleteService,
  isAdminAuthenticated // No se usa para restricciones
}) => {
  const [showNewServiceModal, setShowNewServiceModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [newService, setNewService] = useState({
    name: '',
    description: '',
    price: 0,
    duration: 30,
    active: true
  });

  const [showPromotionModal, setShowPromotionModal] = useState(false);
  const [selectedServiceForPromotion, setSelectedServiceForPromotion] = useState<Service | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (editingService) {
      setEditingService({
        ...editingService,
        [name]: type === 'number' ? Number(value) : value,
        active: name === 'active' ? value === 'true' : editingService.active
      });
    } else {
      setNewService({
        ...newService,
        [name]: type === 'number' ? Number(value) : value,
        active: name === 'active' ? value === 'true' : newService.active
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingService) {
      await onUpdateService(editingService);
      setEditingService(null);
    } else {
      await onAddService(newService);
      setNewService({
        name: '',
        description: '',
        price: 0,
        duration: 30,
        active: true
      });
      setShowNewServiceModal(false);
    }
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setShowNewServiceModal(true);
  };

  const handleDelete = async (serviceId: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este servicio?')) {
      await onDeleteService(serviceId);
    }
  };

  const handleManagePromotions = (service: Service) => {
    setSelectedServiceForPromotion(service);
    setShowPromotionModal(true);
  };

  return (
    <div className="service-management-container">
      <div className="services-header">
        <h2>Servicios</h2>
        {/* Botón disponible para TODOS los usuarios */}
        <button
          className="btn btn-primary add-service-btn"
          onClick={() => {
            setEditingService(null);
            setShowNewServiceModal(true);
          }}
        >
          <Plus size={16} />
          Agregar Servicio
        </button>
      </div>

      <div className="services-list">
        {services.map(service => (
          <div key={service.id} className={`service-card ${!service.active ? 'inactive' : ''}`}>
            <div className="service-info">
              <div className="flex items-center gap-2">
                <h3 className="service-name">{service.name}</h3>
                {service.promotions && service.promotions.filter(p => p.active).length > 0 && (
                  <span className="bg-green-600 text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Tag size={10} />
                    {service.promotions.filter(p => p.active).length} Oferta(s)
                  </span>
                )}
              </div>
              <p className="service-description">{service.description}</p>
              <div className="service-details">
                <span className="service-price">${service.price}</span>
                <span className="service-duration">{service.duration} min</span>
                {!service.active && <span className="service-inactive-badge">Inactivo</span>}
              </div>
            </div>
            <div className="service-actions">
              <button
                className="btn btn-sm btn-outline-primary"
                onClick={() => handleEdit(service)}
              >
                Editar
              </button>
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => handleManagePromotions(service)}
                title="Administrar Promociones"
              >
                <Tag size={16} />
              </button>
              <button
                className="btn btn-sm btn-outline-danger"
                onClick={() => handleDelete(service.id)}
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {showNewServiceModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingService ? 'Editar Servicio' : 'Nuevo Servicio'}</h3>
              <button
                className="close-button"
                onClick={() => {
                  setShowNewServiceModal(false);
                  setEditingService(null);
                }}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Nombre:</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={editingService ? editingService.name : newService.name}
                  onChange={handleInputChange}
                  required
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Descripción:</label>
                <textarea
                  id="description"
                  name="description"
                  value={editingService ? editingService.description : newService.description}
                  onChange={handleInputChange}
                  className="form-control"
                  rows={3}
                ></textarea>
              </div>

              <div className="form-group">
                <label htmlFor="price">Precio:</label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={editingService ? editingService.price : newService.price}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.01"
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label htmlFor="duration">Duración (minutos):</label>
                <input
                  type="number"
                  id="duration"
                  name="duration"
                  value={editingService ? editingService.duration : newService.duration}
                  onChange={handleInputChange}
                  required
                  min="5"
                  step="5"
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label htmlFor="active">Estado:</label>
                <select
                  id="active"
                  name="active"
                  value={editingService ? (editingService.active ? 'true' : 'false') : (newService.active ? 'true' : 'false')}
                  onChange={handleInputChange}
                  className="form-control"
                >
                  <option value="true">Activo</option>
                  <option value="false">Inactivo</option>
                </select>
              </div>

              <button type="submit" className="btn btn-primary">
                {editingService ? 'Actualizar' : 'Agregar'}
              </button>
            </form>
          </div>
        </div>
      )}

      {showPromotionModal && selectedServiceForPromotion && (
        <PromotionModal
          service={selectedServiceForPromotion}
          onClose={() => {
            setShowPromotionModal(false);
            setSelectedServiceForPromotion(null);
          }}
          onUpdate={() => {
            // Recargar servicios? El context ya lo maneja pero tal vez deberíamos forzar update
            // O mejor aún, pasamos una función que actualice el servicio localmente
            window.location.reload(); // Simple refresh to show changes for now or use Context refresh
          }}
        />
      )}
    </div>
  );
};

export default ServiceManagement;
