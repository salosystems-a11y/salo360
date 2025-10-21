
    import React, { useEffect, useMemo } from 'react';
    import { motion } from 'framer-motion';
    import { Users, Award, Clock, Star, CheckCircle, FolderKanban, FileCheck } from 'lucide-react';
    import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
    import { useAuth } from '@/contexts/SupabaseAuthContext';
    import { useData } from '@/contexts/DataContext';
    import { Link } from 'react-router-dom';
    import { useTranslation } from '@/hooks/useTranslation';

    const Dashboard = () => {
      const { user } = useAuth();
      const { users, evaluations, projects, projectEvaluations, refreshData, roles } = useData();
      const t = useTranslation();
      
      const currentUserRole = useMemo(() => {
        if (!user?.role) return null;
        return roles.find(r => r.id === user.role);
      }, [user, roles]);

      useEffect(() => {
        refreshData();
      }, []);

      const visibleData = useMemo(() => {
        if (!user || !currentUserRole) return { users: [], evaluations: [], projects: [], projectEvaluations: [] };

        switch (currentUserRole.id) {
          case 'admin':
            return { users, evaluations, projects, projectEvaluations };
          case 'manager':
            const teamMemberIds = users.filter(u => u.manager_id === user.id).map(u => u.id);
            const allRelevantIds = [user.id, ...teamMemberIds];
            return {
              users: users.filter(u => allRelevantIds.includes(u.id)),
              evaluations: evaluations.filter(e => allRelevantIds.includes(e.evaluated_id) || allRelevantIds.includes(e.evaluator_id)),
              projects: projects.filter(p => p.creator_id === user.id || p.participants.some(partId => allRelevantIds.includes(partId))),
              projectEvaluations: projectEvaluations.filter(pe => allRelevantIds.includes(pe.evaluated_user_id) || pe.evaluator_id === user.id)
            };
          case 'employee':
            return {
              users: users.filter(u => u.id === user.id),
              evaluations: evaluations.filter(e => e.evaluated_id === user.id || e.evaluator_id === user.id),
              projects: projects.filter(p => p.participants.includes(user.id)),
              projectEvaluations: projectEvaluations.filter(pe => pe.evaluated_user_id === user.id || pe.evaluator_id === user.id)
            };
          default:
            return { users: [], evaluations: [], projects: [], projectEvaluations: [] };
        }
      }, [user, users, evaluations, projects, projectEvaluations, currentUserRole]);

      const subordinatesCount = useMemo(() => {
        if (user?.role === 'admin' || user?.role === 'manager') {
          return users.filter(u => u.manager_id === user.id).length;
        }
        return 0;
      }, [users, user]);

      const stats = [
        {
          title: t('total_users'),
          value: users.length,
          icon: Users,
          color: 'from-blue-500 to-cyan-500',
          roles: ['admin', 'manager'],
          subtext: subordinatesCount > 0 ? t('subordinates', { count: subordinatesCount }) : null
        },
        {
          title: t('my_evaluations'),
          value: visibleData.evaluations.filter(e => e.evaluated_id === user?.id).length,
          icon: Award,
          color: 'from-purple-500 to-pink-500',
          roles: ['employee']
        },
        {
          title: t('competence_evaluations'),
          value: visibleData.evaluations.filter(e => e.status === 'completed').length,
          icon: Award,
          color: 'from-purple-500 to-pink-500',
          roles: ['admin', 'manager']
        },
        {
          title: t('active_projects'),
          value: visibleData.projects.filter(p => p.status === 'open').length,
          icon: FolderKanban,
          color: 'from-green-500 to-emerald-500',
          roles: ['admin', 'manager', 'employee']
        },
        {
          title: t('project_evals'),
          value: visibleData.projectEvaluations.length,
          icon: FileCheck,
          color: 'from-orange-500 to-red-500',
          roles: ['admin', 'manager', 'employee']
        }
      ];

      const recentActivities = useMemo(() => {
        const competenceActivities = visibleData.evaluations.map(e => ({
          type: 'competence',
          id: e.id,
          evaluatedId: e.evaluated_id,
          evaluatorId: e.evaluator_id,
          status: e.status,
          date: e.created_at,
          period: e.period,
        }));

        const projectActivities = visibleData.projectEvaluations.map(pe => ({
          type: 'project',
          id: pe.id,
          evaluatedId: pe.evaluated_user_id,
          evaluatorId: pe.evaluator_id,
          status: 'completed',
          date: pe.created_at,
          projectId: pe.project_id,
        }));

        return [...competenceActivities, ...projectActivities]
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 5);
      }, [visibleData]);
        
      const getMySituation = () => {
          if (!user || !currentUserRole) return { type: null, data: [] };

          const myPendingCompetenceEvals = evaluations.filter(e => e.evaluator_id === user.id && e.status === 'pending');
          
          const myPendingProjectEvals = projects.filter(p => p.participants?.includes(user.id)).filter(p => {
              const userEvaluationsForProject = projectEvaluations.filter(pe => pe.project_id === p.id && pe.evaluator_id === user.id);
              const participantsToEvaluate = p.participants.filter(pId => pId !== user.id);
              return userEvaluationsForProject.length < participantsToEvaluate.length;
          });


          if (currentUserRole?.id === 'employee') {
              const myLastCompleted = visibleData.evaluations
                  .filter(e => e.evaluated_id === user.id && e.status === 'completed')
                  .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
              
              let lastScore = "N/A";
              if (myLastCompleted && myLastCompleted.scores && Object.values(myLastCompleted.scores).length > 0) {
                  const scores = Object.values(myLastCompleted.scores);
                  lastScore = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
              }

              return {
                  type: 'employee',
                  data: [
                      { icon: Clock, title: t('pending_competence_evals'), value: t('to_respond', { count: myPendingCompetenceEvals.length }), color: "blue", link: "/evaluations?filter=pending" },
                      { icon: Star, title: t('last_avg_score_competence'), value: lastScore, color: "green", subtext: myLastCompleted ? t('in_period', { period: myLastCompleted.period }) : '' }
                  ]
              };
          } else { // Manager or Admin
              return {
                  type: 'manager',
                  data: [
                      { icon: Clock, title: t('pending_competence_evals'), value: t('to_respond', { count: myPendingCompetenceEvals.length }), color: "purple", link: "/evaluations?filter=pending" },
                      { icon: FolderKanban, title: t('pending_project_evals'), value: t('projects_count', { count: myPendingProjectEvals.length }), color: "teal", link: "/projects" },
                      { icon: CheckCircle, title: t('view_reports'), value: t('analyze_performance'), color: "orange", link: "/reports" }
                  ]
              };
          }
      };
      
      const mySituation = getMySituation();

      if (!currentUserRole) {
        return <div className="flex h-screen w-full items-center justify-center">A carregar dados do utilizador...</div>
      }

      return (
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl lg:text-4xl font-semibold text-foreground mb-1">
              {t('welcome')}, {user?.name}!
            </h1>
            <p className="text-muted-foreground">
              {t('dashboard_summary')}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.filter(s => s.roles.includes(currentUserRole.id)).map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="bg-card border-border card-hover">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-muted-foreground text-sm font-medium">
                            {stat.title}
                          </p>
                          <p className="text-3xl font-bold text-foreground mt-2">
                            {stat.value}
                          </p>
                          {stat.subtext && <p className="text-xs text-muted-foreground mt-1">{stat.subtext}</p>}
                        </div>
                        <div className={`p-3 rounded-full bg-gradient-to-r ${stat.color}`}>
                          <Icon className="h-6 w-6 text-primary-foreground" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card className="bg-card border-border h-full">
                <CardHeader>
                  <CardTitle className="text-foreground">{t('recent_activity')}</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    {t('recent_activity_desc')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivities.length > 0 ? (
                      recentActivities.map((activity) => {
                        const evaluatedUser = users.find(u => u.id === activity.evaluatedId);
                        const evaluatorUser = users.find(u => u.id === activity.evaluatorId);
                        const projectName = activity.type === 'project' ? projects.find(p => p.id === activity.projectId)?.name : '';
                        
                        return (
                          <div key={activity.id} className="flex items-center space-x-4 p-3 bg-background rounded-lg border border-border">
                            <img
                              src={evaluatedUser?.avatar_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'}
                              alt={evaluatedUser?.name}
                              className="w-10 h-10 rounded-full"
                            />
                            <div className="flex-1">
                              <p className="text-foreground font-medium text-sm">
                                {evaluatedUser?.name || t('unknown_user')}
                              </p>
                              <p className="text-muted-foreground text-xs">
                                {activity.type === 'competence' 
                                  ? `${t('evaluated_by', { name: evaluatorUser?.name || 'N/A' })} • ${t('competence_short')}`
                                  : `${t('evaluated_by', { name: evaluatorUser?.name || 'N/A' })} • ${t('project_short')}: ${projectName}`
                                }
                              </p>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              activity.status === 'completed' 
                                ? 'bg-green-500/20 text-green-700 dark:text-green-300' 
                                : activity.status === 'pending'
                                ? 'bg-orange-500/20 text-orange-700 dark:text-orange-300'
                                : 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300'
                            }`}>
                              {t(`status_${activity.status}`)}
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-muted-foreground text-center py-8">
                        {t('no_recent_activity')}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <Card className="bg-card border-border h-full">
                <CardHeader>
                  <CardTitle className="text-foreground">{t('my_situation')}</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    {t('my_situation_desc')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mySituation.data.map((item, index) => {
                      const ItemWrapper = item.link ? Link : 'div';
                      const props = item.link ? { to: item.link } : {};
                      
                       const colorClasses = {
                            blue: "bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400",
                            green: "bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400",
                            purple: "bg-purple-500/10 border-purple-500/30 text-purple-600 dark:text-purple-400",
                            orange: "bg-orange-500/10 border-orange-500/30 text-orange-600 dark:text-orange-400",
                            teal: "bg-teal-500/10 border-teal-500/30 text-teal-600 dark:text-teal-400",
                        };
                        const hoverClasses = item.link ? "hover:bg-accent/50 transition-colors duration-200 cursor-pointer" : "";

                      return (
                         <ItemWrapper key={index} {...props} className={`p-4 rounded-lg border flex items-start gap-4 ${colorClasses[item.color]} ${hoverClasses}`}>
                            <item.icon className={`h-6 w-6 mt-1 ${colorClasses[item.color].split(' ')[2]}`} />
                            <div>
                                <h3 className={`font-medium mb-1 ${colorClasses[item.color].split(' ')[2]}`}>{item.title}</h3>
                                <p className="text-foreground text-lg font-bold">{item.value}</p>
                                {item.subtext && <p className="text-muted-foreground text-xs mt-1">{item.subtext}</p>}
                            </div>
                        </ItemWrapper>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      );
    };

    export default Dashboard;
  