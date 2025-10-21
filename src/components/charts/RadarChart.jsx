import React from 'react';
import { ResponsiveContainer, RadarChart as RechartsRadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, Tooltip } from 'recharts';

const RadarChart = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsRadarChart cx="50%" cy="50%" outerRadius="80%" data={data.data}>
        <PolarGrid />
        <PolarAngleAxis dataKey="competency" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
        <PolarRadiusAxis angle={30} domain={[0, 5]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
        
        {data.keys.map(key => (
          <Radar 
            key={key.key}
            name={key.name} 
            dataKey={key.key} 
            stroke={key.color} 
            fill={key.color} 
            fillOpacity={0.6} 
          />
        ))}

        <Legend wrapperStyle={{ fontSize: '12px' }} />
        <Tooltip
            contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                borderColor: 'hsl(var(--border))',
                color: 'hsl(var(--foreground))',
                fontSize: '12px',
                borderRadius: '0.5rem'
            }}
        />
      </RechartsRadarChart>
    </ResponsiveContainer>
  );
};

export default RadarChart;