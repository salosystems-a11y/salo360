import React from 'react';
import { motion } from 'framer-motion';
import { Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/hooks/useTranslation';

const ProjectReportFilters = ({
  selectedProject, setSelectedProject,
  selectedUser, setSelectedUser,
  selectedStatus, setSelectedStatus,
  projects, users
}) => {
  const t = useTranslation();
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
            {t('project_report_filters')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="space-y-1.5">
              <Label className="text-muted-foreground">{t('project_status')}</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="bg-input border-border text-foreground">
                  <SelectValue placeholder={t('select_status')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('all_statuses')}</SelectItem>
                  <SelectItem value="open">{t('open')}</SelectItem>
                  <SelectItem value="closed">{t('closed')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-muted-foreground">{t('project')}</Label>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger className="bg-input border-border text-foreground">
                  <SelectValue placeholder={t('select_project')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('all_projects')}</SelectItem>
                  {projects.map(project => (
                    <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-muted-foreground">{t('evaluated_collaborator')}</Label>
              <Select value={selectedUser} onValueChange={setSelectedUser} disabled={selectedProject === 'all'}>
                <SelectTrigger className="bg-input border-border text-foreground">
                   <SelectValue placeholder={t('select_collaborator')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('all_collaborators')}</SelectItem>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ProjectReportFilters;