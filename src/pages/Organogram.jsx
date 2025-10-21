import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, ChevronDown, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useData } from '@/contexts/DataContext';
import { useTranslation } from '@/hooks/useTranslation';

const Organogram = () => {
  const { users, roles } = useData();
  const t = useTranslation();
  const [expandedNodes, setExpandedNodes] = useState(new Set());

  const toggleNode = (userId) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedNodes(newExpanded);
  };

  const buildHierarchy = () => {
    if (!users || users.length === 0) return [];
    
    const hierarchy = {};
    const rootUsers = [];

    users.forEach(user => {
      hierarchy[user.id] = { ...user, children: [] };
    });

    users.forEach(user => {
      if (user.manager_id && hierarchy[user.manager_id]) {
        hierarchy[user.manager_id].children.push(hierarchy[user.id]);
      } else {
        rootUsers.push(hierarchy[user.id]);
      }
    });

    return rootUsers;
  };

  const UserNode = ({ user, level = 0 }) => {
    const hasChildren = user.children && user.children.length > 0;
    const isExpanded = expandedNodes.has(user.id);

    const roleDetails = roles.find(r => r.id === user.role);
    const roleName = roleDetails ? t(roleDetails.name.toLowerCase()) : user.role;

    const getRoleColorClasses = (roleId) => {
      if (roleId === 'admin') return 'bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/30';
      if (roleId === 'manager') return 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30';
      return 'bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30';
    };

    return (
      <div className="relative">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: level * 0.1 }}
          className={`ml-${level * 6} md:ml-${level * 8}`} 
        >
          <Card className="bg-card border-border card-hover mb-4">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                {hasChildren && (
                  <button
                    onClick={() => toggleNode(user.id)}
                    className="text-muted-foreground hover:text-foreground transition-colors self-start sm:self-center"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5" />
                    ) : (
                      <ChevronRight className="h-5 w-5" />
                    )}
                  </button>
                )}
                
                <img
                  src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.name?.replace(/\s/g, '+')}&background=random`}
                  alt={user.name}
                  className="w-12 h-12 rounded-full"
                />
                
                <div className="flex-1">
                  <h3 className="text-foreground font-semibold text-lg">{user.name}</h3>
                  <p className="text-muted-foreground">{user.position}</p>
                  <p className="text-muted-foreground/80 text-sm">{user.department}</p>
                </div>
                
                <div className="text-left sm:text-right w-full sm:w-auto">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleColorClasses(user.role)}`}>
                    {roleName}
                  </span>
                  {hasChildren && (
                    <p className="text-muted-foreground text-sm mt-1">
                      {user.children.length > 1 ? t('subordinates', { count: user.children.length }) : t('subordinate', { count: user.children.length })}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {hasChildren && isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className={`ml-${(level + 1) * 6} md:ml-${(level + 1) * 8} border-l-2 border-border pl-4`}
          >
            {user.children.map(child => (
              <UserNode key={child.id} user={child} level={level + 1} />
            ))}
          </motion.div>
        )}
      </div>
    );
  };

  const hierarchy = buildHierarchy();
  const totalUsers = users.length;
  const departmentList = [...new Set(users.map(u => u.department).filter(Boolean))];
  const managerCount = users.filter(u => roles.find(r => r.id === u.role)?.id === 'manager' || roles.find(r => r.id === u.role)?.id === 'admin').length;


  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-bold text-foreground mb-2">
          {t('business_organogram')}
        </h1>
        <p className="text-muted-foreground">
          {t('organogram_desc')}
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">{t('total_collaborators_chart')}</p>
                  <p className="text-3xl font-bold text-foreground">{totalUsers}</p>
                </div>
                <Users className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">{t('departments_chart')}</p>
                  <p className="text-3xl font-bold text-foreground">{departmentList.length}</p>
                </div>
                <Users className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">{t('managers_chart')}</p>
                  <p className="text-3xl font-bold text-foreground">{managerCount}</p>
                </div>
                <Users className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}>
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">{t('department_view')}</CardTitle>
            <CardDescription className="text-muted-foreground">
              {t('department_view_desc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {departmentList.map(department => {
                const deptUsers = users.filter(u => u.department === department);
                const deptManagers = deptUsers.filter(u => roles.find(r => r.id === u.role)?.id === 'manager' || roles.find(r => r.id === u.role)?.id === 'admin');
                
                return (
                  <div key={department} className="bg-background rounded-lg p-4 border border-border">
                    <h3 className="text-foreground font-semibold text-lg mb-2">{department}</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('total')}:</span>
                        <span className="text-foreground">{deptUsers.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('managers_chart')}:</span>
                        <span className="text-foreground">{deptManagers.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('employee')}s:</span>
                        <span className="text-foreground">{deptUsers.length - deptManagers.length}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.5 }}>
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">{t('hierarchical_structure')}</CardTitle>
            <CardDescription className="text-muted-foreground">
              {t('hierarchical_structure_desc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {hierarchy.map(user => (
                <UserNode key={user.id} user={user} />
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Organogram;