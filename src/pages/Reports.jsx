
    import React, { useState, useMemo, useEffect } from 'react';
    import { motion } from 'framer-motion';
    import { Download, FileDown, BarChart, FolderKanban } from 'lucide-react';
    import { Button } from '@/components/ui/button';
    import { useData } from '@/contexts/DataContext';
    import { useAuth } from '@/contexts/SupabaseAuthContext';
    import ReportFilters from '@/components/reports/ReportFilters';
    import ReportSummaryCards from '@/components/reports/ReportSummaryCards';
    import ReportCharts from '@/components/reports/ReportCharts';
    import Evaluation360SummaryTable from '@/components/reports/Evaluation360SummaryTable';
    import ProjectReportCharts from '@/components/reports/ProjectReportCharts';
    import ProjectReportFilters from '@/components/reports/ProjectReportFilters';
    import generatePdfFromElement from '@/utils/pdfExport';
    import { exportToExcel } from '@/utils/excelExport';
    import { toast } from '@/components/ui/use-toast';
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
    import { useTranslation } from '@/hooks/useTranslation';

    const PerformanceReports = ({ headerText, setHeaderText }) => {
      const { users, evaluations, competencies, roles } = useData();
      const { user: currentUser } = useAuth();
      const t = useTranslation();
      
      const currentUserRoleDetails = roles.find(r => r.id === currentUser.role);
      const isManager = currentUserRoleDetails?.id === 'manager';
      const isAdmin = currentUserRoleDetails?.id === 'admin';
      const isEmployee = currentUserRoleDetails?.id === 'employee';

      const [selectedPeriod, setSelectedPeriod] = useState('all');
      const [selectedDepartments, setSelectedDepartments] = useState([]);
      const [selectedCompetencies, setSelectedCompetencies] = useState([]);
      const [selectedUserId, setSelectedUserId] = useState(isEmployee ? currentUser.id : 'all');
      const [selectedEvaluationTypes, setSelectedEvaluationTypes] = useState([]);
      const [selectedYears, setSelectedYears] = useState([]);

      const availableYears = useMemo(() => {
        const years = new Set(evaluations.map(e => new Date(e.created_at).getFullYear()));
        return Array.from(years).sort((a, b) => b - a);
      }, [evaluations]);

      useEffect(() => {
        if (isEmployee) {
          setSelectedUserId(currentUser.id);
        }
      }, [isEmployee, currentUser.id]);
      
      const baseUsersForFilter = useMemo(() => {
        if (isAdmin) return users;
        if (isManager) return users.filter(u => u.manager_id === currentUser.id || u.id === currentUser.id);
        if (isEmployee) return users.filter(u => u.id === currentUser.id);
        return [];
      }, [users, isAdmin, isManager, isEmployee, currentUser.id]);

      const filteredEvaluations = useMemo(() => {
        return evaluations.filter(evaluation => {
          if (evaluation.status !== 'completed') return false;

          const evaluatedUserDetails = users.find(u => u.id === evaluation.evaluated_id);
          if (!evaluatedUserDetails) return false;

          const isRelevantForEmployee = evaluation.evaluated_id === currentUser.id || evaluation.evaluator_id === currentUser.id;
          if (isEmployee && !isRelevantForEmployee) return false;
          
          if (isManager && !isAdmin) { 
            const teamMemberIds = baseUsersForFilter.map(u => u.id);
            const isEvaluationInTeamContext = teamMemberIds.includes(evaluation.evaluated_id) || teamMemberIds.includes(evaluation.evaluator_id);
            if (!isEvaluationInTeamContext) return false;
          }
          
          if (selectedDepartments.length > 0 && !selectedDepartments.includes(evaluatedUserDetails.department)) return false;
          if (selectedUserId !== 'all' && evaluation.evaluated_id !== selectedUserId) return false;
          if (selectedEvaluationTypes.length > 0 && !selectedEvaluationTypes.includes(evaluation.type)) return false;
          if (selectedYears.length > 0 && !selectedYears.includes(new Date(evaluation.created_at).getFullYear())) return false;

          if (selectedCompetencies.length > 0) {
            const hasSelectedCompetency = Object.keys(evaluation.scores || {}).some(compId => selectedCompetencies.includes(compId));
            if (!hasSelectedCompetency) return false;
          }
          
          if (selectedPeriod !== 'all' && evaluation.period) {
              const evalYear = parseInt(evaluation.period.split(' ')[1]);
              const evalQuarter = parseInt(evaluation.period.charAt(1));
              const now = new Date();
              const currentYear = now.getFullYear();
              const currentQuarter = Math.ceil((now.getMonth() + 1) / 3);

              if (selectedPeriod === 'quarter' && !(evalYear === currentYear && evalQuarter === currentQuarter)) return false;
              if (selectedPeriod === 'year' && evalYear !== currentYear) return false;
          }
          
          return true;
        });
      }, [evaluations, users, selectedPeriod, selectedDepartments, selectedCompetencies, selectedUserId, selectedEvaluationTypes, selectedYears, isAdmin, isManager, isEmployee, currentUser.id, baseUsersForFilter]);

      const evaluatedUserIds = useMemo(() => new Set(filteredEvaluations.map(e => e.evaluated_id)), [filteredEvaluations]);
      const availableUsersForFilter = useMemo(() => baseUsersForFilter.filter(u => evaluatedUserIds.has(u.id)), [baseUsersForFilter, evaluatedUserIds]);

      useEffect(() => {
        if (selectedUserId !== 'all' && !availableUsersForFilter.find(u => u.id === selectedUserId)) {
          setSelectedUserId('all');
        }
      }, [availableUsersForFilter, selectedUserId]);

       useEffect(() => {
        if (selectedUserId !== 'all') {
          const user = users.find(u => u.id === selectedUserId);
          setHeaderText(t('report_header_for', { target: user?.name || '' }));
        } else if (selectedDepartments.length > 0) {
          setHeaderText(t('report_header_for', { target: selectedDepartments.join(', ') }));
        } else {
          setHeaderText(t('competence_reports'));
        }
      }, [selectedUserId, selectedDepartments, users, t, setHeaderText]);

      const availableDepartmentsForFilter = useMemo(() => {
          if (isAdmin) return [...new Set(users.map(u => u.department).filter(Boolean))];
          if (isManager) return [...new Set(baseUsersForFilter.map(u => u.department).filter(Boolean))];
          return [];
      }, [users, baseUsersForFilter, isAdmin, isManager]);
      
      const getPerformanceData = () => {
        const performanceRanges = {
          'excelente': { label: t('excellent_performance'), count: 0, color: '#10B981' },
          'bom': { label: t('good_performance'), count: 0, color: '#3B82F6' },
          'regular': { label: t('regular_performance'), count: 0, color: '#F59E0B' },
          'melhorar': { label: t('needs_improvement_performance'), count: 0, color: '#EF4444' }
        };
        
        const processedEvals = new Map();
        filteredEvaluations.forEach(evaluation => {
          const key = evaluation.is_360_part ? evaluation.main_evaluation_id : evaluation.id;
          if (!processedEvals.has(key)) processedEvals.set(key, []);
          processedEvals.get(key).push(evaluation);
        });

        processedEvals.forEach(evalGroup => {
            const average = evalGroup.reduce((sum, e) => {
                const scores = Object.values(e.scores || {});
                return sum + (scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0);
            }, 0) / evalGroup.length;
            
            if (average >= 4.5) performanceRanges.excelente.count++;
            else if (average >= 3.5) performanceRanges.bom.count++;
            else if (average >= 2.5) performanceRanges.regular.count++;
            else if (average > 0) performanceRanges.melhorar.count++;
        });

        return Object.values(performanceRanges).map(range => ({
          label: range.label, 
          value: range.count,
          color: range.color
        })).filter(item => item.value > 0);
      };

      const getCompetencyData = () => {
        const competencyScores = {};
        const relevantCompetencies = selectedCompetencies.length > 0 
          ? competencies.filter(c => selectedCompetencies.includes(c.id))
          : competencies;

        relevantCompetencies.forEach(comp => { competencyScores[comp.id] = { name: comp.name, total: 0, count: 0 }; });

        filteredEvaluations.forEach(evaluation => {
            Object.entries(evaluation.scores || {}).forEach(([compId, score]) => {
              if (competencyScores[compId]) {
                competencyScores[compId].total += score;
                competencyScores[compId].count++;
              }
            });
        });
        
        const competencyColors = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#84CC16', '#F97316'];

        return Object.values(competencyScores)
          .filter(data => data.count > 0)
          .map((data, index) => ({
            label: data.name, 
            value: parseFloat((data.total / data.count).toFixed(2)),
            color: competencyColors[index % competencyColors.length]
          }));
      };
      
      const getDepartmentData = () => {
        if (isEmployee) return []; 

        const departmentScores = {};
        availableDepartmentsForFilter.forEach(dept => { departmentScores[dept] = { total: 0, count: 0 }; });
        
        const processedEvals = new Map();
        filteredEvaluations.forEach(evaluation => {
          const key = evaluation.is_360_part ? evaluation.main_evaluation_id : evaluation.id;
          const userDetails = users.find(u => u.id === evaluation.evaluated_id);
          if (userDetails && !processedEvals.has(key)) {
            processedEvals.set(key, { department: userDetails.department, scores: [] });
          }
          if(processedEvals.has(key) && evaluation.scores) {
              const scoresArray = Object.values(evaluation.scores);
              const avg = scoresArray.length > 0 ? scoresArray.reduce((a, b) => a + b, 0) / scoresArray.length : 0;
              if(avg > 0) processedEvals.get(key).scores.push(avg);
          }
        });

        processedEvals.forEach(data => {
            if(departmentScores[data.department] && data.scores.length > 0) {
                departmentScores[data.department].total += data.scores.reduce((a,b) => a+b, 0) / data.scores.length;
                departmentScores[data.department].count++;
            }
        });
        
        const departmentColors = ['#1ABC9C', '#3498DB', '#9B59B6', '#F1C40F', '#E74C3C', '#34495E', '#2ECC71'];

        return Object.entries(departmentScores)
          .filter(([_, data]) => data.count > 0)
          .map(([name, data], index) => ({
            label: name, 
            value: parseFloat((data.total / data.count).toFixed(2)),
            color: departmentColors[index % departmentColors.length]
          }));
      };

      const getEvaluationTypeData = () => {
        if (isEmployee) return [];
        const typeCount = { '180': { label: t('eval_type_180_short'), count: 0, color: '#8B5CF6' }, '360': { label: t('eval_type_360_short'), count: 0, color: '#06B6D4' } }; 
        const processedEvals = new Set();

        filteredEvaluations.forEach(evaluation => {
          const key = evaluation.is_360_part ? evaluation.main_evaluation_id : evaluation.id;
          if (!processedEvals.has(key)) {
            if (typeCount[evaluation.type]) {
              typeCount[evaluation.type].count++;
            }
            processedEvals.add(key);
          }
        });

        return Object.values(typeCount).map(type => ({
            label: type.label,
            value: type.count,
            color: type.color
        })).filter(item => item.value > 0);
      };

      const getComparisonData = () => {
        const usersToCompare = availableUsersForFilter.filter(u => selectedUserId === 'all' ? true : u.id === selectedUserId);
        if (usersToCompare.length < 1) return { data: [], keys: [] };

        const competencyScoresByUser = {};
        const relevantCompetencies = selectedCompetencies.length > 0 
          ? competencies.filter(c => selectedCompetencies.includes(c.id))
          : competencies;

        usersToCompare.forEach(u => {
          competencyScoresByUser[u.id] = { name: u.name };
          relevantCompetencies.forEach(c => competencyScoresByUser[u.id][c.id] = { total: 0, count: 0 });
        });

        filteredEvaluations.forEach(e => {
          if (competencyScoresByUser[e.evaluated_id] && e.scores) {
            Object.entries(e.scores).forEach(([compId, score]) => {
              if (competencyScoresByUser[e.evaluated_id][compId]) {
                competencyScoresByUser[e.evaluated_id][compId].total += score;
                competencyScoresByUser[e.evaluated_id][compId].count++;
              }
            });
          }
        });

        const chartData = relevantCompetencies.map(c => {
          const entry = { label: c.name };
          usersToCompare.forEach(u => {
            const userData = competencyScoresByUser[u.id][c.id];
            entry[u.id] = userData.count > 0 ? parseFloat((userData.total / userData.count).toFixed(2)) : 0;
          });
          return entry;
        });

        const colors = ['#3B82F6', '#10B981', '#EF4444', '#F59E0B', '#8B5CF6', '#06B6D4'];
        const chartKeys = usersToCompare.map((u, i) => ({
          key: u.id,
          name: u.name,
          color: colors[i % colors.length]
        }));

        return { data: chartData.filter(d => chartKeys.some(k => d[k.key] > 0)), keys: chartKeys };
      };

      const getRadarData = () => {
          if (selectedUserId === 'all' || filteredEvaluations.length === 0) {
            return { data: [], keys: [] };
          }

          const types = ['self', 'peer', 'subordinate', 'manager'];
          const scoresByType = {};
          types.forEach(type => {
              scoresByType[type] = { competencies: {} };
              competencies.forEach(c => scoresByType[type].competencies[c.id] = { total: 0, count: 0 });
          });

          const userEvals = filteredEvaluations.filter(e => e.evaluated_id === selectedUserId);

          userEvals.forEach(e => {
              let type = e.evaluation_360_type;
              if (scoresByType[type] && e.scores) {
                  Object.entries(e.scores).forEach(([compId, score]) => {
                      if (scoresByType[type].competencies[compId]) {
                          scoresByType[type].competencies[compId].total += score;
                          scoresByType[type].competencies[compId].count++;
                      }
                  });
              }
          });
          
          const chartData = competencies.map(c => {
              const entry = { competency: c.name };
              types.forEach(type => {
                  const data = scoresByType[type].competencies[c.id];
                  entry[type] = data.count > 0 ? parseFloat((data.total / data.count).toFixed(2)) : 0;
              });
              return entry;
          }).filter(d => types.some(type => d[type] > 0)); 
          
          const colors = { self: '#3B82F6', peer: '#10B981', subordinate: '#F59E0B', manager: '#EF4444' };
          const keys = types
            .filter(type => chartData.some(d => d[type] > 0))
            .map(type => ({ key: type, name: t(type), color: colors[type] }));

          return { data: chartData, keys: keys };
      };

      const getUserName = (id) => users.find(u => u.id === id)?.name || t('unknown_user');

      const totalUniqueEvaluations = new Set(filteredEvaluations.map(e => e.is_360_part ? e.main_evaluation_id : e.id)).size;
      const totalEvals = new Set(evaluations.map(e => e.is_360_part ? e.main_evaluation_id : e.id)).size;

      const averageScore = useMemo(() => {
        if (filteredEvaluations.length === 0) return "0.0";
        const totalScore = filteredEvaluations.reduce((acc, evaluation) => {
            const scores = Object.values(evaluation.scores || {});
            return acc + (scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0);
        }, 0);
        return (totalScore / filteredEvaluations.length).toFixed(2);
      }, [filteredEvaluations]);

      const summaryCardData = {
        totalEvaluations: totalUniqueEvaluations, 
        completedEvaluations: totalUniqueEvaluations,
        averageScore: averageScore,
        completionRate: totalEvals > 0 ? Math.round((totalUniqueEvaluations / totalEvals) * 100) : 0, 
      };
      
      const chartData = {
        performance: getPerformanceData(),
        competencies: getCompetencyData(),
        departments: getDepartmentData(),
        types: getEvaluationTypeData(),
        comparison: getComparisonData(),
        radar: getRadarData(),
      };
      
      const user360Evals = filteredEvaluations.filter(e => e.evaluated_id === selectedUserId && e.type === '360');

      return (
        <>
          <div className="non-printable">
            <ReportFilters
              selectedPeriod={selectedPeriod} setSelectedPeriod={setSelectedPeriod}
              selectedDepartments={selectedDepartments} setSelectedDepartments={setSelectedDepartments}
              selectedCompetencies={selectedCompetencies} setSelectedCompetencies={setSelectedCompetencies}
              selectedUser={selectedUserId} setSelectedUser={setSelectedUserId} 
              selectedEvaluationTypes={selectedEvaluationTypes} setSelectedEvaluationTypes={setSelectedEvaluationTypes}
              selectedYears={selectedYears} setSelectedYears={setSelectedYears}
              departments={availableDepartmentsForFilter} users={availableUsersForFilter}
              competencies={competencies}
              availableYears={availableYears}
              currentUserRole={currentUserRoleDetails}
            />

            <div className="mt-6">
              <ReportSummaryCards data={summaryCardData} />
            </div>
          </div>
          
          <div id="report-content-printable-section" className="mt-6 space-y-6">
             <div className="print-only hidden my-4">
                <h2 className="text-xl font-bold">{headerText}</h2>
              </div>
            {selectedUserId !== 'all' && (
                <Evaluation360SummaryTable 
                    data={chartData.radar} 
                    evaluations={user360Evals}
                    competencies={competencies}
                    getUserName={getUserName}
                />
            )}
            <ReportCharts 
              chartData={chartData} 
              currentUserRole={currentUserRoleDetails}
              selectedUserId={selectedUserId}
            />
          </div>

          {filteredEvaluations.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="text-center py-10"
            >
              <p className="text-muted-foreground text-md">{t('no_report_data')}</p>
            </motion.div>
          )}
        </>
      );
    };

    const ProjectReports = () => {
        const { users, projects, projectEvaluations } = useData();
        const t = useTranslation();

        const [selectedProjectId, setSelectedProjectId] = useState('all');
        const [selectedUserId, setSelectedUserId] = useState('all');
        const [selectedStatus, setSelectedStatus] = useState('all');

        const filteredProjects = useMemo(() => {
          return projects.filter(p => selectedStatus === 'all' || p.status === selectedStatus);
        }, [projects, selectedStatus]);

        const usersInSelectedProject = useMemo(() => {
          if (selectedProjectId === 'all') {
            const allParticipantIds = new Set(filteredProjects.flatMap(p => p.participants));
            return users.filter(u => allParticipantIds.has(u.id));
          }
          const project = filteredProjects.find(p => p.id === selectedProjectId);
          return project ? users.filter(u => project.participants.includes(u.id)) : [];
        }, [selectedProjectId, filteredProjects, users]);

        useEffect(() => {
          if (selectedUserId !== 'all' && !usersInSelectedProject.find(u => u.id === selectedUserId)) {
            setSelectedUserId('all');
          }
        }, [usersInSelectedProject, selectedUserId]);

        const filteredProjectEvals = useMemo(() => {
            return projectEvaluations.filter(e => {
                if (!filteredProjects.some(p => p.id === e.project_id)) return false;
                if (selectedProjectId !== 'all' && e.project_id !== selectedProjectId) return false;
                if (selectedUserId !== 'all' && e.evaluated_user_id !== selectedUserId) return false;
                return true;
            });
        }, [projectEvaluations, selectedProjectId, selectedUserId, filteredProjects]);

        const getProjectChartData = () => {
            if (selectedProjectId === 'all') return {};
            const selectedProject = projects.find(p => p.id === selectedProjectId);
            if (!selectedProject) return {};

            const chartData = {};

            const collaboratorScores = {};
            const participants = users.filter(u => selectedProject.participants.includes(u.id));

            participants.forEach(p => {
                collaboratorScores[p.id] = { name: p.name, totalScore: 0, count: 0 };
            });

            const ratingFields = selectedProject.custom_fields.filter(f => f.type === 'rating');

            filteredProjectEvals.forEach(e => {
                if (collaboratorScores[e.evaluated_user_id]) {
                    let evalTotal = 0;
                    let evalCount = 0;
                    ratingFields.forEach(field => {
                        const score = e.results[field.id];
                        if (typeof score === 'number') {
                            evalTotal += score;
                            evalCount++;
                        }
                    });
                    if (evalCount > 0) {
                        collaboratorScores[e.evaluated_user_id].totalScore += (evalTotal / evalCount);
                        collaboratorScores[e.evaluated_user_id].count++;
                    }
                }
            });
            
            const comparisonData = Object.values(collaboratorScores)
                .filter(d => d.count > 0)
                .map((d, i) => ({
                    label: d.name,
                    value: parseFloat((d.totalScore / d.count).toFixed(2)),
                    color: ['#3B82F6', '#10B981', '#EF4444', '#F59E0B', '#8B5CF6'][i % 5]
                }));
            
            if (comparisonData.length > 0) {
                chartData[t('collaborator_comparison')] = comparisonData;
            }

            selectedProject.custom_fields.forEach(field => {
                if (field.type === 'select') {
                    const counts = {};
                    field.options.forEach(opt => counts[opt] = 0);
                    filteredProjectEvals.forEach(e => {
                        const value = e.results[field.id];
                        if (counts[value] !== undefined) counts[value]++;
                    });

                    chartData[field.name] = Object.entries(counts).map(([label, value], i) => ({
                        label,
                        value,
                        color: ['#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][i % 4]
                    })).filter(item => item.value > 0);
                }
            });
            return chartData;
        };
        
        const projectChartData = getProjectChartData();

        return (
            <>
                <div className="non-printable">
                    <ProjectReportFilters
                        selectedProject={selectedProjectId}
                        setSelectedProject={setSelectedProjectId}
                        selectedUser={selectedUserId}
                        setSelectedUser={setSelectedUserId}
                        selectedStatus={selectedStatus}
                        setSelectedStatus={setSelectedStatus}
                        projects={filteredProjects}
                        users={usersInSelectedProject}
                    />
                </div>
                <div className="mt-6">
                    <ProjectReportCharts chartData={projectChartData} />
                </div>
                 {filteredProjectEvals.length === 0 && (
                    <div className="text-center py-10">
                        <p className="text-muted-foreground text-md">{t('no_project_report_data')}</p>
                    </div>
                )}
            </>
        );
    };


    const Reports = () => {
      const [reportType, setReportType] = useState('competence');
      const { evaluations, projectEvaluations, users, competencies } = useData();
      const t = useTranslation();
      const [headerText, setHeaderText] = useState(t('competence_reports'));

      const handleExportPDF = async () => {
         if ((reportType === 'competence' && evaluations.length === 0) || (reportType === 'projects' && projectEvaluations.length === 0)) {
          toast({ title: t('export_error'), description: t('no_data_to_export'), variant: "destructive" });
          return;
        }
        toast({ title: t('exporting_pdf'), description: t('wait_for_report') });
        try {
          await generatePdfFromElement('report-content-to-print', `Salo360_Relatorio_${reportType}_${new Date().toISOString().split('T')[0]}.pdf`);
          toast({ title: t('report_exported'), description: t('pdf_success'), className: "bg-green-500 text-white" });
        } catch (error) {
          toast({ title: t('export_error'), description: t('pdf_error'), variant: "destructive"});
          console.error("PDF Export Error:", error);
        }
      };

      const handleExportExcel = () => {
        if (reportType === 'competence' && evaluations.length === 0) {
          toast({ title: t('export_error'), description: t('no_data_to_export'), variant: "destructive" });
          return;
        }
        if (reportType === 'projects') {
            toast({ title: t('feature_in_dev_title'), description: t('excel_project_soon') });
            return;
        }
         toast({ title: t('exporting_excel'), description: t('wait_for_report') });
        const dataToExport = {
          rawData: evaluations,
          users,
          competencies,
        };
        exportToExcel(dataToExport, `Salo360_Relatorio_Excel_${new Date().toISOString().split('T')[0]}.xlsx`);
        toast({ title: t('report_exported'), description: t('excel_success'), className: "bg-green-500 text-white" });
      };
      
      return (
        <div className="space-y-6">
          <div id="report-header-non-printable" className="non-printable">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6"
            >
              <div>
                <h1 className="text-3xl font-semibold text-foreground mb-1">
                  {reportType === 'competence' ? t('competence_reports') : t('project_reports')}
                </h1>
                <p className="text-muted-foreground text-sm">
                    {reportType === 'competence' 
                        ? t('competence_reports_desc')
                        : t('project_reports_desc')
                    }
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 items-center">
                 <Select value={reportType} onValueChange={setReportType}>
                    <SelectTrigger className="w-full md:w-[220px]">
                        <SelectValue placeholder={t('report_type')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="competence">
                            <div className="flex items-center gap-2">
                               <BarChart className="h-4 w-4" /> {t('competence_report_short')}
                            </div>
                        </SelectItem>
                        <SelectItem value="projects">
                            <div className="flex items-center gap-2">
                               <FolderKanban className="h-4 w-4" /> {t('project_report_short')}
                            </div>
                        </SelectItem>
                    </SelectContent>
                </Select>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button onClick={handleExportExcel} variant="outline" className="w-full">
                    <FileDown className="h-4 w-4 mr-2" /> Excel
                  </Button>
                  <Button onClick={handleExportPDF} className="bg-primary text-primary-foreground hover:bg-primary/90 w-full">
                    <Download className="h-4 w-4 mr-2" /> PDF
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>

          <div id="report-content-to-print">
            <div className="print-only hidden my-4 text-center">
                <h1 className="text-2xl font-bold">Salo 360</h1>
                <p className="text-lg font-semibold">{reportType === 'competence' ? t('competence_reports') : t('project_reports')}</p>
                <p className="text-sm text-gray-500">{t('generated_on')}: {new Date().toLocaleDateString()}</p>
            </div>
            {reportType === 'competence' && <PerformanceReports headerText={headerText} setHeaderText={setHeaderText} />}
            {reportType === 'projects' && <ProjectReports />}
          </div>
        </div>
      );
    };

    export default Reports;
  