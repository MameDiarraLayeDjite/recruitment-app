import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  Grid,
  Typography,
  Alert,
  Card,
  CardContent,
  IconButton,
  FormHelperText,
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

// Schéma de validation
const jobSchema = yup.object({
  title: yup.string().required('Le titre est obligatoire'),
  description: yup.string().required('La description est obligatoire'),
  department: yup.string().required('Le département est obligatoire'),
  location: yup.string().required('La localisation est obligatoire'),
  salaryRange: yup.string(),
  type: yup.string().required('Le type de contrat est obligatoire'),
  visibility: yup.string().required('La visibilité est obligatoire'),
});

const JobForm = ({ job, onSubmit, loading = false }) => {
  const [requirements, setRequirements] = useState([]);
  const [currentRequirement, setCurrentRequirement] = useState('');
  const [benefits, setBenefits] = useState([]);
  const [currentBenefit, setCurrentBenefit] = useState('');
  const [tags, setTags] = useState([]);
  const [currentTag, setCurrentTag] = useState('');

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm({
    resolver: yupResolver(jobSchema),
    defaultValues: {
      title: job?.title || '',
      description: job?.description || '',
      department: job?.department || '',
      location: job?.location || 'Remote',
      salaryRange: job?.salaryRange || '',
      type: job?.type || 'CDI',
      visibility: job?.visibility || 'public',
    },
  });

  useEffect(() => {
    if (job) {
      setRequirements(job.requirements || []);
      setBenefits(job.benefits || []);
      setTags(job.tags || []);
    }
  }, [job]);

  const handleAddRequirement = () => {
    if (currentRequirement.trim() && !requirements.includes(currentRequirement.trim())) {
      const newRequirements = [...requirements, currentRequirement.trim()];
      setRequirements(newRequirements);
      setCurrentRequirement('');
    }
  };

  const handleRemoveRequirement = (index) => {
    const newRequirements = requirements.filter((_, i) => i !== index);
    setRequirements(newRequirements);
  };

  const handleAddBenefit = () => {
    if (currentBenefit.trim() && !benefits.includes(currentBenefit.trim())) {
      const newBenefits = [...benefits, currentBenefit.trim()];
      setBenefits(newBenefits);
      setCurrentBenefit('');
    }
  };

  const handleRemoveBenefit = (index) => {
    const newBenefits = benefits.filter((_, i) => i !== index);
    setBenefits(newBenefits);
  };

  const handleAddTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim())) {
      const newTags = [...tags, currentTag.trim()];
      setTags(newTags);
      setCurrentTag('');
    }
  };

  const handleRemoveTag = (index) => {
    const newTags = tags.filter((_, i) => i !== index);
    setTags(newTags);
  };

  const handleFormSubmit = (data) => {
    const formData = {
      ...data,
      requirements,
      benefits,
      tags,
    };
    onSubmit(formData);
  };

  const contractTypes = [
    { value: 'CDI', label: 'CDI' },
    { value: 'CDD', label: 'CDD' },
    { value: 'Stage', label: 'Stage' },
    { value: 'Intern', label: 'Interne' },
  ];

  const visibilities = [
    { value: 'public', label: 'Public' },
    { value: 'internal', label: 'Interne' },
  ];

  return (
    <Box component="form" onSubmit={handleSubmit(handleFormSubmit)}>
      <Grid container spacing={3}>
        {/* Informations de base */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Informations de base
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Controller
                    name="title"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Titre du poste *"
                        fullWidth
                        error={!!errors.title}
                        helperText={errors.title?.message}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Controller
                    name="description"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Description du poste *"
                        multiline
                        rows={4}
                        fullWidth
                        error={!!errors.description}
                        helperText={errors.description?.message}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Controller
                    name="department"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Département *"
                        fullWidth
                        error={!!errors.department}
                        helperText={errors.department?.message}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Controller
                    name="location"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Localisation *"
                        fullWidth
                        error={!!errors.location}
                        helperText={errors.location?.message}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Controller
                    name="type"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth error={!!errors.type}>
                        <InputLabel>Type de contrat *</InputLabel>
                        <Select {...field} label="Type de contrat *">
                          {contractTypes.map((type) => (
                            <MenuItem key={type.value} value={type.value}>
                              {type.label}
                            </MenuItem>
                          ))}
                        </Select>
                        <FormHelperText>{errors.type?.message}</FormHelperText>
                      </FormControl>
                    )}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Controller
                    name="salaryRange"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Fourchette salariale"
                        fullWidth
                        placeholder="Ex: 35k€ - 45k€"
                        error={!!errors.salaryRange}
                        helperText={errors.salaryRange?.message}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Controller
                    name="visibility"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth error={!!errors.visibility}>
                        <InputLabel>Visibilité *</InputLabel>
                        <Select {...field} label="Visibilité *">
                          {visibilities.map((visibility) => (
                            <MenuItem key={visibility.value} value={visibility.value}>
                              {visibility.label}
                            </MenuItem>
                          ))}
                        </Select>
                        <FormHelperText>{errors.visibility?.message}</FormHelperText>
                      </FormControl>
                    )}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Exigences */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Exigences du poste
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  value={currentRequirement}
                  onChange={(e) => setCurrentRequirement(e.target.value)}
                  label="Nouvelle exigence"
                  fullWidth
                  size="small"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddRequirement();
                    }
                  }}
                />
                <Button
                  onClick={handleAddRequirement}
                  variant="outlined"
                  startIcon={<Add />}
                  disabled={!currentRequirement.trim()}
                >
                  Ajouter
                </Button>
              </Box>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {requirements.map((requirement, index) => (
                  <Chip
                    key={index}
                    label={requirement}
                    onDelete={() => handleRemoveRequirement(index)}
                    color="primary"
                    variant="outlined"
                  />
                ))}
                {requirements.length === 0 && (
                  <Typography variant="body2" color="textSecondary">
                    Aucune exigence ajoutée
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Avantages */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Avantages
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  value={currentBenefit}
                  onChange={(e) => setCurrentBenefit(e.target.value)}
                  label="Nouvel avantage"
                  fullWidth
                  size="small"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddBenefit();
                    }
                  }}
                />
                <Button
                  onClick={handleAddBenefit}
                  variant="outlined"
                  startIcon={<Add />}
                  disabled={!currentBenefit.trim()}
                >
                  Ajouter
                </Button>
              </Box>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {benefits.map((benefit, index) => (
                  <Chip
                    key={index}
                    label={benefit}
                    onDelete={() => handleRemoveBenefit(index)}
                    color="secondary"
                    variant="outlined"
                  />
                ))}
                {benefits.length === 0 && (
                  <Typography variant="body2" color="textSecondary">
                    Aucun avantage ajouté
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Tags/Compétences */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Compétences recherchées (Tags)
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  value={currentTag}
                  onChange={(e) => setCurrentTag(e.target.value)}
                  label="Nouvelle compétence"
                  fullWidth
                  size="small"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                />
                <Button
                  onClick={handleAddTag}
                  variant="outlined"
                  startIcon={<Add />}
                  disabled={!currentTag.trim()}
                >
                  Ajouter
                </Button>
              </Box>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {tags.map((tag, index) => (
                  <Chip
                    key={index}
                    label={tag}
                    onDelete={() => handleRemoveTag(index)}
                    color="default"
                    variant="outlined"
                  />
                ))}
                {tags.length === 0 && (
                  <Typography variant="body2" color="textSecondary">
                    Aucune compétence ajoutée
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Boutons d'action */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              type="button"
              variant="outlined"
              onClick={() => window.history.back()}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
            >
              {loading ? 'Enregistrement...' : (job ? 'Mettre à jour' : 'Créer l\'offre')}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default JobForm;