import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/hooks/useTranslation';
import { useData } from '@/contexts/DataContext';

/**
 * Modal para recuperação de senha.
 * @param {object} props - Propriedades do componente.
 * @param {boolean} props.isOpen - Controla se o modal está aberto.
 * @param {Function} props.onClose - Função para fechar o modal.
 * @returns {JSX.Element} O componente de modal de recuperação de senha.
 */
const ForgotPasswordModal = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const t = useTranslation();
  const { users } = useData();

  /**
   * Lida com a submissão do formulário de recuperação de senha.
   * Simula o envio de um link de recuperação.
   * @param {React.FormEvent} e - O evento do formulário.
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);

    // Simula uma chamada de API
    setTimeout(() => {
      const userExists = users.some(user => user.email === email);

      if (userExists) {
        toast({
          title: t('recovery_link_sent_title'),
          description: t('recovery_link_sent_desc', { email }),
          className: 'bg-green-500 text-white',
        });
        onClose();
      } else {
        toast({
          title: t('email_not_found_title'),
          description: t('email_not_found_desc'),
          variant: 'destructive',
        });
      }
      setLoading(false);
      setEmail('');
    }, 1000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-card border-border">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <DialogHeader>
            <DialogTitle className="text-foreground">{t('password_recovery_title')}</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {t('password_recovery_modal_desc')}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email-forgot" className="text-right text-muted-foreground">
                  {t('email')}
                </Label>
                <Input
                  id="email-forgot"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="col-span-3 bg-input border-border"
                  placeholder={t('email_placeholder')}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={onClose}>{t('cancel')}</Button>
              <Button type="submit" disabled={loading}>
                {loading ? t('sending') : t('send_recovery_link')}
              </Button>
            </DialogFooter>
          </form>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default ForgotPasswordModal;