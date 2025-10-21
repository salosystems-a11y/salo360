
    import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
    import { supabase } from '@/lib/customSupabaseClient';
    import { useAuth } from '@/contexts/SupabaseAuthContext';

    const DataContext = createContext(undefined);

    export const useData = () => {
      const context = useContext(DataContext);
      if (!context) {
        throw new Error('useData must be used within a DataProvider');
      }
      return context;
    };

    export const DataProvider = ({ children }) => {
      const { session, profileLoaded } = useAuth();
      const [data, setData] = useState({
        users: [],
        evaluations: [],
        competencies: [],
        roles: [],
        projects: [],
        projectEvaluations: [],
        departments: [],
        positions: [],
        permissions: [],
      });
      const [loading, setLoading] = useState(true);
      
      const fetchStatus = useRef({ isFetching: false, hasFetched: false });

      const fetchData = useCallback(async () => {
        if (fetchStatus.current.isFetching || fetchStatus.current.hasFetched) {
          setLoading(false);
          return;
        }

        fetchStatus.current.isFetching = true;
        setLoading(true);

        try {
          const [
            { data: profilesData, error: profilesError },
            { data: rolesData, error: rolesError },
            { data: permissionsData, error: permissionsError },
            { data: departmentsData, error: departmentsError },
            { data: positionsData, error: positionsError },
            { data: competenciesData, error: competenciesError },
            { data: evaluationsData, error: evaluationsError },
            { data: projectsData, error: projectsError },
            { data: projectEvaluationsData, error: projectEvaluationsError },
          ] = await Promise.all([
            supabase.from('profiles').select('*'),
            supabase.from('roles').select('*'),
            supabase.from('permissions').select('*'),
            supabase.from('departments').select('*'),
            supabase.from('positions').select('*'),
            supabase.from('competencies').select('*'),
            supabase.from('evaluations').select('*'),
            supabase.from('projects').select('*'),
            supabase.from('project_evaluations').select('*'),
          ]);

          const errors = [profilesError, rolesError, permissionsError, departmentsError, positionsError, competenciesError, evaluationsError, projectsError, projectEvaluationsError].filter(Boolean);
          if (errors.length > 0) {
            const errorMessages = errors.map(e => e.message).join(', ');
            console.error('Error fetching data parts:', errorMessages);
            throw new Error(errorMessages);
          }

          setData({
            users: profilesData || [],
            roles: rolesData || [],
            permissions: permissionsData || [],
            departments: departmentsData || [],
            positions: positionsData || [],
            competencies: competenciesData || [],
            evaluations: evaluationsData || [],
            projects: projectsData || [],
            projectEvaluations: projectEvaluationsData || [],
          });
          
          fetchStatus.current.hasFetched = true;
        } catch (error) {
          console.error('Error fetching all data:', error);
          fetchStatus.current.hasFetched = false; 
        } finally {
          fetchStatus.current.isFetching = false;
          setLoading(false);
        }
      }, []);
      
      const clearData = useCallback(() => {
          setData({
            users: [], evaluations: [], competencies: [], roles: [],
            projects: [], projectEvaluations: [], departments: [],
            positions: [], permissions: [],
          });
          fetchStatus.current.hasFetched = false;
          fetchStatus.current.isFetching = false;
          setLoading(false);
      }, []);

      useEffect(() => {
        if (session && profileLoaded) {
            fetchData();
        } else if (!session) {
            clearData();
        }
      }, [session, profileLoaded, fetchData, clearData]);
      
      const refreshData = useCallback(async () => {
          fetchStatus.current.hasFetched = false;
          await fetchData();
      }, [fetchData]);

      const value = useMemo(() => ({
        ...data,
        loading,
        refreshData,
      }), [data, loading, refreshData]);

      return (
        <DataContext.Provider value={value}>
          {children}
        </DataContext.Provider>
      );
    };
  