import React, { useState } from 'react';
import { User, Phone, Mail, MessageSquare } from 'lucide-react';

interface ClientData {
  name: string;
  phone: string;
  email: string;
  notes: string;
}

interface ClientFormProps {
  initialData: ClientData;
  onSubmit: (data: ClientData) => void;
}

const ClientForm: React.FC<ClientFormProps> = ({ initialData, onSubmit }) => {
  const [formData, setFormData] = useState<ClientData>(initialData);
  const [errors, setErrors] = useState<Partial<ClientData>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    let processedValue = value;
    
    // Procesar el teléfono para mostrar solo los 10 dígitos al usuario
    if (name === 'phone') {
      // Remover cualquier carácter que no sea número
      const digitsOnly = value.replace(/\D/g, '');
      
      // Limitar a 10 dígitos
      if (digitsOnly.length <= 10) {
        processedValue = digitsOnly;
      } else {
        // Si ya tiene 10 dígitos, no permitir más
        return;
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));
    
    // Limpiar error cuando el usuario empiece a escribir
    if (errors[name as keyof ClientData]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<ClientData> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'El teléfono es requerido';
    } else {
      // Validar que tenga exactamente 10 dígitos
      const digitsOnly = formData.phone.replace(/\D/g, '');
      if (digitsOnly.length !== 10) {
        newErrors.phone = 'El teléfono debe tener 10 dígitos';
      }
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Formato de email inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Agregar el prefijo +52 al teléfono antes de enviar
      const processedData = {
        ...formData,
        phone: `+52${formData.phone.replace(/\D/g, '')}`
      };
      
      onSubmit(processedData);
    }
  };

  return (
    <div className="client-form">
      <h3>Ingresa tus datos</h3>
      <p className="form-description">
        Necesitamos algunos datos para confirmar tu cita
      </p>

      <form onSubmit={handleSubmit} className="booking-form">
        <div className="form-group">
          <label htmlFor="name">
            <User size={16} />
            Nombre completo *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className={errors.name ? 'error' : ''}
            placeholder="Tu nombre completo"
            required
          />
          {errors.name && <span className="error-message">{errors.name}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="phone">
            <Phone size={16} />
            Teléfono (10 dígitos) *
          </label>
          <div className="phone-input-container">
            <span className="phone-prefix">+52</span>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className={errors.phone ? 'error' : ''}
              placeholder="1234567890"
              maxLength={10}
              pattern="[0-9]{10}"
              required
            />
          </div>
          {errors.phone && <span className="error-message">{errors.phone}</span>}
          <small className="input-help">
            Ingresa solo los 10 dígitos de tu número telefónico
          </small>
        </div>

        <div className="form-group">
          <label htmlFor="email">
            <Mail size={16} />
            Email (opcional)
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className={errors.email ? 'error' : ''}
            placeholder="tu@email.com"
          />
          {errors.email && <span className="error-message">{errors.email}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="notes">
            <MessageSquare size={16} />
            Notas adicionales (opcional)
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            placeholder="Alguna información adicional que quieras compartir..."
            rows={3}
          />
        </div>

        <button type="submit" className="continue-btn">
          Continuar
        </button>
      </form>
    </div>
  );
};

export default ClientForm;
