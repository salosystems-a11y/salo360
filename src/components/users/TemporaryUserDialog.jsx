import React, { useState } from 'react';
import { Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useData } from '@/contexts/DataContext';
import { toast } from '@/components/ui/use-toast';
import { useTranslation } from '@/hooks/useTranslation';

// This component is no longer used directly, as the logic is now inside Projects.jsx
// It can be removed in a future cleanup.
const TemporaryUserDialog = ({ open, onOpenChange }) => {
  const { users, roles, refreshData } = useData();
  const t = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: roles.find(r => r.id === 'employee')?.id || '',
    expirationValue: '1',
    expirationUnit: 'hours',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    toast({ title: "Obsoleto", description: "Esta funcionalidade foi movida para a criação de projetos." });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-primary/50 text-primary hover:bg-primary/10 w-full">
          <Clock className="h-4 w-4 mr-2" />
          {t('temp_collaborator')}
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border text-foreground">
        <DialogHeader>
          <DialogTitle>{t('new_temp_collaborator')}</DialogTitle>
          <DialogDescription>
            {t('new_temp_collaborator_desc')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="temp-name">{t('name')}</Label>
            <Input id="temp-name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="temp-email">{t('email')}</Label>
              <Input id="temp-email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="temp-password">{t('password')}</Label>
              <Input id="temp-password" type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="temp-role">{t('role')}</Label>
            <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {roles.filter(role => role.id).map(role => (
                  <SelectItem key={role.id} value={role.id}>{t(role.name.toLowerCase())}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>{t('session_duration')}</Label>
            <div className="flex items-center gap-2">
              <Input type="number" min="1" value={formData.expirationValue} onChange={(e) => setFormData({ ...formData, expirationValue: e.target.value })} className="w-1/3" />
              <Select value={formData.expirationUnit} onValueChange={(value) => setFormData({ ...formData, expirationUnit: value })}>
                <SelectTrigger className="w-2/3"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="minutes">{t('minutes')}</SelectItem>
                  <SelectItem value="hours">{t('hours')}</SelectItem>
                  <SelectItem value="days">{t('days')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">{t('create_temp_collaborator')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TemporaryUserDialog;