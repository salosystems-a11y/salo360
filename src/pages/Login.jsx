
    import React, { useState, useEffect } from 'react';
    import { useNavigate } from 'react-router-dom';
    import { motion } from 'framer-motion';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { Label } from '@/components/ui/label';
    import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
    import { useToast } from '@/components/ui/use-toast';
    import { useAuth } from '@/contexts/SupabaseAuthContext';
    import ForgotPasswordModal from '@/components/auth/ForgotPasswordModal';
    import { useTranslation } from '@/hooks/useTranslation';
    import { supabase } from '@/lib/customSupabaseClient';

    const Login = () => {
      const [email, setEmail] = useState('');
      const [password, setPassword] = useState('');
      const [loading, setLoading] = useState(false);
      const [showAdminButton, setShowAdminButton] = useState(false);
      const navigate = useNavigate();
      const { signIn, user, session } = useAuth();
      const { toast } = useToast();
      const t = useTranslation();

      useEffect(() => {
        const checkUsers = async () => {
          try {
            const { count } = await supabase
              .from('profiles')
              .select('*', { count: 'exact', head: true });

            if (count === 0) {
              setShowAdminButton(true);
            } else {
              setShowAdminButton(false);
            }
          } catch (error) {
            console.error("Error checking users:", error);
          }
        };
        checkUsers();
      }, []);

      useEffect(() => {
        if (user && session) {
          navigate('/');
        }
      }, [user, session, navigate]);

      const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        await signIn(email, password);
        setLoading(false);
      };
      
      const createAdminUser = async () => {
        setLoading(true);
        const adminEmail = 'edsoncanzele@gmail.com';
        const adminPassword = 'Angola2025#';

        try {
          const { data: { user: authUser }, error: signUpError } = await supabase.auth.signUp({
            email: adminEmail,
            password: adminPassword,
          });

          if (signUpError && signUpError.message.includes('User already registered')) {
            toast({ title: "Utilizador Admin Já Existe", description: "O utilizador administrador já foi criado. Por favor, inicie sessão.", variant: "default" });
            setShowAdminButton(false);
            setLoading(false);
            return;
          }
          
          if(signUpError) throw signUpError;

          if (authUser) {
            const { error: profileError } = await supabase
              .from('profiles')
              .insert({
                id: authUser.id,
                name: 'Administrador',
                email: adminEmail,
                role: 'admin'
              });

            if (profileError) throw profileError;
            
            toast({ title: "Utilizador Admin Criado", description: "Pode agora iniciar sessão com as credenciais de administrador." });
            setShowAdminButton(false);
          }
        } catch (error) {
          console.error("Error creating admin user:", error);
          toast({ title: "Erro ao Criar Admin", description: error.message, variant: "destructive" });
        } finally {
          setLoading(false);
        }
      };


      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="w-full max-w-md mx-auto bg-card">
              <CardHeader className="text-center">
                 <img src="https://storage.googleapis.com/hostinger-horizons-assets-prod/f04a1a34-d7e4-4816-8ab0-354964bc379b/aa66381f637605ca31ec6571ff073a63.png" alt="Salo 360 Logo" className="w-20 mx-auto mb-4" />
                <CardTitle className="text-3xl font-bold tracking-tight text-foreground">{t('welcome')}</CardTitle>
                <CardDescription className="text-muted-foreground">{t('login_desc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">{t('email')}</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seuemail@exemplo.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-input border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">{t('password')}</Label>
                      <ForgotPasswordModal />
                    </div>
                    <Input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-input border-border"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? t('loading') : t('login')}
                  </Button>
                </form>
                {showAdminButton && (
                  <div className="mt-4">
                    <Button onClick={createAdminUser} className="w-full" variant="secondary" disabled={loading}>
                      {loading ? t('creating') : "Criar Admin"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      );
    };

    export default Login;
  