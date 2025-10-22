import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import { jobService } from '../../services/jobService';
import JobForm from '../../components/forms/JobForm';

const EditJobPage = () => {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const jobData = await jobService.getJobById(id);
        setJob(jobData);
      } catch (err) {
        console.error('Error fetching job:', err);
        setError('Erreur lors du chargement de l\'offre');
      } finally {
        setFetchLoading(false);
      }
    };

    fetchJob();
  }, [id]);

  const handleSubmit = async (jobData) => {
    try {
      setLoading(true);
      setError('');
      
      await jobService.updateJob(id, jobData);
      
      navigate('/app/jobs', { 
        state: { message: 'Offre mise à jour avec succès' } 
      });
    } catch (err) {
      console.error('Error updating job:', err);
      setError(err.response?.data?.message || 'Erreur lors de la mise à jour de l\'offre');
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error && !job) {
    return (
      <Alert severity="error">
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
        Modifier l'offre d'emploi
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <JobForm job={job} onSubmit={handleSubmit} loading={loading} />
    </Box>
  );
};

export default EditJobPage;