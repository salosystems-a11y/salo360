import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, AlertTriangle, Eye, Edit3, ChevronDown, User, Users, Briefcase, UserCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import EvaluationDetailsModal from '@/components/evaluations/EvaluationDetailsModal';
import EvaluationResponseModal from '@/components/evaluations/EvaluationResponseModal';
import { toast } from '@/components/ui/use-toast';
import { useTranslation } from '@/hooks/useTranslation';

const EvaluationListItem = ({ evaluation, getUserName, isPendingList, currentUser, onOpenDetails, onOpenResponse }) => {
  const t = useTranslation();
  
  const getEvaluationStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'active': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'pending': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      layout
      className="w-full"
    >
      <Card className={`bg-card border-border card-hover overflow-hidden w-full ${isPendingList ? 'border-primary/50' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-foreground text-md font-semibold">
              {evaluation.type === '180' ? t('eval_type_180_short') : t('eval_type_360_short')}
               {evaluation.evaluation360Type && ` - ${t(evaluation.evaluation360Type)}`}
            </CardTitle>
            {getEvaluationStatusIcon(evaluation.status)}
          </div>
          <CardDescription className="text-muted-foreground text-xs">
            {t('period')}: {evaluation.period} {isPendingList ? `- ${t('awaiting_your_evaluation')}` : ''}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2.5 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('evaluated')}:</span>
            <span className="text-foreground font-medium">{getUserName(evaluation.evaluatedId)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('evaluator')}:</span>
            <span className="text-foreground">{getUserName(evaluation.evaluatorId)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('status')}:</span>
            <span className="text-foreground">{t(`status_${evaluation.status}`)}</span>
          </div>
          {evaluation.scores && Object.keys(evaluation.scores).length > 0 && evaluation.status === 'completed' && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('average_score')}:</span>
              <span className="text-foreground font-semibold">
                {(Object.values(evaluation.scores).reduce((a, b) => a + b, 0) / Object.values(evaluation.scores).length).toFixed(1)}/5
              </span>
            </div>
          )}
           <div className="pt-2.5 flex space-x-2">
            {isPendingList && evaluation.evaluatorId === currentUser.id && evaluation.status === 'pending' ? (
               <Button 
                size="sm"
                onClick={() => onOpenResponse(evaluation)}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Edit3 className="h-3.5 w-3.5 mr-1.5" />
                {t('respond_evaluation')}
              </Button>
            ) : (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onOpenDetails(evaluation)}
                className="flex-1 border-border text-foreground hover:bg-muted"
              >
                <Eye className="h-3.5 w-3.5 mr-1.5" />
                {t('view_details')}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

const EvaluationGroupCard = ({ title, icon, evaluations, ...props }) => {
    const [isOpen, setIsOpen] = useState(evaluations.length > 0);
    const t = useTranslation();
    const Icon = icon;

    return (
        <Card className="bg-card border-border w-full">
            <CardHeader 
                className="flex flex-row items-center justify-between cursor-pointer p-4"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 text-primary rounded-lg">
                        <Icon className="h-6 w-6" />
                    </div>
                    <div>
                        <CardTitle className="text-lg font-bold text-foreground">{title}</CardTitle>
                        <CardDescription className="text-xs">{t('evaluations_count', { count: evaluations.length })}</CardDescription>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-primary">{evaluations.length}</span>
                    <motion.div animate={{ rotate: isOpen ? 180 : 0 }}>
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    </motion.div>
                </div>
            </CardHeader>
            {isOpen && (
                <CardContent className="p-4 pt-0">
                    <div className="border-t border-border pt-4">
                        {evaluations.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {evaluations.map(ev => (
                                    <EvaluationListItem key={ev.id} evaluation={ev} {...props} />
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-sm text-muted-foreground py-4">{t('no_evaluations_in_category')}</p>
                        )}
                    </div>
                </CardContent>
            )}
        </Card>
    );
};

const EvaluationList = ({ 
  groupedEvaluations,
  isPendingList = false,
  ...rest
}) => {
  const t = useTranslation();

  const [selectedEvaluationForDetails, setSelectedEvaluationForDetails] = useState(null);
  const [selectedEvaluationForResponse, setSelectedEvaluationForResponse] = useState(null);
  
  const handleOpenDetails = (evaluation) => setSelectedEvaluationForDetails(evaluation);
  const handleOpenResponse = (evaluation) => {
    if (evaluation.evaluatorId !== rest.currentUser.id || evaluation.status !== 'pending') {
      toast({ title: t('action_not_allowed'), description: t('cannot_respond_evaluation'), variant: "destructive" });
      return;
    }
    setSelectedEvaluationForResponse(evaluation);
  };
  
  const handleSubmitResponse = (evaluationId, scores, comments) => {
    const updatedEvaluations = rest.allEvaluations.map(ev =>
      ev.id === evaluationId
        ? { ...ev, scores, comments, status: 'completed', completedAt: new Date().toISOString() }
        : ev
    );
    rest.saveEvaluations(updatedEvaluations);
    toast({ title: t('evaluation_sent'), description: t('response_registered') });
    setSelectedEvaluationForResponse(null);
  };
  
  const groupConfig = [
    { key: 'self', title: t('self_evaluation_title'), icon: User },
    { key: 'peer', title: t('peer_evaluation_title'), icon: Users },
    { key: 'subordinate', title: t('subordinate_evaluation_title'), icon: Briefcase },
    { key: 'manager', title: t('manager_evaluation_title'), icon: UserCheck }
  ];
  
  const hasAnyEvaluations = Object.values(groupedEvaluations).some(arr => arr.length > 0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-4"
    >
      {groupConfig.map(group => (
        <EvaluationGroupCard
          key={group.key}
          title={group.title}
          icon={group.icon}
          evaluations={groupedEvaluations[group.key] || []}
          isPendingList={isPendingList}
          onOpenDetails={handleOpenDetails}
          onOpenResponse={handleOpenResponse}
          {...rest}
        />
      ))}
      {!hasAnyEvaluations && !isPendingList && (
        <div className="text-center py-10">
          <p className="text-muted-foreground text-md">{rest.emptyMessage}</p>
        </div>
      )}
      {isPendingList && Object.values(groupedEvaluations).every(arr => arr.length === 0) && (
         <div className="text-center py-10">
          <p className="text-muted-foreground text-md">{rest.emptyMessage}</p>
        </div>
      )}

      {selectedEvaluationForDetails && (
        <EvaluationDetailsModal
          evaluation={selectedEvaluationForDetails}
          isOpen={!!selectedEvaluationForDetails}
          onClose={() => setSelectedEvaluationForDetails(null)}
          getUserName={rest.getUserName}
          competencies={rest.competencies}
        />
      )}
       {selectedEvaluationForResponse && (
        <EvaluationResponseModal
          evaluation={selectedEvaluationForResponse}
          isOpen={!!selectedEvaluationForResponse}
          onClose={() => setSelectedEvaluationForResponse(null)}
          onRespond={handleSubmitResponse}
          getUserName={rest.getUserName}
          competencies={rest.competencies}
          currentUser={rest.currentUser}
        />
      )}
    </motion.div>
  );
};

export default EvaluationList;