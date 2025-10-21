import React from 'react';
import { motion } from 'framer-motion';
import PieChart from '@/components/charts/PieChart';
import BarChart from '@/components/charts/BarChart';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useTranslation } from '@/hooks/useTranslation';

const ProjectReportCharts = ({ chartData }) => {
    const t = useTranslation();
    if (!chartData || Object.keys(chartData).length === 0) {
        return (
            <div className="text-center py-10">
                <p className="text-muted-foreground text-md">{t('select_project_to_view_charts')}</p>
            </div>
        );
    }

    const renderChart = (data, title) => {
        if (!data || data.length === 0) {
            return <p className="text-muted-foreground text-center py-12 text-sm">{t('no_data_for_chart')}</p>;
        }

        // Heuristic to decide chart type
        if (title.toLowerCase().includes(t('comparison').toLowerCase()) || data.every(d => typeof d.value === 'number' && d.value <= 5)) {
            return <BarChart data={data} layout="horizontal" />;
        }
        return <PieChart data={data} />;
    };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="grid grid-cols-1 lg:grid-cols-2 gap-6"
    >
      {Object.entries(chartData).map(([title, data]) => (
        <Card key={title} className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground text-lg">{title}</CardTitle>
            <CardDescription className="text-muted-foreground text-sm">{t('analysis_of_criterion', { criterion: title })}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full flex justify-center items-center">
                {renderChart(data, title)}
            </div>
          </CardContent>
        </Card>
      ))}
    </motion.div>
  );
};

export default ProjectReportCharts;