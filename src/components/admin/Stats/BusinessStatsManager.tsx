import React, { useState, useEffect } from 'react';
import { useStats } from '../../../contexts/StatsContext';
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, subYears } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'react-toastify';
import './BusinessStatsManager.css';

// Importamos Chart.js para los gráficos
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js';
import { Bar, Pie, Line, Doughnut } from 'react-chartjs-2';

// Registramos los componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

interface BusinessStatsManagerProps {
  isAdminAuthenticated: boolean; // Mantenemos el prop pero no lo usamos para restricciones
}

interface ExtendedStats {
  // Resumen de Citas
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  pendingAppointments: number;
  completionRate: number;
  cancellationRate: number;
  
  // Métricas Financieras
  totalRevenue: number;
  previousPeriodRevenue: number;
  revenueGrowth: number;
  averageTicket: number;
  revenueByService: Array<{service: string, revenue: number}>;
  
  // Estadísticas Operativas
  topServices: Array<{name: string, count: number, percentage: number}>;
  peakHours: Array<{hour: string, count: number}>;
  dailyOccupancy: number;
  averageServiceTime: number;
  
  // Comparativas
  currentYearStats: any;
  previousYearStats: any;
}

const BusinessStatsManager: React.FC<BusinessStatsManagerProps> = ({ isAdminAuthenticated }) => {
  const { stats, loading, error, fetchStats, getRevenueByPeriod } = useStats();
  const [dateRange, setDateRange] = useState<'current' | 'last' | 'year' | 'custom'>('current');
  const [startDate, setStartDate] = useState<Date>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date>(endOfMonth(new Date()));
  const [extendedStats, setExtendedStats] = useState<ExtendedStats | null>(null);
  const [revenueData, setRevenueData] = useState<{day: number, week: number, month: number, year: number}>({day: 0, week: 0, month: 0, year: 0});

  // Cargar estadísticas al montar el componente o cambiar el rango de fechas
  useEffect(() => {
    loadStats();
  }, [dateRange, startDate, endDate]);

  // Cargar ingresos por período
  useEffect(() => {
    if (!loading) {
      loadRevenueByPeriod();
      calculateExtendedStats();
    }
  }, [loading, stats]);

  // Función para cargar estadísticas
  const loadStats = async () => {
    try {
      let start, end;
      
      if (dateRange === 'current') {
        start = startOfMonth(new Date());
        end = endOfMonth(new Date());
      } else if (dateRange === 'last') {
        const lastMonth = subMonths(new Date(), 1);
        start = startOfMonth(lastMonth);
        end = endOfMonth(lastMonth);
      } else if (dateRange === 'year') {
        start = startOfYear(new Date());
        end = endOfYear(new Date());
      } else {
        start = startDate;
        end = endDate;
      }
      
      await fetchStats(start, end);
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
      toast.error('Error al cargar las estadísticas');
    }
  };

  // Función para cargar ingresos por período
  const loadRevenueByPeriod = async () => {
    try {
      const day = await getRevenueByPeriod('day');
      const week = await getRevenueByPeriod('week');
      const month = await getRevenueByPeriod('month');
      const year = await getRevenueByPeriod('year');
      
      setRevenueData({ day, week, month, year });
    } catch (error) {
      console.error('Error al cargar ingresos por período:', error);
    }
  };

  // Función para calcular estadísticas extendidas
  const calculateExtendedStats = () => {
    if (!stats) return;

    const totalAppointments = stats.total_appointments;
    const completedAppointments = stats.completed_appointments;
    const pendingAppointments = stats.pending_appointments;
    const cancelledAppointments = totalAppointments - completedAppointments - pendingAppointments;
    
    const completionRate = totalAppointments > 0 ? (completedAppointments / totalAppointments) * 100 : 0;
    const cancellationRate = totalAppointments > 0 ? (cancelledAppointments / totalAppointments) * 100 : 0;
    
    const averageTicket = completedAppointments > 0 ? stats.total_revenue / completedAppointments : 0;
    
    // Simular datos adicionales (en una implementación real, estos vendrían de la base de datos)
    const peakHours = [
      { hour: '09:00', count: 15 },
      { hour: '10:00', count: 22 },
      { hour: '11:00', count: 18 },
      { hour: '14:00', count: 25 },
      { hour: '15:00', count: 30 },
      { hour: '16:00', count: 28 },
      { hour: '17:00', count: 20 }
    ];

    const revenueByService = stats.popular_services.map(service => ({
      service: service.service_name,
      revenue: service.count * 35 // Precio promedio estimado
    }));

    const extended: ExtendedStats = {
      totalAppointments,
      completedAppointments,
      cancelledAppointments,
      pendingAppointments,
      completionRate,
      cancellationRate,
      totalRevenue: stats.total_revenue,
      previousPeriodRevenue: stats.total_revenue * 0.85, // Simulado
      revenueGrowth: 15, // Simulado
      averageTicket,
      revenueByService,
      topServices: stats.popular_services.slice(0, 5),
      peakHours,
      dailyOccupancy: 75, // Simulado
      averageServiceTime: 45, // Simulado
      currentYearStats: stats,
      previousYearStats: null // Se calcularía con datos reales
    };

    setExtendedStats(extended);
  };

  // Función para manejar cambios en el rango de fechas
  const handleDateRangeChange = (range: 'current' | 'last' | 'year' | 'custom') => {
    setDateRange(range);
    
    if (range === 'current') {
      setStartDate(startOfMonth(new Date()));
      setEndDate(endOfMonth(new Date()));
    } else if (range === 'last') {
      const lastMonth = subMonths(new Date(), 1);
      setStartDate(startOfMonth(lastMonth));
      setEndDate(endOfMonth(lastMonth));
    } else if (range === 'year') {
      setStartDate(startOfYear(new Date()));
      setEndDate(endOfYear(new Date()));
    }
  };

  // Preparar datos para el gráfico de servicios populares
  const getPopularServicesChartData = () => {
    if (!extendedStats || !extendedStats.topServices || extendedStats.topServices.length === 0) {
      return {
        labels: [],
        datasets: [{
          data: [],
          backgroundColor: []
        }]
      };
    }

    const colors = [
      '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
      '#FF9F40', '#8AC249', '#EA526F', '#23B5D3', '#279AF1'
    ];

    return {
      labels: extendedStats.topServices.map(service => service.name),
      datasets: [{
        data: extendedStats.topServices.map(service => service.count),
        backgroundColor: extendedStats.topServices.map((_, index) => colors[index % colors.length]),
        borderWidth: 2,
        borderColor: '#fff'
      }]
    };
  };

  // Preparar datos para el gráfico de horarios pico
  const getPeakHoursChartData = () => {
    if (!extendedStats || !extendedStats.peakHours) {
      return {
        labels: [],
        datasets: [{
          data: [],
          backgroundColor: ''
        }]
      };
    }

    return {
      labels: extendedStats.peakHours.map(hour => hour.hour),
      datasets: [{
        label: 'Citas por Hora',
        data: extendedStats.peakHours.map(hour => hour.count),
        backgroundColor: 'rgba(79, 70, 229, 0.8)',
        borderColor: 'rgba(79, 70, 229, 1)',
        borderWidth: 2,
        borderRadius: 4
      }]
    };
  };

  // Preparar datos para el gráfico de ingresos por servicio
  const getRevenueByServiceChartData = () => {
    if (!extendedStats || !extendedStats.revenueByService) {
      return {
        labels: [],
        datasets: [{
          data: [],
          backgroundColor: []
        }]
      };
    }

    const colors = ['#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

    return {
      labels: extendedStats.revenueByService.map(item => item.service),
      datasets: [{
        data: extendedStats.revenueByService.map(item => item.revenue),
        backgroundColor: colors,
        borderWidth: 0
      }]
    };
  };

  // Preparar datos para el gráfico de tendencias mensuales
  const getMonthlyTrendsData = () => {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const currentYearData = [1200, 1350, 1100, 1450, 1600, 1750, 1900, 1800, 1650, 1700, 1850, 2000];
    const previousYearData = [1000, 1150, 950, 1250, 1400, 1500, 1650, 1550, 1400, 1450, 1600, 1750];

    return {
      labels: months,
      datasets: [
        {
          label: '2024',
          data: currentYearData,
          borderColor: 'rgba(79, 70, 229, 1)',
          backgroundColor: 'rgba(79, 70, 229, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4
        },
        {
          label: '2023',
          data: previousYearData,
          borderColor: 'rgba(156, 163, 175, 1)',
          backgroundColor: 'rgba(156, 163, 175, 0.1)',
          borderWidth: 2,
          fill: false,
          tension: 0.4
        }
      ]
    };
  };

  if (loading) {
    return <div className="loading">Cargando estadísticas...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  return (
    <div className="business-stats-manager">
      <h1>Dashboard de Estadísticas</h1>
      
      <div className="date-range-selector">
        <button 
          className={`btn ${dateRange === 'current' ? 'btn-primary' : 'btn-outline-primary'}`}
          onClick={() => handleDateRangeChange('current')}
        >
          Mes Actual
        </button>
        <button 
          className={`btn ${dateRange === 'last' ? 'btn-primary' : 'btn-outline-primary'}`}
          onClick={() => handleDateRangeChange('last')}
        >
          Mes Anterior
        </button>
        <button 
          className={`btn ${dateRange === 'year' ? 'btn-primary' : 'btn-outline-primary'}`}
          onClick={() => handleDateRangeChange('year')}
        >
          Año Actual
        </button>
        <button 
          className={`btn ${dateRange === 'custom' ? 'btn-primary' : 'btn-outline-primary'}`}
          onClick={() => handleDateRangeChange('custom')}
        >
          Personalizado
        </button>
        
        {dateRange === 'custom' && (
          <div className="custom-date-range">
            <div className="form-group">
              <label>Desde:</label>
              <input 
                type="date" 
                value={format(startDate, 'yyyy-MM-dd')} 
                onChange={(e) => setStartDate(new Date(e.target.value))}
              />
            </div>
            <div className="form-group">
              <label>Hasta:</label>
              <input 
                type="date" 
                value={format(endDate, 'yyyy-MM-dd')} 
                onChange={(e) => setEndDate(new Date(e.target.value))}
              />
            </div>
            <button 
              className="btn btn-success" 
              onClick={loadStats}
            >
              Aplicar
            </button>
          </div>
        )}
      </div>

      {stats && extendedStats && (
        <div className="stats-content">
          {/* 1. RESUMEN DE CITAS */}
          <div className="stats-section">
            <h2 className="section-title">📅 Resumen de Citas</h2>
            <div className="stats-cards">
              <div className="stats-card primary">
                <h3>Total de Citas</h3>
                <div className="stats-value">{extendedStats.totalAppointments}</div>
                <div className="stats-details">
                  <div>Programadas en el período</div>
                </div>
              </div>
              
              <div className="stats-card success">
                <h3>Citas Realizadas</h3>
                <div className="stats-value">{extendedStats.completedAppointments}</div>
                <div className="stats-details">
                  <div>Tasa de cumplimiento: <strong>{extendedStats.completionRate.toFixed(1)}%</strong></div>
                </div>
              </div>
              
              <div className="stats-card warning">
                <h3>Citas Pendientes</h3>
                <div className="stats-value">{extendedStats.pendingAppointments}</div>
                <div className="stats-details">
                  <div>Por confirmar o realizar</div>
                </div>
              </div>
              
              <div className="stats-card danger">
                <h3>Citas Canceladas</h3>
                <div className="stats-value">{extendedStats.cancelledAppointments}</div>
                <div className="stats-details">
                  <div>Tasa de cancelación: <strong>{extendedStats.cancellationRate.toFixed(1)}%</strong></div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. MÉTRICAS FINANCIERAS */}
          <div className="stats-section">
            <h2 className="section-title">💰 Métricas Financieras</h2>
            <div className="stats-cards">
              <div className="stats-card financial">
                <h3>Ventas del Período</h3>
                <div className="stats-value">${extendedStats.totalRevenue.toFixed(2)}</div>
                <div className="stats-details">
                  <div className="growth-indicator positive">
                    ↗ +{extendedStats.revenueGrowth}% vs período anterior
                  </div>
                </div>
              </div>
              
              <div className="stats-card financial">
                <h3>Ticket Promedio</h3>
                <div className="stats-value">${extendedStats.averageTicket.toFixed(2)}</div>
                <div className="stats-details">
                  <div>Por cita completada</div>
                </div>
              </div>
              
              <div className="stats-card financial">
                <h3>Ingresos Diarios</h3>
                <div className="stats-value">${revenueData.day.toFixed(2)}</div>
                <div className="stats-details">
                  <div>Semana: <strong>${revenueData.week.toFixed(2)}</strong></div>
                  <div>Mes: <strong>${revenueData.month.toFixed(2)}</strong></div>
                  <div>Año: <strong>${revenueData.year.toFixed(2)}</strong></div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. ESTADÍSTICAS OPERATIVAS */}
          <div className="stats-section">
            <h2 className="section-title">⚙️ Estadísticas Operativas</h2>
            <div className="stats-cards">
              <div className="stats-card operational">
                <h3>Tasa de Ocupación</h3>
                <div className="stats-value">{extendedStats.dailyOccupancy}%</div>
                <div className="stats-details">
                  <div>Promedio diario</div>
                </div>
              </div>
              
              <div className="stats-card operational">
                <h3>Tiempo Promedio</h3>
                <div className="stats-value">{extendedStats.averageServiceTime} min</div>
                <div className="stats-details">
                  <div>Por servicio</div>
                </div>
              </div>
              
              <div className="stats-card operational">
                <h3>Retención de Clientes</h3>
                <div className="stats-value">{(stats.client_retention_rate * 100).toFixed(1)}%</div>
                <div className="stats-details">
                  <div>Clientes que regresan</div>
                </div>
              </div>
            </div>
          </div>

          {/* 4. GRÁFICOS Y VISUALIZACIONES */}
          <div className="stats-charts">
            {/* Servicios Más Solicitados */}
            <div className="chart-container">
              <h3>🏆 Top 5 Servicios Más Solicitados</h3>
              {extendedStats.topServices && extendedStats.topServices.length > 0 ? (
                <div className="pie-chart">
                  <Doughnut 
                    data={getPopularServicesChartData()} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'right',
                        },
                        title: {
                          display: true,
                          text: 'Distribución de Servicios'
                        }
                      }
                    }}
                  />
                </div>
              ) : (
                <p className="no-data">No hay datos disponibles</p>
              )}
            </div>
            
            {/* Horarios de Mayor Demanda */}
            <div className="chart-container">
              <h3>🕐 Horarios de Mayor Demanda</h3>
              {extendedStats.peakHours && extendedStats.peakHours.length > 0 ? (
                <div className="bar-chart">
                  <Bar 
                    data={getPeakHoursChartData()} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false,
                        },
                        title: {
                          display: true,
                          text: 'Citas por Horario'
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: true
                        }
                      }
                    }}
                  />
                </div>
              ) : (
                <p className="no-data">No hay datos disponibles</p>
              )}
            </div>

            {/* Ingresos por Tipo de Servicio */}
            <div className="chart-container">
              <h3>💵 Ingresos por Tipo de Servicio</h3>
              {extendedStats.revenueByService && extendedStats.revenueByService.length > 0 ? (
                <div className="pie-chart">
                  <Pie 
                    data={getRevenueByServiceChartData()} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom',
                        },
                        title: {
                          display: true,
                          text: 'Distribución de Ingresos'
                        }
                      }
                    }}
                  />
                </div>
              ) : (
                <p className="no-data">No hay datos disponibles</p>
              )}
            </div>

            {/* Tendencias Mensuales */}
            <div className="chart-container full-width">
              <h3>📈 Tendencias de Ingresos Mensuales</h3>
              <div className="line-chart">
                <Line 
                  data={getMonthlyTrendsData()} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top',
                      },
                      title: {
                        display: true,
                        text: 'Comparativa Año Actual vs Anterior'
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          callback: function(value) {
                            return '$' + value;
                          }
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>

          {/* 5. INDICADORES DE RENDIMIENTO */}
          <div className="stats-section">
            <h2 className="section-title">🎯 Indicadores de Rendimiento</h2>
            <div className="performance-indicators">
              <div className="indicator-card">
                <div className="indicator-header">
                  <h4>Eficiencia Operativa</h4>
                  <div className="indicator-status excellent">Excelente</div>
                </div>
                <div className="indicator-metrics">
                  <div className="metric">
                    <span>Cumplimiento de citas:</span>
                    <span className="metric-value">{extendedStats.completionRate.toFixed(1)}%</span>
                  </div>
                  <div className="metric">
                    <span>Ocupación promedio:</span>
                    <span className="metric-value">{extendedStats.dailyOccupancy}%</span>
                  </div>
                </div>
              </div>

              <div className="indicator-card">
                <div className="indicator-header">
                  <h4>Rendimiento Financiero</h4>
                  <div className="indicator-status good">Bueno</div>
                </div>
                <div className="indicator-metrics">
                  <div className="metric">
                    <span>Crecimiento de ingresos:</span>
                    <span className="metric-value">+{extendedStats.revenueGrowth}%</span>
                  </div>
                  <div className="metric">
                    <span>Ticket promedio:</span>
                    <span className="metric-value">${extendedStats.averageTicket.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="indicator-card">
                <div className="indicator-header">
                  <h4>Satisfacción del Cliente</h4>
                  <div className="indicator-status excellent">Excelente</div>
                </div>
                <div className="indicator-metrics">
                  <div className="metric">
                    <span>Tasa de retención:</span>
                    <span className="metric-value">{(stats.client_retention_rate * 100).toFixed(1)}%</span>
                  </div>
                  <div className="metric">
                    <span>Tasa de cancelación:</span>
                    <span className="metric-value">{extendedStats.cancellationRate.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessStatsManager;
