import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Visibility,
  NoteAdd,
  Download,
  FilterList,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { applicationService } from '../../services/applicationService';
import { jobService } from '../../services/jobService';
import { reportingService } from '../../services/reportingService';

const ApplicationsPage = () => {
  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    job: '',
    status: '',
    search: '',
  });
  const [noteDialog, setNoteDialog] = useState({ open: false, application: null, note: '' });
  const { isHR } = useAuth();

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [appsResponse, jobsResponse] = await Promise.all([
        applicationService.getAllApplications(filters),
        jobService.getAllJobs(),
      ]);

      setApplications(appsResponse || []);
      setJobs(jobsResponse || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (applicationId, newStatus) => {
    try {
      await applicationService.updateApplicationStatus(applicationId, newStatus);
      // Mettre à jour localement
      setApplications(applications.map(app =>
        app._id === applicationId ? { ...app, status: newStatus } : app
      ));
    } catch (err) {
      console.error('Error updating status:', err);
      setError('Erreur lors de la mise à jour du statut');
    }
  };

  const handleAddNote = async () => {
    try {
      await applicationService.addNoteToApplication(noteDialog.application._id, noteDialog.note);
      setNoteDialog({ open: false, application: null, note: '' });
      fetchData(); // Recharger pour avoir les nouvelles notes
    } catch (err) {
      console.error('Error adding note:', err);
      setError('Erreur lors de l\'ajout de la note');
    }
  };

  const handleExport = async () => {
    try {
      const blob = await reportingService.exportApplicationsCSV();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'candidatures.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting:', err);
      setError('Erreur lors de l\'export');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'default',
      in_review: 'primary',
      interview: 'info',
      offer: 'warning',
      rejected: 'error',
      accepted: 'success',
    };
    return colors[status] || 'default';
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'En attente',
      in_review: 'En revue',
      interview: 'Entretien',
      offer: 'Offre',
      rejected: 'Rejeté',
      accepted: 'Accepté',
    };
    return labels[status] || status;
  };

  if (!isHR) {
    return (
      <Alert severity="warning">
        Accès non autorisé. Cette page est réservée aux RH.
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 0 }}>
          Gestion des candidatures
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Download />}
          onClick={handleExport}
        >
          Exporter CSV
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Filtres */}
      <Card sx={{ mb: 3, p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Rechercher candidat..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Offre d'emploi</InputLabel>
              <Select
                value={filters.job}
                label="Offre d'emploi"
                onChange={(e) => setFilters(prev => ({ ...prev, job: e.target.value }))}
              >
                <MenuItem value="">Toutes les offres</MenuItem>
                {jobs.map(job => (
                  <MenuItem key={job._id} value={job._id}>
                    {job.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Statut</InputLabel>
              <Select
                value={filters.status}
                label="Statut"
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              >
                <MenuItem value="">Tous les statuts</MenuItem>
                <MenuItem value="pending">En attente</MenuItem>
                <MenuItem value="in_review">En revue</MenuItem>
                <MenuItem value="interview">Entretien</MenuItem>
                <MenuItem value="offer">Offre</MenuItem>
                <MenuItem value="rejected">Rejeté</MenuItem>
                <MenuItem value="accepted">Accepté</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Card>

      {/* Tableau des candidatures */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Candidat</TableCell>
                <TableCell>Offre</TableCell>
                <TableCell>Statut</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Notes</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : applications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography color="textSecondary">
                      Aucune candidature trouvée
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                applications.map((application) => (
                  <TableRow key={application._id}>
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2">
                          {application.candidateInfo?.name || 'N/A'}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {application.candidateInfo?.email}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {jobs.find(j => j._id === application.job)?.title || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <FormControl size="small" fullWidth>
                        <Select
                          value={application.status}
                          onChange={(e) => handleStatusChange(application._id, e.target.value)}
                        >
                          <MenuItem value="pending">En attente</MenuItem>
                          <MenuItem value="in_review">En revue</MenuItem>
                          <MenuItem value="interview">Entretien</MenuItem>
                          <MenuItem value="offer">Offre</MenuItem>
                          <MenuItem value="rejected">Rejeté</MenuItem>
                          <MenuItem value="accepted">Accepté</MenuItem>
                        </Select>
                      </FormControl>
                    </TableCell>
                    <TableCell>
                      {new Date(application.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={application.notes?.length || 0}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => setNoteDialog({
                          open: true,
                          application,
                          note: ''
                        })}
                      >
                        <NoteAdd />
                      </IconButton>
                      <IconButton size="small">
                        <Visibility />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Dialog d'ajout de note */}
      <Dialog
        open={noteDialog.open}
        onClose={() => setNoteDialog({ open: false, application: null, note: '' })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Ajouter une note - {noteDialog.application?.candidateInfo?.name}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            multiline
            rows={4}
            fullWidth
            label="Note"
            value={noteDialog.note}
            onChange={(e) => setNoteDialog(prev => ({ ...prev, note: e.target.value }))}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNoteDialog({ open: false, application: null, note: '' })}>
            Annuler
          </Button>
          <Button
            variant="contained"
            onClick={handleAddNote}
            disabled={!noteDialog.note.trim()}
          >
            Ajouter
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ApplicationsPage;