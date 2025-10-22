import React from 'react';
import { Link } from 'react-router-dom';
import {
  Container,
  Typography,
  Button,
  Box,
  Grid,
  Card,
  CardContent,
  Paper,
} from '@mui/material';
import {
  Work,
  People,
  TrendingUp,
  Security,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const HomePage = () => {
  const { isAuthenticated } = useAuth();

  const features = [
    {
      icon: <Work sx={{ fontSize: 40 }} />,
      title: 'Gestion des Offres',
      description: 'Créez et publiez des offres d\'emploi attractives'
    },
    {
      icon: <People sx={{ fontSize: 40 }} />,
      title: 'Suivi des Candidatures',
      description: 'Suivez toutes les candidatures en temps réel'
    },
    {
      icon: <TrendingUp sx={{ fontSize: 40 }} />,
      title: 'Analytics',
      description: 'Analyses détaillées de votre processus de recrutement'
    },
    {
      icon: <Security sx={{ fontSize: 40 }} />,
      title: 'Sécurité',
      description: 'Plateforme sécurisée et conforme RGPD'
    }
  ];

  return (
    <Box>
      {/* Hero Section */}
      <Paper
        sx={{
          position: 'relative',
          backgroundColor: 'grey.800',
          color: '#fff',
          mb: 4,
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5))`,
          pt: 15,
          pb: 15,
        }}
      >
        <Container maxWidth="lg">
          <Typography
            component="h1"
            variant="h2"
            align="center"
            color="inherit"
            gutterBottom
            sx={{ fontWeight: 'bold' }}
          >
            Recrutement Pro
          </Typography>
          <Typography variant="h5" align="center" color="inherit" paragraph>
            La plateforme tout-en-un pour optimiser votre processus de recrutement
          </Typography>
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 2 }}>
            {isAuthenticated ? (
              <Button
                variant="contained"
                size="large"
                component={Link}
                to="/app"
                sx={{ px: 4, py: 1.5 }}
              >
                Accéder au tableau de bord
              </Button>
            ) : (
              <>
                <Button
                  variant="contained"
                  size="large"
                  component={Link}
                  to="/register"
                  sx={{ px: 4, py: 1.5 }}
                >
                  Commencer gratuitement
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  component={Link}
                  to="/login"
                  sx={{ 
                    px: 4, 
                    py: 1.5,
                    borderColor: 'white',
                    color: 'white',
                    '&:hover': {
                      borderColor: 'white',
                      backgroundColor: 'rgba(255,255,255,0.1)'
                    }
                  }}
                >
                  Se connecter
                </Button>
              </>
            )}
          </Box>
        </Container>
      </Paper>

      {/* Features Section */}
      <Container sx={{ py: 8 }} maxWidth="lg">
        <Typography
          component="h2"
          variant="h3"
          align="center"
          color="text.primary"
          gutterBottom
          sx={{ fontWeight: 'bold', mb: 6 }}
        >
          Pourquoi choisir Recrutement Pro ?
        </Typography>
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item key={index} xs={12} sm={6} md={3}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  p: 2,
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                  },
                }}
              >
                <CardContent>
                  <Box sx={{ color: 'primary.main', mb: 2 }}>
                    {feature.icon}
                  </Box>
                  <Typography gutterBottom variant="h5" component="h3">
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* CTA Section */}
      <Box sx={{ bgcolor: 'primary.main', color: 'white', py: 8 }}>
        <Container maxWidth="lg" sx={{ textAlign: 'center' }}>
          <Typography variant="h4" component="h3" gutterBottom sx={{ fontWeight: 'bold' }}>
            Prêt à transformer votre recrutement ?
          </Typography>
          <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
            Rejoignez des centaines d'entreprises qui nous font confiance
          </Typography>
          <Button
            variant="contained"
            size="large"
            component={Link}
            to={isAuthenticated ? "/app" : "/register"}
            sx={{
              backgroundColor: 'white',
              color: 'primary.main',
              px: 4,
              py: 1.5,
              '&:hover': {
                backgroundColor: 'grey.100',
              },
            }}
          >
            {isAuthenticated ? 'Tableau de bord' : 'Essayer gratuitement'}
          </Button>
        </Container>
      </Box>
    </Box>
  );
};

export default HomePage;