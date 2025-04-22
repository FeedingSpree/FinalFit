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
  
  const accordionStyle = {
    backgroundColor: colors.grey[900],
    borderRadius: "8px !important",
    marginBottom: "10px",
    '&:before': {
      display: 'none',
    },
    boxShadow: `0px 2px 4px ${colors.primary[500]}`,
  };

  const summaryStyle = {
    '& .MuiAccordionSummary-content': {
      margin: '12px 0',
    },
    '&:hover': {
      backgroundColor: '#e6c200',
    },
  };

  const expandIconStyle = {
    color: colors.grey[100],
    transition: 'transform 0.3s ease-in-out',
    '&.Mui-expanded': {
      transform: 'rotate(180deg)',
    },
  };

  const detailsStyle = {
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: '8px',
    borderBottomRightRadius: '8px',
    padding: '20px',
  };

  return (
    <Box m="20px">
      <Header 
        title="FAQ" 
        subtitle="Frequently Asked Questions About the System" 
      />

      <Box 
        mt="40px" 
        sx={{
          maxWidth: '800px',
          margin: '0 auto',
        }}
      >
        <Accordion sx={accordionStyle}>
          <AccordionSummary 
            expandIcon={<ExpandMoreIcon sx={expandIconStyle} />}
            sx={summaryStyle}
          >
            <Typography 
              color={colors.grey[100]} 
              variant="h5" 
              fontWeight="600"
            >
              What is this web application used for?
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={detailsStyle}>
            <Typography color={colors.grey[100]} lineHeight="1.6">
              This application is designed to automatically detect dress code violations in real-time using object detection models integrated with surveillance cameras. 
              It helps institutions monitor compliance and ensure dress code policies are followed.
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion sx={accordionStyle}>
          <AccordionSummary 
            expandIcon={<ExpandMoreIcon sx={expandIconStyle} />}
            sx={summaryStyle}
          >
            <Typography 
              color={colors.grey[100]} 
              variant="h5" 
              fontWeight="600"
            >
              How does the system detect dress code violations?
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={detailsStyle}>
            <Typography color={colors.grey[100]} lineHeight="1.6">
              The system uses an advanced object detection algorithm trained to identify specific clothing items or prohibited attire from surveillance footage. 
              Once detected, violations are flagged and logged in the system.
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion sx={accordionStyle}>
          <AccordionSummary 
            expandIcon={<ExpandMoreIcon sx={expandIconStyle} />}
            sx={summaryStyle}
          >
            <Typography 
              color={colors.grey[100]} 
              variant="h5" 
              fontWeight="600"
            >
              What types of dress code violations can the system detect?
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={detailsStyle}>
            <Typography color={colors.grey[100]} lineHeight="1.6">
              Currently, the system can detect violations such as: <br />
              - Cap<br />
              - Shorts<br />
              - Sleeveless Shirts<br />
              - Wearing PE uniform outside PE centers<br />
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion sx={accordionStyle}>
          <AccordionSummary 
            expandIcon={<ExpandMoreIcon sx={expandIconStyle} />}
            sx={summaryStyle}
          >
            <Typography 
              color={colors.grey[100]} 
              variant="h5" 
              fontWeight="600"
            >
              Can I view the history of detected violations?
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={detailsStyle}>
            <Typography color={colors.grey[100]} lineHeight="1.6">
              Yes. All detected violations are logged with their corresponding dress code category, timestamp, and location. 
              These are accessible through the audit logs.
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion sx={accordionStyle}>
          <AccordionSummary 
            expandIcon={<ExpandMoreIcon sx={expandIconStyle} />}
            sx={summaryStyle}
          >
            <Typography 
              color={colors.grey[100]} 
              variant="h5" 
              fontWeight="600"
            >
              Is it possible to add more dress code categories for the system to detect?
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={detailsStyle}>
            <Typography color={colors.grey[100]} lineHeight="1.6">
              Yes. If there are new types of clothing you'd like the system to recognize, they can be added. 
              You'll just need to provide a dataset with images showing the new dress code category, so the system can learn to detect it accurately.
            </Typography>
          </AccordionDetails>
        </Accordion>
      </Box>
    </Box>
  );
};

export default FAQ;
