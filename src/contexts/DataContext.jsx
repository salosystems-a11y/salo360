
    import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
      const { session } = useAuth();
      const [users, setUsers] = useState([]);
      const [evaluations, setEvaluations] = useState([]);
      const [competencies, setCompetencies] = useState([]);
      const [roles, setRoles] = useState([]);
      const [projects, setProjects] = useState([]);
      const [projectEvaluations, setProjectEvaluations] = useState([]);
      const [departments, setDepartments] = useState([]);
      const [positions, setPositions] = useState([]);
      const [permissions, setPermissions] = useState([]);
      const [loading, setLoading] = useState(true);
      const [hasFetched, setHasFetched] = useState(false);

      const fetchData = useCallback(async () => {
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

          if (profilesError) throw profilesError;
          if (rolesError) throw rolesError;
          if (permissionsError) throw permissionsError;
          if (departmentsError) throw departmentsError;
          if (positionsError) throw positionsError;
          if (competenciesError) throw competenciesError;
          if (evaluationsError) throw evaluationsError;
          if (projectsError) throw projectsError;
          if (projectEvaluationsError) throw projectEvaluationsError;

          setUsers(profilesData || []);
          setRoles(rolesData || []);
          setPermissions(permissionsData || []);
          setDepartments(departmentsData || []);
          setPositions(positionsData || []);
          setCompetencies(competenciesData || []);
          setEvaluations(evaluationsData || []);
          setProjects(projectsData || []);
          setProjectEvaluations(projectEvaluationsData || []);
          setHasFetched(true);

        } catch (error) {
          console.error('Error fetching data:', error);
          setHasFetched(false); 
        } finally {
          setLoading(false);
        }
      }, []);

      useEffect(() => {
        if (session && !hasFetched) {
          fetchData();
        } else if (!session) {
          setUsers([]);
          setEvaluations([]);
          setCompetencies([]);
          setRoles([]);
          setProjects([]);
          setProjectEvaluations([]);
          setDepartments([]);
          setPositions([]);
          setPermissions([]);
          setHasFetched(false);
          setLoading(false);
        }
      }, [session, hasFetched, fetchData]);

      const refreshData = useCallback(() => {
        if (session) {
          setHasFetched(false); 
          fetchData();
        }
      }, [session, fetchData]);

      const value = {
        users,
        evaluations,
        competencies,
        roles,
        projects,
        projectEvaluations,
        departments,
        positions,
        permissions,
        loading,
        refreshData,
      };

      return (
        <DataContext.Provider value={value}>
          {children}
        </DataContext.Provider>
      );
    };
  