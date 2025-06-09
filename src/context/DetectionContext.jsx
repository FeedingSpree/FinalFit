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
  const [lastViolationId, setLastViolationId] = useState(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isFeedInitialized, setIsFeedInitialized] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [lastViolationCount, setLastViolationCount] = useState(0);
  const [hourlyViolations, setHourlyViolations] = useState(0);

  useEffect(() => {
    const checkDetection = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/detection');
        if (!response.ok) return;
        
        const data = await response.json();
        
        if (data.type === "violation" && 
            data.data && 
            data.data.violation_id && 
            data.data.violation_id !== lastViolationId) {
          
          setIsDetecting(true);
          setTimeout(() => setIsDetecting(false), 5000);
          
          // Create the violation log
          const violationLog = {
            camera_number: data.data.camera_number,
            date: data.data.date,
            time: data.data.time,
            violation: data.data.violation,
            violation_id: data.data.violation_id,
            url: data.data.url,
            status: "Pending",
            confidence: data.data.confidence
          };

          try {
            // Add to reviewlogs collection using addReviewLog
            await addReviewLog(violationLog);
            
            // Add to local state after successful logging
            addViolation(violationLog);
            setLastViolationId(data.data.violation_id);
            
            // Update hourly violations count
            const oneHourAgo = new Date();
            oneHourAgo.setHours(oneHourAgo.getHours() - 1);
            
            const recentViolations = violations.filter(v => {
              const violationDate = new Date(`${v.date}T${v.time}`);
              return violationDate > oneHourAgo;
            });
            
            setHourlyViolations(recentViolations.length + 1);
            setShowAlert(true);
            
            // Play alert sound
            const audio = new Audio('/alert.mp3');
            audio.play().catch(e => console.log('Audio play failed:', e));
          } catch (error) {
            console.error('Error adding review log:', error);
          }
        }
      } catch (error) {
        console.error('Error checking detection:', error);
      }
    };

    const detectionInterval = setInterval(checkDetection, 500);
    
    return () => clearInterval(detectionInterval);
  }, [addViolation, lastViolationId, violations]);

  // Auto-hide alert after 5 seconds
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