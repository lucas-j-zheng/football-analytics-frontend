import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CollaborationProvider } from './components/CollaborationProvider';
import Login from './components/Login';
import Register from './components/Register';
import TeamDashboard from './components/TeamDashboard';
import ConsultantWorkspace from './components/ConsultantWorkspace';
import ProtectedRoute from './components/ProtectedRoute';
// import CoachDecisionDashboard from './components/CoachDecisionDashboard'; // Hidden for now - ML service needs fixing
import './App.css';
import './styles/design-system.css';

function App() {
  return (
    <AuthProvider>
      <CollaborationProvider>
        <Router>
          <div className="App">
            <Routes>
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route 
                path="/team/dashboard" 
                element={
                  <ProtectedRoute allowedUserTypes={['team']}>
                    <TeamDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/consultant/dashboard" 
                element={
                  <ProtectedRoute allowedUserTypes={['consultant']}>
                    <ConsultantWorkspace />
                  </ProtectedRoute>
                } 
              />
              {/* Decision Dashboard temporarily hidden - ML service needs fixing
              <Route 
                path="/coach/decisions" 
                element={
                  <ProtectedRoute allowedUserTypes={['team','consultant']}>
                    <CoachDecisionDashboard />
                  </ProtectedRoute>
                } 
              />
              */}
            </Routes>
          </div>
        </Router>
      </CollaborationProvider>
    </AuthProvider>
  );
}

export default App;
