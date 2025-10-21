import React, { useState, useEffect } from 'react';
import { Star, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { useData } from '@/contexts/DataContext';
import { useTranslation } from '@/hooks/useTranslation';

const EvaluationResponseModal = ({ isOpen, onClose, evaluation, onRespond, isSelfEvaluation = false, getUserName }) => {
  const { competencies } = useData();
  const t = useTranslation();
  const [scores, setScores] = useState({});
  const [comments, setComments] = useState('');
  const [selfEvaluationFeedback, setSelfEvaluationFeedback] = useState('');

  useEffect(() => {
    if (isOpen && evaluation) {
      setScores({}); 
      setComments('');
      setSelfEvaluationFeedback('');
    }
  }, [isOpen, evaluation]);

  if (!evaluation) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (Object.keys(scores).length !== competencies.length) {
      toast({
        title: t('incomplete_fields'),
        description: t('please_rate_all_competencies'),
        variant: "destructive",
      });
      return;
    }

    onRespond(evaluation.id, scores, comments, false);
    onClose();
  };
  
  const evaluatedName = getUserName ? getUserName(evaluation.evaluatedId) : t('collaborator');
  const title = t('respond_competence_evaluation_for', { name: evaluatedName });
  const description = t('provide_feedback_for', { name: evaluatedName });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border text-foreground max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="text-muted-foreground">{description}</DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-6 py-4 max-h-[70vh] overflow-y-auto pr-2">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">{t('competencies')}</h3>
              {competencies.map(competency => (
                <div key={competency.id} className="space-y-2 p-3 bg-input rounded-md border border-border">
                  <Label className="text-foreground">{competency.name}</Label>
                  <p className="text-xs text-muted-foreground">{competency.description}</p>
                  <div className="flex items-center space-x-2">
                    {[1, 2, 3, 4, 5].map(rating => (
                      <button
                        key={rating}
                        type="button"
                        onClick={() => setScores(prev => ({ ...prev, [competency.id]: rating }))}
                        className={`p-1 transition-transform transform hover:scale-110 ${
                          scores[competency.id] >= rating 
                            ? 'text-yellow-400' 
                            : 'text-muted-foreground/50 hover:text-muted-foreground'
                        }`}
                      >
                        <Star className={`h-6 w-6 ${scores[competency.id] >= rating ? 'fill-yellow-400' : ''}`} />
                      </button>
                    ))}
                    <span className="text-foreground ml-2 w-8 text-center font-bold">
                      {scores[competency.id] || '-'}/5
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Label htmlFor="comments">{t('general_comments')}</Label>
              <Textarea
                id="comments"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="bg-input border-border placeholder:text-muted-foreground min-h-[100px]"
                placeholder={t('comments_placeholder')}
              />
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="border-border text-foreground hover:bg-muted">{t('cancel')}</Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <MessageSquare className="h-4 w-4 mr-2" />
              {t('send_response')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EvaluationResponseModal;