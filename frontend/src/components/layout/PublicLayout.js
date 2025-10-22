import React from 'react';
import { Outlet } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
} from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const PublicLayout = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Recrutement Pro
          </Typography>
          <Box>
            {isAuthenticated ? (
              <Button color="inherit" component={Link} to="/app">
                Tableau de bord
              </Button>
            ) : (
              <>
                <Button 
                  color="inherit" 
                  component={Link} 
                  to="/login"
                  sx={{ mr: 1 }}
                >
                  Connexion
                </Button>
                <Button 
                  color="inherit" 
                  component={Link} 
                  to="/register"
                  variant="outlined"
                >
                  Inscription
                </Button>
              </>
            )}
          </Box>
        </Toolbar>
      </AppBar>
      <Outlet />
    </Box>
  );
};

export default PublicLayout;