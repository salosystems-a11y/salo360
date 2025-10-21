import React, { useState, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Search, Clock, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from '@/components/ui/use-toast';
import { useTranslation } from '@/hooks/useTranslation';
import ImportUsersDialog from '@/components/users/ImportUsersDialog';
import { supabase } from '@/lib/customSupabaseClient';

const Users = () => {
  const { users, roles, departments, positions, refreshData } = useData();
  const { user: currentUser } = useAuth();
  const t = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: '',
    department: '',
    position: '',
    manager_id: '',
    avatar_url: ''
  });
  const fileInputRef = useRef(null);

  const currentUserRoleDetails = roles.find(r => r.id === currentUser.role);
  const canManageAllUsers = currentUserRoleDetails?.id === 'admin';

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (user.department && user.department.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileExt = file.name.split('.').pop();
    const fileName = `${editingUser?.id || 'new'}-${Date.now()}.${fileExt}`;
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.manager_id && !editingUser) {
        toast({ title: t('manager_required_title'), description: t('manager_required_desc'), variant: "destructive" });
        return;
    }

    if (editingUser) {
        const { error } = await supabase
            .from('profiles')
            .update({ 
                name: formData.name, 
                role: formData.role, 
                department: formData.department, 
                position: formData.position, 
                manager_id: formData.manager_id,
                avatar_url: formData.avatar_url
            })
            .eq('id', editingUser.id);

        if (error) {
            toast({ title: 'Error updating user', description: error.message, variant: 'destructive' });
        } else {
            toast({ title: t('collaborator_updated_title'), description: t('collaborator_updated_desc') });
            refreshData();
        }

    } else {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: formData.email,
            password: formData.password,
            options: {
                data: {
                    name: formData.name,
                    role: formData.role,
                }
            }
        });

        if (signUpError) {
            toast({ title: 'Error creating user', description: signUpError.message, variant: 'destructive' });
            return;
        }

        if (signUpData.user) {
            const { error: profileError } = await supabase.from('profiles').insert({
                id: signUpData.user.id,
                name: formData.name,
                role: formData.role,
                department: formData.department,
                position: formData.position,
                manager_id: formData.manager_id,
                avatar_url: formData.avatar_url
            });

            if (profileError) {
                toast({ title: 'Error creating profile', description: profileError.message, variant: 'destructive' });
            } else {
                toast({ title: t('collaborator_created_title'), description: t('collaborator_created_desc') });
                refreshData();
            }
        }
    }

    setIsDialogOpen(false);
    setEditingUser(null);
    setFormData({ name: '', email: '', password: '', role: '', department: '', position: '', manager_id: '', avatar_url: '' });
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      department: user.department,
      position: user.position,
      manager_id: user.manager_id || '',
      avatar_url: user.avatar_url || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (userId) => {
    if (currentUserRoleDetails?.id !== 'admin') {
      toast({ title: t('access_denied_title'), description: t('access_denied_desc'), variant: "destructive" });
      return;
    }
    // This requires backend privileges to delete users from auth.users.
    // For now, we only delete from profiles.
    const { error } = await supabase.from('profiles').delete().eq('id', userId);
    
    if (error) {
        toast({ title: 'Error deleting user', description: error.message, variant: 'destructive' });
    } else {
        toast({ title: t('collaborator_removed_title'), description: t('collaborator_removed_desc') });
        refreshData();
    }
  };

  const getRoleName = (roleId) => {
    const role = roles.find(r => r.id === roleId);
    return role ? t(role.name.toLowerCase()) : roleId;
  };

  const getManagerName = (managerId) => {
    if (!managerId) return t('none');
    const manager = users.find(u => u.id === managerId);
    return manager ? manager.name : t('none');
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row justify-between md:items-center gap-4"
      >
        <div>
          <h1 className="text-3xl font-semibold text-foreground mb-1">
            {t('user_management')}
          </h1>
          <p className="text-muted-foreground text-sm">
            {t('collaborator_management_desc')}
          </p>
        </div>
        
        {canManageAllUsers && (
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
             <Dialog open={isDialogOpen} onOpenChange={(isOpen) => {
              setIsDialogOpen(isOpen);
              if (!isOpen) {
                setEditingUser(null);
                setFormData({ name: '', email: '', password: '', role: '', department: '', position: '', manager_id: '', avatar_url: '' });
              }
            }}>
              <DialogTrigger asChild>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90 w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  {t('new_collaborator')}
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border text-foreground">
                <DialogHeader>
                  <DialogTitle>
                    {editingUser ? t('edit_collaborator') : t('new_permanent_collaborator')}
                  </DialogTitle>
                  <DialogDescription className="text-muted-foreground">
                    {editingUser ? t('edit_collaborator_desc') : t('new_permanent_collaborator_desc')}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5"><Label htmlFor="name">{t('name')}</Label><Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="bg-input border-border" required/></div>
                    <div className="space-y-1.5"><Label htmlFor="email">{t('email')}</Label><Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="bg-input border-border" required disabled={!!editingUser} /></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5"><Label htmlFor="password">{t('password')}</Label><Input id="password" type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="bg-input border-border" placeholder={editingUser ? t('leave_blank_to_keep') : ""} required={!editingUser} /></div>
                    <div className="space-y-1.5"><Label htmlFor="role">{t('role')}</Label><Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}><SelectTrigger className="bg-input border-border"><SelectValue placeholder={t('role')} /></SelectTrigger><SelectContent>{roles.filter(role => role.id).map(role => (<SelectItem key={role.id} value={role.id}>{t(role.name.toLowerCase())}</SelectItem>))}</SelectContent></Select></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5"><Label htmlFor="department">{t('department')}</Label><Select value={formData.department} onValueChange={(value) => setFormData({ ...formData, department: value })}><SelectTrigger className="bg-input border-border"><SelectValue placeholder={t('department')} /></SelectTrigger><SelectContent>{departments.map(dept => (<SelectItem key={dept.id} value={dept.name}>{dept.name}</SelectItem>))}</SelectContent></Select></div>
                    <div className="space-y-1.5"><Label htmlFor="position">{t('position')}</Label><Select value={formData.position} onValueChange={(value) => setFormData({ ...formData, position: value })}><SelectTrigger className="bg-input border-border"><SelectValue placeholder={t('position')} /></SelectTrigger><SelectContent>{positions.map(pos => (<SelectItem key={pos.id} value={pos.name}>{pos.name}</SelectItem>))}</SelectContent></Select></div>
                  </div>
                  <div className="space-y-1.5"><Label htmlFor="manager">{t('manager_label')}</Label><Select value={formData.manager_id} onValueChange={(value) => setFormData({ ...formData, manager_id: value === 'none' ? null : value })}><SelectTrigger className="bg-input border-border"><SelectValue placeholder={t('manager_select')} /></SelectTrigger><SelectContent><SelectItem value="none">{t('none')}</SelectItem>{users.filter(u => roles.find(r => r.id === u.role)?.id !== 'employee' && u.id !== editingUser?.id && u.id).map(user => (<SelectItem key={user.id} value={user.id}>{user.name} - {getRoleName(user.role)}</SelectItem>))}</SelectContent></Select></div>
                  <DialogFooter><Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">{editingUser ? t('update_collaborator') : t('create_collaborator')}</Button></DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            <ImportUsersDialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen} />
          </div>
        )}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input placeholder={t('search_collaborators_placeholder')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 bg-input border-border text-foreground placeholder:text-muted-foreground" />
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredUsers.map((user, index) => {
          const userCanBeEdited = canManageAllUsers;
          const isTempUser = user.isTemporary || false;
          return (
            <motion.div key={user.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: index * 0.05 }}>
              <Card className={`bg-card border-border card-hover overflow-hidden ${isTempUser ? 'border-amber-500/50' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start space-x-3">
                    <img src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.name?.replace(/\s/g, '+')}&background=random`} alt={user.name} className="w-14 h-14 rounded-full object-cover" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2"><CardTitle className="text-foreground text-md font-semibold truncate">{user.name}</CardTitle>{isTempUser && <Clock className="h-4 w-4 text-amber-500" title={t('temp_collaborator')}/>}</div>
                      <CardDescription className="text-muted-foreground text-xs truncate">{user.position || 'N/A'}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2.5 text-xs">
                  <div className="flex justify-between"><span className="text-muted-foreground">{t('email')}:</span><span className="text-foreground truncate">{user.email}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">{t('role')}:</span><span className="text-foreground">{getRoleName(user.role)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">{t('department')}:</span><span className="text-foreground">{user.department}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">{t('manager_label')}:</span><span className="text-foreground truncate">{getManagerName(user.manager_id)}</span></div>
                  
                  {userCanBeEdited && (
                    <div className="flex space-x-2 pt-2.5">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(user)} className="flex-1 border-border text-foreground hover:bg-muted" disabled={isTempUser}><Edit className="h-3.5 w-3.5 mr-1" />{t('edit')}</Button>
                      {user.id !== currentUser.id && (<Button variant="outline" size="sm" onClick={() => handleDelete(user.id)} className="border-destructive/50 text-destructive hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5" /></Button>)}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {filteredUsers.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="text-center py-10">
          <p className="text-muted-foreground text-md">{t('no_collaborators_found')}</p>
        </motion.div>
      )}
    </div>
  );
};

export default Users;