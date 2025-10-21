import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import EvaluationList from '@/components/evaluations/EvaluationList';
import { useTranslation } from '@/hooks/useTranslation';

const Evaluations = () => {
  const { evaluations, users, roles, competencies, refreshData } = useData();
  const { user: currentUser } = useAuth();
  const location = useLocation();
  const t = useTranslation();

  const queryParams = new URLSearchParams(location.search);
  const initialTab = queryParams.get('filter') === 'pending' ? 'pending' : 'my-evaluations';

  const getUserName = (userId) => {
    const user = users.find(u => u.id === userId);
    return user ? user.name : t('unknown_user');
  };
  
  const getSubordinateIds = (managerId) => {
      return users.filter(u => u.manager_id === managerId).map(u => u.id);
  }

  const groupEvaluationsByType = (evals, contextUserId) => {
    const grouped = { self: [], peer: [], subordinate: [], manager: [] };
    
    evals.forEach(e => {
        if (e.evaluation360Type) {
            if (grouped[e.evaluation360Type]) {
                grouped[e.evaluation360Type].push(e);
            }
        } else if (e.type === '180') {
            const evaluatedUser = users.find(u => u.id === e.evaluated_id);
            const evaluatorUser = users.find(u => u.id === e.evaluator_id);
            if (!evaluatedUser || !evaluatorUser) return;

            if (e.evaluated_id === contextUserId) {
                if (evaluatedUser.manager_id === evaluatorUser.id) {
                    grouped.manager.push(e);
                }
            } else if (e.evaluator_id === contextUserId) {
                 if (evaluatorUser.manager_id === evaluatedUser.id) {
                    grouped.subordinate.push(e);
                }
            } else {
                 if (e.evaluated_id === e.evaluator_id) {
                    grouped.self.push(e);
                 } else if (evaluatedUser.manager_id === evaluatorUser.id) {
                    grouped.manager.push(e);
                 } else if (evaluatorUser.manager_id === evaluatedUser.id) {
                    grouped.subordinate.push(e);
                 } else if (evaluatedUser.role === evaluatorUser.role) {
                    grouped.peer.push(e);
                 }
            }
        }
    });
    return grouped;
  };

  const { myEvaluations, teamEvaluations, pendingEvaluations } = useMemo(() => {
    if (!currentUser) return { myEvaluations: {}, teamEvaluations: {}, pendingEvaluations: {} };

    const myEvals = evaluations.filter(e => e.evaluated_id === currentUser.id && e.status === 'completed');
    const pendingEvals = evaluations.filter(e => e.evaluator_id === currentUser.id && e.status === 'pending');
    
    let teamEvals = [];
    let teamContextId;
    if (currentUser.role === 'manager') {
      const teamMemberIds = getSubordinateIds(currentUser.id);
      teamEvals = evaluations.filter(e => teamMemberIds.includes(e.evaluated_id) && e.status === 'completed');
      teamContextId = currentUser.id;
    } else if (currentUser.role === 'admin') {
      teamEvals = evaluations.filter(e => e.status === 'completed');
      teamContextId = null;
    }

    return { 
      myEvaluations: groupEvaluationsByType(myEvals, currentUser.id), 
      teamEvaluations: groupEvaluationsByType(teamEvals, teamContextId), 
      pendingEvaluations: groupEvaluationsByType(pendingEvals, currentUser.id)
    };
  }, [evaluations, currentUser, users]);
  
  const pendingCount = Object.values(pendingEvaluations).reduce((sum, arr) => sum + arr.length, 0);

  const currentUserRoleDetails = roles.find(r => r.id === currentUser.role);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-semibold text-foreground mb-1">{t('competence_management_title')}</h1>
        <p className="text-muted-foreground text-sm">{t('competence_management_desc')}</p>
      </motion.div>

      <Tabs defaultValue={initialTab} className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 bg-input p-1 h-auto sm:h-10">
          <TabsTrigger value="my-evaluations">{t('my_evals_tab')}</TabsTrigger>
          <TabsTrigger value="pending">{t('pending_evals_tab', { count: pendingCount })}</TabsTrigger>
          {(currentUserRoleDetails?.id === 'admin' || currentUserRoleDetails?.id === 'manager') && (
            <TabsTrigger value="team-evaluations">{t('team_evals_tab')}</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="my-evaluations" className="mt-4">
          <EvaluationList
            groupedEvaluations={myEvaluations}
            emptyMessage={t('not_evaluated_yet')}
            getUserName={getUserName}
            currentUser={currentUser}
            roles={roles}
            saveEvaluations={refreshData}
            allEvaluations={evaluations}
            competencies={competencies}
          />
        </TabsContent>

        <TabsContent value="pending" className="mt-4">
          <EvaluationList
            groupedEvaluations={pendingEvaluations}
            emptyMessage={t('no_pending_evals')}
            isPendingList={true}
            getUserName={getUserName}
            currentUser={currentUser}
            roles={roles}
            saveEvaluations={refreshData}
            allEvaluations={evaluations}
            competencies={competencies}
          />
        </TabsContent>

        {(currentUserRoleDetails?.id === 'admin' || currentUserRoleDetails?.id === 'manager') && (
          <TabsContent value="team-evaluations" className="mt-4">
            <EvaluationList
              groupedEvaluations={teamEvaluations}
              emptyMessage={t('no_team_evals')}
              getUserName={getUserName}
              currentUser={currentUser}
              roles={roles}
              saveEvaluations={refreshData}
              allEvaluations={evaluations}
              competencies={competencies}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default Evaluations;