import React, { createContext, useContext, useEffect, useState } from "react";
import useViolationStore from '../services/violationStore';
import { addReviewLog} from '../services/reviewLogsService.ts';
import { addViolationLog } from '../services/violationLogsService.ts';
import { addDetectionLog } from '../services/detectionLogsService.ts'; // Add this line

// Rest of the DetectionContext.jsx file remains the same

export const DetectionContext = createContext({
  violations: [],
  isDetecting: false,
  isFeedInitialized: false,
  showAlert: false,
  setShowAlert: () => {},
  hourlyViolations: 0,
});

export const useDetection = () => useContext(DetectionContext);

export const DetectionProvider = ({ children }) => {
  const addViolation = useViolationStore(state => state.addViolation);
  const violations = useViolationStore(state => state.violations);
  const [lastViolationId, setLastViolationId] = React.useState(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isFeedInitialized, setIsFeedInitialized] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [lastViolationCount, setLastViolationCount] = useState(0);
  const [hourlyViolations, setHourlyViolations] = useState(0);

  useEffect(() => {
    const checkDetection = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/detection');
        if (response.ok) {
          const data = await response.json();
          
          if (data.type === "violation" && 
              data.data && 
              data.data.violation_id && 
              data.data.violation_id !== lastViolationId) {
            
            setIsDetecting(true);
            setTimeout(() => setIsDetecting(false), 5000);
            
            const violationLog = {
              camera_number: data.data.camera_number,
              date: data.data.date,
              time: data.data.time,
              violation: data.data.violation,
              violation_id: data.data.violation_id,
              url: data.data.url,
              status: data.data.status
            };

            setLastViolationId(data.data.violation_id);
            
            // Update violation count first
            setHourlyViolations(prev => prev + 1);
            
            // Then add the violation to the log
            await addReviewLog(violationLog);
            addViolation(violationLog);
            setShowAlert(true);
          }
        }
      } catch (error) {
        console.error('Error checking detection:', error);
      }
    };

    // Check for detections more frequently
    const detectionInterval = setInterval(checkDetection, 500);
    
    // Clean up old violations every minute
    const cleanupInterval = setInterval(() => {
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);
      
      const recentViolations = violations.filter(violation => {
        const violationDate = new Date(`${violation.date}T${violation.time}`);
        return violationDate > oneHourAgo;
      });
      
      setHourlyViolations(recentViolations.length);
    }, 60000);

    return () => {
      clearInterval(detectionInterval);
      clearInterval(cleanupInterval);
    };
  }, [addViolation, lastViolationId, violations]);

  useEffect(() => {
    if (!isFeedInitialized) return;

    if (violations.length > lastViolationCount) {
      setShowAlert(true);
    }
    setLastViolationCount(violations.length);
  }, [violations.length, lastViolationCount, isFeedInitialized]);

  useEffect(() => {
    let timer;
    if (showAlert) {
      timer = setTimeout(() => {
        setShowAlert(false);
      }, 5000);
    }
    return () => clearTimeout(timer);
  }, [showAlert]);

  return (
    <DetectionContext.Provider value={{ 
      violations, 
      isDetecting, 
      isFeedInitialized,
      setIsFeedInitialized,
      showAlert,
      setShowAlert,
      hourlyViolations
    }}>
      {children}
    </DetectionContext.Provider>
  );
};