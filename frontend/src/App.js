import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './contexts/AuthContext';
// import { NotificationProvider } from './contexts/NotificationContext';

// Layouts
import MainLayout from './components/layout/MainLayout';
import PublicLayout from './components/layout/PublicLayout';

// Pages publiques
import HomePage from './pages/public/HomePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Pages protégées
// import Dashboard from './pages/dashboard/Dashboard';
// import JobsPage from './pages/jobs/JobsPage';
// import JobDetailsPage from './pages/jobs/JobDetailsPage';
import CreateJobPage from './pages/jobs/CreateJobPage';
import EditJobPage from './pages/jobs/EditJobPage';
// import ApplicationsPage from './pages/applications/ApplicationsPage';
// import InterviewsPage from './pages/interviews/InterviewsPage';

// Composants de route protégée
import ProtectedRoute from './components/common/ProtectedRoute';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AuthProvider>
          {/* <NotificationProvider> */}
            <Routes>
              {/* Routes publiques */}
              <Route path="/" element={<PublicLayout />}>
                <Route index element={<HomePage />} />
                <Route path="login" element={<LoginPage />} />
                <Route path="register" element={<RegisterPage />} />
              </Route>

              {/* Routes protégées */}
              {/* <Route path="/app" element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }>
                <Route index element={<Dashboard />} />
                <Route path="jobs" element={<JobsPage />} />
                <Route path="jobs/:id" element={<JobDetailsPage />} />
                <Route path="applications" element={<ApplicationsPage />} />
                <Route path="interviews" element={<InterviewsPage />} />
              </Route> */}
            </Routes>
          {/* </NotificationProvider> */}
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;