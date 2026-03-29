import React, { useState, useEffect } from 'react';
import { Service, ServicePromotion } from '../../../types';
import { supabase } from '../../../lib/supabase';
import { toast } from 'react-toastify';
import { X, Plus, Trash2, Edit, Check } from 'lucide-react';

interface PromotionModalProps {
    service: Service;
    onClose: () => void;
    onUpdate: () => void;
}

const DAYS = [
    { id: 1, label: 'Lunes' },
    { id: 2, label: 'Martes' },
    { id: 3, label: 'Miércoles' },
    { id: 4, label: 'Jueves' },
    { id: 5, label: 'Viernes' },
    { id: 6, label: 'Sábado' },
    { id: 0, label: 'Domingo' },
];

const PromotionModal: React.FC<PromotionModalProps> = ({ service, onClose, onUpdate }) => {
    const [promotions, setPromotions] = useState<ServicePromotion[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    const [newPromotion, setNewPromotion] = useState<Partial<ServicePromotion>>({
        name: '',
        discount_type: 'percentage',
        discount_value: 0,
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
        days_of_week: [],
        active: true
    });

    useEffect(() => {
        fetchPromotions();
    }, [service.id]);

    const fetchPromotions = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('service_promotions')
                .select('*')
                .eq('service_id', service.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setPromotions(data || []);
        } catch (error) {
            console.error('Error fetching promotions:', error);
            toast.error('Error al cargar promociones');
        } finally {
            setLoading(false);
        }
    };

    const handleDayToggle = (dayId: number) => {
        setNewPromotion(prev => {
            const currentDays = prev.days_of_week || [];
            const newDays = currentDays.includes(dayId)
                ? currentDays.filter(d => d !== dayId)
                : [...currentDays, dayId];
            return { ...prev, days_of_week: newDays };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPromotion.name || !newPromotion.discount_value || !newPromotion.start_date || !newPromotion.end_date) {
            toast.error('Por favor completa todos los campos requeridos');
            return;
        }

        try {
            let error;

            if (editingId) {
                // Update existing
                const { error: updateError } = await supabase
                    .from('service_promotions')
                    .update({ ...newPromotion, service_id: service.id })
                    .eq('id', editingId);
                error = updateError;
            } else {
                // Insert new
                const { error: insertError } = await supabase
                    .from('service_promotions')
                    .insert([{ ...newPromotion, service_id: service.id }]);
                error = insertError;
            }

            if (error) throw error;

            toast.success(editingId ? 'Promoción actualizada con éxito' : 'Promoción creada exitosamente');
            handleCancel(); // Reset and close form
            fetchPromotions();
            onUpdate(); // Refresh parent
        } catch (error) {
            console.error('Error saving promotion:', error);
            toast.error(editingId ? 'Error al actualizar promoción' : 'Error al crear promoción');
        }
    };

    const handleEdit = (promo: ServicePromotion) => {
        setEditingId(promo.id);
        setNewPromotion({
            name: promo.name,
            discount_type: promo.discount_type,
            discount_value: promo.discount_value,
            start_date: promo.start_date,
            end_date: promo.end_date,
            days_of_week: promo.days_of_week,
            active: promo.active
        });
        setShowForm(true);
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingId(null);
        setNewPromotion({
            name: '',
            discount_type: 'percentage',
            discount_value: 0,
            start_date: new Date().toISOString().split('T')[0],
            end_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
            days_of_week: [],
            active: true
        });
    };

    const handleDeleteClick = (id: string) => {
        setDeleteConfirmId(id);
    };

    const confirmDelete = async (id: string) => {
        try {
            const { error } = await supabase
                .from('service_promotions')
                .delete()
                .eq('id', id);

            if (error) throw error;

            toast.success('Promoción eliminada');
            setDeleteConfirmId(null);
            fetchPromotions();
            onUpdate();
        } catch (error) {
            console.error('Error deleting promotion:', error);
            toast.error('Error al eliminar promoción');
        }
    };

    const getDaysLabel = (days: number[]) => {
        if (!days || days.length === 0) return 'Todos los días';
        if (days.length === 7) return 'Todos los días';
        return days.map(d => DAYS.find(day => day.id === d)?.label).join(', ');
    };

    return (
        <div className="modal-overlay">
            <div className="modal-container" style={{ maxWidth: '600px' }}>
                <div className="modal-header">
                    <h3>Promociones: {service.name}</h3>
                    <button className="close-button" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <div className="modal-body" style={{ padding: '1.5rem', maxHeight: '70vh', overflowY: 'auto' }}>
                    {!showForm && (
                        <div className="mb-4">
                            <button
                                className="btn btn-primary w-full flex items-center justify-center gap-2"
                                onClick={() => {
                                    handleCancel(); // Ensure reset
                                    setShowForm(true);
                                }}
                            >
                                <Plus size={18} /> Nueva Promoción
                            </button>
                        </div>
                    )}

                    {showForm && (
                        <form onSubmit={handleSubmit} className="promotion-form bg-slate-800 p-4 rounded-lg mb-6 border border-slate-700">
                            <h4 className="mb-3 font-semibold text-lg text-white">
                                {editingId ? 'Editar Promoción' : 'Nueva Promoción'}
                            </h4>

                            <div className="form-group mb-3">
                                <label className="block text-sm font-medium text-gray-300 mb-1">Nombre (ej: Miércoles 2x1)</label>
                                <input
                                    type="text"
                                    className="w-full bg-slate-700 border border-slate-600 rounded p-2 text-white"
                                    value={newPromotion.name}
                                    onChange={e => setNewPromotion({ ...newPromotion, name: e.target.value })}
                                    placeholder="Oferta de verano"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-3">
                                <div className="form-group">
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Tipo Descuento</label>
                                    <select
                                        className="w-full bg-slate-700 border border-slate-600 rounded p-2 text-white"
                                        value={newPromotion.discount_type}
                                        onChange={e => setNewPromotion({ ...newPromotion, discount_type: e.target.value as any })}
                                    >
                                        <option value="percentage">Porcentaje (%)</option>
                                        <option value="fixed_amount">Monto Fijo ($)</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Valor</label>
                                    <input
                                        type="number"
                                        className="w-full bg-slate-700 border border-slate-600 rounded p-2 text-white"
                                        value={newPromotion.discount_value}
                                        onChange={e => setNewPromotion({ ...newPromotion, discount_value: Number(e.target.value) })}
                                        min="0"
                                        required
                                    />
                                    {newPromotion.discount_type === 'percentage' && (newPromotion.discount_value || 0) > 0 && (
                                        <span className="text-xs text-green-400 mt-1 block">
                                            Precio final: ${(service.price * (1 - (newPromotion.discount_value || 0) / 100)).toFixed(2)}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-3">
                                <div className="form-group">
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Fecha Inicio</label>
                                    <input
                                        type="date"
                                        className="w-full bg-slate-700 border border-slate-600 rounded p-2 text-white"
                                        value={newPromotion.start_date}
                                        onChange={e => setNewPromotion({ ...newPromotion, start_date: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Fecha Fin</label>
                                    <input
                                        type="date"
                                        className="w-full bg-slate-700 border border-slate-600 rounded p-2 text-white"
                                        value={newPromotion.end_date}
                                        onChange={e => setNewPromotion({ ...newPromotion, end_date: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group mb-4">
                                <label className="block text-sm font-medium text-gray-300 mb-2">Días Aplicables</label>
                                <div className="flex flex-wrap gap-2">
                                    {DAYS.map(day => {
                                        const isSelected = (newPromotion.days_of_week || []).includes(day.id);
                                        return (
                                            <button
                                                key={day.id}
                                                type="button"
                                                className={`px-3 py-2 text-sm rounded-md border flex items-center gap-2 transition-all duration-200 ${isSelected
                                                    ? 'bg-blue-600 border-blue-500 text-white shadow-lg scale-105 font-medium'
                                                    : 'bg-slate-700 border-slate-600 text-gray-300 hover:bg-slate-600'
                                                    }`}
                                                onClick={() => handleDayToggle(day.id)}
                                            >
                                                {isSelected && <Check size={14} />}
                                                {day.label}
                                            </button>
                                        );
                                    })}
                                </div>
                                <p className="text-xs text-gray-400 mt-1">
                                    {(newPromotion.days_of_week || []).length === 0 ? 'Aplica todos los días' : 'Solo días seleccionados'}
                                </p>
                            </div>

                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    className="btn btn-secondary btn-sm"
                                    onClick={handleCancel}
                                >
                                    Cancelar
                                </button>
                                <button type="submit" className="btn btn-primary btn-sm">
                                    {editingId ? 'Actualizar' : 'Guardar'} Promoción
                                </button>
                            </div>
                        </form>
                    )}

                    <div className="promotions-list space-y-3">
                        <h4 className="font-medium text-gray-300 border-b border-gray-700 pb-2">Promociones Activas</h4>
                        {loading ? (
                            <p className="text-center text-gray-500 py-4">Cargando...</p>
                        ) : promotions.length === 0 ? (
                            <p className="text-center text-gray-500 py-4 bg-slate-800 rounded">No hay promociones activas</p>
                        ) : (
                            promotions.map(promo => (
                                <div key={promo.id} className="bg-slate-700 rounded p-3 border border-slate-600 flex justify-between items-center">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h5 className="font-bold text-white">{promo.name}</h5>
                                            {!promo.active && <span className="bg-red-500 text-white text-[10px] px-1 rounded">Inactivo</span>}
                                        </div>
                                        <p className="text-sm text-green-400 font-medium">
                                            {promo.discount_type === 'percentage' ? `-${promo.discount_value}%` : `-$${promo.discount_value}`}
                                            <span className="text-gray-400 ml-1 font-normal">
                                                (${(service.price - (promo.discount_type === 'percentage' ? service.price * (promo.discount_value / 100) : promo.discount_value)).toFixed(2)})
                                            </span>
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            📅 {new Date(promo.start_date).toLocaleDateString()} - {new Date(promo.end_date).toLocaleDateString()}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            🕒 {getDaysLabel(promo.days_of_week)}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleEdit(promo)}
                                        className="text-blue-400 hover:text-blue-300 p-2"
                                        title="Editar"
                                    >
                                        <Edit size={18} />
                                    </button>

                                    {deleteConfirmId === promo.id ? (
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => confirmDelete(promo.id)}
                                                className="text-red-500 hover:text-red-400 text-xs font-bold px-2 py-1 bg-red-900/30 rounded"
                                            >
                                                Confirmar
                                            </button>
                                            <button
                                                onClick={() => setDeleteConfirmId(null)}
                                                className="text-gray-400 hover:text-gray-300 p-1"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => handleDeleteClick(promo.id)}
                                            className="text-red-400 hover:text-red-300 p-2"
                                            title="Eliminar"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PromotionModal;
