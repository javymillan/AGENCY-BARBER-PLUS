import React, { useState, useEffect } from 'react';
import { useLoyalty } from '../../../contexts/LoyaltyContext';
import { toast } from 'react-toastify';

interface LoyaltyRewardsManagerProps {
  isAdminAuthenticated: boolean;
}

const LoyaltyRewardsManager: React.FC<LoyaltyRewardsManagerProps> = ({ isAdminAuthenticated }) => {
  const { 
    loyaltyRewards, 
    loyaltyRedemptions,
    loading, 
    error, 
    createReward,
    updateReward,
    deleteReward
  } = useLoyalty();

  const [showForm, setShowForm] = useState(false);
  const [selectedReward, setSelectedReward] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    points_required: 50,
    reward_type: 'discount',
    discount_percentage: 10,
    service_id: '',
    active: true
  });

  // Resetear formulario
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      points_required: 50,
      reward_type: 'discount',
      discount_percentage: 10,
      service_id: '',
      active: true
    });
    setSelectedReward(null);
  };

  // Cargar datos de recompensa seleccionada
  useEffect(() => {
    if (selectedReward) {
      const reward = loyaltyRewards.find(r => r.id === selectedReward);
      if (reward) {
        setFormData({
          name: reward.name,
          description: reward.description || '',
          points_required: reward.points_required,
          reward_type: reward.reward_type,
          discount_percentage: reward.discount_percentage || 0,
          service_id: reward.service_id || '',
          active: reward.active
        });
        setShowForm(true);
      }
    }
  }, [selectedReward, loyaltyRewards]);

  // Manejar cambios en el formulario
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const target = e.target as HTMLInputElement;
      setFormData(prev => ({ ...prev, [name]: target.checked }));
    } else if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: parseInt(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Enviar formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Preparar los datos para envío, manejando correctamente el service_id
      const submitData = {
        ...formData,
        // Si el tipo de recompensa no es 'free_service' o service_id está vacío, enviamos null
        service_id: formData.reward_type === 'free_service' && formData.service_id.trim() !== '' 
          ? formData.service_id 
          : null
      };

      if (selectedReward) {
        // Actualizar recompensa existente
        await updateReward(selectedReward, submitData);
        toast.success('Recompensa actualizada correctamente');
      } else {
        // Crear nueva recompensa
        await createReward(submitData);
        toast.success('Recompensa creada correctamente');
      }
      
      resetForm();
      setShowForm(false);
    } catch (error) {
      console.error('Error al guardar recompensa:', error);
      toast.error('Error al guardar la recompensa');
    }
  };

  // Eliminar recompensa
  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta recompensa?')) {
      try {
        await deleteReward(id);
        toast.success('Recompensa eliminada correctamente');
      } catch (error) {
        console.error('Error al eliminar recompensa:', error);
        toast.error('Error al eliminar la recompensa');
      }
    }
  };

  // Contar canjes por recompensa
  const getRedemptionCount = (rewardId: string) => {
    return loyaltyRedemptions.filter(r => r.reward_id === rewardId).length;
  };

  if (loading) {
    return <div className="loading">Cargando recompensas...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  return (
    <div className="loyalty-rewards-manager">
      <h2>Gestión de Recompensas</h2>
      
      <div className="rewards-actions">
        <button 
          className="btn btn-primary" 
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
        >
          {showForm ? 'Cancelar' : 'Nueva Recompensa'}
        </button>
      </div>

      {showForm && (
        <div className="reward-form-container">
          <form onSubmit={handleSubmit} className="reward-form">
            <div className="form-group">
              <label htmlFor="name">Nombre de la Recompensa</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Descripción</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
              />
            </div>

            <div className="form-group">
              <label htmlFor="points_required">Puntos Requeridos</label>
              <input
                type="number"
                id="points_required"
                name="points_required"
                value={formData.points_required}
                onChange={handleChange}
                min="1"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="reward_type">Tipo de Recompensa</label>
              <select
                id="reward_type"
                name="reward_type"
                value={formData.reward_type}
                onChange={handleChange}
                required
              >
                <option value="discount">Descuento</option>
                <option value="free_service">Servicio Gratis</option>
                <option value="product">Producto</option>
              </select>
            </div>

            {formData.reward_type === 'discount' && (
              <div className="form-group">
                <label htmlFor="discount_percentage">Porcentaje de Descuento</label>
                <input
                  type="number"
                  id="discount_percentage"
                  name="discount_percentage"
                  value={formData.discount_percentage}
                  onChange={handleChange}
                  min="1"
                  max="100"
                  required
                />
              </div>
            )}

            {formData.reward_type === 'free_service' && (
              <div className="form-group">
                <label htmlFor="service_id">Servicio</label>
                <input
                  type="text"
                  id="service_id"
                  name="service_id"
                  value={formData.service_id}
                  onChange={handleChange}
                  required
                />
              </div>
            )}

            <div className="form-group checkbox">
              <label>
                <input
                  type="checkbox"
                  name="active"
                  checked={formData.active}
                  onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                />
                Activa
              </label>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-success">
                {selectedReward ? 'Actualizar' : 'Crear'} Recompensa
              </button>
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => {
                  resetForm();
                  setShowForm(false);
                }}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="rewards-list">
        <h3>Recompensas Disponibles</h3>
        {loyaltyRewards.length > 0 ? (
          loyaltyRewards.map(reward => (
            <div key={reward.id} className={`reward-card ${!reward.active ? 'inactive' : ''}`}>
              <div className="reward-info">
                <h4>{reward.name}</h4>
                {reward.description && <p>{reward.description}</p>}
                <p className="points">Puntos necesarios: <span>{reward.points_required}</span></p>
                <p>
                  Tipo: {
                    reward.reward_type === 'discount' ? `Descuento del ${reward.discount_percentage}%` :
                    reward.reward_type === 'free_service' ? 'Servicio Gratis' :
                    'Producto'
                  }
                </p>
                <p>Canjes realizados: {getRedemptionCount(reward.id)}</p>
                <p className="status">Estado: {reward.active ? 'Activa' : 'Inactiva'}</p>
              </div>
              <div className="reward-actions">
                <button 
                  className="btn btn-secondary"
                  onClick={() => setSelectedReward(reward.id)}
                >
                  Editar
                </button>
                <button 
                  className="btn btn-danger"
                  onClick={() => handleDelete(reward.id)}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="no-data">No hay recompensas disponibles</p>
        )}
      </div>

      <div className="redemptions-list">
        <h3>Últimos Canjes Realizados</h3>
        {loyaltyRedemptions.length > 0 ? (
          loyaltyRedemptions.slice(0, 10).map(redemption => {
            const reward = loyaltyRewards.find(r => r.id === redemption.reward_id);
            return (
              <div key={redemption.id} className="redemption-card">
                <p>Cliente: {redemption.client_phone}</p>
                <p>Recompensa: {reward?.name || 'Desconocida'}</p>
                <p>Puntos utilizados: {redemption.points_used}</p>
                <p>Estado: {
                  redemption.status === 'active' ? 'Activo' :
                  redemption.status === 'used' ? 'Utilizado' : 'Expirado'
                }</p>
              </div>
            );
          })
        ) : (
          <p className="no-data">No hay canjes realizados</p>
        )}
      </div>
    </div>
  );
};

export default LoyaltyRewardsManager;
