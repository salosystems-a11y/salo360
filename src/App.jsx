import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/SupabaseAuthContext';
import { DataProvider } from '@/contexts/DataContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import Layout from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import Users from '@/pages/Users';
import Evaluations from '@/pages/Evaluations';
import Reports from '@/pages/Reports';
import Organogram from '@/pages/Organogram';
import Profile from '@/pages/Profile';
import Login from '@/pages/Login';
import Settings from '@/pages/Settings';
import Projects from '@/pages/Projects';
import ProtectedRoute from '@/components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <LanguageProvider>
          <Router>
            <div className="min-h-screen">
              <Routes>
                <Route path="/login" element={<Login />} />
                
                <Route 
                  path="/" 
                  element={
                    <ProtectedRoute>
                      <Layout><Dashboard /></Layout>
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/collaborators" 
                  element={
                    <ProtectedRoute requiredPermission="manage_users">
                      <Layout><Users /></Layout>
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/evaluations" 
                  element={
                    <ProtectedRoute>
                      <Layout><Evaluations /></Layout>
                    </ProtectedRoute>
                  } 
                />

                <Route 
                  path="/projects" 
                  element={
                    <ProtectedRoute requiredRoles={['admin', 'manager', 'employee']}>
                      <Layout><Projects /></Layout>
                    </ProtectedRoute>
                  } 
                />

                <Route 
                  path="/reports" 
                  element={
                    <ProtectedRoute requiredRoles={['admin', 'manager', 'employee']}>
                      <Layout><Reports /></Layout>
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/organogram" 
                  element={
                    <ProtectedRoute>
                      <Layout><Organogram /></Layout>
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/profile" 
                  element={
                    <ProtectedRoute>
                      <Layout><Profile /></Layout>
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/settings" 
                  element={
                    <ProtectedRoute requiredPermission="manage_settings">
                      <Layout><Settings /></Layout>
                    </ProtectedRoute>
                  } 
                />
              </Routes>
              <Toaster />
            </div>
          </Router>
        </LanguageProvider>
      </DataProvider>
    </AuthProvider>
  );
}

export default App;