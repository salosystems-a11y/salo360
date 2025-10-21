import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Star } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

const EvaluationDetailsModal = ({ evaluation, isOpen, onClose, getUserName, competencies }) => {
  const t = useTranslation();
  if (!evaluation) return null;

  const getCompetencyName = (compId) => {
    const comp = competencies.find(c => c.id === compId);
    return comp ? comp.name : t('unknown_competency');
  };

  const averageScore = evaluation.scores && Object.keys(evaluation.scores).length > 0
    ? (Object.values(evaluation.scores).reduce((a, b) => a + b, 0) / Object.values(evaluation.scores).length).toFixed(1)
    : "N/A";


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border text-foreground max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('competence_evaluation_details_title')}</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {t('evaluation_of_by', { evaluated: getUserName(evaluation.evaluatedId), evaluator: getUserName(evaluation.evaluatorId) })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3 max-h-[60vh] overflow-y-auto pr-2 text-sm">
          <div>
            <Label className="text-muted-foreground">{t('type')}:</Label>
            <p className="text-foreground">{evaluation.type === '180' ? t('eval_type_180') : t('eval_type_360')}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">{t('period')}:</Label>
            <p className="text-foreground">{evaluation.period}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">{t('status')}:</Label>
            <p className="text-foreground font-medium">{t(`status_${evaluation.status}`)}</p>
          </div>
           {evaluation.status === 'completed' && evaluation.completedAt && (
            <div>
              <Label className="text-muted-foreground">{t('completion_date')}:</Label>
              <p className="text-foreground">{new Date(evaluation.completedAt).toLocaleDateString()}</p>
            </div>
          )}

          {evaluation.status === 'completed' && evaluation.scores && Object.keys(evaluation.scores).length > 0 ? (
            <div className="space-y-3 pt-2">
              <h4 className="font-medium text-foreground">{t('competency_scores_title', { average: averageScore })}</h4>
              {Object.entries(evaluation.scores).map(([compId, score]) => (
                <div key={compId} className="p-2 bg-input rounded-md border border-border">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">{getCompetencyName(compId)}:</span>
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map(rating => (
                        <Star
                          key={rating}
                          className={`h-4 w-4 ${score >= rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/50'}`}
                        />
                      ))}
                       <span className="text-foreground ml-2 text-xs">({score}/5)</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : evaluation.status !== 'completed' && (
            <div className="space-y-3 pt-2">
                <h4 className="font-medium text-foreground">{t('competencies_to_be_evaluated')}</h4>
                {competencies.map(comp => (
                    <div key={comp.id} className="p-2 bg-input rounded-md border border-border text-muted-foreground">{comp.name}</div>
                ))}
            </div>
          )}
          
          {evaluation.customFields && evaluation.customFields.length > 0 && (
             <div className="space-y-3 pt-2">
              <h4 className="font-medium text-foreground">{t('custom_fields')}</h4>
              {evaluation.customFields.map((field, index) => (
                <div key={index} className="p-2 bg-input rounded-md border border-border">
                  <Label className="text-muted-foreground">{field.name}:</Label>
                  <p className="text-foreground whitespace-pre-wrap">{field.value || (evaluation.status === 'completed' ? t('not_filled') : t('awaiting_evaluator'))}</p>
                </div>
              ))}
            </div>
          )}

          {evaluation.comments && evaluation.status === 'completed' ? (
            <div className="pt-2">
              <Label className="text-muted-foreground">{t('general_comments_evaluator')}:</Label>
              <p className="p-2 bg-input rounded-md border border-border text-foreground whitespace-pre-wrap">{evaluation.comments}</p>
            </div>
          ) : (
             <div className="pt-2">
                <Label className="text-muted-foreground">{t('general_comments_evaluator')}:</Label>
                <p className="p-2 bg-input rounded-md border border-border text-muted-foreground italic">{t('awaiting_evaluator')}</p>
             </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="text-foreground border-border hover:bg-muted">{t('close')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EvaluationDetailsModal;