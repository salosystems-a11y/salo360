
import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { useTranslation } from '@/hooks/useTranslation';
import { supabase } from '@/lib/customSupabaseClient';
import { useData } from '@/contexts/DataContext';

const EvaluationFormModal = ({ isOpen, onClose, users, competencies, currentUser, roles }) => {
  const t = useTranslation();
  const { refreshData } = useData();
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

  const handleInternalSubmit = async () => {
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
    const userMap = new Map(users.map(u => [u.id, u]));

    usersToEvaluate.forEach(userToEvaluate => {
      const mainEvaluationId = crypto.randomUUID(); // Used for grouping 360 evaluations

      if (evaluationType === '180') {
        const manager = userMap.get(userToEvaluate.manager_id);
        if (manager) {
          allNewEvaluations.push({
            id: crypto.randomUUID(),
            evaluated_id: userToEvaluate.id,
            type: '180',
            scores: {},
            comments: initialComments,
            custom_fields: [],
            period,
            evaluator_id: manager.id,
            status: 'pending',
            is_360_part: false,
            main_evaluation_id: null,
            evaluation_360_type: 'manager' // Direct manager evaluation
          });
        } else {
          toast({ title: t('error'), description: t('no_manager_found_for_180', { name: userToEvaluate.name }), variant: "destructive" });
        }
      } else if (evaluationType === '360') {
        // Collect all potential evaluators for a 360 evaluation
        const evaluatorsFor360 = [];

        // Self-evaluation
        evaluatorsFor360.push({ id: userToEvaluate.id, type: 'self' });

        // Manager evaluation
        const manager = userMap.get(userToEvaluate.manager_id);
        if (manager) {
          evaluatorsFor360.push({ id: manager.id, type: 'manager' });
        }

        // Subordinates evaluation (if userToEvaluate is a manager)
        const subordinates = users.filter(u => u.manager_id === userToEvaluate.id);
        subordinates.forEach(sub => evaluatorsFor360.push({ id: sub.id, type: 'subordinate' }));

        // Peers evaluation (all other users not already included, not managers/subordinates of each other)
        users.forEach(potentialEvaluator => {
          if (potentialEvaluator.id !== userToEvaluate.id && // Not self
              potentialEvaluator.id !== manager?.id && // Not manager
              !subordinates.some(sub => sub.id === potentialEvaluator.id) && // Not subordinate
              userToEvaluate.manager_id !== potentialEvaluator.id && // Current user is not manager of potential evaluator (covered by peer)
              potentialEvaluator.role === selectedRole // Only peers in the same role can evaluate
            ) {
            evaluatorsFor360.push({ id: potentialEvaluator.id, type: 'peer' });
          }
        });

        evaluatorsFor360.forEach(evaluator => {
          allNewEvaluations.push({
            id: crypto.randomUUID(),
            evaluated_id: userToEvaluate.id,
            type: '360',
            scores: {},
            comments: initialComments,
            custom_fields: [],
            period,
            evaluator_id: evaluator.id,
            status: 'pending',
            is_360_part: true,
            main_evaluation_id: mainEvaluationId,
            evaluation_360_type: evaluator.type
          });
        });
      }
    });

    if (allNewEvaluations.length === 0) {
        toast({ title: t('no_evaluations_created_title'), description: t('no_evaluations_created_desc'), variant: "default" });
        return;
    }

    const { error } = await supabase.from('evaluations').insert(allNewEvaluations);

    if (error) {
      toast({ title: t('error'), description: error.message, variant: 'destructive' });
    } else {
      toast({ title: t('success'), description: t('evaluation_started_notification') });
      refreshData();
      onClose();
    }
  };

  const availableRoles = useMemo(() => {
    if (currentUser.role !== 'admin') return [];
    return roles;
  }, [roles, currentUser]);

  const competenciesForSelectedRole = useMemo(() => {
    if (!selectedRole) return [];
    // Assuming roles have a 'competencies' array field containing competence IDs
    const selectedRoleObj = roles.find(r => r.id === selectedRole);
    if (selectedRoleObj && selectedRoleObj.competencies) {
      return competencies.filter(c => selectedRoleObj.competencies.includes(c.id));
    }
    return [];
  }, [selectedRole, competencies, roles]);

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
          
          <div className="p-3 bg-input rounded-md border border-border text-xs text-muted-foreground">
            {evaluationType === '180' ? t('eval_type_180_desc') : t('eval_type_360_desc')}
          </div>

          <div className="space-y-1.5">
            <Label>{t('competencies_to_be_evaluated')}</Label>
            <div className="space-y-2 p-3 bg-input rounded-md border border-border max-h-40 overflow-y-auto">
                {selectedRole ? (
                  competenciesForSelectedRole.length > 0 ? (
                    competenciesForSelectedRole.map(competency => (
                      <div key={competency.id} className="text-sm text-foreground p-1.5 bg-background rounded">
                        {competency.name}
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground p-1.5">{t('no_competencies_for_role')}</div>
                  )
                ) : (
                  <div className="text-sm text-muted-foreground p-1.5">{t('select_role_to_see_competencies')}</div>
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
