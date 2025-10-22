import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Paper,
} from '@mui/material';
import {
  Work,
  People,
  Schedule,
  TrendingUp,
  Warning,
  CheckCircle,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { jobService } from '../../services/jobService';
import { applicationService } from '../../services/applicationService';
import { reportingService } from '../../services/reportingService';

const StatCard = ({ title, value, subtitle, icon, color = 'primary' }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography color="textSecondary" gutterBottom variant="h6">
            {title}
          </Typography>
          <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="textSecondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        <Box
          sx={{
            color: `${color}.main`,
            backgroundColor: `${color}.light`,
            borderRadius: '50%',
            p: 1,
          }}
        >
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalJobs: 0,
    publishedJobs: 0,
    totalApplications: 0,
    pendingApplications: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user, isHR } = useAuth();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        if (isHR) {
          // Pour les RH/Admin, on récupère les données complètes
          const [jobsResponse, applicationsResponse, metricsResponse] = await Promise.all([
            jobService.getAllJobs(),
            applicationService.getAllApplications(),
            reportingService.getPipelineMetrics().catch(() => ({})), // Optionnel
          ]);

          const jobs = jobsResponse || [];
          const applications = applicationsResponse || [];

          setStats({
            totalJobs: jobs.length,
            publishedJobs: jobs.filter(job => job.status === 'published').length,
            totalApplications: applications.length,
            pendingApplications: applications.filter(app => app.status === 'pending').length,
          });
        } else {
          // Pour les autres utilisateurs, données basiques
          const jobsResponse = await jobService.getAllJobs({ status: 'published' });
          const jobs = jobsResponse || [];
          
          setStats({
            totalJobs: jobs.length,
            publishedJobs: jobs.length,
            totalApplications: 0,
            pendingApplications: 0,
          });
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [isHR]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 4 }}>
        Tableau de bord
      </Typography>

      <Grid container spacing={3}>
        {/* Cartes de statistiques */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Offres totales"
            value={stats.totalJobs}
            icon={<Work />}
            color="primary"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Offres publiées"
            value={stats.publishedJobs}
            icon={<CheckCircle />}
            color="success"
          />
        </Grid>

        {isHR && (
          <>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Candidatures totales"
                value={stats.totalApplications}
                icon={<People />}
                color="info"
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Candidatures en attente"
                value={stats.pendingApplications}
                icon={<Schedule />}
                color="warning"
              />
            </Grid>
          </>
        )}

        {/* Section d'actions rapides pour RH */}
        {isHR && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3, mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                Actions rapides
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Card sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Work color="primary" />
                        <Box>
                          <Typography variant="h6">Nouvelle offre</Typography>
                          <Typography variant="body2" color="textSecondary">
                            Créer une nouvelle offre d'emploi
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Card sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <People color="info" />
                        <Box>
                          <Typography variant="h6">Voir candidatures</Typography>
                          <Typography variant="body2" color="textSecondary">
                            Gérer les candidatures en cours
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Card sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <TrendingUp color="success" />
                        <Box>
                          <Typography variant="h6">Rapports</Typography>
                          <Typography variant="body2" color="textSecondary">
                            Exporter les données
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        )}

        {/* Message de bienvenue */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, bgcolor: 'primary.main', color: 'white' }}>
            <Typography variant="h5" gutterBottom>
              Bienvenue, {user?.firstName} {user?.lastName} !
            </Typography>
            <Typography variant="body1">
              {isHR 
                ? 'Gérez vos offres d\'emploi et suivez les candidatures en temps réel.'
                : 'Parcourez les offres d\'emploi disponibles et postulez en quelques clics.'
              }
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;