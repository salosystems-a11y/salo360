
    import React, { useState, useMemo } from 'react';
    import { useAuth } from '@/contexts/SupabaseAuthContext';
    import { useData } from '@/contexts/DataContext';
    import { Button } from '@/components/ui/button';
    import { Separator } from '@/components/ui/separator';
    import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
    import { toast } from '@/components/ui/use-toast';
    import { useTranslation } from '@/hooks/useTranslation';
    import EvaluationFormModal from '@/components/evaluations/EvaluationFormModal';
    import EvaluationList from '@/components/evaluations/EvaluationList';
    import { MessageSquarePlus } from 'lucide-react';
    import { motion } from 'framer-motion';
    import { Helmet } from 'react-helmet';
    import { supabase } from '@/lib/customSupabaseClient';

    const Evaluations = () => {
      const { user } = useAuth();
      const { evaluations, users, currentUser, refreshData, roles, competencies } = useData();
      const t = useTranslation();

      const [isEvaluationFormModalOpen, setIsEvaluationFormModalOpen] = useState(false);

      const getDisplayName = (userId) => {
        const foundUser = users.find(u => u.id === userId);
        return foundUser ? foundUser.name : t('unknown_user');
      };

      const handleRespondEvaluation = async (evaluationId, scores, comments) => {
        const { error } = await supabase.from('evaluations').update({
          scores: scores,
          comments: comments,
          status: 'completed',
          completed_at: new Date().toISOString(),
        }).eq('id', evaluationId);

        if (error) {
          toast({
            title: t('error'),
            description: error.message,
            variant: 'destructive',
          });
        } else {
          toast({
            title: t('evaluation_sent'),
            description: t('response_registered'),
            variant: 'success',
          });
          refreshData();
        }
      };

      const groupedEvaluations = useMemo(() => {
        const grouped = {
          myPending: [],
          myCompleted: [],
          myAutoEvaluations: [],
          myPeerEvaluations: [],
          mySubordinateEvaluations: [],
          myManagerEvaluations: [],
          myTeamEvaluations: [],
        };

        if (!currentUser || !evaluations || evaluations.length === 0) {
          return grouped;
        }

        evaluations.forEach(evalItem => {
          // My Evaluations tab
          if (evalItem.evaluator_id === currentUser.id) {
            if (evalItem.status === 'pending') {
              grouped.myPending.push(evalItem);
            } else if (evalItem.status === 'completed') {
              grouped.myCompleted.push(evalItem);
            }
          }

          // Evaluations Received (for Profile page, but also useful here for categorisation)
          if (evalItem.evaluated_id === currentUser.id) {
            if (evalItem.evaluation_360_type === 'self' || (evalItem.type === '180' && evalItem.evaluator_id === evalItem.evaluated_id)) {
              grouped.myAutoEvaluations.push(evalItem);
            } else if (evalItem.evaluation_360_type === 'peer') {
              grouped.myPeerEvaluations.push(evalItem);
            } else if (evalItem.evaluation_360_type === 'subordinate') {
              grouped.mySubordinateEvaluations.push(evalItem);
            } else if (evalItem.evaluation_360_type === 'manager' || (evalItem.type === '180' && evalItem.evaluator_id !== evalItem.evaluated_id)) {
              grouped.myManagerEvaluations.push(evalItem);
            }
          }

          // Team Evaluations tab (if current user is a manager or admin)
          if (currentUser.role === 'admin' || currentUser.role === 'manager') {
            const evaluatedUser = users.find(u => u.id === evalItem.evaluated_id);
            if (evaluatedUser && evaluatedUser.manager_id === currentUser.id) {
              grouped.myTeamEvaluations.push(evalItem);
            }
            if (currentUser.role === 'admin' && evaluatedUser) {
              if (!grouped.myTeamEvaluations.some(e => e.id === evalItem.id)) {
                grouped.myTeamEvaluations.push(evalItem);
              }
            }
          }
        });

        return grouped;
      }, [evaluations, users, currentUser]);

      const canCreateEvaluations = currentUser?.role === 'admin';

      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <Helmet>
            <title>{t('competence_management_title')} | Hostinger Horizons</title>
            <meta name="description" content={t('competence_management_desc')} />
          </Helmet>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">{t('competence_management_title')}</h1>
              <p className="text-muted-foreground">{t('competence_management_desc')}</p>
            </div>
            {canCreateEvaluations && (
              <Button onClick={() => setIsEvaluationFormModalOpen(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <MessageSquarePlus className="mr-2 h-4 w-4" />
                {t('new_evaluation')}
              </Button>
            )}
          </div>

          <Separator />

          <Tabs defaultValue="my-pending">
            <TabsList className="grid w-full grid-cols-3 md:w-fit bg-card border-border">
              <TabsTrigger value="my-pending" className="flex items-center space-x-2">
                <span>{t('pending_evals_tab', { count: groupedEvaluations.myPending.length })}</span>
              </TabsTrigger>
              <TabsTrigger value="my-evals">{t('my_evals_tab')}</TabsTrigger>
              <TabsTrigger value="team-evals">{t('team_evals_tab')}</TabsTrigger>
            </TabsList>

            <TabsContent value="my-pending" className="mt-4">
              <EvaluationList
                title={t('pending_evals_tab', { count: groupedEvaluations.myPending.length })}
                description={groupedEvaluations.myPending.length > 0 ? "" : t('no_pending_evals')}
                evaluations={groupedEvaluations.myPending}
                getUserName={getDisplayName}
                onRespond={handleRespondEvaluation}
                type="pending"
                currentUser={currentUser}
              />
            </TabsContent>

            <TabsContent value="my-evals" className="mt-4">
              <h2 className="text-2xl font-bold text-foreground mb-4">{t('my_evals_tab')}</h2>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="space-y-6"
              >
                <EvaluationList
                  title={t('self_evaluation_title')}
                  description={groupedEvaluations.myAutoEvaluations.length > 0 ? "" : t('no_evaluations_in_category')}
                  evaluations={groupedEvaluations.myAutoEvaluations}
                  getUserName={getDisplayName}
                  type="received"
                  currentUser={currentUser}
                />
                <EvaluationList
                  title={t('peer_evaluation_title')}
                  description={groupedEvaluations.myPeerEvaluations.length > 0 ? "" : t('no_evaluations_in_category')}
                  evaluations={groupedEvaluations.myPeerEvaluations}
                  getUserName={getDisplayName}
                  type="received"
                  currentUser={currentUser}
                />
                <EvaluationList
                  title={t('subordinate_evaluation_title')}
                  description={groupedEvaluations.mySubordinateEvaluations.length > 0 ? "" : t('no_evaluations_in_category')}
                  evaluations={groupedEvaluations.mySubordinateEvaluations}
                  getUserName={getDisplayName}
                  type="received"
                  currentUser={currentUser}
                />
                <EvaluationList
                  title={t('manager_evaluation_title')}
                  description={groupedEvaluations.myManagerEvaluations.length > 0 ? "" : t('no_evaluations_in_category')}
                  evaluations={groupedEvaluations.myManagerEvaluations}
                  getUserName={getDisplayName}
                  type="received"
                  currentUser={currentUser}
                />
              </motion.div>
            </TabsContent>

            <TabsContent value="team-evals" className="mt-4">
              <EvaluationList
                title={t('team_evals_tab')}
                description={groupedEvaluations.myTeamEvaluations.length > 0 ? "" : t('no_team_evals')}
                evaluations={groupedEvaluations.myTeamEvaluations}
                getUserName={getDisplayName}
                type="team"
                currentUser={currentUser}
              />
            </TabsContent>
          </Tabs>

          <EvaluationFormModal
            isOpen={isEvaluationFormModalOpen}
            onClose={() => setIsEvaluationFormModalOpen(false)}
            users={users}
            competencies={competencies}
            currentUser={currentUser}
            roles={roles}
          />
        </motion.div>
      );
    };

    export default Evaluations;
  