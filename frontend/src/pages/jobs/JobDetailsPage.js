import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  ArrowBack,
  Edit,
  Delete,
  Publish,
  Close,
  LocationOn,
  Business,
  Schedule,
  AttachMoney,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { jobService } from '../../services/jobService';
import { applicationService } from '../../services/applicationService';

const JobDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [applicationData, setApplicationData] = useState({
    coverLetter: '',
    resume: null,
  });
  const { user, isHR } = useAuth();

  useEffect(() => {
    fetchJob();
  }, [id]);

  const fetchJob = async () => {
    try {
      setLoading(true);
      const jobData = await jobService.getJobById(id);
      setJob(jobData);
    } catch (err) {
      console.error('Error fetching job:', err);
      setError('Erreur lors du chargement de l\'offre');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    try {
      if (!applicationData.resume) {
        setError('Veuillez sélectionner un CV');
        return;
      }

      await applicationService.createApplication(
        id,
        applicationData,
        applicationData.resume
      );

      setApplyDialogOpen(false);
      setApplicationData({ coverLetter: '', resume: null });
      alert('Candidature envoyée avec succès !');
    } catch (err) {
      console.error('Error applying:', err);
      setError('Erreur lors de l\'envoi de la candidature');
    }
  };

  const handleFileChange = (e) => {
    setApplicationData(prev => ({
      ...prev,
      resume: e.target.files[0]
    }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'published': return 'success';
      case 'draft': return 'default';
      case 'closed': return 'error';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        {error}
      </Alert>
    );
  }

  if (!job) {
    return (
      <Alert severity="warning">
        Offre non trouvée
      </Alert>
    );
  }

  return (
    <Box>
      {/* En-tête avec navigation */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/app/jobs')}
        >
          Retour
        </Button>
        
        {isHR && (
          <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
            <Button
              startIcon={<Edit />}
              variant="outlined"
              onClick={() => navigate(`/app/jobs/${id}/edit`)}
            >
              Modifier
            </Button>
            {job.status === 'draft' && (
              <Button
                startIcon={<Publish />}
                variant="contained"
                onClick={() => jobService.publishJob(id).then(fetchJob)}
              >
                Publier
              </Button>
            )}
            {job.status === 'published' && (
              <Button
                startIcon={<Close />}
                variant="contained"
                color="warning"
                onClick={() => jobService.closeJob(id).then(fetchJob)}
              >
                Fermer
              </Button>
            )}
          </Box>
        )}

        {!isHR && job.status === 'published' && (
          <Button
            variant="contained"
            onClick={() => setApplyDialogOpen(true)}
            sx={{ ml: 'auto' }}
          >
            Postuler
          </Button>
        )}
      </Box>

      <Grid container spacing={3}>
        {/* Colonne principale */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Typography variant="h4" gutterBottom>
                  {job.title}
                </Typography>
                <Chip 
                  label={job.status} 
                  color={getStatusColor(job.status)}
                />
              </Box>

              {/* Métadonnées */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Business fontSize="small" color="action" />
                  <Typography variant="body2" color="textSecondary">
                    {job.department}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <LocationOn fontSize="small" color="action" />
                  <Typography variant="body2" color="textSecondary">
                    {job.location}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Schedule fontSize="small" color="action" />
                  <Typography variant="body2" color="textSecondary">
                    {job.type}
                  </Typography>
                </Box>
                {job.salaryRange && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <AttachMoney fontSize="small" color="action" />
                    <Typography variant="body2" color="textSecondary">
                      {job.salaryRange}
                    </Typography>
                  </Box>
                )}
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Description */}
              <Typography variant="h6" gutterBottom>
                Description du poste
              </Typography>
              <Typography variant="body1" paragraph sx={{ whiteSpace: 'pre-wrap' }}>
                {job.description}
              </Typography>

              {/* Exigences */}
              {job.requirements && job.requirements.length > 0 && (
                <>
                  <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                    Exigences
                  </Typography>
                  <List dense>
                    {job.requirements.map((req, index) => (
                      <ListItem key={index}>
                        <ListItemIcon sx={{ minWidth: 32 }}>•</ListItemIcon>
                        <ListItemText primary={req} />
                      </ListItem>
                    ))}
                  </List>
                </>
              )}

              {/* Avantages */}
              {job.benefits && job.benefits.length > 0 && (
                <>
                  <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                    Avantages
                  </Typography>
                  <List dense>
                    {job.benefits.map((benefit, index) => (
                      <ListItem key={index}>
                        <ListItemIcon sx={{ minWidth: 32 }}>•</ListItemIcon>
                        <ListItemText primary={benefit} />
                      </ListItem>
                    ))}
                  </List>
                </>
              )}

              {/* Tags */}
              {job.tags && job.tags.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Compétences recherchées
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {job.tags.map((tag, index) => (
                      <Chip key={index} label={tag} variant="outlined" />
                    ))}
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Colonne latérale */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Informations
              </Typography>
              
              <List dense>
                <ListItem>
                  <ListItemText
                    primary="Statut"
                    secondary={
                      <Chip 
                        label={job.status} 
                        size="small" 
                        color={getStatusColor(job.status)}
                      />
                    }
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Visibilité"
                    secondary={job.visibility}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Type de contrat"
                    secondary={job.type}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Localisation"
                    secondary={job.location}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Département"
                    secondary={job.department}
                  />
                </ListItem>
                {job.salaryRange && (
                  <ListItem>
                    <ListItemText
                      primary="Salaire"
                      secondary={job.salaryRange}
                    />
                  </ListItem>
                )}
                <ListItem>
                  <ListItemText
                    primary="Date de création"
                    secondary={new Date(job.createdAt).toLocaleDateString()}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Dialog de candidature */}
      <Dialog open={applyDialogOpen} onClose={() => setApplyDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Postuler à {job.title}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Lettre de motivation"
            value={applicationData.coverLetter}
            onChange={(e) => setApplicationData(prev => ({
              ...prev,
              coverLetter: e.target.value
            }))}
            sx={{ mt: 2 }}
          />
          <Button
            variant="outlined"
            component="label"
            fullWidth
            sx={{ mt: 2 }}
          >
            {applicationData.resume ? applicationData.resume.name : 'Télécharger le CV'}
            <input
              type="file"
              hidden
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange}
            />
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApplyDialogOpen(false)}>Annuler</Button>
          <Button 
            variant="contained" 
            onClick={handleApply}
            disabled={!applicationData.resume}
          >
            Envoyer la candidature
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default JobDetailsPage;