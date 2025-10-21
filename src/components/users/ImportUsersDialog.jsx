import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UploadCloud, FileSpreadsheet, Server, Download } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { toast } from '@/components/ui/use-toast';
import * as XLSX from 'xlsx';
import { generateExcelTemplate } from '@/utils/excelExport';
import { useTranslation } from '@/hooks/useTranslation';

const ImportUsersDialog = ({ open, onOpenChange }) => {
  const { users, refreshData } = useData();
  const t = useTranslation();
  const [file, setFile] = useState(null);
  const [ldapConfig, setLdapConfig] = useState({ url: '', bindDN: '', password: '', searchBase: '', searchFilter: '(objectClass=*)' });

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      setFile(selectedFile);
    } else {
      toast({
        title: t('invalid_file_title'),
        description: t('invalid_file_desc_xlsx'),
        variant: "destructive",
      });
      setFile(null);
    }
  };

  const handleExcelImport = () => {
    if (!file) {
      toast({ title: t('no_file_selected_title'), description: t('no_file_selected_desc'), variant: "destructive" });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);

        if (json.length === 0) {
          toast({ title: t('empty_file_title'), description: t('empty_file_desc'), variant: "destructive" });
          return;
        }

        const requiredFields = ['name', 'email', 'password', 'role', 'department', 'position'];
        const firstRow = json[0];
        for (const field of requiredFields) {
          if (!firstRow.hasOwnProperty(field)) {
            toast({ title: t('invalid_format_title'), description: t('invalid_format_desc', { field }), variant: "destructive" });
            return;
          }
        }

        // This part needs to be adapted to work with Supabase Auth and Profiles
        // For now, it's a placeholder showing the logic.
        // A real implementation would require a backend function to securely create users.
        toast({ title: "Funcionalidade em Desenvolvimento", description: "A importação em massa de utilizadores via Excel está a ser adaptada para o novo sistema. Estará disponível em breve." });
        
        /*
        const newUsers = json.map((row, index) => {
          const manager = users.find(u => u.email === row.managerEmail);
          return {
            id: `imported_${Date.now()}_${index}`,
            name: row.name,
            email: row.email,
            password: String(row.password),
            role: row.role,
            department: row.department,
            position: row.position,
            managerId: manager ? manager.id : null,
            avatar: `https://images.unsplash.com/photo-${Math.floor(Math.random() * 1000000000)}?w=150&h=150&fit=crop&crop=face`,
            isTemporary: false,
          };
        });

        // This would be replaced by Supabase calls
        const combinedUsers = [...users, ...newUsers];
        saveUsers(combinedUsers);
        */

        // toast({ title: t('import_success_title'), description: t('import_success_desc', { count: newUsers.length }) });
        onOpenChange(false);
        setFile(null);
      } catch (error) {
        console.error("Erro ao importar Excel:", error);
        toast({ title: t('import_error_title'), description: t('import_error_desc'), variant: "destructive" });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleLdapImport = () => {
    toast({
      title: t('feature_in_dev_title'),
      description: t('ldap_in_dev_desc'),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <UploadCloud className="h-4 w-4 mr-2" />
          {t('import_collaborators')}
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border text-foreground sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>{t('import_collaborators_mass')}</DialogTitle>
          <DialogDescription>
            {t('import_collaborators_desc')}
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="excel" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="excel"><FileSpreadsheet className="h-4 w-4 mr-2" />Excel</TabsTrigger>
            <TabsTrigger value="ldap"><Server className="h-4 w-4 mr-2" />LDAP</TabsTrigger>
          </TabsList>
          <TabsContent value="excel" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>{t('step_1_download_template')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('step_1_desc')}
              </p>
              <Button variant="outline" size="sm" onClick={generateExcelTemplate}>
                <Download className="h-4 w-4 mr-2" />
                {t('download_template')}
              </Button>
            </div>
            <div className="space-y-2">
              <Label htmlFor="excel-file">{t('step_2_upload_file')}</Label>
              <Input id="excel-file" type="file" accept=".xlsx" onChange={handleFileChange} className="file:text-primary file:font-medium" />
              {file && <p className="text-sm text-muted-foreground">{t('file_selected')}: {file.name}</p>}
            </div>
            <DialogFooter>
              <Button onClick={handleExcelImport} disabled={!file}>{t('import_from_excel')}</Button>
            </DialogFooter>
          </TabsContent>
          <TabsContent value="ldap" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="ldap-url">{t('ldap_url')}</Label>
              <Input id="ldap-url" placeholder="ldap://servidor.exemplo.com" value={ldapConfig.url} onChange={(e) => setLdapConfig({...ldapConfig, url: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ldap-bind-dn">{t('ldap_bind_dn')}</Label>
              <Input id="ldap-bind-dn" placeholder="cn=admin,dc=exemplo,dc=com" value={ldapConfig.bindDN} onChange={(e) => setLdapConfig({...ldapConfig, bindDN: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ldap-password">{t('ldap_password')}</Label>
              <Input id="ldap-password" type="password" value={ldapConfig.password} onChange={(e) => setLdapConfig({...ldapConfig, password: e.target.value})} />
            </div>
            <p className="text-xs text-muted-foreground" dangerouslySetInnerHTML={{ __html: t('ldap_help_text') }} />
            <DialogFooter>
              <Button onClick={handleLdapImport}>{t('connect_and_import')}</Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ImportUsersDialog;