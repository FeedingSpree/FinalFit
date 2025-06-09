import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  Grid,
  Paper,
  Radio,
  RadioGroup,
  FormControlLabel,
  OutlinedInput,
  Chip
} from '@mui/material';
import {
  Close as CloseIcon,
  Description as DescriptionIcon,
  DateRange as DateRangeIcon,
  Sort as SortIcon,
  Check as CheckIcon,
  Schedule as ScheduleIcon,
  Group as GroupIcon,
  TrendingUp as TrendingUpIcon,
  Business as BusinessIcon,
  LibraryBooks as LibraryBooksIcon
} from '@mui/icons-material';

const steps = ['Department', 'Date Range', 'Sort Options'];

const ReportDialog = ({ open, onClose, config, setConfig, onSubmit, colors, departments }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [selectedPreset, setSelectedPreset] = useState(null); // Track which preset is active

  const sortOptions = [
    { value: 'name', label: 'Student Name', icon: GroupIcon },
    { value: 'program', label: 'Program', icon: LibraryBooksIcon },
    { value: 'yearLevel', label: 'Year Level', icon: TrendingUpIcon },
    { value: 'violationCount', label: 'Violation Count', icon: DescriptionIcon },
    { value: 'department', label: 'Department', icon: BusinessIcon }
  ];

  const datePresets = [
    {
      label: 'Last 7 days',
      getRange: () => ({
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        end: new Date()
      })
    },
    {
      label: 'Last 30 days',
      getRange: () => ({
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: new Date()
      })
    },
    {
      label: 'Last 3 months',
      getRange: () => ({
        start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        end: new Date()
      })
    }
  ];

  const handleGenerateClick = async () => {
    setIsGenerating(true);
    await onSubmit();
    setIsGenerating(false);
  };

  const applyDatePreset = (preset, index) => {
    const range = preset.getRange();
    setConfig(prev => ({
      ...prev,
      startDate: range.start.toISOString().split('T')[0],
      endDate: range.end.toISOString().split('T')[0]
    }));
    setSelectedPreset(index);
  };

  // Add validation for date range
  const validateDateRange = () => {
    const startDate = new Date(config.startDate);
    const endDate = new Date(config.endDate);
    return startDate <= endDate;
  };

  // Disable submit if validation fails
  const isSubmitDisabled = !validateDateRange();

  return (
    <Dialog
      open={open}
      maxWidth="md" // Changed from lg to md
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: colors.grey[900],
          backgroundImage: 'linear-gradient(rgba(255, 215, 0, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 215, 0, 0.05) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
          maxHeight: '53vh', // Reduced from 90vh
          borderRadius: '12px' // Reduced from 16px
        }
      }}
    >
      {/* Header with gradient background */}
      <DialogTitle 
        sx={{ 
          background: `linear-gradient(to right, ${colors.grey[800]}, ${colors.grey[900]})`,
          borderBottom: `1px solid ${colors.grey[800]}`,
          p: 2 // Reduced from p: 3
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box>
              <Typography variant="h6" sx={{ color: colors.grey[100], fontWeight: 'bold' }}>
                Generate Violation Report
              </Typography>
              <Typography variant="caption" sx={{ color: colors.grey[400] }}>
                Configure your report parameters
              </Typography>
            </Box>
          </Box>
          <IconButton size="small" onClick={onClose} sx={{ color: colors.grey[400] }}>
            <CloseIcon sx={{ fontSize: '1.25rem' }} />
          </IconButton>
        </Box>
      </DialogTitle>

      {/* Progress Steps */}
      <Box sx={{ 
        px: 3, // Reduced padding
        py: 2,
        bgcolor: colors.grey[800],
        borderBottom: `1px solid ${colors.grey[700]}`
      }}>
        <Box sx={{ maxWidth: '400px', mx: 'auto' }}> {/* Reduced width */}
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label, index) => (
              <Step key={label}>
                <StepLabel
                  StepIconProps={{
                    sx: {
                      width: 28, // Reduced from 32
                      height: 28, // Reduced from 32
                      color: index <= activeStep ? '#ffd700' : colors.grey[600],
                      '& .MuiStepIcon-text': {
                        fill: index <= activeStep ? colors.grey[900] : colors.grey[400]
                      }
                    }
                  }}
                >
                  <Typography variant="body2" sx={{ color: colors.grey[100] }}>
                    {label}
                  </Typography>
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>
      </Box>

      {/* Content Area */}
      <DialogContent sx={{ 
        p: 3, // Reduced from p: 4
        height: '400px', // Reduced from 450px
        overflow: 'auto'
      }}>
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Department Selection */}
          {activeStep === 0 && (
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ 
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)', // Changed to 3 columns
                gap: 1.5,
                flex: 1
              }}>
                <Paper
                  onClick={() => setConfig(prev => ({ ...prev, department: 'all' }))}
                  sx={{
                    p: 1.5,
                    bgcolor: config.department === 'all' ? 'rgba(255, 215, 0, 0.1)' : colors.grey[800],
                    border: `2px solid ${config.department === 'all' ? '#ffd700' : colors.grey[700]}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    borderRadius: '8px',
                    '&:hover': {
                      bgcolor: config.department === 'all' ? 'rgba(255, 215, 0, 0.15)' : colors.grey[700],
                    }
                  }}
                >
                  <BusinessIcon sx={{ 
                    color: config.department === 'all' ? '#ffd700' : colors.grey[400],
                    fontSize: '1.5rem'
                  }} />
                  <Box>
                    <Typography sx={{ color: colors.grey[100], fontWeight: 'medium', fontSize: '0.9rem' }}>
                      All Departments
                    </Typography>
                  </Box>
                </Paper>

                {departments.map((dept) => (
                  <Paper
                    key={dept}
                    onClick={() => setConfig(prev => ({ ...prev, department: dept }))}
                    sx={{
                      p: 1.5,
                      bgcolor: config.department === dept ? 'rgba(255, 215, 0, 0.1)' : colors.grey[800],
                      border: `2px solid ${config.department === dept ? '#ffd700' : colors.grey[700]}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      borderRadius: '8px',
                      '&:hover': {
                        bgcolor: config.department === dept ? 'rgba(255, 215, 0, 0.15)' : colors.grey[700],
                      }
                    }}
                  >
                    <BusinessIcon sx={{ 
                      color: config.department === dept ? '#ffd700' : colors.grey[400],
                      fontSize: '1.5rem'
                    }} />
                    <Typography sx={{ color: colors.grey[100], fontWeight: 'medium', fontSize: '0.9rem' }}>
                      {dept}
                    </Typography>
                  </Paper>
                ))}
              </Box>
            </Box>
          )}

          {/* Date Range section */}
          {activeStep === 1 && (
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', gap: 3 }}>
                {/* Left side - Quick Presets */}
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" sx={{ color: colors.grey[300], mb: 2 }}>
                    Quick Presets
                  </Typography>
                  <Box sx={{ 
                    display: 'grid',
                    gridTemplateColumns: 'repeat(1, 1fr)', // Changed to single column
                    gap: 1.5 
                  }}>
                    {datePresets.map((preset, index) => (
                      <Paper
                        key={index}
                        onClick={() => applyDatePreset(preset, index)}
                        sx={{
                          p: 1.5,
                          bgcolor: selectedPreset === index ? 'rgba(255, 215, 0, 0.1)' : colors.grey[800],
                          border: `2px solid ${selectedPreset === index ? '#ffd700' : colors.grey[700]}`,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          borderRadius: '8px',
                          '&:hover': {
                            bgcolor: selectedPreset === index ? 'rgba(255, 215, 0, 0.15)' : colors.grey[700],
                            borderColor: selectedPreset === index ? '#ffd700' : colors.grey[600]
                          }
                        }}
                      >
                        <ScheduleIcon sx={{ 
                          color: selectedPreset === index ? '#ffd700' : colors.grey[400],
                          fontSize: '1.5rem'
                        }} />
                        <Typography sx={{ 
                          color: colors.grey[100],
                          fontSize: '0.9rem',
                          fontWeight: 'medium'
                        }}>
                          {preset.label}
                        </Typography>
                      </Paper>
                    ))}
                  </Box>
                </Box>

                {/* Right side - Custom Range */}
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" sx={{ color: colors.grey[300], mb: 2 }}>
                    Custom Range
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Box>
                      <Typography variant="body2" sx={{ color: colors.grey[400], mb: 1 }}>
                        Start Date
                      </Typography>
                      <OutlinedInput
                        type="date"
                        fullWidth
                        size="small"
                        value={config.startDate}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          startDate: e.target.value
                        }))}
                        sx={{
                          bgcolor: colors.grey[800],
                          '& input': { color: colors.grey[100], py: 1 },
                          '& fieldset': { borderColor: colors.grey[700] },
                          '&:hover fieldset': { borderColor: colors.grey[600] },
                          '&.Mui-focused fieldset': { borderColor: '#ffd700' }
                        }}
                      />
                    </Box>
                    <Box>
                      <Typography variant="body2" sx={{ color: colors.grey[400], mb: 1 }}>
                        End Date
                      </Typography>
                      <OutlinedInput
                        type="date"
                        fullWidth
                        size="small"
                        value={config.endDate}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          endDate: e.target.value
                        }))}
                        sx={{
                          bgcolor: colors.grey[800],
                          '& input': { color: colors.grey[100], py: 1 },
                          '& fieldset': { borderColor: colors.grey[700] },
                          '&:hover fieldset': { borderColor: colors.grey[600] },
                          '&.Mui-focused fieldset': { borderColor: '#ffd700' }
                        }}
                      />
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>
          )}

          {/* Sort Options Section */}
          {activeStep === 2 && (
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Sort By */}
                <Box>
                  <Typography variant="subtitle2" sx={{ color: colors.grey[300], mb: 2 }}>
                    Sort Records By
                  </Typography>
                  <Box sx={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(5, 1fr)', // Changed to 2 columns
                    gap: 1.5 
                  }}>
                    {sortOptions.map(option => {
                      const Icon = option.icon;
                      return (
                        <Paper
                          key={option.value}
                          onClick={() => setConfig(prev => ({ ...prev, sortBy: option.value }))
                          }
                          sx={{
                            p: 1.5,
                            bgcolor: config.sortBy === option.value ? 'rgba(255, 215, 0, 0.1)' : colors.grey[800],
                            border: `2px solid ${config.sortBy === option.value ? '#ffd700' : colors.grey[700]}`,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center', // Changed to align horizontally
                            gap: 2,
                            borderRadius: '8px', // Added rounded edges
                            '&:hover': {
                              bgcolor: config.sortBy === option.value ? 'rgba(255, 215, 0, 0.15)' : colors.grey[700],
                            }
                          }}
                        >
                          <Icon sx={{ 
                            color: config.sortBy === option.value ? '#ffd700' : colors.grey[400],
                            fontSize: '1.5rem' // Reduced icon size
                          }} />
                          <Typography sx={{ 
                            color: colors.grey[100],
                            fontSize: '0.9rem', // Reduced font size
                            fontWeight: 'medium'
                          }}>
                            {option.label}
                          </Typography>
                        </Paper>
                      );
                    })}
                  </Box>
                </Box>

                {/* Sort Order */}
                <Box>
                  <Typography variant="subtitle2" sx={{ color: colors.grey[300], mb: 2 }}>
                    Sort Order
                  </Typography>
                  <Box sx={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(2, 1fr)', // Changed to 2 columns
                    gap: 1.5
                  }}>
                    <Paper
                      onClick={() => setConfig(prev => ({ ...prev, sortOrder: 'asc' }))
                      }
                      sx={{
                        p: 1.5,
                        bgcolor: config.sortOrder === 'asc' ? 'rgba(255, 215, 0, 0.1)' : colors.grey[800],
                        border: `2px solid ${config.sortOrder === 'asc' ? '#ffd700' : colors.grey[700]}`,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center', // Changed to align horizontally
                        gap: 2,
                        borderRadius: '8px', // Added rounded edges
                        '&:hover': {
                          bgcolor: config.sortOrder === 'asc' ? 'rgba(255, 215, 0, 0.15)' : colors.grey[700],
                        }
                      }}
                    >
                      <TrendingUpIcon sx={{ 
                        color: config.sortOrder === 'asc' ? '#ffd700' : colors.grey[400],
                        fontSize: '1.5rem' // Reduced icon size
                      }} />
                      <Typography sx={{ 
                        color: colors.grey[100],
                        fontSize: '0.9rem', // Reduced font size
                        fontWeight: 'medium'
                      }}>
                        Ascending (A-Z, 1-9)
                      </Typography>
                    </Paper>

                    <Paper
                      onClick={() => setConfig(prev => ({ ...prev, sortOrder: 'desc' }))
                      }
                      sx={{
                        p: 1.5,
                        bgcolor: config.sortOrder === 'desc' ? 'rgba(255, 215, 0, 0.1)' : colors.grey[800],
                        border: `2px solid ${config.sortOrder === 'desc' ? '#ffd700' : colors.grey[700]}`,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center', // Changed to align horizontally
                        gap: 2,
                        borderRadius: '8px', // Added rounded edges
                        '&:hover': {
                          bgcolor: config.sortOrder === 'desc' ? 'rgba(255, 215, 0, 0.15)' : colors.grey[700],
                        }
                      }}
                    >
                      <TrendingUpIcon 
                        sx={{ 
                          color: config.sortOrder === 'desc' ? '#ffd700' : colors.grey[400],
                          fontSize: '1.5rem', // Reduced icon size
                          transform: 'rotate(180deg)'
                        }} 
                      />
                      <Typography sx={{ 
                        color: colors.grey[100],
                        fontSize: '0.9rem', // Reduced font size
                        fontWeight: 'medium'
                      }}>
                        Descending (Z-A, 9-1)
                      </Typography>
                    </Paper>
                  </Box>
                </Box>
              </Box>
            </Box>
          )}
        </Box>
      </DialogContent>

      {/* Footer */}
      <DialogActions sx={{ 
        p: 2,
        borderTop: `1px solid ${colors.grey[800]}`,
        bgcolor: colors.grey[800],
        display: 'flex',
        justifyContent: 'space-between'
      }}>
        <Box>
          <Button
            size="small"
            disabled={activeStep === 0}
            onClick={() => setActiveStep(prev => prev - 1)}
            sx={{ color: colors.grey[300] }}
          >
            Previous
          </Button>
          {activeStep < steps.length - 1 && (
            <Button
              size="small"
              onClick={() => setActiveStep(prev => prev + 1)}
              sx={{ color: colors.grey[300] }}
            >
              Next
            </Button>
          )}
        </Box>

        {activeStep === steps.length - 1 && (
          <Button
            size="small"
            onClick={onSubmit}
            variant="contained"
            disabled={isSubmitDisabled}
            startIcon={<DescriptionIcon sx={{ fontSize: '1.25rem' }} />}
            sx={{
              px: 3,
              bgcolor: '#ffd700',
              color: colors.grey[900],
              borderRadius: 1.5,
              fontWeight: 'bold',
              '&:hover': {
                bgcolor: '#e6c200'
              }
            }}
          >
            Generate Report
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ReportDialog;