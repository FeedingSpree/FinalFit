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

  const accuracyData = [
    { label: 'Regular Uniform (Female)', value: '95.2%' },
    { label: 'PE Uniform (Female)', value: '93.4%' },
    { label: 'PE Uniform (Male)', value: '90.1%' },
    { label: 'No Sleeves', value: '91.6%' },
    { label: 'Regular Uniform (Male)', value: '87.6%' },
    { label: 'Cap', value: '87.5%' },
    { label: 'Shorts', value: '81.6%' }
  ];

  const AccuracyList = () => (
    <Box sx={{ mt: 2 }}>
      {accuracyData.map(({ label, value }, index) => (
        <Box 
          key={index}
          display="flex" 
          justifyContent="space-between" 
          width="100%" 
          maxWidth="400px"
          mb={1}
          sx={{
            color: colors.grey[100],
            '&:hover': {
              backgroundColor: colors.grey[800],
              borderRadius: "8px !important", // Match accordion borderRadius
            },
            padding: '8px',
            transition: 'all 0.2s'
          }}
        >
          <Typography variant="body1">• {label}</Typography>
          <Typography variant="body1" fontWeight="bold">{value}</Typography>
        </Box>
      ))}
    </Box>
  );

  return (
    <Box m="20px">
      <Header title="FAQ" subtitle="Frequently Asked Questions" />
      <Box mt="40px" sx={{ maxWidth: '800px', margin: '0 auto' }}>
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
              What is the accuracy of the model used in dress code violation detection?
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{
            ...detailsStyle,
            '& .MuiTypography-root': {
              color: colors.grey[100]
            }
          }}>
            <Typography variant="body1" mb={2}>
            We don’t measure accuracy in the usual way because our system doesn’t just label things — 
            it also needs to find them in images. Instead, we use something called Mean Average Precision (mAP), 
            which shows how well it can both detect and correctly identify each item.
            </Typography>
            <Typography variant="h6" fontWeight="600" mb={1}>
              Here’s how well the system performs in detecting different types of clothing:
            </Typography>
            <AccuracyList />
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
              How can I add an event in the calendar?
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={detailsStyle}>
            <Typography color={colors.grey[100]} variant="body1">
              Adding events to the calendar is straightforward:
            </Typography>
            <Box sx={{ mt: 2, ml: 2 }}>
              <Typography color={colors.grey[100]} component="div">
                1. Click on your desired start date
              </Typography>
              <Typography color={colors.grey[100]} component="div">
                2. In the dialog that appears:
                <Box sx={{ ml: 2, mt: 1 }}>
                  • Enter the event name<br/>
                  • Set the end date if needed
                </Box>
              </Typography>
              <Typography color={colors.grey[100]} component="div" mt={2}>
                3. Click Save to add your event
              </Typography>
            </Box>
          </AccordionDetails>
        </Accordion>
      </Box>
    </Box>
  );
};

export default FAQ;
