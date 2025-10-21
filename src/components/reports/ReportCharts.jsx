import React from 'react';
import { motion } from 'framer-motion';
import PieChart from '@/components/charts/PieChart';
import BarChart from '@/components/charts/BarChart';
import Evaluation360Table from '@/components/reports/Evaluation360Table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from '@/hooks/useTranslation';

const ReportCharts = ({ chartData, currentUserRole, selectedUserId }) => {
  const t = useTranslation();

  const chartsConfig = [
    {
      id: "performance",
      title: t('performance_distribution'),
      data: chartData.performance,
      chartType: 'pie',
      roles: ['admin', 'manager', 'employee'] 
    },
    {
      id: 'radar',
      title: t('evaluation_360_radar'),
      data: chartData.radar,
      chartType: 'table',
      roles: ['admin', 'manager', 'employee'],
      className: 'lg:col-span-2',
      condition: selectedUserId !== 'all'
    },
    {
      id: "competencies",
      title: t('average_by_competency'),
      data: chartData.competencies,
      chartType: 'bar',
      roles: ['admin', 'manager', 'employee']
    },
    {
      id: "departments",
      title: t('performance_by_department'),
      data: chartData.departments,
      chartType: 'bar',
      roles: ['admin', 'manager'] 
    },
    {
      id: "types",
      title: t('evaluation_types'),
      data: chartData.types,
      chartType: 'pie',
      roles: ['admin', 'manager']
    },
    {
      id: "comparison",
      title: t('competency_comparison'),
      data: chartData.comparison.data,
      chartType: 'groupedBar',
      keys: chartData.comparison.keys,
      roles: ['admin', 'manager', 'employee']
    }
  ];

  const availableCharts = chartsConfig.filter(chart => 
    chart.roles.includes(currentUserRole?.id) && 
    (chart.condition !== undefined ? chart.condition : true) &&
    chart.data && 
    ((chart.data.data && chart.data.data.length > 0) || (Array.isArray(chart.data) && chart.data.length > 0))
  );

  const renderChart = (chart) => {
    switch (chart.chartType) {
        case 'bar':
            return <BarChart data={chart.data} layout={chart.layout || 'vertical'} />;
        case 'groupedBar':
            return <BarChart data={chart.data} keys={chart.keys} />;
        case 'table':
            return <Evaluation360Table data={chart.data} />;
        case 'pie':
        default:
            return <PieChart data={chart.data} />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="grid grid-cols-1 lg:grid-cols-2 gap-6"
    >
      {availableCharts.map(chart => (
        <Card key={chart.id} className={`bg-card border-border ${chart.className || ''}`}>
          <CardHeader>
            <CardTitle className="text-foreground text-lg">{chart.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`w-full flex justify-center items-start ${chart.chartType === 'table' ? 'overflow-x-auto' : 'h-[350px] sm:h-[400px]'}`}>
              {renderChart(chart)}
            </div>
          </CardContent>
        </Card>
      ))}
      {availableCharts.length === 0 && (
        <div className="lg:col-span-2 text-center py-10">
          <p className="text-muted-foreground text-md">{t('no_data_for_chart')}</p>
        </div>
      )}
    </motion.div>
  );
};

export default ReportCharts;