
import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
    import { supabase } from '@/lib/customSupabaseClient';
    import { useToast } from '@/components/ui/use-toast';

    const SupabaseAuthContext = createContext(undefined);

    export const AuthProvider = ({ children }) => {
      const { toast } = useToast();

      const [user, setUser] = useState(null);
      const [session, setSession] = useState(null);
      const [loading, setLoading] = useState(true);

      const fetchUserProfile = useCallback(async (authUser) => {
        if (!authUser) return null;

        let { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (error && error.code === 'PGRST116') {
          console.log('No profile found for user, creating one.');
          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: authUser.id,
              name: authUser.user_metadata?.name || authUser.email,
              email: authUser.email,
              role: authUser.user_metadata?.role || 'employee',
            })
            .select('*')
            .single();

          if (insertError) {
            console.error('Error creating user profile:', insertError.message);
            return null; 
          }
          profile = newProfile;
        } else if (error) {
          console.error('Error fetching user profile:', error.message);
          return null;
        }
        
        const fullUser = {
          ...authUser,
          ...profile,
          id: authUser.id,
          name: profile.name,
          email: profile.email,
          avatar_url: profile.avatar_url,
          role: profile.role,
          department: profile.department,
          position: profile.position,
          manager_id: profile.manager_id,
          isTemporary: authUser.user_metadata?.isTemporary,
          projectId: authUser.user_metadata?.projectId,
        };

        return fullUser;
      }, []);

      const handleSession = useCallback(async (currentSession) => {
        setLoading(true);
        if (currentSession?.user) {
          const fullUser = await fetchUserProfile(currentSession.user);
          setUser(fullUser);
        } else {
          setUser(null);
        }
        setSession(currentSession);
        setLoading(false);
      }, [fetchUserProfile]);

      useEffect(() => {
        const getSession = async () => {
          const { data: { session } } = await supabase.auth.getSession();
          await handleSession(session);
        };

        getSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            await handleSession(session);
          }
        );

        return () => subscription.unsubscribe();
      }, [handleSession]);

      const signUp = useCallback(async (email, password, options) => {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options,
        });

        if (error) {
          toast({
            variant: "destructive",
            title: "Sign up Failed",
            description: error.message || "Something went wrong",
          });
        }

        return { data, error };
      }, [toast]);

      const signIn = useCallback(async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          toast({
            variant: "destructive",
            title: "Sign in Failed",
            description: error.message || "Something went wrong",
          });
        } else if (data.session) {
          await handleSession(data.session);
        }

        return { data, error };
      }, [toast, handleSession]);

      const signOut = useCallback(async () => {
        const { error } = await supabase.auth.signOut();

        if (error) {
          toast({
            variant: "destructive",
            title: "Sign out Failed",
            description: error.message || "Something went wrong",
          });
        } else {
          setUser(null);
          setSession(null);
        }

        return { error };
      }, [toast]);

      const value = useMemo(() => ({
        user,
        session,
        loading,
        signUp,
        signIn,
        signOut,
      }), [user, session, loading, signUp, signIn, signOut]);

      return <SupabaseAuthContext.Provider value={value}>{children}</SupabaseAuthContext.Provider>;
    };

    export const useAuth = () => {
      const context = useContext(SupabaseAuthContext);
      if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
      }
      return context;
    };
