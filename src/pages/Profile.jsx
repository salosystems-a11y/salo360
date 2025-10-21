import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Edit, Save, Star, Calendar, Award, Camera, FolderKanban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useData } from '@/contexts/DataContext';
import { toast } from '@/components/ui/use-toast';
import { useTranslation } from '@/hooks/useTranslation';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';

const Profile = () => {
  const { user } = useAuth();
  const { users, evaluations, competencies, projects, refreshData } = useData();
  const t = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    avatar_url: '',
    position: '',
    department: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        avatar_url: user.avatar_url || '',
        position: user.position || '',
        department: user.department || '',
      });
    }
  }, [user]);

  const fileInputRef = useRef(null);

  const myEvaluations = evaluations.filter(e => e.evaluated_id === user?.id);
  const myProjects = projects.filter(p => p.participants?.includes(user?.id));

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !user) return;

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file);

    if (uploadError) {
      toast({ title: "Erro ao carregar imagem", description: uploadError.message, variant: "destructive" });
      return;
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);

    setFormData({ ...formData, avatar_url: data.publicUrl });
    toast({ title: "Avatar atualizado", description: "O seu novo avatar foi carregado. Clique em Salvar." });
  };

  const handleSave = async () => {
    const { error } = await supabase
      .from('profiles')
      .update({
        name: formData.name,
        position: formData.position,
        department: formData.department,
        avatar_url: formData.avatar_url,
      })
      .eq('id', user.id);

    if (error) {
      toast({ title: "Erro ao atualizar perfil", description: error.message, variant: "destructive" });
    } else {
      toast({
        title: t('profile_updated_title'),
        description: t('profile_updated_desc'),
      });
      refreshData();
    }
    setIsEditing(false);
  };

  const getAverageScore = () => {
    const completedEvaluations = myEvaluations.filter(e => e.status === 'completed' && e.scores);
    if (completedEvaluations.length === 0) return "0.0";
    
    const totalScore = completedEvaluations.reduce((acc, evaluation) => {
      if (!evaluation.scores) return acc;
      const scoresArray = Object.values(evaluation.scores);
      if (scoresArray.length === 0) return acc;
      const avgScore = scoresArray.reduce((a, b) => a + b, 0) / scoresArray.length;
      return acc + avgScore;
    }, 0);
    
    return (totalScore / completedEvaluations.length).toFixed(1);
  };

  const getCompetencyScores = () => {
    const competencyScores = {};
    
    competencies.forEach(comp => {
      competencyScores[comp.name] = { total: 0, count: 0 };
    });

    myEvaluations.forEach(evaluation => {
      if (evaluation.status === 'completed' && evaluation.scores) {
        Object.entries(evaluation.scores).forEach(([compId, score]) => {
          const competency = competencies.find(c => c.id.toString() === compId.toString());
          if (competency && competencyScores[competency.name]) {
            competencyScores[competency.name].total += score;
            competencyScores[competency.name].count += 1;
          }
        });
      }
    });

    return Object.entries(competencyScores)
      .filter(([_, data]) => data.count > 0)
      .map(([name, data]) => ({
        name,
        average: (data.total / data.count).toFixed(1)
      }));
  };

  const getUserName = (userId) => {
    const foundUser = users.find(u => u.id === userId);
    return foundUser ? foundUser.name : t('unknown_user');
  };

  const averageScore = getAverageScore();
  const competencyScoresData = getCompetencyScores();

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row justify-between sm:items-center gap-4"
      >
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-1">
            {t('my_profile')}
          </h1>
          <p className="text-muted-foreground text-sm">
            {t('my_profile_desc')}
          </p>
        </div>
        
        <Button
          onClick={() => isEditing ? handleSave() : setIsEditing(true)}
          className="bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto"
        >
          {isEditing ? (
            <>
              <Save className="h-4 w-4 mr-2" />
              {t('save')}
            </>
          ) : (
            <>
              <Edit className="h-4 w-4 mr-2" />
              {t('edit')}
            </>
          )}
        </Button>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="lg:col-span-1"
        >
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">{t('personal_info')}</CardTitle>
              <CardDescription className="text-muted-foreground">
                {t('personal_info_desc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-center mb-6 relative">
                <img 
                  src={formData.avatar_url || `https://ui-avatars.com/api/?name=${formData.name?.replace(/\s/g, '+')}&background=random`} 
                  alt={formData.name}
                  className="w-24 h-24 rounded-full object-cover border-2 border-primary"
                />
                {isEditing && (
                  <button
                    onClick={() => fileInputRef.current.click()}
                    className="absolute bottom-0 right-1/2 translate-x-10 bg-primary text-primary-foreground p-2 rounded-full hover:bg-primary/90 transition-all"
                  >
                    <Camera className="h-4 w-4" />
                  </button>
                )}
                <Input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleAvatarChange} 
                />
              </div>
              
              <div className="space-y-3">
                <div>
                  <Label htmlFor="name" className="text-muted-foreground">{t('name')}</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    disabled={!isEditing}
                    className="bg-input border-border text-foreground"
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="text-muted-foreground">{t('email')}</Label>
                  <Input
                    id="email"
                    value={user?.email}
                    disabled={true}
                    className="bg-input border-border text-foreground"
                  />
                </div>
                <div>
                  <Label htmlFor="position" className="text-muted-foreground">{t('position')}</Label>
                  <Input
                    id="position"
                    value={formData.position}
                    onChange={(e) => setFormData({...formData, position: e.target.value})}
                    disabled={!isEditing}
                    className="bg-input border-border text-foreground"
                  />
                </div>
                <div>
                  <Label htmlFor="department" className="text-muted-foreground">{t('department')}</Label>
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                    disabled={!isEditing}
                    className="bg-input border-border text-foreground"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:col-span-2"
        >
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="bg-card border-border p-1">
              <TabsTrigger value="overview" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary text-muted-foreground">
                {t('overview')}
              </TabsTrigger>
              <TabsTrigger value="evaluations" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary text-muted-foreground">
                {t('my_evaluations')}
              </TabsTrigger>
              <TabsTrigger value="competencies" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary text-muted-foreground">
                {t('competencies')}
              </TabsTrigger>
              <TabsTrigger value="projects" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary text-muted-foreground">
                {t('my_projects')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-card border-border">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3">
                      <Star className="h-7 w-7 text-yellow-500" />
                      <div>
                        <p className="text-2xl font-bold text-foreground">{averageScore}</p>
                        <p className="text-sm text-muted-foreground">{t('avg_score')}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-card border-border">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-7 w-7 text-blue-500" />
                      <div>
                        <p className="text-2xl font-bold text-foreground">{myEvaluations.length}</p>
                        <p className="text-sm text-muted-foreground">{t('evals_received')}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-card border-border">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3">
                      <Award className="h-7 w-7 text-green-500" />
                      <div>
                        <p className="text-2xl font-bold text-foreground">
                          {myEvaluations.filter(e => e.status === 'completed').length}
                        </p>
                        <p className="text-sm text-muted-foreground">{t('completed_evals')}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="evaluations" className="space-y-4">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">{t('received_competence_evals')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {myEvaluations.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">
                        {t('no_evals_found')}
                      </p>
                    ) : (
                      myEvaluations.map((evaluation) => (
                        <div
                          key={evaluation.id}
                          className="flex items-center justify-between p-4 bg-background rounded-lg border border-border"
                        >
                          <div>
                            <h4 className="font-medium text-foreground">{t('eval_of_period', { period: evaluation.period })}</h4>
                            <p className="text-sm text-muted-foreground">
                              {t('evaluator_name', { name: getUserName(evaluation.evaluator_id) })}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {t('type')}: {evaluation.type === '180' ? t('eval_type_180_short') : t('eval_type_360_short')}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              evaluation.status === 'completed' 
                                ? 'bg-green-500/20 text-green-700 dark:text-green-300' 
                                : evaluation.status === 'active'
                                ? 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300'
                                : 'bg-gray-500/20 text-gray-700 dark:text-gray-300'
                            }`}>
                              {t(`status_${evaluation.status}`)}
                            </span>
                            {evaluation.status === 'completed' && evaluation.scores && Object.keys(evaluation.scores).length > 0 && (
                              <p className="text-sm text-foreground mt-1">
                                {t('score')}: {(Object.values(evaluation.scores).reduce((a, b) => a + b, 0) / Object.values(evaluation.scores).length).toFixed(1)}
                              </p>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="competencies" className="space-y-4">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">{t('performance_by_competency')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {competencyScoresData.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">
                        {t('no_competencies_evaluated')}
                      </p>
                    ) : (
                      competencyScoresData.map((comp, index) => (
                        <div key={index} className="space-y-1.5">
                          <div className="flex justify-between items-center">
                            <span className="text-foreground font-medium text-sm">{comp.name}</span>
                            <span className="text-foreground text-sm">{comp.average}/5</span>
                          </div>
                          <div className="w-full bg-input rounded-full h-2.5">
                            <div
                              className="bg-primary h-2.5 rounded-full transition-all duration-500"
                              style={{ width: `${(comp.average / 5) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="projects" className="space-y-4">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">{t('my_projects')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {myProjects.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">
                        {t('no_projects_found')}
                      </p>
                    ) : (
                      myProjects.map((project) => (
                        <Link
                          key={project.id}
                          to="/projects"
                          state={{ selectedProjectId: project.id }}
                          className="flex items-center justify-between p-4 bg-background rounded-lg border border-border hover:bg-muted transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <FolderKanban className="h-5 w-5 text-primary" />
                            <div>
                              <h4 className="font-medium text-foreground">{project.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                {t('start_date')}: {new Date(project.start_date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${project.status === 'open' ? 'bg-green-500/20 text-green-700' : 'bg-red-500/20 text-red-700'}`}>
                            {t(project.status)}
                          </span>
                        </Link>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

          </Tabs>
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;