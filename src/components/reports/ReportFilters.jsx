import React from 'react';
import { motion } from 'framer-motion';
import { Filter, X, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useTranslation } from '@/hooks/useTranslation';

const ReportFilters = ({
  selectedPeriod, setSelectedPeriod,
  selectedDepartments, setSelectedDepartments,
  selectedCompetencies, setSelectedCompetencies,
  selectedUser, setSelectedUser,
  selectedEvaluationTypes, setSelectedEvaluationTypes,
  selectedYears, setSelectedYears,
  departments, users, competencies, availableYears,
  currentUserRole
}) => {
  const t = useTranslation();

  const handleMultiSelect = (setter, value) => {
    setter(prev => 
      prev.includes(value) 
        ? prev.filter(item => item !== value)
        : [...prev, value]
    );
  };
  
  const isEmployee = currentUserRole?.id === 'employee';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <Card className="bg-card border-border">
        <CardHeader className="pb-4">
          <CardTitle className="text-foreground text-lg flex items-center">
            <Filter className="h-4 w-4 mr-2 text-primary" />
            {t('report_filters')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 text-sm">
            <div className="space-y-1.5">
              <Label className="text-muted-foreground">{t('period')}</Label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="bg-input border-border text-foreground">
                  <SelectValue placeholder={t('period')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('all_periods')}</SelectItem>
                  <SelectItem value="quarter">{t('current_quarter')}</SelectItem>
                  <SelectItem value="year">{t('current_year')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-muted-foreground">{t('year')}</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="bg-input border-border text-foreground h-auto min-h-[40px] w-full justify-start font-normal">
                    <div className="flex flex-wrap gap-1 items-center">
                      {selectedYears.length === 0 
                        ? <span className="text-muted-foreground">{t('select_years')}</span>
                        : selectedYears.map(year => (
                          <div key={year} className="flex items-center gap-1 bg-primary/20 text-primary-foreground-darker rounded-full px-2 py-0.5 text-xs">
                            <span>{year}</span>
                            <button onClick={(e) => { e.stopPropagation(); handleMultiSelect(setSelectedYears, year); }} className="text-primary hover:text-primary/80"><X size={12} /></button>
                          </div>
                        ))
                      }
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-full">
                   <DropdownMenuItem onSelect={() => setSelectedYears([])} className="text-destructive hover:!text-destructive">{t('clear_selection')}</DropdownMenuItem>
                  {availableYears.map(year => (
                    <DropdownMenuItem key={year} onSelect={(e) => e.preventDefault()} onClick={() => handleMultiSelect(setSelectedYears, year)}>
                      <div className={`w-4 h-4 mr-2 flex items-center justify-center border border-primary rounded-sm ${selectedYears.includes(year) ? 'bg-primary' : ''}`}>
                        {selectedYears.includes(year) && <Check className="h-3 w-3 text-primary-foreground" />}
                      </div>
                      {year}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="space-y-1.5">
              <Label className="text-muted-foreground">{t('departments')}</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="bg-input border-border text-foreground h-auto min-h-[40px] w-full justify-start font-normal" disabled={isEmployee}>
                    <div className="flex flex-wrap gap-1 items-center">
                      {selectedDepartments.length === 0 
                        ? <span className="text-muted-foreground">{t('select_departments')}</span>
                        : selectedDepartments.map(dept => (
                          <div key={dept} className="flex items-center gap-1 bg-primary/20 text-primary-foreground-darker rounded-full px-2 py-0.5 text-xs">
                            <span>{dept}</span>
                            <button onClick={(e) => { e.stopPropagation(); handleMultiSelect(setSelectedDepartments, dept); }} className="text-primary hover:text-primary/80"><X size={12} /></button>
                          </div>
                        ))
                      }
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-full">
                   <DropdownMenuItem onSelect={() => setSelectedDepartments([])} className="text-destructive hover:!text-destructive">{t('clear_selection')}</DropdownMenuItem>
                  {departments.map(dept => (
                    <DropdownMenuItem key={dept} onSelect={(e) => e.preventDefault()} onClick={() => handleMultiSelect(setSelectedDepartments, dept)}>
                      <div className={`w-4 h-4 mr-2 flex items-center justify-center border border-primary rounded-sm ${selectedDepartments.includes(dept) ? 'bg-primary' : ''}`}>
                        {selectedDepartments.includes(dept) && <Check className="h-3 w-3 text-primary-foreground" />}
                      </div>
                      {dept}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="space-y-1.5">
              <Label className="text-muted-foreground">{t('competencies')}</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="bg-input border-border text-foreground h-auto min-h-[40px] w-full justify-start font-normal">
                    <div className="flex flex-wrap gap-1 items-center">
                      {selectedCompetencies.length === 0 
                        ? <span className="text-muted-foreground">{t('select_competencies')}</span>
                        : selectedCompetencies.map(compId => {
                            const comp = competencies.find(c => c.id === compId);
                            return (
                              <div key={compId} className="flex items-center gap-1 bg-primary/20 text-primary-foreground-darker rounded-full px-2 py-0.5 text-xs">
                                <span>{comp?.name || compId}</span>
                                <button onClick={(e) => { e.stopPropagation(); handleMultiSelect(setSelectedCompetencies, compId); }} className="text-primary hover:text-primary/80"><X size={12} /></button>
                              </div>
                            )
                        })
                      }
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-full">
                   <DropdownMenuItem onSelect={() => setSelectedCompetencies([])} className="text-destructive hover:!text-destructive">{t('clear_selection')}</DropdownMenuItem>
                  {competencies.map(comp => (
                    <DropdownMenuItem key={comp.id} onSelect={(e) => e.preventDefault()} onClick={() => handleMultiSelect(setSelectedCompetencies, comp.id)}>
                      <div className={`w-4 h-4 mr-2 flex items-center justify-center border border-primary rounded-sm ${selectedCompetencies.includes(comp.id) ? 'bg-primary' : ''}`}>
                        {selectedCompetencies.includes(comp.id) && <Check className="h-3 w-3 text-primary-foreground" />}
                      </div>
                      {comp.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="space-y-1.5">
              <Label className="text-muted-foreground">{t('evaluated_collaborator')}</Label>
              <Select value={selectedUser} onValueChange={setSelectedUser} disabled={isEmployee}>
                <SelectTrigger className="bg-input border-border text-foreground">
                   <SelectValue placeholder={t('all_collaborators')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('all_collaborators')}</SelectItem>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-muted-foreground">{t('evaluation_type')}</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="bg-input border-border text-foreground h-auto min-h-[40px] w-full justify-start font-normal">
                    <div className="flex flex-wrap gap-1 items-center">
                      {selectedEvaluationTypes.length === 0 
                        ? <span className="text-muted-foreground">{t('select_evaluation_types')}</span>
                        : selectedEvaluationTypes.map(type => (
                          <div key={type} className="flex items-center gap-1 bg-primary/20 text-primary-foreground-darker rounded-full px-2 py-0.5 text-xs">
                            <span>{type}°</span>
                            <button onClick={(e) => { e.stopPropagation(); handleMultiSelect(setSelectedEvaluationTypes, type); }} className="text-primary hover:text-primary/80"><X size={12} /></button>
                          </div>
                        ))
                      }
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-full">
                   <DropdownMenuItem onSelect={() => setSelectedEvaluationTypes([])} className="text-destructive hover:!text-destructive">{t('clear_selection')}</DropdownMenuItem>
                  {['180', '360'].map(type => (
                    <DropdownMenuItem key={type} onSelect={(e) => e.preventDefault()} onClick={() => handleMultiSelect(setSelectedEvaluationTypes, type)}>
                      <div className={`w-4 h-4 mr-2 flex items-center justify-center border border-primary rounded-sm ${selectedEvaluationTypes.includes(type) ? 'bg-primary' : ''}`}>
                        {selectedEvaluationTypes.includes(type) && <Check className="h-3 w-3 text-primary-foreground" />}
                      </div>
                      {type}°
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ReportFilters;