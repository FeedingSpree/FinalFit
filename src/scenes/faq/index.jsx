import { Box, useTheme } from "@mui/material";
import Header from "../../components/Header";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Typography from "@mui/material/Typography";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { tokens } from "../../theme";

const FAQ = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  return (
    <Box m="20px">
      <Header title="Frequently Asked Questions" />

      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography color={colors.greenAccent[500]} variant="h5">
            What is this web application used for?
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
            This application is designed to automatically detect dress code violations in real-time using object detection models integrated with surveillance cameras. 
            It helps institutions monitor compliance and ensure dress code policies are followed.
          </Typography>
        </AccordionDetails>
      </Accordion>
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography color={colors.greenAccent[500]} variant="h5">
            How does the system detect dress code violations?
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
            The system uses an advanced object detection algorithm trained to identify specific clothing items or prohibited attire from surveillance footage. 
            Once detected, violations are flagged and logged in the system.
          </Typography>
        </AccordionDetails>
      </Accordion>
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography color={colors.greenAccent[500]} variant="h5">
            What types of dress code violations can the system detect?
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
            Currently, the system can detect violations such as: <br />
            - Cap<br />
            - Shorts<br />
            - Sleeveless Shirts<br />
            - Wearing PE uniform outside PE centers<br />
          </Typography>
        </AccordionDetails>
      </Accordion>
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography color={colors.greenAccent[500]} variant="h5">
            Can I view the history of detected violations?
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
          Yes. All detected violations are logged with their corresponding dress code category, timestamp, and location. 
          These are accessible through the audit logs.
          </Typography>
        </AccordionDetails>
      </Accordion>
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography color={colors.greenAccent[500]} variant="h5">
            Is it possible to add more dress code categories for the system to detect?
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
            Yes. If there are new types of clothing you'd like the system to recognize, they can be added. 
            You'll just need to provide a dataset with images showing the new dress code category, so the system can learn to detect it accurately.
          </Typography>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

export default FAQ;
