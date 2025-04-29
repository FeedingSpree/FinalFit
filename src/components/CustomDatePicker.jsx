import React, { useState, useRef, useEffect } from 'react';
import { Box, Button, Paper, Typography, IconButton } from '@mui/material';
import { tokens } from "../theme";
import { useTheme } from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ArrowLeftIcon from '@mui/icons-material/ArrowLeft';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';

// Add a new prop for minimum date
const CustomDatePicker = ({ label, value, onChange, minDate = null }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [isOpen, setIsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(() => {
    const date = new Date(value);
    // Subtract one day to display correct date in calendar
    date.setDate(date.getDate() - 1);
    return date;
  });
  const pickerRef = useRef(null);

  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 
                 'July', 'August', 'September', 'October', 'November', 'December'];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = getDaysInMonth(year, month);
    const days = [];

    // Add empty cells for days before the first of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Add the days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const handleDateSelect = (day) => {
    if (day) {
      const newDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        day
      );
      
      // Check if the date is after minDate if it exists
      if (minDate && newDate < new Date(minDate)) {
        return;
      }
      
      newDate.setDate(newDate.getDate() + 1);
      const dateString = newDate.toISOString().split('T')[0];
      onChange(dateString);
      setIsOpen(false);
    }
  };

  const handleMonthChange = (increment) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + increment);
    setCurrentDate(newDate);
  };

  // Add a function to check if a date should be disabled
  const isDateDisabled = (day) => {
    if (!day || !minDate) return false;
    
    const checkDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day
    );
    
    return checkDate < new Date(minDate);
  };

  // Update the calendar day buttons rendering
  return (
    <Box ref={pickerRef} position="relative">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        sx={{
          backgroundColor: colors.grey[900],
          color: colors.grey[100],
          width: '160px',
          height: '40px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          px: 2,
          '&:hover': {
            backgroundColor: colors.grey[800],
          },
        }}
      >
        <Typography>
          {new Date(value).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })}
        </Typography>
        <CalendarTodayIcon />
      </Button>

      {isOpen && (
        <Paper
          sx={{
            position: 'absolute',
            top: '100%',
            left: 0,
            mt: 1,
            p: 2,
            zIndex: 1000,
            backgroundColor: colors.grey[900],
            border: `1px solid ${colors.grey[800]}`,
            width: '280px',
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <IconButton onClick={() => handleMonthChange(-1)} sx={{ color: colors.grey[100] }}>
              <ArrowLeftIcon />
            </IconButton>
            <Typography color={colors.grey[100]}>
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </Typography>
            <IconButton onClick={() => handleMonthChange(1)} sx={{ color: colors.grey[100] }}>
              <ArrowRightIcon />
            </IconButton>
          </Box>

          <Box display="grid" gridTemplateColumns="repeat(7, 1fr)" gap={1}>
            {DAYS.map(day => (
              <Typography 
                key={day} 
                color={colors.grey[100]} 
                textAlign="center" 
                fontSize="0.8rem"
              >
                {day}
              </Typography>
            ))}
            {getCalendarDays().map((day, index) => (
              <Button
                key={index}
                onClick={() => handleDateSelect(day)}
                disabled={!day || isDateDisabled(day)}
                sx={{
                  minWidth: 0,
                  p: 1,
                  color: colors.grey[100],
                  backgroundColor: day && new Date(value).getDate() === day ? 
                    colors.blueAccent[500] : 'transparent',
                  '&:hover': {
                    backgroundColor: day && !isDateDisabled(day) ? colors.grey[800] : 'transparent',
                  },
                  '&.Mui-disabled': {
                    color: colors.grey[700],
                    backgroundColor: 'transparent',
                  },
                }}
              >
                {day}
              </Button>
            ))}
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default CustomDatePicker;