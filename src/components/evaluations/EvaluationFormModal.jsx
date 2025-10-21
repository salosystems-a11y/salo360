import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { useTranslation } from '@/hooks/useTranslation';

const EvaluationFormModal = ({ isOpen, onClose, onSubmit, users, competencies, currentUser, roles }) => {
  const t = useTranslation();
  const [evaluationType, setEvaluationType] = useState('180');
  const [selectedRole, setSelectedRole] = useState('');
  const [initialComments, setInitialComments] = useState('');

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setEvaluationType('180');
    setSelectedRole('');
    setInitialComments('');
  };

  const getCurrentPeriod = () => {
    const now = new Date();
    const quarter = Math.ceil((now.getMonth() + 1) / 3);
    return `Q${quarter} ${now.getFullYear()}`;
  };

  const handleInternalSubmit = () => {
    if (!selectedRole) {
      toast({ title: t('error'), description: t('select_role_to_evaluate'), variant: "destructive" });
      return;
    }

    const usersToEvaluate = users.filter(u => u.role === selectedRole);
    if (usersToEvaluate.length === 0) {
      toast({ title: t('error'), description: t('no_users_in_role'), variant: "destructive" });
      return;
    }

    const allNewEvaluations = [];
    const period = getCurrentPeriod();
    const createdAt = new Date().toISOString();

    usersToEvaluate.forEach(userToEvaluate => {
      const mainEvaluationId = `eval_${Date.now()}_${userToEvaluate.id}`;

      if (evaluationType === '180') {
        const manager = users.find(u => u.id === userToEvaluate.managerId);
        if (manager) {
          allNewEvaluations.push({
            id: mainEvaluationId,
            evaluatedId: userToEvaluate.id,
            type: '180',
            scores: {},
            comments: initialComments,
            customFields: [],
            period,
            evaluatorId: manager.id,
            status: 'pending',
            createdAt,
            is360Part: false,
            mainEvaluationId: null,
            evaluation360Type: null
          });
        }
      } else if (evaluationType === '360') {
        const evaluators = new Map();
        
        // Self-evaluation
        evaluators.set(userToEvaluate.id, { id: userToEvaluate.id, type: 'self' });

        // Manager evaluation
        if (userToEvaluate.managerId) {
          evaluators.set(userToEvaluate.managerId, { id: userToEvaluate.managerId, type: 'manager' });
        }

        // Peer evaluation
        users.filter(u => u.role === userToEvaluate.role && u.id !== userToEvaluate.id)
             .forEach(peer => evaluators.set(peer.id, { id: peer.id, type: 'peer' }));

        // Subordinate evaluation
        users.filter(u => u.managerId === userToEvaluate.id)
             .forEach(sub => evaluators.set(sub.id, { id: sub.id, type: 'subordinate' }));

        evaluators.forEach(evaluator => {
          allNewEvaluations.push({
            id: `eval_${Date.now()}_${userToEvaluate.id}_${evaluator.id}`,
            evaluatedId: userToEvaluate.id,
            type: '360',
            scores: {},
            comments: initialComments,
            customFields: [],
            period,
            evaluatorId: evaluator.id,
            status: 'pending',
            createdAt,
            is360Part: true,
            mainEvaluationId: mainEvaluationId,
            evaluation360Type: evaluator.type
          });
        });
      }
    });

    if (allNewEvaluations.length === 0) {
        toast({ title: t('no_evaluations_created_title'), description: t('no_evaluations_created_desc'), variant: "default" });
        return;
    }

    onSubmit(allNewEvaluations);
  };

  const availableRoles = useMemo(() => {
    if (currentUser.role !== 'admin') return [];
    return roles;
  }, [roles, currentUser]);

  const competenciesForSelectedRole = useMemo(() => {
    if (!selectedRole) return [];
    return competencies.filter(c => c.roles?.includes(selectedRole));
  }, [selectedRole, competencies]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border text-foreground max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('new_competence_evaluation')}</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {t('new_competence_evaluation_desc_by_role')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-3 max-h-[65vh] overflow-y-auto pr-2 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>{t('role_to_evaluate')}</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="bg-input border-border">
                  <SelectValue placeholder={t('select_a_role')} />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.length > 0 ? (
                    availableRoles.map(r => (
                      <SelectItem key={r.id} value={r.id || ''}>
                        {r.name}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-xs text-muted-foreground">{t('no_roles_to_evaluate')}</div>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t('evaluation_type')}</Label>
              <Select value={evaluationType} onValueChange={setEvaluationType} disabled={!selectedRole}>
                <SelectTrigger className="bg-input border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="180">{t('eval_type_180')}</SelectItem>
                  <SelectItem value="360">{t('eval_type_360')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-1.5">
            <Label>{t('competencies_to_be_evaluated')}</Label>
            <div className="space-y-2 p-3 bg-input rounded-md border border-border max-h-40 overflow-y-auto">
                {selectedRole ? (
                  competenciesForSelectedRole.length > 0 ? (
                    competenciesForSelectedRole.map(competency => (
                      <div key={competency.id} className="text-xs text-muted-foreground p-1.5 bg-background rounded">
                        {competency.name}
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-muted-foreground p-1.5">{t('no_competencies_for_role')}</div>
                  )
                ) : (
                  <div className="text-xs text-muted-foreground p-1.5">{t('select_role_to_see_competencies')}</div>
                )}
            </div>
            <p className="text-xs text-muted-foreground">{t('evaluator_will_score')}</p>
          </div>

          <div className="space-y-1.5">
            <Label>{t('initial_comments_optional')}</Label>
            <Textarea
              value={initialComments}
              onChange={(e) => setInitialComments(e.target.value)}
              className="bg-input border-border text-sm min-h-[80px]"
              placeholder={t('initial_comments_placeholder')}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="text-foreground border-border hover:bg-muted">{t('cancel')}</Button>
          <Button onClick={handleInternalSubmit} className="bg-primary text-primary-foreground hover:bg-primary/90">
            {t('start_evaluation')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EvaluationFormModal;