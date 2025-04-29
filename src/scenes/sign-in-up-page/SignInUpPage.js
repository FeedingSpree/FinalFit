import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getUsers, updateUser } from "../../services/userService.ts";
import { addUserLog } from "../../services/userLogsService.ts";
import "./style.css";

function SignInUpPage() {
  const [isRightPanelActive, setIsRightPanelActive] = useState(false);
  const [signInData, setSignInData] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockTimer, setLockTimer] = useState(0);
  const [lastAttemptTime, setLastAttemptTime] = useState(null);
  const navigate = useNavigate();

  const handleSignInClick = () => setIsRightPanelActive(false);

  const handleSignInChange = (e) => {
    const { name, value } = e.target;
    setSignInData({ ...signInData, [name]: value });
    setError(""); // Clear error when user types
  };

  // Function to generate log ID
  const generateLogId = () => {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const year = String(today.getFullYear()).slice(-2);
    const randomLetter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
    return `LOG${month}${day}${year}${randomLetter}`;
  };

  // Function to create log entry
  const createUserLog = async (log) => {
    await addUserLog(log);
  };

  const handleSignInSubmit = async (event) => {
    event.preventDefault();

    if (isLocked) {
      setError(`Account locked. Please wait ${Math.floor(lockTimer / 60)}:${(lockTimer % 60).toString().padStart(2, '0')} minutes`);
      return;
    }

    try {
      const users = await getUsers();
      const userExists = users.some(u => u.username === signInData.username);
      const user = users.find(u => 
        u.username === signInData.username && 
        u.password === signInData.password
      );

      const logId = generateLogId();

      // Check if account is deactivated
      if (userExists) {
        const userAccount = users.find(u => u.username === signInData.username);
        if (userAccount.status === 'Deactivated') {
          setError("Account has been deactivated. Please contact administrator.");
          return;
        }
      }

      if (!userExists) {
        await createUserLog({
          log_id: logId,
          username: "Invalid Username",
          action: "Login Attempt",
          date: new Date().toISOString().split('T')[0],
          time: new Date().toTimeString().split(' ')[0]
        });
        setLoginAttempts(prev => prev + 1);
        setError("Invalid username or password");
      } else if (!user) {
        await createUserLog({
          log_id: logId,
          username: signInData.username,
          action: "Login Attempt",
          date: new Date().toISOString().split('T')[0],
          time: new Date().toTimeString().split(' ')[0]
        });
        setLoginAttempts(prev => prev + 1);
        setError("Invalid username or password");
      } else {
        // Successful login
        setLoginAttempts(0);
        await createUserLog({
          log_id: logId,
          username: signInData.username,
          action: "Logged In",
          date: new Date().toISOString().split('T')[0],
          time: new Date().toTimeString().split(' ')[0]
        });
        
        // Store user info and log_id in session
        sessionStorage.setItem('user', JSON.stringify({
          ...user,
          log_id: logId
        }));
        
        navigate("/dashboard");
        return;
      }

      // Handle login attempts consequences
      if (loginAttempts + 1 >= 5) {
        if (userExists) {
          // Deactivate account
          await handleAccountDeactivation(signInData.username);
          setError("Account has been deactivated due to multiple failed attempts.");
          handleTemporaryLockout(300); // 5 minutes
        } else {
          // Longer timeout for non-existent accounts
          setError(`Locked locked for 8 minutes due to multiple failed attempts.`);
          handleTemporaryLockout(480); // 8 minutes
        }
      } else if (loginAttempts + 1 >= 3) {
        // Temporary timeout after 3 attempts
        setError(`Locked for 2 minutes due to multiple failed attempts.`);
        handleTemporaryLockout(120); // 2 minutes
      }

    } catch (error) {
      console.error("Sign In Error:", error);
      setError("Sign In Failed: " + error.message);
    }
  };

  // Effect to handle the countdown timer
  useEffect(() => {
    let interval;
    if (isLocked && lockTimer > 0) {
      interval = setInterval(() => {
        setLockTimer((prev) => prev - 1);
      }, 1000);
    } else if (lockTimer === 0) {
      setIsLocked(false);
    }
    return () => clearInterval(interval);
  }, [isLocked, lockTimer]);

  // Function to handle temporary lockout
  const handleTemporaryLockout = (duration) => {
    setIsLocked(true);
    setLockTimer(duration);
  };

  // Function to handle account deactivation
  const handleAccountDeactivation = async (username) => {
    try {
      const users = await getUsers();
      const user = users.find(u => u.username === username);
      if (user) {
        await updateUser(user.id, { ...user, status: 'Deactivated' });
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error deactivating account:", error);
      return false;
    }
  };

  return (
    <div className="page-container">
      <div className={`container ${isRightPanelActive ? "right-panel-active" : ""}`} id="container">
        <div className="form-container sign-in-container">
          <form onSubmit={handleSignInSubmit}>
            <h1>Sign in</h1>
            <div className="infield">
              <input
                type="text"
                placeholder="Username"
                name="username"
                value={signInData.username}
                onChange={handleSignInChange}
                disabled={isLocked}
                required
              />
            </div>
            <div className="infield">
              <input
                type="password"
                placeholder="Password"
                name="password"
                value={signInData.password}
                onChange={handleSignInChange}
                disabled={isLocked}
                required
              />
            </div>
            {error && <div className="error-message">{error}</div>}
            <button type="submit">Sign In</button>
          </form>
        </div>
        <div className="overlay-container">
          <div className="overlay">
            <div className="overlay-panel overlay-left">
              <h1>Welcome Back!</h1>
              <p>To keep connected with us please login with your personal info</p>
              <button className="ghost" onClick={handleSignInClick}>Sign In</button>
            </div>
            <div className="overlay-panel overlay-right">
              <h1>Welcome to CAMPUSFIT!</h1>
              <p>Get started by entering your details and make the most of our service.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignInUpPage;
