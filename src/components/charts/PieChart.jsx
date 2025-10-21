import React from 'react';
import { ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, Legend, Tooltip } from 'recharts';
import { useTranslation } from '@/hooks/useTranslation';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const total = payload[0].payload.total;
    const percentage = total > 0 ? ((payload[0].value / total) * 100).toFixed(1) : 0;
    return (
      <div className="p-2 bg-card border border-border rounded-md shadow-lg text-sm">
        <p className="font-bold text-foreground">{`${payload[0].name}: ${payload[0].value}`}</p>
        <p className="text-muted-foreground">{`(${percentage}%)`}</p>
      </div>
    );
  }
  return null;
};

const CustomPieChart = ({ data }) => {
  const t = useTranslation();
  if (!data || data.length === 0) {
    return <div className="text-center text-muted-foreground py-8">{t('no_data_for_chart')}</div>;
  }

  const totalValue = data.reduce((sum, item) => sum + item.value, 0);
  const dataWithTotal = data.map(item => ({ ...item, total: totalValue }));

  const COLORS = data.map(entry => entry.color || `#${Math.floor(Math.random()*16777215).toString(16)}`);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsPieChart>
        <Pie
          data={dataWithTotal}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius="80%"
          fill="#8884d8"
          dataKey="value"
          nameKey="label" 
          label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
            const RADIAN = Math.PI / 180;
            const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
            const x = cx + radius * Math.cos(-midAngle * RADIAN);
            const y = cy + radius * Math.sin(-midAngle * RADIAN);
            if (percent * 100 < 5) return null; 
            return (
              <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize="12px" fontWeight="bold">
                {`${(percent * 100).toFixed(0)}%`}
              </text>
            );
          }}
        >
          {dataWithTotal.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend 
          layout="horizontal" 
          verticalAlign="bottom" 
          align="center"
          wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }}
          formatter={(value, entry) => {
            const { color } = entry;
            const item = data.find(d => d.label === value);
            const percentage = totalValue > 0 ? ((item.value / totalValue) * 100).toFixed(1) : 0;
            return <span style={{ color: 'hsl(var(--muted-foreground))' }}><span style={{ color }}>{value}</span> ({item.value})</span>;
          }}
        />
      </RechartsPieChart>
    </ResponsiveContainer>
  );
};

export default CustomPieChart;