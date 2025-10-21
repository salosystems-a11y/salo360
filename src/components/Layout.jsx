import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, Users as UsersIconLucide, BarChart3, ShoppingBasket as Sitemap, User, LogOut, Menu, X, Settings as SettingsIcon, FolderKanban, ChevronDown, Globe, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useData } from '@/contexts/DataContext';
import EvaluationFormModal from '@/components/evaluations/EvaluationFormModal';
import { ProjectFormModal } from '@/pages/Projects';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from '@/hooks/useTranslation';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
  
  const { user, signOut, loading: authLoading } = useAuth();
  const { roles, users, competencies, saveEvaluations, projects, saveProjects, loading: dataLoading } = useData();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { setLanguage } = useLanguage();
  const t = useTranslation();

  const [isEvaluationDropdownOpen, setEvaluationDropdownOpen] = useState(false);
  const [isCompetencySubmenuOpen, setIsCompetencySubmenuOpen] = useState(false);
  const [isSettingsDropdownOpen, setSettingsDropdownOpen] = useState(false);
  const [isEvalModalOpen, setEvalModalOpen] = useState(false);
  const [isProjectModalOpen, setProjectModalOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const userRoleDetails = user && roles.length > 0 ? roles.find(r => r.id === user.role) : null;

  const getRoleName = (roleId) => {
    if (!roles || roles.length === 0) return roleId;
    const role = roles.find(r => r.id === roleId);
    return role ? t(role.name.toLowerCase()) : roleId;
  };

  const userRoleName = user ? getRoleName(user.role) : '';
  const canCreateCompetenceEval = userRoleDetails?.permissions?.includes('create_evaluations');
  const canCreateProject = user?.role === 'admin' || user?.role === 'manager';

  const menuItems = [
    { icon: LayoutDashboard, label: t('dashboard'), path: '/' },
    { icon: Sitemap, label: t('organogram'), path: '/organogram' },
    { icon: BarChart3, label: t('reports'), path: '/reports' },
  ];

  const settingsMenuItems = [
    { icon: UsersIconLucide, label: t('user_management'), path: '/collaborators', permission: 'manage_users' },
    { icon: User, label: t('profile'), path: '/profile' },
    { icon: SettingsIcon, label: t('general_settings'), path: '/settings', permission: 'manage_settings' },
  ];

  const hasPermission = (permission) => {
    if (!permission) return true;
    if (!userRoleDetails || !userRoleDetails.permissions) return false;
    return userRoleDetails.permissions.includes(permission);
  };
  
  const isLoading = authLoading || dataLoading;
  
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="text-center">
          <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12 mb-4 mx-auto"></div>
          <h2 className="text-xl font-semibold text-foreground">A carregar dados...</h2>
          <p className="text-muted-foreground">Por favor, aguarde um momento.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <EvaluationFormModal
        isOpen={isEvalModalOpen}
        onClose={() => setEvalModalOpen(false)}
        onSubmit={(newEvaluations) => {
          const allEvaluations = JSON.parse(localStorage.getItem('evaluations') || '[]');
          saveEvaluations([...allEvaluations, ...newEvaluations]);
          setEvalModalOpen(false);
          toast({
            title: t('success'),
            description: t('evaluation_started_notification'),
            className: "bg-green-500 text-white",
          });
        }}
        users={users}
        competencies={competencies}
        currentUser={user}
        roles={roles}
      />
      <ProjectFormModal
        isOpen={isProjectModalOpen}
        setIsOpen={setProjectModalOpen}
        onSave={(projectData) => {
          const existingIndex = projects.findIndex(p => p.id === projectData.id);
          let newProjects;
          if (existingIndex > -1) {
            newProjects = [...projects];
            newProjects[existingIndex] = projectData;
          } else {
            newProjects = [...projects, projectData];
          }
          saveProjects(newProjects);
        }}
      />

      <div className="flex h-screen bg-background text-foreground">
        {sidebarOpen && window.innerWidth < 1024 && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <motion.div
          initial={false}
          animate={{
            x: sidebarOpen ? 0 : '-100%',
            width: sidebarOpen ? '16rem' : '0rem'
          }}
          transition={{ duration: 0.3, type: 'tween' }}
          className={`fixed lg:relative lg:translate-x-0 z-50 h-full sidebar-gradient border-r border-border overflow-y-auto`}
        >
          <div className="flex flex-col h-full p-4 w-64">
            <div className="flex items-center justify-between mb-6 pt-2">
              <Link to="/" className="flex items-center space-x-2 text-xl font-semibold">
                <img src="https://storage.googleapis.com/hostinger-horizons-assets-prod/f04a1a34-d7e4-4816-8ab0-354964bc379b/aa66381f637605ca31ec6571ff073a63.png" alt="Salo 360 Logo" className="h-8 w-auto" />
                <span className="gradient-text">Salo 360</span>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden text-foreground"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="glass-effect rounded-md p-3 mb-4">
              <div className="flex items-center space-x-3">
                <img
                  src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name?.replace(/\s/g, '+')}&background=random`}
                  alt={user?.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <p className="text-foreground font-medium text-sm">{user?.name}</p>
                  <p className="text-muted-foreground text-xs">{user?.position} ({userRoleName})</p>
                </div>
              </div>
            </div>

            <nav className="flex-1">
              <ul className="space-y-1.5">
                {menuItems.map((item) => (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={`flex items-center space-x-3 px-3 py-2.5 rounded-md transition-colors duration-200 text-sm font-medium ${location.pathname === item.path ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                      onClick={() => { if (window.innerWidth < 1024) setSidebarOpen(false); }}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                ))}
                
                <li>
                  <button
                    onClick={() => setEvaluationDropdownOpen(!isEvaluationDropdownOpen)}
                    className="flex items-center justify-between w-full space-x-3 px-3 py-2.5 rounded-md transition-colors duration-200 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <div className="flex items-center space-x-3">
                      <Star className="h-4 w-4" />
                      <span>Avaliação</span>
                    </div>
                    <ChevronDown className={`h-4 w-4 transition-transform ${isEvaluationDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isEvaluationDropdownOpen && (
                    <div className="pl-6 pt-1 space-y-1">
                      <div>
                        <button onClick={() => setIsCompetencySubmenuOpen(!isCompetencySubmenuOpen)} className="flex items-center justify-between w-full text-left text-muted-foreground hover:text-foreground text-sm py-1.5 cursor-pointer">
                          <span>Por Competência</span>
                          <ChevronDown className={`h-4 w-4 transition-transform ${isCompetencySubmenuOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isCompetencySubmenuOpen && (
                          <div className="pl-4 pt-1 space-y-1">
                            {canCreateCompetenceEval && <button onClick={() => { setEvalModalOpen(true); if (window.innerWidth < 1024) setSidebarOpen(false); }} className="w-full text-left text-muted-foreground hover:text-foreground text-sm py-1.5">Nova Avaliação</button>}
                            <Link to="/evaluations" onClick={() => { if (window.innerWidth < 1024) setSidebarOpen(false); }} className="block w-full text-left text-muted-foreground hover:text-foreground text-sm py-1.5">Avaliações</Link>
                          </div>
                        )}
                      </div>
                      <Link to="/projects" onClick={() => { if (window.innerWidth < 1024) setSidebarOpen(false); }} className="block w-full text-left text-muted-foreground hover:text-foreground text-sm py-1.5">
                        Por Projeto
                      </Link>
                    </div>
                  )}
                </li>
                
                <li>
                  <button
                    onClick={() => setSettingsDropdownOpen(!isSettingsDropdownOpen)}
                    className="flex items-center justify-between w-full space-x-3 px-3 py-2.5 rounded-md transition-colors duration-200 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <div className="flex items-center space-x-3">
                      <SettingsIcon className="h-4 w-4" />
                      <span>{t('settings')}</span>
                    </div>
                    <ChevronDown className={`h-4 w-4 transition-transform ${isSettingsDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isSettingsDropdownOpen && (
                    <div className="pl-8 pt-1 space-y-1">
                      {settingsMenuItems.filter(item => hasPermission(item.permission)).map(item => (
                        <Link
                          key={item.path}
                          to={item.path}
                          className={`flex items-center w-full text-left py-1.5 text-sm ${location.pathname === item.path ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                          onClick={() => { if (window.innerWidth < 1024) setSidebarOpen(false); }}
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </li>
              </ul>
            </nav>

            <Button
              variant="ghost"
              className="flex items-center space-x-3 w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 mt-auto px-3 py-2.5"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              <span className="text-sm font-medium">{t('logout')}</span>
            </Button>
          </div>
        </motion.div>

        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="bg-card border-b border-border p-4">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="icon"
                className="text-foreground"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <Menu className="h-5 w-5" />
              </Button>

              <div className="flex items-center space-x-4 ml-auto">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Globe className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setLanguage('pt')}>
                      Português
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setLanguage('en')}>
                      English
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <span className="text-sm text-foreground hidden sm:inline">
                  {t('welcome')}, {user?.name}!
                </span>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-auto p-6 bg-background">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="h-full"
            >
              {children}
            </motion.div>
          </main>
        </div>
      </div>
    </>
  );
};

export default Layout;