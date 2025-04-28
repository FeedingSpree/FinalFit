import { useState, useEffect } from "react";
import FullCalendar, { formatDate } from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import {
  Box,
  List,
  ListItem,
  ListItemText,
  Typography,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField
} from "@mui/material";
import Header from "../../components/Header";
import { tokens } from "../../theme";
import {
  addCalendarEvent,
  getCalendarEvents,
  updateCalendarEvent,
  deleteCalendarEvent,
} from "../../services/calendarService.ts";
import { addUserLog } from "../../services/userLogsService.ts";
import DeleteIcon from '@mui/icons-material/Delete';
import IconButton from '@mui/material/IconButton';

const getRandomColor = () => {
  const colors = [
    "#ffd700", // gold
    "#4caf50", // green
    "#2196f3", // blue
    "#ff9800", // orange
    "#e91e63", // pink
    "#9c27b0", // purple
    "#00bcd4", // cyan
    "#f44336", // red
    "#607d8b", // blue-grey
    "#8bc34a", // light green
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

const Calendar = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [currentEvents, setCurrentEvents] = useState([]);
  const [customEvents, setCustomEvents] = useState([]);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventEndDate, setNewEventEndDate] = useState("");
  const [selectedDateInfo, setSelectedDateInfo] = useState(null);
  const [eventCount, setEventCount] = useState(0);
  const [selectedEvents, setSelectedEvents] = useState([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);

  const handleDateClick = (selected) => {
    setSelectedDateInfo(selected);
    setNewEventEndDate(selected.startStr); // Default end date to start date
    setAddDialogOpen(true);
  };

  const handleAddEvent = async () => {
    if (!newEventTitle || !selectedDateInfo || !newEventEndDate) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      const color = getRandomColor();
      const user = JSON.parse(sessionStorage.getItem('user'));
      
      // Get the dates in yyyy-mm-dd format from the date picker
      const pickerStartDate = selectedDateInfo.startStr;
      const pickerEndDate = newEventEndDate;
      
      // Convert to mm-dd-yyyy for storage
      const startParts = pickerStartDate.split('-');
      const endParts = pickerEndDate.split('-');
      
      if (startParts.length !== 3 || endParts.length !== 3) {
        throw new Error("Invalid date format");
      }

      const eventData = {
        event_name: newEventTitle,
        start_date: `${startParts[1]}-${startParts[2]}-${startParts[0]}`,
        end_date: `${endParts[1]}-${endParts[2]}-${endParts[0]}`,
        color
      };

      await addCalendarEvent(eventData);

      // Add user log for event creation
      await addUserLog({
        log_id: user.log_id,
        username: user.username,
        action: `Added event`,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().split(' ')[0]
      });

      // Refresh events and count
      const events = await getCalendarEvents();
      setCustomEvents(events.map(mapEventForCalendar));
      setEventCount(events.length);  // Update count after adding

      setNewEventTitle("");
      setNewEventEndDate("");
      setAddDialogOpen(false);
    } catch (error) {
      console.error("Error adding event:", error);
      alert(`Failed to add event: ${error.message}`);
    }
  };

  const handleEventClick = (selected) => {
    setEventToDelete(selected.event);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      const user = JSON.parse(sessionStorage.getItem('user'));
      await deleteCalendarEvent(eventToDelete.id);
      
      // Add user log for event deletion
      await addUserLog({
        log_id: user.log_id,
        username: user.username,
        action: `Deleted calendar event: ${eventToDelete.title}`,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().split(' ')[0]
      });

      // Refresh events and count
      const events = await getCalendarEvents();
      setCustomEvents(events.map(mapEventForCalendar));
      setEventCount(events.length);  // Update count after deleting

      setDeleteDialogOpen(false);
      setEventToDelete(null);
    } catch (error) {
      console.error("Error deleting event:", error);
    }
  };

  const handleEventSelect = (eventId) => {
    setSelectedEvents(prev => {
      if (prev.includes(eventId)) {
        return prev.filter(id => id !== eventId);
      }
      return [...prev, eventId];
    });
  };

  const handleBulkDelete = () => {
    setBulkDeleteDialogOpen(true);
  };

  const handleBulkDeleteConfirm = async () => {
    try {
      const user = JSON.parse(sessionStorage.getItem('user'));
      await Promise.all(selectedEvents.map(id => deleteCalendarEvent(id)));
      
      // Add user log for bulk deletion
      await addUserLog({
        log_id: user.log_id,
        username: user.username,
        action: `Removed ${selectedEvents.length} events`,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().split(' ')[0]
      });

      // Refresh events and count
      const events = await getCalendarEvents();
      setCustomEvents(events.map(mapEventForCalendar));
      setEventCount(events.length);  // Update count after bulk deleting

      setSelectedEvents([]);
      setBulkDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error deleting events:", error);
    }
  };

  useEffect(() => {
    const fetchEvents = async () => {
      const events = await getCalendarEvents();
      setCustomEvents(events.map(mapEventForCalendar));
      setEventCount(events.length);
    };
    fetchEvents();
    // eslint-disable-next-line
  }, []);

  return (
    <Box m="20px">
      <Header title="Calendar" subtitle="Events Calendar" />

      {/* Add Event Dialog */}
      <Dialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        PaperProps={{
          sx: {
            backgroundColor: colors.grey[900],
          }
        }}
      >
        <DialogTitle sx={{ color: colors.grey[100] }}>
          Add New Event
        </DialogTitle>
        <DialogContent>
          <Box
            component="form"
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              padding: '10px',
              '& .form-row': {
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
              },
              '& .form-field': {
                display: 'flex',
                alignItems: 'flex-start',
                gap: 2,
                minWidth: '350px',
              },
              '& .form-label': {
                minWidth: '120px',
                textAlign: 'left',
                paddingTop: '8px',
              },
              '& .form-input': {
                flex: 1,
                minWidth: '200px',
              },
              '& .error-text': {
                marginLeft: 'calc(120px + 16px)',
                fontSize: '0.75rem',
              },
            }}
            noValidate
            autoComplete="off"
          >
            <div className="form-row">
              <div className="form-field">
                <Typography className="form-label" sx={{ color: colors.grey[100], fontWeight: 'bold' }}>
                  Event Title *
                </Typography>
                <TextField
                  className="form-input"
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  placeholder="Enter event title"
                  error={!newEventTitle.trim()}
                  sx={{
                    color: colors.grey[100],
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: !newEventTitle.trim() ? '#f44336' : colors.grey[400],
                      borderWidth: 1,
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: !newEventTitle.trim() ? '#f44336' : colors.grey[100],
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: !newEventTitle.trim() ? '#f44336' : colors.grey[100],
                    },
                    '&::placeholder': {
                      color: colors.grey[500],
                      opacity: 1,
                    },
                    input: { color: colors.grey[100] }
                  }}
                  autoFocus
                  margin="dense"
                  fullWidth
                />
              </div>
              {!newEventTitle.trim() && (
                <Typography className="error-text" color="error" variant="caption">
                  Event title is required
                </Typography>
              )}
            </div>
            <div className="form-row">
              <div className="form-field">
                <Typography className="form-label" sx={{ color: colors.grey[100], fontWeight: 'bold' }}>
                  End Date *
                </Typography>
                <TextField
                  className="form-input"
                  type="date"
                  value={newEventEndDate}
                  onChange={(e) => setNewEventEndDate(e.target.value)}
                  inputProps={{
                    min: selectedDateInfo ? selectedDateInfo.startStr : undefined,
                  }}
                  sx={{
                    color: colors.grey[100],
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: !newEventEndDate ? '#f44336' : colors.grey[400],
                      borderWidth: 1,
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: !newEventEndDate ? '#f44336' : colors.grey[100],
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: !newEventEndDate ? '#f44336' : colors.grey[100],
                    },
                    input: { color: colors.grey[100] }
                  }}
                  margin="dense"
                  fullWidth
                />
              </div>
              {!newEventEndDate && (
                <Typography className="error-text" color="error" variant="caption">
                  End date is required
                </Typography>
              )}
            </div>
          </Box>
        </DialogContent>
        <DialogActions sx={{ backgroundColor: colors.grey[900], padding: '20px' }}>
          <Button onClick={() => setAddDialogOpen(false)} sx={{ color: colors.grey[100] }}>
            Cancel
          </Button>
          <Button
            onClick={handleAddEvent}
            variant="contained"
            sx={{
              backgroundColor: '#ffd700',
              color: colors.grey[100],
              fontWeight: "bold",
              padding: "10px 20px",
              "&:hover": {
                backgroundColor: '#e6c200',
              },
            }}
            disabled={!newEventTitle.trim() || !newEventEndDate}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>

      <Box display="flex" flexDirection={{ xs: "column", md: "row" }} justifyContent="space-between">
        {/* CALENDAR SIDEBAR */}
        <Box
          flex="1 1 20%"
          backgroundColor={colors.grey[900]}
          p="15px"
          borderRadius="16px"
          mb={{ xs: 2, md: 0 }}
        >
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Typography variant="h5">Events ({eventCount})</Typography>
            <IconButton
              onClick={handleBulkDelete}
              disabled={selectedEvents.length === 0}
              sx={{
                color: selectedEvents.length === 0 ? colors.grey[500] : colors.grey[100],
                '&:hover': {
                  backgroundColor: selectedEvents.length === 0 ? 'transparent' : colors.grey[700],
                }
              }}
            >
              <DeleteIcon />
            </IconButton>
          </Box>
          <List>
            {customEvents.map((event) => (
              <ListItem
                key={event.id}
                sx={{
                  backgroundColor: event.backgroundColor,
                  margin: "10px 0",
                  borderRadius: "16px",
                  cursor: 'pointer',
                  opacity: selectedEvents.includes(event.id) ? 0.7 : 1,
                  outline: selectedEvents.includes(event.id) 
                    ? `2px solid ${colors.grey[100]}` 
                    : 'none',
                }}
                onClick={() => handleEventSelect(event.id)}
              >
                <ListItemText
                  primary={event.title}
                  secondary={
                    <Typography>
                      {formatDate(event.start, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                      {" "} - {" "}
                      {formatDate(new Date(new Date(event.end).setDate(new Date(event.end).getDate() - 1)), {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </Typography>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Box>

        {/* CALENDAR */}
        <Box flex="1 1 100%" ml={{ xs: 0, md: "15px" }}>
          <FullCalendar
            height="75vh"
            plugins={[
              dayGridPlugin,
              timeGridPlugin,
              interactionPlugin,
              listPlugin,
            ]}
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay,listMonth",
            }}
            initialView="dayGridMonth"
            editable={true}
            selectable={true}
            selectMirror={true}
            dayMaxEvents={3} // Changed from true to 3
            select={handleDateClick}
            eventClick={handleEventClick}
            events={customEvents}
            eventDisplay="block" // Makes events more visible
            eventTimeFormat={{ // Removes time display since these are all-day events
              hour: undefined,
              minute: undefined,
              meridiem: false
            }}
            views={{
              dayGrid: {
                dayMaxEvents: 3 // Ensure month view shows max 3 events
              },
              timeGrid: {
                dayMaxEvents: 3 // Ensure week view shows max 3 events
              }
            }}
            // Custom styling for better visibility
            eventDidMount={(info) => {
              info.el.style.fontSize = '0.85em';
              info.el.style.padding = '2px 4px';
              info.el.style.marginBottom = '1px';
              info.el.style.whiteSpace = 'nowrap';
              info.el.style.overflow = 'hidden';
              info.el.style.textOverflow = 'ellipsis';
            }}
          />
        </Box>
      </Box>

      {/* Single Event Delete Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{
          sx: {
            backgroundColor: colors.grey[900],
          }
        }}
      >
        <DialogTitle sx={{ color: colors.grey[100] }}>
          Delete Event
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: colors.grey[100] }}>
            Are you sure you want to delete the event '{eventToDelete?.title}'?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ backgroundColor: colors.grey[900], padding: '20px' }}>
          <Button onClick={() => setDeleteDialogOpen(false)} sx={{ color: colors.grey[100] }}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            sx={{
              backgroundColor: '#f44336',
              color: colors.grey[100],
              fontWeight: "bold",
              padding: "10px 20px",
              "&:hover": {
                backgroundColor: '#d32f2f',
              },
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Delete Dialog */}
      <Dialog
        open={bulkDeleteDialogOpen}
        onClose={() => setBulkDeleteDialogOpen(false)}
        PaperProps={{
          sx: {
            backgroundColor: colors.grey[900],
          }
        }}
      >
        <DialogTitle sx={{ color: colors.grey[100] }}>
          Remove Selected Events
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: colors.grey[100] }}>
            Are you sure you want to remove {selectedEvents.length} selected event(s)?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ backgroundColor: colors.grey[900], padding: '20px' }}>
          <Button onClick={() => setBulkDeleteDialogOpen(false)} sx={{ color: colors.grey[100] }}>
            Cancel
          </Button>
          <Button
            onClick={handleBulkDeleteConfirm}
            variant="contained"
            sx={{
              backgroundColor: '#f44336',
              color: colors.grey[100],
              fontWeight: "bold",
              padding: "10px 20px",
              "&:hover": {
                backgroundColor: '#d32f2f',
              },
            }}
          >
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// First, update the date conversion helpers
function toISODate(mmddyyyy) {
  if (!mmddyyyy) return undefined;
  const [month, day, year] = mmddyyyy.split("-");
  if (!month || !day || !year) return undefined;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function toMMDDYYYY(isoDate) {
  if (!isoDate) return undefined;
  const [year, month, day] = isoDate.split("-");
  if (!month || !day || !year) return undefined;
  return `${month}-${day}-${year}`;
}

const mapEventForCalendar = (e) => {
  // Start date conversion (unchanged)
  const start = toISODate(e.start_date);
  
  // End date handling
  let end;
  if (e.end_date) {
    const isoEnd = toISODate(e.end_date);
    if (isoEnd) {
      // Add one day to the end date for FullCalendar's exclusive end date
      const [year, month, day] = isoEnd.split("-");
      const nextDay = new Date(parseInt(year), parseInt(month) - 1, parseInt(day) + 1);
      end = nextDay.toISOString().split('T')[0];
    }
  }

  return {
    id: e.id,
    title: e.event_name,
    start,
    end,
    allDay: true,
    backgroundColor: e.color,
    borderColor: e.color,
    color: e.color,
  };
};

export default Calendar;