import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Briefcase, Zap, Building, UserCheck, ShieldCheck, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useData } from '@/contexts/DataContext';
import { toast } from '@/components/ui/use-toast';
import { useTranslation } from '@/hooks/useTranslation';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { supabase } from '@/lib/customSupabaseClient';

const Settings = () => {
  const { 
    roles, 
    competencies,
    departments,
    positions,
    permissions,
    refreshData
  } = useData();
  const t = useTranslation();

  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [roleFormData, setRoleFormData] = useState({ id: '', name: '', description: '', permissions: [] });

  const [isCompetencyDialogOpen, setIsCompetencyDialogOpen] = useState(false);
  const [editingCompetency, setEditingCompetency] = useState(null);
  const [competencyFormData, setCompetencyFormData] = useState({ name: '', description: '', roles: [] });

  const [isDeptDialogOpen, setIsDeptDialogOpen] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [deptFormData, setDeptFormData] = useState({ name: '' });

  const [isPositionDialogOpen, setIsPositionDialogOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState(null);
  const [positionFormData, setPositionFormData] = useState({ name: '' });

  const [isPermissionDialogOpen, setIsPermissionDialogOpen] = useState(false);
  const [editingPermission, setEditingPermission] = useState(null);
  const [permissionFormData, setPermissionFormData] = useState({ id: '', name: '', description: '' });

  const handleRoleSubmit = async (e) => {
    e.preventDefault();
    let error;
    if (editingRole) {
      ({ error } = await supabase.from('roles').update(roleFormData).eq('id', editingRole.id));
      if (!error) toast({ title: t('role_updated'), description: t('role_updated_desc') });
    } else {
      ({ error } = await supabase.from('roles').insert(roleFormData));
      if (!error) toast({ title: t('role_created'), description: t('role_created_desc') });
    }
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else refreshData();
    
    setIsRoleDialogOpen(false);
    setEditingRole(null);
    setRoleFormData({ id: '', name: '', description: '', permissions: [] });
  };

  const handleEditRole = (role) => {
    setEditingRole(role);
    setRoleFormData({ id: role.id, name: role.name, description: role.description, permissions: role.permissions || [] });
    setIsRoleDialogOpen(true);
  };

  const handleDeleteRole = async (roleId) => {
    const { error } = await supabase.from('roles').delete().eq('id', roleId);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: t('role_removed'), description: t('role_removed_desc') });
      refreshData();
    }
  };

  const handlePermissionToggle = (permissionId) => {
    setRoleFormData(prev => {
      const newPermissions = prev.permissions.includes(permissionId)
        ? prev.permissions.filter(p => p !== permissionId)
        : [...prev.permissions, permissionId];
      return { ...prev, permissions: newPermissions };
    });
  };

  const handleCompetencySubmit = async (e) => {
    e.preventDefault();
    let error;
    if (editingCompetency) {
      ({ error } = await supabase.from('competencies').update(competencyFormData).eq('id', editingCompetency.id));
      if (!error) toast({ title: t('competency_updated'), description: t('competency_updated_desc') });
    } else {
      ({ error } = await supabase.from('competencies').insert(competencyFormData));
      if (!error) toast({ title: t('competency_created'), description: t('competency_created_desc') });
    }
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else refreshData();

    setIsCompetencyDialogOpen(false);
    setEditingCompetency(null);
    setCompetencyFormData({ name: '', description: '', roles: [] });
  };

  const handleEditCompetency = (competency) => {
    setEditingCompetency(competency);
    setCompetencyFormData({ name: competency.name, description: competency.description, roles: competency.roles || [] });
    setIsCompetencyDialogOpen(true);
  };

  const handleDeleteCompetency = async (competencyId) => {
    const { error } = await supabase.from('competencies').delete().eq('id', competencyId);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: t('competency_removed'), description: t('competency_removed_desc') });
      refreshData();
    }
  };

  const handleCompetencyRoleToggle = (roleId) => {
    setCompetencyFormData(prev => {
      const newRoles = prev.roles.includes(roleId)
        ? prev.roles.filter(r => r !== roleId)
        : [...prev.roles, roleId];
      return { ...prev, roles: newRoles };
    });
  };

  const handleDeptSubmit = async (e) => {
    e.preventDefault();
    let error;
    if (editingDept) {
      ({ error } = await supabase.from('departments').update(deptFormData).eq('id', editingDept.id));
      if (!error) toast({ title: t('department_updated'), description: t('department_updated_desc') });
    } else {
      ({ error } = await supabase.from('departments').insert(deptFormData));
      if (!error) toast({ title: t('department_created'), description: t('department_created_desc') });
    }
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else refreshData();

    setIsDeptDialogOpen(false);
    setEditingDept(null);
    setDeptFormData({ name: '' });
  };

  const handleEditDept = (dept) => {
    setEditingDept(dept);
    setDeptFormData({ name: dept.name });
    setIsDeptDialogOpen(true);
  };

  const handleDeleteDept = async (deptId) => {
    const { error } = await supabase.from('departments').delete().eq('id', deptId);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: t('department_removed'), description: t('department_removed_desc') });
      refreshData();
    }
  };

  const handlePositionSubmit = async (e) => {
    e.preventDefault();
    let error;
    if (editingPosition) {
      ({ error } = await supabase.from('positions').update(positionFormData).eq('id', editingPosition.id));
      if (!error) toast({ title: t('position_updated'), description: t('position_updated_desc') });
    } else {
      ({ error } = await supabase.from('positions').insert(positionFormData));
      if (!error) toast({ title: t('position_created'), description: t('position_created_desc') });
    }
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else refreshData();

    setIsPositionDialogOpen(false);
    setEditingPosition(null);
    setPositionFormData({ name: '' });
  };

  const handleEditPosition = (pos) => {
    setEditingPosition(pos);
    setPositionFormData({ name: pos.name });
    setIsPositionDialogOpen(true);
  };

  const handleDeletePosition = async (posId) => {
    const { error } = await supabase.from('positions').delete().eq('id', posId);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: t('position_removed'), description: t('position_removed_desc') });
      refreshData();
    }
  };

  const handlePermissionSubmit = async (e) => {
    e.preventDefault();
    const id = permissionFormData.name.toLowerCase().replace(/\s+/g, '_');
    const newPermission = { ...permissionFormData, id };
    let error;

    if (editingPermission) {
      ({ error } = await supabase.from('permissions').update(newPermission).eq('id', editingPermission.id));
      if (!error) toast({ title: t('permission_updated'), description: t('permission_updated_desc') });
    } else {
      if (permissions.some(p => p.id === id)) {
        toast({ title: "ID de Permissão Duplicado", description: "Já existe uma permissão com este nome.", variant: "destructive" });
        return;
      }
      ({ error } = await supabase.from('permissions').insert(newPermission));
      if (!error) toast({ title: t('permission_created'), description: t('permission_created_desc') });
    }
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else refreshData();

    setIsPermissionDialogOpen(false);
    setEditingPermission(null);
    setPermissionFormData({ id: '', name: '', description: '' });
  };

  const handleEditPermission = (permission) => {
    setEditingPermission(permission);
    setPermissionFormData({ id: permission.id, name: permission.name, description: permission.description });
    setIsPermissionDialogOpen(true);
  };

  const handleDeletePermission = async (permissionId) => {
    const { error } = await supabase.from('permissions').delete().eq('id', permissionId);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: t('permission_removed'), description: t('permission_removed_desc') });
      refreshData();
    }
  };

  const renderGenericList = (items, onEdit, onDelete, titleKey, descriptionContent) => (
    <div className="space-y-4">
      {items.map(item => (
        <div key={item.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-background rounded-lg border border-border gap-3">
          <div className="flex-1">
            <h3 className="text-foreground font-semibold">{item[titleKey]}</h3>
            {descriptionContent ? descriptionContent(item) : (item.description && <p className="text-muted-foreground text-sm">{item.description}</p>)}
          </div>
          <div className="flex space-x-2 self-start sm:self-center">
            <Button variant="outline" size="icon" onClick={() => onEdit(item)} className="border-border text-foreground hover:bg-muted">
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => onDelete(item.id)} className="border-destructive/50 text-destructive hover:bg-destructive/10">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-1">{t('settings_title')}</h1>
        <p className="text-muted-foreground text-sm">{t('settings_desc')}</p>
      </motion.div>

      <Tabs defaultValue="roles" className="space-y-6">
        <TabsList className="bg-card border-border p-1 grid grid-cols-2 md:grid-cols-5 h-auto">
          <TabsTrigger value="roles" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary text-muted-foreground"><Briefcase className="h-4 w-4 mr-2" /> {t('roles')}</TabsTrigger>
          <TabsTrigger value="permissions" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary text-muted-foreground"><ShieldCheck className="h-4 w-4 mr-2" /> {t('permissions')}</TabsTrigger>
          <TabsTrigger value="competencies" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary text-muted-foreground"><Zap className="h-4 w-4 mr-2" /> {t('competencies')}</TabsTrigger>
          <TabsTrigger value="departments" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary text-muted-foreground"><Building className="h-4 w-4 mr-2" /> {t('departments')}</TabsTrigger>
          <TabsTrigger value="positions" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary text-muted-foreground"><UserCheck className="h-4 w-4 mr-2" /> {t('positions')}</TabsTrigger>
        </TabsList>

        <TabsContent value="roles">
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-foreground">{t('manage_roles')}</CardTitle>
                <CardDescription className="text-muted-foreground">{t('manage_roles_desc')}</CardDescription>
              </div>
              <Dialog open={isRoleDialogOpen} onOpenChange={(isOpen) => { setIsRoleDialogOpen(isOpen); if (!isOpen) { setEditingRole(null); setRoleFormData({ id: '', name: '', description: '', permissions: [] }); } }}>
                <DialogTrigger asChild><Button className="bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto"><Plus className="h-4 w-4 mr-2" /> {t('new_role')}</Button></DialogTrigger>
                <DialogContent className="bg-card border-border text-foreground sm:max-w-lg">
                  <DialogHeader><DialogTitle>{editingRole ? t('edit_role') : t('new_role')}</DialogTitle></DialogHeader>
                  <form onSubmit={handleRoleSubmit} className="space-y-4">
                    <div className="space-y-1.5"><Label htmlFor="roleId" className="text-muted-foreground">{t('role_id')}</Label><Input id="roleId" value={roleFormData.id} onChange={(e) => setRoleFormData({ ...roleFormData, id: e.target.value })} className="bg-input border-border text-foreground" required disabled={!!editingRole} /></div>
                    <div className="space-y-1.5"><Label htmlFor="roleName" className="text-muted-foreground">{t('role_name')}</Label><Input id="roleName" value={roleFormData.name} onChange={(e) => setRoleFormData({ ...roleFormData, name: e.target.value })} className="bg-input border-border text-foreground" required /></div>
                    <div className="space-y-1.5"><Label htmlFor="roleDescription" className="text-muted-foreground">{t('description')}</Label><Input id="roleDescription" value={roleFormData.description} onChange={(e) => setRoleFormData({ ...roleFormData, description: e.target.value })} className="bg-input border-border text-foreground" /></div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">{t('permissions')}</Label>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="w-full justify-start font-normal text-left h-auto min-h-[40px]">
                            {roleFormData.permissions.length > 0 ? `${roleFormData.permissions.length} ${t('permissions_selected')}` : t('select_permissions')}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] max-h-60 overflow-y-auto">
                          {permissions.map(p => (
                            <DropdownMenuItem key={p.id} onSelect={(e) => e.preventDefault()} onClick={() => handlePermissionToggle(p.id)}>
                              <div className={`w-4 h-4 mr-2 flex items-center justify-center border border-primary rounded-sm ${roleFormData.permissions.includes(p.id) ? 'bg-primary' : ''}`}>
                                {roleFormData.permissions.includes(p.id) && <Check className="h-3 w-3 text-primary-foreground" />}
                              </div>
                              {p.name}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <DialogFooter><Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">{editingRole ? t('update') : t('create')}</Button></DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>{renderGenericList(roles, handleEditRole, handleDeleteRole, 'name')}</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions">
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-foreground">{t('manage_permissions')}</CardTitle>
                <CardDescription className="text-muted-foreground">{t('manage_permissions_desc')}</CardDescription>
              </div>
              <Dialog open={isPermissionDialogOpen} onOpenChange={(isOpen) => { setIsPermissionDialogOpen(isOpen); if (!isOpen) { setEditingPermission(null); setPermissionFormData({ id: '', name: '', description: '' }); } }}>
                <DialogTrigger asChild><Button className="bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto"><Plus className="h-4 w-4 mr-2" /> {t('new_permission')}</Button></DialogTrigger>
                <DialogContent className="bg-card border-border text-foreground">
                  <DialogHeader><DialogTitle>{editingPermission ? t('edit_permission') : t('new_permission')}</DialogTitle></DialogHeader>
                  <form onSubmit={handlePermissionSubmit} className="space-y-4">
                    <div className="space-y-1.5"><Label htmlFor="permissionName" className="text-muted-foreground">{t('permission_name')}</Label><Input id="permissionName" value={permissionFormData.name} onChange={(e) => setPermissionFormData({ ...permissionFormData, name: e.target.value })} className="bg-input border-border text-foreground" required /></div>
                    <div className="space-y-1.5"><Label htmlFor="permissionDescription" className="text-muted-foreground">{t('description')}</Label><Input id="permissionDescription" value={permissionFormData.description} onChange={(e) => setPermissionFormData({ ...permissionFormData, description: e.target.value })} className="bg-input border-border text-foreground" /></div>
                    <DialogFooter><Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">{editingPermission ? t('update') : t('create')}</Button></DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>{renderGenericList(permissions, handleEditPermission, handleDeletePermission, 'name')}</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="competencies">
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-foreground">{t('manage_competencies')}</CardTitle>
                <CardDescription className="text-muted-foreground">{t('manage_competencies_desc')}</CardDescription>
              </div>
              <Dialog open={isCompetencyDialogOpen} onOpenChange={(isOpen) => { setIsCompetencyDialogOpen(isOpen); if (!isOpen) { setEditingCompetency(null); setCompetencyFormData({ name: '', description: '', roles: [] }); } }}>
                <DialogTrigger asChild><Button className="bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto"><Plus className="h-4 w-4 mr-2" /> {t('new_competency')}</Button></DialogTrigger>
                <DialogContent className="bg-card border-border text-foreground sm:max-w-lg">
                  <DialogHeader><DialogTitle>{editingCompetency ? t('edit_competency') : t('new_competency')}</DialogTitle></DialogHeader>
                  <form onSubmit={handleCompetencySubmit} className="space-y-4">
                    <div className="space-y-1.5"><Label htmlFor="competencyName" className="text-muted-foreground">{t('competency_name')}</Label><Input id="competencyName" value={competencyFormData.name} onChange={(e) => setCompetencyFormData({ ...competencyFormData, name: e.target.value })} className="bg-input border-border text-foreground" required /></div>
                    <div className="space-y-1.5"><Label htmlFor="competencyDescription" className="text-muted-foreground">{t('description')}</Label><Input id="competencyDescription" value={competencyFormData.description} onChange={(e) => setCompetencyFormData({ ...competencyFormData, description: e.target.value })} className="bg-input border-border text-foreground" /></div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">{t('roles')}</Label>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="w-full justify-start font-normal text-left h-auto min-h-[40px]">
                            {competencyFormData.roles.length > 0 ? `${competencyFormData.roles.length} ${t('roles_selected')}` : t('select_roles')}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] max-h-60 overflow-y-auto">
                          {roles.map(r => (
                            <DropdownMenuItem key={r.id} onSelect={(e) => e.preventDefault()} onClick={() => handleCompetencyRoleToggle(r.id)}>
                              <div className={`w-4 h-4 mr-2 flex items-center justify-center border border-primary rounded-sm ${competencyFormData.roles.includes(r.id) ? 'bg-primary' : ''}`}>
                                {competencyFormData.roles.includes(r.id) && <Check className="h-3 w-3 text-primary-foreground" />}
                              </div>
                              {r.name}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <DialogFooter><Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">{editingCompetency ? t('update') : t('create')}</Button></DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>{renderGenericList(competencies, handleEditCompetency, handleDeleteCompetency, 'name', (item) => (
              <p className="text-muted-foreground text-sm">
                {item.description}
                <br />
                <span className="font-medium text-foreground">{t('roles')}: </span>
                {item.roles?.map(roleId => roles.find(r => r.id === roleId)?.name).join(', ') || 'Nenhum'}
              </p>
            ))}</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="departments">
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-foreground">{t('manage_departments')}</CardTitle>
                <CardDescription className="text-muted-foreground">{t('manage_departments_desc')}</CardDescription>
              </div>
              <Dialog open={isDeptDialogOpen} onOpenChange={(isOpen) => { setIsDeptDialogOpen(isOpen); if (!isOpen) { setEditingDept(null); setDeptFormData({ name: '' }); } }}>
                <DialogTrigger asChild><Button className="bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto"><Plus className="h-4 w-4 mr-2" /> {t('new_department')}</Button></DialogTrigger>
                <DialogContent className="bg-card border-border text-foreground">
                  <DialogHeader><DialogTitle>{editingDept ? t('edit_department') : t('new_department')}</DialogTitle></DialogHeader>
                  <form onSubmit={handleDeptSubmit} className="space-y-4">
                    <div className="space-y-1.5"><Label htmlFor="deptName" className="text-muted-foreground">{t('department_name')}</Label><Input id="deptName" value={deptFormData.name} onChange={(e) => setDeptFormData({ ...deptFormData, name: e.target.value })} className="bg-input border-border text-foreground" required /></div>
                    <DialogFooter><Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">{editingDept ? t('update') : t('create')}</Button></DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>{renderGenericList(departments, handleEditDept, handleDeleteDept, 'name')}</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="positions">
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-foreground">{t('manage_positions')}</CardTitle>
                <CardDescription className="text-muted-foreground">{t('manage_positions_desc')}</CardDescription>
              </div>
              <Dialog open={isPositionDialogOpen} onOpenChange={(isOpen) => { setIsPositionDialogOpen(isOpen); if (!isOpen) { setEditingPosition(null); setPositionFormData({ name: '' }); } }}>
                <DialogTrigger asChild><Button className="bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto"><Plus className="h-4 w-4 mr-2" /> {t('new_position')}</Button></DialogTrigger>
                <DialogContent className="bg-card border-border text-foreground">
                  <DialogHeader><DialogTitle>{editingPosition ? t('edit_position') : t('new_position')}</DialogTitle></DialogHeader>
                  <form onSubmit={handlePositionSubmit} className="space-y-4">
                    <div className="space-y-1.5"><Label htmlFor="positionName" className="text-muted-foreground">{t('position_name')}</Label><Input id="positionName" value={positionFormData.name} onChange={(e) => setPositionFormData({ ...positionFormData, name: e.target.value })} className="bg-input border-border text-foreground" required /></div>
                    <DialogFooter><Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">{editingPosition ? t('update') : t('create')}</Button></DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>{renderGenericList(positions, handleEditPosition, handleDeletePosition, 'name')}</CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;