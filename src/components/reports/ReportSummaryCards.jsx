import React from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, CheckCircle, Award, Percent } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslation } from '@/hooks/useTranslation';

const ReportSummaryCards = ({ data }) => {
  const t = useTranslation();
  const cards = [
    { title: t('total_evaluations'), value: data.totalEvaluations, icon: ClipboardList, color: 'text-primary' },
    { title: t('completion_rate'), value: `${data.completionRate}%`, icon: Percent, color: 'text-green-500' },
    { title: t('average_performance'), value: data.averageScore, icon: Award, color: 'text-purple-500' },
    { title: t('completed_evaluations'), value: data.completedEvaluations, icon: CheckCircle, color: 'text-orange-500' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
    >
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index} className="bg-card border-border card-hover">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">{card.title}</p>
                  <p className="text-2xl font-semibold text-foreground mt-1 truncate">{card.value}</p>
                </div>
                <div className={`p-2 rounded-full bg-primary/10 ${card.color}`}>
                    <Icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </motion.div>
  );
};

export default ReportSummaryCards;