// LiveFeed.jsx
import React from 'react';
import { Box, Typography, useTheme } from "@mui/material";
import { tokens } from "../../theme";
import Header from "../../components/Header";

const LiveFeed = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  return (
    <Box m="20px">
      <Header title="Live Feed" subtitle="Viewing live CCTV footage" />
      <Box mt="20px">
        <Typography variant="h5" color={colors.grey[100]}>
          This is where the live feed from CCTV cameras will be displayed.
        </Typography>
      </Box>
    </Box>
  );
};

export default LiveFeed;
