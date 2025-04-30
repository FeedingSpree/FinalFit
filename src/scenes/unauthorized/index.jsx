import { Box, Button, Typography, useTheme } from "@mui/material";
import { tokens } from "../../theme";
import { useNavigate } from "react-router-dom";

const Unauthorized = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      height="100vh"
      backgroundColor={colors.primary[400]}
    >
      <Typography
        variant="h1"
        color={colors.grey[100]}
        fontWeight="bold"
        mb={3}
      >
        401 - Unauthorized Access
      </Typography>
      <Typography
        variant="h5"
        color={colors.grey[300]}
        mb={4}
      >
        You don't have permission to access this page.
      </Typography>
      <Button
        variant="contained"
        onClick={() => navigate(-1)}
        sx={{
          backgroundColor: colors.blueAccent[700],
          color: colors.grey[100],
          fontSize: "14px",
          fontWeight: "bold",
          padding: "10px 20px",
        }}
      >
        Go Back
      </Button>
    </Box>
  );
};

export default Unauthorized;