import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  TextField,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Add,
  MoreVert,
  Edit,
  Delete,
  Visibility,
  Publish,
  Close,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { jobService } from '../../services/jobService';

const JobCard = ({ job, onEdit, onDelete, onView, onPublish, onClose }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const { isHR } = useAuth();

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'published': return 'success';
      case 'draft': return 'default';
      case 'closed': return 'error';
      default: return 'default';
    }
  };

  const getTypeLabel = (type) => {
    const types = {
      'CDI': 'CDI',
      'CDD': 'CDD',
      'Stage': 'Stage',
      'Intern': 'Interne'
    };
    return types[type] || type;
  };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography variant="h6" component="h2" gutterBottom>
            {job.title}
          </Typography>
          <IconButton size="small" onClick={handleMenuOpen}>
            <MoreVert />
          </IconButton>
        </Box>

        <Typography color="textSecondary" gutterBottom>
          {job.department} • {job.location}
        </Typography>

        <Typography variant="body2" paragraph sx={{ mb: 2 }}>
          {job.description.length > 150 
            ? `${job.description.substring(0, 150)}...` 
            : job.description
          }
        </Typography>

        <Box sx={{ mb: 2 }}>
          <Chip 
            label={job.status} 
            size="small" 
            color={getStatusColor(job.status)}
            sx={{ mr: 1, mb: 1 }}
          />
          <Chip 
            label={getTypeLabel(job.type)} 
            size="small" 
            variant="outlined"
            sx={{ mr: 1, mb: 1 }}
          />
          {job.salaryRange && (
            <Chip 
              label={job.salaryRange} 
              size="small" 
              variant="outlined"
              sx={{ mb: 1 }}
            />
          )}
        </Box>

        {job.tags && job.tags.length > 0 && (
          <Box sx={{ mb: 2 }}>
            {job.tags.slice(0, 3).map((tag, index) => (
              <Chip
                key={index}
                label={tag}
                size="small"
                sx={{ mr: 0.5, mb: 0.5 }}
              />
            ))}
            {job.tags.length > 3 && (
              <Chip
                label={`+${job.tags.length - 3}`}
                size="small"
                variant="outlined"
              />
            )}
          </Box>
        )}
      </CardContent>

      <Box sx={{ p: 2, pt: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body2" color="textSecondary">
          {new Date(job.createdAt).toLocaleDateString()}
        </Typography>
        
        {isHR && (
          <Button 
            size="small" 
            onClick={() => onView(job._id)}
            startIcon={<Visibility />}
          >
            Voir
          </Button>
        )}
      </Box>

      {/* Menu contextuel pour les actions RH */}
      {isHR && (
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => { onView(job._id); handleMenuClose(); }}>
            <Visibility sx={{ mr: 1 }} />
            Voir détails
          </MenuItem>
          <MenuItem onClick={() => { onEdit(job._id); handleMenuClose(); }}>
            <Edit sx={{ mr: 1 }} />
            Modifier
          </MenuItem>
          {job.status === 'draft' && (
            <MenuItem onClick={() => { onPublish(job._id); handleMenuClose(); }}>
              <Publish sx={{ mr: 1 }} />
              Publier
            </MenuItem>
          )}
          {job.status === 'published' && (
            <MenuItem onClick={() => { onClose(job._id); handleMenuClose(); }}>
              <Close sx={{ mr: 1 }} />
              Fermer
            </MenuItem>
          )}
          <MenuItem onClick={() => { onDelete(job._id); handleMenuClose(); }}>
            <Delete sx={{ mr: 1 }} />
            Supprimer
          </MenuItem>
        </Menu>
      )}
    </Card>
  );
};

const JobsPage = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    department: '',
    status: '',
    visibility: '',
    search: '',
  });

  const { isHR } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchJobs();
  }, [filters]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const params = {};
      
      if (filters.department) params.department = filters.department;
      if (filters.status) params.status = filters.status;
      if (filters.visibility) params.visibility = filters.visibility;
      if (filters.search) params.q = filters.search;

      const response = await jobService.getAllJobs(params);
      setJobs(response || []);
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError('Erreur lors du chargement des offres');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateJob = () => {
    navigate('/app/jobs/new');
  };

  const handleViewJob = (id) => {
    navigate(`/app/jobs/${id}`);
  };

  const handleEditJob = (id) => {
    navigate(`/app/jobs/${id}/edit`);
  };

  const handleDeleteJob = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette offre ?')) {
      try {
        await jobService.deleteJob(id);
        setJobs(jobs.filter(job => job._id !== id));
      } catch (err) {
        console.error('Error deleting job:', err);
        setError('Erreur lors de la suppression');
      }
    }
  };

  const handlePublishJob = async (id) => {
    try {
      await jobService.publishJob(id);
      fetchJobs(); // Recharger la liste
    } catch (err) {
      console.error('Error publishing job:', err);
      setError('Erreur lors de la publication');
    }
  };

  const handleCloseJob = async (id) => {
    try {
      await jobService.closeJob(id);
      fetchJobs(); // Recharger la liste
    } catch (err) {
      console.error('Error closing job:', err);
      setError('Erreur lors de la fermeture');
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const departments = [...new Set(jobs.map(job => job.department))];
  const statuses = ['draft', 'published', 'closed'];
  const visibilities = ['public', 'internal'];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* En-tête avec titre et bouton d'action */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 0 }}>
          Offres d'emploi
        </Typography>
        {isHR && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleCreateJob}
          >
            Nouvelle offre
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Filtres */}
      <Card sx={{ mb: 3, p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Rechercher..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Département</InputLabel>
              <Select
                value={filters.department}
                label="Département"
                onChange={(e) => handleFilterChange('department', e.target.value)}
              >
                <MenuItem value="">Tous</MenuItem>
                {departments.map(dept => (
                  <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Statut</InputLabel>
              <Select
                value={filters.status}
                label="Statut"
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <MenuItem value="">Tous</MenuItem>
                {statuses.map(status => (
                  <MenuItem key={status} value={status}>{status}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Visibilité</InputLabel>
              <Select
                value={filters.visibility}
                label="Visibilité"
                onChange={(e) => handleFilterChange('visibility', e.target.value)}
              >
                <MenuItem value="">Toutes</MenuItem>
                {visibilities.map(visibility => (
                  <MenuItem key={visibility} value={visibility}>{visibility}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Card>

      {/* Liste des offres */}
      {jobs.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="textSecondary">
              Aucune offre d'emploi trouvée
            </Typography>
            {isHR && (
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleCreateJob}
                sx={{ mt: 2 }}
              >
                Créer la première offre
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {jobs.map((job) => (
            <Grid item key={job._id} xs={12} sm={6} lg={4}>
              <JobCard
                job={job}
                onView={handleViewJob}
                onEdit={handleEditJob}
                onDelete={handleDeleteJob}
                onPublish={handlePublishJob}
                onClose={handleCloseJob}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default JobsPage;