/**
 * Componentes de gráficos para Dashboard
 * Usando Recharts con tema oscuro
 */

import React from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

// Paleta de colores para tema oscuro
const COLORS = {
  primary: '#0080ff',
  secondary: '#00d4ff',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  purple: '#a855f7',
  pink: '#ec4899',
};

const CHART_COLORS = [
  COLORS.primary,
  COLORS.secondary,
  COLORS.success,
  COLORS.warning,
  COLORS.purple,
  COLORS.pink,
  COLORS.danger,
];

// Tooltip personalizado
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-dark-800/95 backdrop-blur-xl border border-dark-700/50 rounded-xl px-4 py-3 shadow-xl">
        <p className="text-sm font-medium text-white mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: <span className="font-semibold">{entry.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Props para el gráfico de área (tendencias)
interface TrendChartProps {
  data: Array<{
    date: string;
    entradas?: number;
    salidas?: number;
    totalIn?: number;
    totalOut?: number;
  }>;
  height?: number;
}

export const MovementTrendChart: React.FC<TrendChartProps> = ({ data, height = 300 }) => {
  // Normalizar datos
  const normalizedData = data.map(item => ({
    date: item.date,
    Entradas: item.entradas ?? item.totalIn ?? 0,
    Salidas: item.salidas ?? item.totalOut ?? 0,
  }));

  return (
    <div className="glass-card p-6">
      <h3 className="text-lg font-bold text-white mb-4">Tendencia de Movimientos</h3>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={normalizedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorEntradas" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.success} stopOpacity={0.3} />
              <stop offset="95%" stopColor={COLORS.success} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorSalidas" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.danger} stopOpacity={0.3} />
              <stop offset="95%" stopColor={COLORS.danger} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#3a3a50" vertical={false} />
          <XAxis 
            dataKey="date" 
            stroke="#6b7280" 
            tick={{ fill: '#9ca3af', fontSize: 12 }}
            axisLine={{ stroke: '#3a3a50' }}
          />
          <YAxis 
            stroke="#6b7280" 
            tick={{ fill: '#9ca3af', fontSize: 12 }}
            axisLine={{ stroke: '#3a3a50' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ paddingTop: 20 }}
            formatter={(value) => <span className="text-gray-300 text-sm">{value}</span>}
          />
          <Area
            type="monotone"
            dataKey="Entradas"
            stroke={COLORS.success}
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorEntradas)"
          />
          <Area
            type="monotone"
            dataKey="Salidas"
            stroke={COLORS.danger}
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorSalidas)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

// Props para el gráfico de barras
interface BarChartProps {
  data: Array<{
    name: string;
    value: number;
    [key: string]: any;
  }>;
  dataKey?: string;
  height?: number;
  title: string;
}

export const CategoryBarChart: React.FC<BarChartProps> = ({ 
  data, 
  dataKey = 'value', 
  height = 300,
  title 
}) => {
  return (
    <div className="glass-card p-6">
      <h3 className="text-lg font-bold text-white mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#3a3a50" vertical={false} />
          <XAxis 
            dataKey="name" 
            stroke="#6b7280"
            tick={{ fill: '#9ca3af', fontSize: 11 }}
            axisLine={{ stroke: '#3a3a50' }}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis 
            stroke="#6b7280"
            tick={{ fill: '#9ca3af', fontSize: 12 }}
            axisLine={{ stroke: '#3a3a50' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            dataKey={dataKey} 
            fill={COLORS.primary}
            radius={[4, 4, 0, 0]}
          >
            {data.map((_, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={CHART_COLORS[index % CHART_COLORS.length]} 
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// Props para el gráfico de pastel
interface PieChartProps {
  data: Array<{
    name: string;
    value: number;
    [key: string]: any;
  }>;
  height?: number;
  title: string;
  showLegend?: boolean;
}

export const CategoryPieChart: React.FC<PieChartProps> = ({ 
  data, 
  height = 300, 
  title,
  showLegend = true 
}) => {
  const total = data.reduce((acc, item) => acc + item.value, 0);

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null; // No mostrar si es menos del 5%
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="glass-card p-6">
      <h3 className="text-lg font-bold text-white mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={CustomLabel}
            outerRadius={100}
            innerRadius={60}
            fill="#8884d8"
            dataKey="value"
            strokeWidth={2}
            stroke="#1e1e2e"
          >
            {data.map((_, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={CHART_COLORS[index % CHART_COLORS.length]} 
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          {showLegend && (
            <Legend
              layout="vertical"
              align="right"
              verticalAlign="middle"
              formatter={(value) => {
                const item = data.find(d => d.name === value);
                const percent = item ? ((item.value / total) * 100).toFixed(1) : 0;
                return (
                  <span className="text-gray-300 text-sm">
                    {value} <span className="text-gray-500">({percent}%)</span>
                  </span>
                );
              }}
            />
          )}
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

// Componente de mini gráfico para estadísticas
interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
}

export const Sparkline: React.FC<SparklineProps> = ({ 
  data, 
  color = COLORS.primary, 
  height = 40 
}) => {
  const chartData = data.map((value, index) => ({ value, index }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`sparkline-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          fill={`url(#sparkline-${color.replace('#', '')})`}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

// Exportar colores para uso externo
export { COLORS, CHART_COLORS };
