import React from 'react';
import { ResponsiveContainer, BarChart as RechartsBarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { useTranslation } from '@/hooks/useTranslation';

const CustomTooltip = ({ active, payload, label }) => {
  const t = useTranslation();
  if (active && payload && payload.length) {
    return (
      <div className="p-2 bg-card border border-border rounded-md shadow-lg text-sm">
        <p className="font-bold text-foreground mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }}>
            {`${p.name}: ${p.value}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const CustomBarChart = ({ data, layout = "vertical", keys }) => {
  const t = useTranslation();
  if (!data || data.length === 0) {
    return <div className="text-center text-muted-foreground py-8">{t('no_data_for_chart')}</div>;
  }
  
  const isVertical = layout === 'vertical';
  const isGrouped = !!keys;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsBarChart data={data} layout={layout} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" />
        {isVertical ? (
          <>
            <XAxis type="number" domain={[0, 5]} hide />
            <YAxis type="category" dataKey="label" width={100} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
          </>
        ) : (
          <>
            <XAxis type="category" dataKey="label" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
            <YAxis type="number" domain={[0, 5]} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
          </>
        )}
        <Tooltip
          cursor={{ fill: 'hsl(var(--muted) / 0.5)' }}
          content={<CustomTooltip />}
        />
        <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
        {isGrouped ? (
          keys.map(key => (
            <Bar key={key.key} dataKey={key.key} name={key.name} fill={key.color} barSize={20} radius={[4, 4, 0, 0]} />
          ))
        ) : (
          <Bar dataKey="value" barSize={isVertical ? 30 : 40} radius={isVertical ? [0, 4, 4, 0] : [4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Bar key={`bar-${index}`} fill={entry.color || '#8884d8'} />
            ))}
          </Bar>
        )}
      </RechartsBarChart>
    </ResponsiveContainer>
  );
};

export default CustomBarChart;