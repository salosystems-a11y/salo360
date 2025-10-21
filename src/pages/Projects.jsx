import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { PlusCircle, Trash2, FolderKanban, Star, Edit, Check, UserPlus, Send, Lock, Unlock, MessageSquare, Calendar, Info, Clock, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from '@/hooks/useTranslation';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';

const TemporaryParticipantModal = ({ isOpen, onOpenChange, onSave, roles, projectId }) => {
  const t = useTranslation();
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    avatar_url: '',
  });

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileExt = file.name.split('.').pop();
    const fileName = `temp-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file);

    if (uploadError) {
      toast({ title: "Erro ao carregar imagem", description: uploadError.message, variant: "destructive" });
      return;
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
    setFormData(prev => ({ ...prev, avatar_url: data.publicUrl }));
  };
  
  const handleSubmit = async () => {
    if (!formData.name || !formData.email || !formData.password) {
        toast({ title: t('error'), description: t('incomplete_fields'), variant: "destructive" });
        return;
    }

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          name: formData.name,
          role: 'employee',
          isTemporary: true,
          projectId: projectId,
        }
      }
    });

    if (signUpError) {
      toast({ title: "Erro ao criar utilizador temporário", description: signUpError.message, variant: "destructive" });
      return;
    }

    if (signUpData.user) {
        const { error: profileError } = await supabase.from('profiles').insert({
            id: signUpData.user.id,
            name: formData.name,
            role: 'employee',
            avatar_url: formData.avatar_url,
            position: 'Participante Temporário',
            department: 'Projeto'
        });

        if (profileError) {
             toast({ title: "Erro ao criar perfil", description: profileError.message, variant: "destructive" });
             // TODO: Maybe delete the auth user here
             return;
        }

        onSave(signUpData.user.id);
        onOpenChange(false);
        setFormData({ name: '', email: '', password: '', avatar_url: '' });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('new_temp_collaborator')}</DialogTitle>
          <DialogDescription>{t('new_temp_collaborator_desc')}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
            <div className="flex justify-center">
                <div className="relative">
                    <img 
                    src={formData.avatar_url || `https://ui-avatars.com/api/?name=${formData.name?.replace(/\s/g, '+') || 'User'}&background=random`} 
                    alt="Avatar"
                    className="w-24 h-24 rounded-full object-cover border-2 border-primary"
                    />
                    <Button type="button" size="icon" variant="outline" className="absolute bottom-0 right-0 rounded-full h-8 w-8" onClick={() => fileInputRef.current.click()}>
                    <Camera className="h-4 w-4" />
                    </Button>
                    <Input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarChange} />
                </div>
            </div>
          <div className="space-y-1.5">
            <Label htmlFor="temp-name">{t('name')}</Label>
            <Input id="temp-name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="temp-email">{t('email')}</Label>
            <Input id="temp-email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="temp-password">{t('password')}</Label>
            <Input id="temp-password" type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit}>{t('create_collaborator')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};


const ProjectFormModal = ({ project, onSave, isOpen, setIsOpen, trigger }) => {
  const { user: currentUser } = useAuth();
  const { users, roles, refreshData } = useData();
  const t = useTranslation();
  const [name, setName] = useState('');
  const [participants, setParticipants] = useState([]);
  const [customFields, setCustomFields] = useState([]);
  const [editingProject, setEditingProject] = useState(null);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [enableDailyReports, setEnableDailyReports] = useState(false);
  const [isTempParticipantModalOpen, setIsTempParticipantModalOpen] = useState(false);
  
  const currentProjectId = useMemo(() => editingProject?.id || `proj_${Date.now()}`, [editingProject]);


  const availableParticipants = useMemo(() => {
    if (currentUser.role === 'admin') return users;
    if (currentUser.role === 'manager') return users.filter(u => u.manager_id === currentUser.id);
    return [];
  }, [users, currentUser]);

  React.useEffect(() => {
    if (isOpen) {
      if (project) {
        setEditingProject(project);
        setName(project.name || '');
        setParticipants(project.participants || []);
        setCustomFields(project.custom_fields || []);
        setStartDate(project.start_date ? new Date(project.start_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
        setEnableDailyReports(project.enable_daily_reports || false);
      } else {
        setEditingProject(null);
        setName('');
        setParticipants([]);
        setCustomFields([]);
        setStartDate(new Date().toISOString().split('T')[0]);
        setEnableDailyReports(false);
      }
    }
  }, [isOpen, project]);

  const handleOpenChange = (open) => {
    if (!open) {
      setEditingProject(null);
    }
    setIsOpen(open);
  };
  
  const handleSaveTempParticipant = (newUserId) => {
    refreshData(); // to get the new user in the list
    setParticipants(prev => [...prev, newUserId]);
    toast({ title: t('temp_user_created_title'), description: t('collaborator_created_desc')});
  };

  const handleAddField = () => {
    setCustomFields([...customFields, { id: `field_${Date.now()}`, name: '', type: 'rating' }]);
  };

  const handleFieldChange = (index, key, value) => {
    const newFields = [...customFields];
    newFields[index][key] = value;
    if (key === 'type' && value !== 'select') {
      delete newFields[index].options;
    }
    if (key === 'type' && value === 'select' && !newFields[index].options) {
      newFields[index].options = [t('option_1'), t('option_2')];
    }
    setCustomFields(newFields);
  };

  const handleOptionChange = (fieldIndex, optIndex, value) => {
    const newFields = [...customFields];
    newFields[fieldIndex].options[optIndex] = value;
    setCustomFields(newFields);
  };

  const handleAddOption = (fieldIndex) => {
    const newFields = [...customFields];
    if (!newFields[fieldIndex].options) newFields[fieldIndex].options = [];
    newFields[fieldIndex].options.push(`${t('option')} ${newFields[fieldIndex].options.length + 1}`);
    setCustomFields(newFields);
  };

  const handleRemoveField = (index) => {
    setCustomFields(customFields.filter((_, i) => i !== index));
  };

  const handleParticipantSelect = (userId) => {
    setParticipants(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ title: t('error'), description: t('project_name_required'), variant: 'destructive' });
      return;
    }
    const projectData = { 
      name, 
      creator_id: currentUser.id, 
      participants, 
      custom_fields: customFields, 
      start_date: startDate,
      enable_daily_reports: enableDailyReports,
      ...(editingProject && { daily_reports: editingProject.daily_reports || [] })
    };

    let error;
    if (editingProject) {
        ({ error } = await supabase.from('projects').update(projectData).eq('id', editingProject.id));
    } else {
        ({ error } = await supabase.from('projects').insert(projectData));
    }

    if (error) {
        toast({ title: 'Error saving project', description: error.message, variant: 'destructive' });
    } else {
        onSave();
        handleOpenChange(false);
    }
  };

  const dialogContent = (
    <>
    <TemporaryParticipantModal 
        isOpen={isTempParticipantModalOpen}
        onOpenChange={setIsTempParticipantModalOpen}
        onSave={handleSaveTempParticipant}
        roles={roles}
        projectId={currentProjectId}
    />
    <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{editingProject ? t('edit_project') : t('new_project')}</DialogTitle>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">{t('project_name')}</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="startDate">{t('start_date')}</Label>
          <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div className="space-y-1.5">
            <div className="flex justify-between items-center mb-1">
              <Label>{t('participants')}</Label>
              <Button variant="outline" size="sm" onClick={() => setIsTempParticipantModalOpen(true)}>
                <Clock className="h-4 w-4 mr-2" />
                {t('temp_collaborator')}
              </Button>
            </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-start font-normal h-auto min-h-[40px]">
                <div className="flex flex-wrap gap-1 items-center">
                  {participants.length === 0 ? t('select_participants') : participants.map(pId => {
                    const participantUser = users.find(u => u.id === pId);
                    return (
                      <div key={pId} className={`flex items-center gap-1 ${participantUser?.isTemporary ? 'bg-amber-500/20 text-amber-700' : 'bg-primary/20 text-primary-foreground-darker'} rounded-full px-2 py-0.5 text-xs`}>
                        {participantUser?.isTemporary && <Clock className="h-3 w-3" />}
                        <span>{participantUser?.name}</span>
                      </div>
                    )
                  })}
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-full">
              {availableParticipants.map(u => (
                <DropdownMenuItem key={u.id} onSelect={(e) => e.preventDefault()} onClick={() => handleParticipantSelect(u.id)}>
                  <div className={`w-4 h-4 mr-2 flex items-center justify-center border border-primary rounded-sm ${participants.includes(u.id) ? 'bg-primary' : ''}`}>
                    {participants.includes(u.id) && <Check className="h-3 w-3 text-primary-foreground" />}
                  </div>
                  {u.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="space-y-3">
          <Label>{t('evaluation_fields')}</Label>
          {customFields.map((field, index) => (
            <div key={field.id} className="p-3 border rounded-md space-y-2 bg-muted/50 relative">
              <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-7 w-7" onClick={() => handleRemoveField(index)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <Input placeholder={t('field_name_placeholder')} value={field.name} onChange={(e) => handleFieldChange(index, 'name', e.target.value)} />
                <Select value={field.type} onValueChange={(value) => handleFieldChange(index, 'type', value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rating">{t('field_type_rating')}</SelectItem>
                    <SelectItem value="text">{t('field_type_text')}</SelectItem>
                    <SelectItem value="select">{t('field_type_select')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {field.type === 'select' && (
                <div className="space-y-1 pl-2">
                  <Label className="text-xs text-muted-foreground">{t('options')}</Label>
                  {field.options?.map((opt, optIndex) => (
                    <div key={optIndex} className="flex items-center gap-2">
                      <Input value={opt} onChange={(e) => handleOptionChange(index, optIndex, e.target.value)} className="h-8" />
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => handleAddOption(index)}>{t('add_option')}</Button>
                </div>
              )}
            </div>
          ))}
          <Button variant="outline" onClick={handleAddField} className="w-full">
            <PlusCircle className="h-4 w-4 mr-2" /> {t('add_field')}
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox id="enableDailyReports" checked={enableDailyReports} onCheckedChange={setEnableDailyReports} />
          <Label htmlFor="enableDailyReports" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {t('enable_daily_reports')}
          </Label>
        </div>
      </div>
      <DialogFooter>
        <Button onClick={handleSave}>{t('save_project')}</Button>
      </DialogFooter>
    </DialogContent>
    </>
  );

  if (trigger) {
    return (
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild onClick={() => setIsOpen(true)}>{trigger}</DialogTrigger>
        {dialogContent}
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {dialogContent}
    </Dialog>
  );
};

const ProjectEvaluationModal = ({ project, userToEvaluate, onSave }) => {
  const { user: currentUser } = useAuth();
  const t = useTranslation();
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState({});

  const handleResultChange = (fieldId, value) => {
    setResults(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleSaveEvaluation = async () => {
    const newEval = {
      project_id: project.id,
      evaluated_user_id: userToEvaluate.id,
      evaluator_id: currentUser.id,
      results,
    };
    const { error } = await supabase.from('project_evaluations').insert(newEval);
    if (error) {
        toast({ title: 'Error saving evaluation', description: error.message, variant: 'destructive' });
    } else {
        onSave();
        setResults({});
        setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm"><Send className="h-4 w-4 mr-2" /> {t('evaluate')}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('evaluate')} {userToEvaluate.name}</DialogTitle>
          <DialogDescription>{t('project')}: {project.name}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {project.custom_fields.map(field => (
            <div key={field.id} className="space-y-2">
              <Label>{field.name}</Label>
              {field.type === 'rating' && (
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star
                      key={star}
                      className={`cursor-pointer h-6 w-6 ${results[field.id] >= star ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`}
                      onClick={() => handleResultChange(field.id, star)}
                    />
                  ))}
                </div>
              )}
              {field.type === 'text' && (
                <Textarea value={results[field.id] || ''} onChange={e => handleResultChange(field.id, e.target.value)} />
              )}
              {field.type === 'select' && (
                <Select onValueChange={value => handleResultChange(field.id, value)} value={results[field.id]}>
                  <SelectTrigger><SelectValue placeholder={t('select_an_option')} /></SelectTrigger>
                  <SelectContent>
                    {field.options.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button onClick={handleSaveEvaluation}>{t('save_project')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

const DailyReportSection = ({ project, onSaveReport }) => {
  const { user: currentUser } = useAuth();
  const { users } = useData();
  const t = useTranslation();
  const [reportText, setReportText] = useState('');

  const handleAddReport = () => {
    if (!reportText.trim()) {
      toast({ title: t('error'), description: t('daily_report_empty'), variant: 'destructive' });
      return;
    }
    const newReport = {
      id: `report_${Date.now()}`,
      userId: currentUser.id,
      text: reportText,
      createdAt: new Date().toISOString(),
    };
    onSaveReport(newReport);
    setReportText('');
  };

  const getUserById = (id) => users.find(u => u.id === id);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="daily-report">{t('add_daily_report')}</Label>
        <Textarea
          id="daily-report"
          value={reportText}
          onChange={(e) => setReportText(e.target.value)}
          placeholder={t('daily_report_placeholder')}
        />
        <Button onClick={handleAddReport} size="sm">{t('add_report')}</Button>
      </div>
      <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
        {project.daily_reports?.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map(report => {
          const reportUser = getUserById(report.userId);
          return (
            <div key={report.id} className="p-3 bg-background rounded-md border">
              <div className="flex items-center gap-2 mb-2">
                <img src={reportUser?.avatar_url} alt={reportUser?.name} className="h-6 w-6 rounded-full" />
                <span className="font-medium text-sm">{reportUser?.name}</span>
                <span className="text-xs text-muted-foreground ml-auto">{new Date(report.createdAt).toLocaleString()}</span>
              </div>
              <p className="text-sm text-foreground whitespace-pre-wrap">{report.text}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Projects = () => {
  const { projects, users, projectEvaluations, refreshData } = useData();
  const { user: currentUser } = useAuth();
  const t = useTranslation();
  const location = useLocation();
  const [selectedProject, setSelectedProject] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const canCreateProject = currentUser.role === 'admin' || currentUser.role === 'manager';

  const visibleProjects = useMemo(() => {
    if (currentUser.isTemporary) {
      return projects.filter(p => p.id === currentUser.projectId);
    }
    if (currentUser.role === 'admin') {
      return projects;
    }
    if (currentUser.role === 'manager') {
      return projects.filter(p => p.creator_id === currentUser.id || p.participants?.includes(currentUser.id));
    }
    return projects.filter(p => p.participants?.includes(currentUser.id));
  }, [projects, currentUser]);

  useEffect(() => {
    if (location.state?.selectedProjectId) {
      const projectFromState = projects.find(p => p.id === location.state.selectedProjectId);
      if (projectFromState) {
        setSelectedProject(projectFromState);
      }
    } else if (visibleProjects.length > 0 && !selectedProject) {
      setSelectedProject(visibleProjects[0]);
    } else if (visibleProjects.length === 0) {
      setSelectedProject(null);
    }
  }, [location.state, projects, visibleProjects, selectedProject]);
  
  const handleSave = () => {
    refreshData();
    toast({ title: t('success'), description: t('project_saved_success') });
  };
  
  const handleSaveEvaluation = () => {
    refreshData();
    toast({ title: t('success'), description: t('evaluation_saved_success') });
  }

  const handleSaveDailyReport = async (report) => {
    const updatedDailyReports = [...(selectedProject.daily_reports || []), report];
    const { error } = await supabase
      .from('projects')
      .update({ daily_reports: updatedDailyReports })
      .eq('id', selectedProject.id);

    if (error) {
        toast({ title: 'Error saving daily report', description: error.message, variant: 'destructive' });
    } else {
        refreshData();
        toast({ title: t('success'), description: t('daily_report_added') });
    }
  };

  const handleToggleProjectStatus = async (project) => {
    const newStatus = project.status === 'open' ? 'closed' : 'open';
    const { error } = await supabase.from('projects').update({ status: newStatus }).eq('id', project.id);
    
    if (error) {
        toast({ title: 'Error updating project status', description: error.message, variant: 'destructive' });
    } else {
        refreshData();
        if (newStatus === 'closed') {
            toast({ title: t('project_closed'), description: t('temp_users_will_be_deactivated') });
        }
    }
  };

  const selectedProjectDetails = useMemo(() => {
    if (!selectedProject) return null;
    const participantsDetails = selectedProject.participants?.map(pId => users.find(u => u.id === pId)).filter(Boolean) || [];
    const evaluationsForProject = projectEvaluations.filter(e => e.project_id === selectedProject.id);

    return { ...selectedProject, participantsDetails, evaluations: evaluationsForProject };
  }, [selectedProject, users, projectEvaluations]);

  return (
    <>
      {canCreateProject && (
        <ProjectFormModal
          isOpen={isEditModalOpen}
          setIsOpen={setIsEditModalOpen}
          project={selectedProject}
          onSave={handleSave}
        />
      )}
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row justify-between md:items-center gap-4"
        >
          <div>
            <h1 className="text-3xl font-semibold text-foreground mb-1">{t('project_eval_title')}</h1>
            <p className="text-muted-foreground">{t('project_eval_desc')}</p>
          </div>
          {canCreateProject && (
            <Button onClick={() => { setSelectedProject(null); setIsEditModalOpen(true); }}>
              <PlusCircle className="h-4 w-4 mr-2" /> {t('new_project')}
            </Button>
          )}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
            <Card className="h-full">
              <CardHeader>
                <CardTitle>{t('projects')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {visibleProjects.map(proj => (
                    <button key={proj.id} onClick={() => setSelectedProject(proj)} className={`w-full text-left p-3 rounded-md flex items-center gap-3 transition-colors ${selectedProject?.id === proj.id ? 'bg-primary/10' : 'hover:bg-muted'}`}>
                      <FolderKanban className={`h-5 w-5 ${selectedProject?.id === proj.id ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className="font-medium text-sm">{proj.name}</span>
                      <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full ${proj.status === 'open' ? 'bg-green-500/20 text-green-700' : 'bg-red-500/20 text-red-700'}`}>{t(proj.status)}</span>
                    </button>
                  ))}
                  {visibleProjects.length === 0 && <p className="text-muted-foreground text-center py-8 text-sm">{t('no_project_created')}</p>}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div className="lg:col-span-2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
            <Card className="h-full">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{selectedProjectDetails?.name || t('select_project')}</CardTitle>
                    <CardDescription>{selectedProjectDetails ? `${t('status')}: ${t(selectedProjectDetails.status)} | ${t('start_date')}: ${new Date(selectedProjectDetails.start_date).toLocaleDateString()}` : t('select_project_to_see_details')}</CardDescription>
                  </div>
                  {selectedProjectDetails && canCreateProject && (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleToggleProjectStatus(selectedProjectDetails)}>
                        {selectedProjectDetails.status === 'open' ? <Lock className="h-3 w-3 mr-2" /> : <Unlock className="h-3 w-3 mr-2" />}
                        {selectedProjectDetails.status === 'open' ? t('close_project') : t('reopen_project')}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setIsEditModalOpen(true)}><Edit className="h-3 w-3 mr-2" /> {t('edit')}</Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {selectedProjectDetails ? (
                  <Tabs defaultValue="details">
                    <TabsList>
                      <TabsTrigger value="details"><Info className="h-4 w-4 mr-2" />{t('details')}</TabsTrigger>
                      {selectedProjectDetails.enable_daily_reports && <TabsTrigger value="reports"><MessageSquare className="h-4 w-4 mr-2" />{t('daily_reports')}</TabsTrigger>}
                    </TabsList>
                    <TabsContent value="details" className="pt-4">
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium mb-2 text-sm flex items-center gap-2"><UserPlus className="h-4 w-4" /> {t('participants')}</h4>
                          <div className="space-y-2">
                            {selectedProjectDetails.participantsDetails.map(p => {
                              const evaluation = selectedProjectDetails.evaluations.find(e => e.evaluated_user_id === p.id);
                              const authUser = users.find(u => u.id === p.id);
                              const isTemp = authUser?.isTemporary;
                              return (
                                <div key={p.id} className="flex items-center justify-between p-2 bg-background rounded-md border">
                                  <div className="flex items-center gap-3">
                                    <img src={p.avatar_url} alt={p.name} className="h-8 w-8 rounded-full" />
                                    <div>
                                      <p className="font-medium text-sm">{p.name} {isTemp && <span className="text-amber-600 text-xs">({t('temp_short')})</span>}</p>
                                      <p className="text-xs text-muted-foreground">{p.position}</p>
                                    </div>
                                  </div>
                                  {canCreateProject ? (
                                    evaluation ? (
                                      <div className="flex items-center gap-2 text-green-600">
                                        <Check className="h-4 w-4" />
                                        <span className="text-xs font-semibold">{t('evaluated_status')}</span>
                                      </div>
                                    ) : (
                                      <ProjectEvaluationModal project={selectedProjectDetails} userToEvaluate={p} onSave={handleSaveEvaluation} />
                                    )
                                  ) : null}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                    {selectedProjectDetails.enable_daily_reports && (
                      <TabsContent value="reports" className="pt-4">
                        <DailyReportSection project={selectedProjectDetails} onSaveReport={handleSaveDailyReport} />
                      </TabsContent>
                    )}
                  </Tabs>
                ) : (
                  <div className="text-center py-20">
                    <FolderKanban className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="mt-4 text-muted-foreground">{t('no_project_selected')}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default Projects;
export { ProjectFormModal };