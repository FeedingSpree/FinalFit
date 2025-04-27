import React, { useState, useRef, useEffect } from 'react';
import { Box, Button, Paper, Typography, IconButton } from '@mui/material';
import { tokens } from "../theme";
import { useTheme } from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ArrowLeftIcon from '@mui/icons-material/ArrowLeft';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';

const CustomDatePicker = ({ label, value, onChange }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [isOpen, setIsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date(value));
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
      const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      onChange(newDate.toISOString().split('T')[0]);
      setIsOpen(false);
    }
  };

  const handleMonthChange = (increment) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + increment);
    setCurrentDate(newDate);
  };

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
        <Typography>{new Date(value).toLocaleDateString()}</Typography>
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
                disabled={!day}
                sx={{
                  minWidth: 0,
                  p: 1,
                  color: colors.grey[100],
                  backgroundColor: day && new Date(value).getDate() === day ? 
                    colors.blueAccent[500] : 'transparent',
                  '&:hover': {
                    backgroundColor: day ? colors.grey[800] : 'transparent',
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