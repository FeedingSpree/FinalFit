import { Box, Button, Typography, useTheme, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, FormControl, InputLabel, OutlinedInput, Select } from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { tokens } from "../../theme";
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FilterListIcon from '@mui/icons-material/FilterList';
import Header from "../../components/Header";
import React, { useEffect, useState } from "react";
import { getUsers, addUser, updateUser, deleteUser } from "../../services/userService.ts";  // Assuming getUsers, addUser, updateUser, and deleteUser are in userService.ts
import { color } from "d3-color";
import { 
  GridToolbarContainer,
  GridToolbarFilterButton,
  GridToolbarDensitySelector,
  GridToolbarExport
} from '@mui/x-data-grid';

const Team = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [users, setUsers] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [filterModel, setFilterModel] = useState({
    items: [],
    quickFilterValues: [],
  });
  const [sortModel, setSortModel] = useState([
    {
      field: 'first_name',
      sort: 'asc',
    },
  ]);
  const [formErrors, setFormErrors] = useState({
    first_name: '',
    last_name: '',
    username: ''
  });
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    username: '',
    password: '',
    loa: 'SOHAS'
  });

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [confirmText, setConfirmText] = useState('');

  const generatePassword = () => {
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const all = uppercase + lowercase + numbers;
    
    let password = "";
    // Ensure at least one of each type
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    
    // Fill the rest randomly
    for (let i = password.length; i < 8; i++) {
      password += all[Math.floor(Math.random() * all.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  };

  const generateUserId = () => {
    const date = new Date();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear().toString().slice(-2);
    const randomLetter = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
    
    return `U${month}${day}${year}${randomLetter}`;
  };

  const [generatedPassword, setGeneratedPassword] = useState("");

  useEffect(() => {
    // Fetch users from Firestore
    const fetchUsers = async () => {
      const fetchedUsers = await getUsers();
      setUsers(fetchedUsers);
    };
    
    fetchUsers();
  }, []);

  const handleAddUser = () => {
    const newPassword = generatePassword();
    setGeneratedPassword(newPassword);
    setFormData({
      first_name: '',
      last_name: '',
      username: '',
      password: newPassword,
      loa: 'SOHAS'
    });
    setFormErrors({
      first_name: '',
      last_name: '',
      username: ''
    });
    setOpenDialog(true);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setFormData({
      first_name: user.first_name,
      last_name: user.last_name,
      username: user.username,
      password: user.password, // Will show as ******** in the form
      loa: user.loa
    });
    setGeneratedPassword("********"); // Set password field to show asterisks
    setFormErrors({
      first_name: '',
      last_name: '',
      username: ''
    });
    setOpenDialog(true);
  };

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
    setConfirmText('');
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setUserToDelete(null);
    setConfirmText('');
  };

  const handleDeleteConfirm = async () => {
    if (confirmText.toLowerCase() === 'confirm') {
      try {
        await deleteUser(userToDelete.id);
        const updatedUsers = await getUsers();
        setUsers(updatedUsers);
        handleDeleteCancel();
      } catch (error) {
        console.error("Error deleting user:", error);
        alert("Error deleting user. Please try again.");
      }
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedUser(null);
    setGeneratedPassword("");
    setFormData({
      first_name: '',
      last_name: '',
      username: '',
      password: '',
      loa: 'SOHAS'
    });
    setFormErrors({
      first_name: '',
      last_name: '',
      username: ''
    });
  };

  const handleSortModelChange = (newSortModel) => {
    setSortModel(newSortModel);
  };

  const validateName = (name) => {
    const nameRegex = /^[A-Za-z\s]+$/;
    return nameRegex.test(name);
  };

  const checkUsernameExists = async (username) => {
    const existingUsers = await getUsers();
    return existingUsers.some(user => 
      user.username === username && (!selectedUser || user.id !== selectedUser.id)
    );
  };

  const handleInputChange = async (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Reset error for this field
    setFormErrors(prev => ({
      ...prev,
      [field]: ''
    }));

    // Validate based on field type
    if (field === 'first_name' || field === 'last_name') {
      if (!validateName(value)) {
        setFormErrors(prev => ({
          ...prev,
          [field]: 'Only letters are allowed'
        }));
      }
    } else if (field === 'username' && value) {
      const exists = await checkUsernameExists(value);
      if (exists) {
        setFormErrors(prev => ({
          ...prev,
          username: 'Username already exists'
        }));
      }
    }
  };

  const handleSubmit = async () => {
    // First reset all errors
    const newErrors = {
      first_name: '',
      last_name: '',
      username: ''
    };

    // Validate required fields
    if (!formData.first_name) newErrors.first_name = 'First name is required';
    if (!formData.last_name) newErrors.last_name = 'Last name is required';
    if (!formData.username) newErrors.username = 'Username is required';

    // Check name format
    if (formData.first_name && !validateName(formData.first_name)) {
      newErrors.first_name = 'Only letters are allowed';
    }
    if (formData.last_name && !validateName(formData.last_name)) {
      newErrors.last_name = 'Only letters are allowed';
    }

    // Check for existing username
    if (formData.username) {
      const exists = await checkUsernameExists(formData.username);
      if (exists) {
        newErrors.username = 'Username already exists';
      }
    }

    // Update form errors
    setFormErrors(newErrors);

    // Check if there are any errors
    if (Object.values(newErrors).some(error => error !== '')) {
      return;
    }

    // If no errors, proceed with submission
    try {
      if (selectedUser) {
        // Update existing user
        await updateUser(selectedUser.id, {
          ...formData,
          password: selectedUser.password // Keep existing password
        });
      } else {
        // Add new user
        const userId = generateUserId();
        const userData = {
          user_id: userId,
          ...formData,
          password: generatedPassword
        };
        await addUser(userData);
      }
      
      // Refresh users list
      const updatedUsers = await getUsers();
      setUsers(updatedUsers);
      
      handleCloseDialog();
      console.log(selectedUser ? "User updated successfully!" : "User added successfully!");
    } catch (error) {
      console.error(selectedUser ? "Error updating user:" : "Error adding user:", error);
      alert(selectedUser ? "Error updating user. Please try again." : "Error adding user. Please try again.");
    }
  };

  const CustomToolbar = () => {
    return (
      <GridToolbarContainer>
        <GridToolbarFilterButton />
        <GridToolbarDensitySelector />
        <GridToolbarExport />
      </GridToolbarContainer>
    );
  };

  const columns = [
    { 
      field: "user_id", 
      headerName: "User ID",
      flex: 0.7,
      sortable: true,
    },
    {
      field: "first_name",
      headerName: "First Name",
      flex: 1,
      cellClassName: "name-column--cell",
      sortable: true,
    },
    {
      field: "last_name",
      headerName: "Last Name",
      flex: 1,
      cellClassName: "name-column--cell",
      sortable: true,
    },
    {
      field: "username",
      headerName: "Username",
      flex: 1,
      sortable: true,
    },
    {
      field: "loa",
      headerName: "Access Level",
      flex: 0.8,
      sortable: true,
      renderCell: ({ row: { loa } }) => {
        return (
          <Typography sx={{ fontSize: "15px" }}>
            {loa}
          </Typography>
        );
      },
    },
    {
      field: "actions",
      headerName: "Actions",
      flex: 0.8,
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        return (
          <Box display="flex" gap="5px">
            <IconButton 
              onClick={() => handleEditUser(params.row)}
              color="primary"
              size="small"
            >
              <EditIcon />
            </IconButton>
            <IconButton 
              onClick={() => handleDeleteClick(params.row)}
              color="error"
              size="small"
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        );
      },
    },
  ];

  return (
    <Box m="20px">
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Header title="User Management"/>
        <Box display="flex" gap="10px">
          <Button
            onClick={handleAddUser}
            variant="contained"
            startIcon={<AddIcon />}
            sx={{
              backgroundColor: '#ffd700',
              color: colors.grey[100],
              fontSize: "14px",
              fontWeight: "bold",
              padding: "10px 20px",
              "&:hover": {
                backgroundColor: '#e6c200',
              },
            }}
          >
            Add New User
          </Button>
        </Box>
      </Box>

      <Box
        m="0px 0 0 0"
        height="85vh"
        sx={{
          "& .MuiDataGrid-root": {
            border: "none",
            fontSize: "16px", // Increased base font size
          },
          "& .MuiDataGrid-cell": {
            borderBottom: "none",
            color: colors.grey[100], // text color for other columns
            fontSize: "15px", // Increased cell font size
          },
          "& .name-column--cell": {
            color: colors.grey[100], // text colors for name columns
          },
          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: colors.grey[400], // header background color
            borderBottom: "none",
            color: colors.grey[900], // Light text
            fontSize: "16px", // Increased header font size
            fontWeight: "bold",
          },
          "& .MuiDataGrid-virtualScroller": {
            backgroundColor: colors.grey[900], // Lighter background for rows
          },
          "& .MuiDataGrid-footerContainer": {
            borderTop: "none",
            backgroundColor: colors.grey[400], // background color for footer
            color: colors.grey[900], // Light text
          },
          "& .MuiCheckbox-root": {
            color: `${colors.grey[700]} !important`,
          },
          // background color for toolbar
          "& .MuiDataGrid-toolbarContainer": {
            padding: 2,
            "& .MuiButton-root": {
              color: colors.grey[100], // Dark text
              fontSize: "14px", // Increased toolbar button font size
            },
          },
          "& .MuiDataGrid-cell:focus": {
            outline: "  ",
          },
          "& .MuiDataGrid-row": { // hover color
            "&:hover": {
              backgroundColor: colors.grey[800],
            },
          },
          // footer text color
          "& .MuiTablePagination-root": {
            color: colors.grey[900],
            fontSize: "15px",
            display: "flex",
            alignItems: "center",
            "& .MuiTablePagination-selectLabel": {
              fontSize: "15px",
              marginBottom: 0,
              marginTop: 0,
            },
            "& .MuiTablePagination-displayedRows": {
              fontSize: "15px",
              marginBottom: 0,
              marginTop: 0,
            },
            "& .MuiSelect-select": {
              fontSize: "15px",
              paddingTop: 0,
              paddingBottom: 0,
            },
            "& .MuiTablePagination-select": {
              marginRight: "8px",
              marginLeft: "8px",
            },
            "& .MuiTablePagination-toolbar": {
              minHeight: "auto",
              height: "48px",
              display: "flex",
              alignItems: "center",
            },
          },
          // action icons color
          "& .MuiIconButton-root": {
            color: colors.grey[400], 
          },
        }}
      >
        <DataGrid 
          rows={users} 
          columns={columns}
          components={{
            Toolbar: CustomToolbar
          }}
          sortModel={sortModel}
          onSortModelChange={handleSortModelChange}
          filterModel={filterModel}
          onFilterModelChange={(newModel) => setFilterModel(newModel)}
          checkboxSelection
          disableRowSelectionOnClick
          initialState={{
            sorting: {
              sortModel: [{ field: 'first_name', sort: 'asc' }],
            },
          }}
        />
      </Box>

      {/* Add/Edit User Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        PaperProps={{
          sx: {
            backgroundColor: colors.grey[900],
          }
        }}
      >
        <DialogTitle sx={{ color: colors.grey[100] }}>
          {selectedUser ? 'Edit User' : 'Add New User'}
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
                alignItems: 'center',
                gap: 2,
              },
              '& .form-label': {
                minWidth: '100px',
                textAlign: 'left', // Changed from 'right' to 'left'
              },
              '& .form-input': {
                flex: 1,
              },
            }}
            noValidate
            autoComplete="off"
          >
            <div className="form-row">
              <Typography
                className="form-label"
                sx={{ 
                  color: colors.grey[100],
                  fontWeight: 'bold'
                }}
              >
                First Name *
              </Typography>
              <OutlinedInput
                className="form-input"
                value={formData.first_name}
                onChange={(e) => handleInputChange('first_name', e.target.value)}
                placeholder="Enter first name"
                error={!!formErrors.first_name}
                sx={{
                  color: colors.grey[100],
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: formErrors.first_name ? '#f44336' : colors.grey[400],
                    borderWidth: 1,
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: formErrors.first_name ? '#f44336' : colors.grey[100],
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: formErrors.first_name ? '#f44336' : colors.grey[100],
                  },
                  '&::placeholder': {
                    color: colors.grey[500],
                    opacity: 1,
                  },
                }}
              />
              {formErrors.first_name && (
                <Typography color="error" variant="caption">
                  {formErrors.first_name}
                </Typography>
              )}
            </div>

            <div className="form-row">
              <Typography
                className="form-label"
                sx={{ 
                  color: colors.grey[100],
                  fontWeight: 'bold'
                }}
              >
                Last Name *
              </Typography>
              <OutlinedInput
                className="form-input"
                value={formData.last_name}
                onChange={(e) => handleInputChange('last_name', e.target.value)}
                placeholder="Enter last name"
                error={!!formErrors.last_name}
                sx={{
                  color: colors.grey[100],
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: formErrors.last_name ? '#f44336' : colors.grey[400],
                    borderWidth: 1,
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: formErrors.last_name ? '#f44336' : colors.grey[100],
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: formErrors.last_name ? '#f44336' : colors.grey[100],
                  },
                  '&::placeholder': {
                    color: colors.grey[500],
                    opacity: 1,
                  },
                }}
              />
              {formErrors.last_name && (
                <Typography color="error" variant="caption">
                  {formErrors.last_name}
                </Typography>
              )}
            </div>

            <div className="form-row">
              <Typography
                className="form-label"
                sx={{ 
                  color: colors.grey[100],
                  fontWeight: 'bold'
                }}
              >
                Username *
              </Typography>
              <OutlinedInput
                className="form-input"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                placeholder="Enter username"
                error={!!formErrors.username}
                sx={{
                  color: colors.grey[100],
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: formErrors.username ? '#f44336' : colors.grey[400],
                    borderWidth: 1,
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: formErrors.username ? '#f44336' : colors.grey[100],
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: formErrors.username ? '#f44336' : colors.grey[100],
                  },
                  '&::placeholder': {
                    color: colors.grey[500],
                    opacity: 1,
                  },
                }}
              />
              {formErrors.username && (
                <Typography color="error" variant="caption">
                  {formErrors.username}
                </Typography>
              )}
            </div>

            <div className="form-row">
              <Typography
                className="form-label"
                sx={{ 
                  color: colors.grey[100],
                  fontWeight: 'bold'
                }}
              >
                Password
              </Typography>
              <OutlinedInput
                className="form-input"
                value={selectedUser ? "********" : generatedPassword}
                disabled
                sx={{
                  color: colors.grey[100],
                  backgroundColor: colors.grey[800],
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: colors.grey[400],
                    borderWidth: 1,
                  },
                  '&.Mui-disabled': {
                    color: colors.grey[100],
                    '-webkit-text-fill-color': colors.grey[100],
                  },
                  '& .MuiOutlinedInput-input.Mui-disabled': {
                    color: colors.grey[100],
                    '-webkit-text-fill-color': colors.grey[100],
                  },
                }}
              />
            </div>

            <div className="form-row">
              <Typography
                className="form-label"
                sx={{ 
                  color: colors.grey[100],
                  fontWeight: 'bold'
                }}
              >
                Access Level *
              </Typography>
              <Select
                className="form-input"
                value={formData.loa}
                onChange={(e) => handleInputChange('loa', e.target.value)}
                sx={{
                  color: colors.grey[100],
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: colors.grey[400],
                    borderWidth: 1,
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: colors.grey[100],
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: colors.grey[100],
                  },
                  '& .MuiSelect-icon': {
                    color: colors.grey[100],
                  },
                }}
              >
                <MenuItem value="OSA">OSA</MenuItem>
                <MenuItem value="SOHAS">SOHAS</MenuItem>
              </Select>
            </div>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} sx={{ color: colors.grey[100] }}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
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
            disabled={Object.values(formErrors).some(error => error)}
          >
            {selectedUser ? 'Save Changes' : 'Add User'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        PaperProps={{
          sx: {
            backgroundColor: colors.grey[900],
          }
        }}
      >
        <DialogTitle sx={{ color: colors.grey[100] }}>
          Confirm Delete User
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography sx={{ color: colors.grey[100], mb: 2 }}>
              Are you sure you want to delete this user?
            </Typography>
            <Typography sx={{ color: colors.grey[100], mb: 2 }}>
              Type "confirm" to delete:
            </Typography>
            <OutlinedInput
              fullWidth
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type 'confirm'"
              sx={{
                color: colors.grey[100],
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: colors.grey[400],
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: colors.grey[100],
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: colors.grey[100],
                },
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} sx={{ color: colors.grey[100] }}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            color="error"
            disabled={confirmText.toLowerCase() !== 'confirm'}
          >
            Delete User
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Team;
