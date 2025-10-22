import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import { jobService } from '../../services/jobService';
import JobForm from '../../components/forms/JobForm';

const CreateJobPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (jobData) => {
    try {
      setLoading(true);
      setError('');
      
      await jobService.createJob(jobData);
      
      navigate('/app/jobs', { 
        state: { message: 'Offre créée avec succès' } 
      });
    } catch (err) {
      console.error('Error creating job:', err);
      setError(err.response?.data?.message || 'Erreur lors de la création de l\'offre');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
        Créer une nouvelle offre d'emploi
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <JobForm onSubmit={handleSubmit} loading={loading} />
    </Box>
  );
};

export default CreateJobPage;