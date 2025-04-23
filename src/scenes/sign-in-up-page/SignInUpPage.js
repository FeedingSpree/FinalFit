import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUsers } from "../../services/userService.ts";
import { addUserLog } from "../../services/userLogsService.ts";
import "./style.css";

function SignInUpPage() {
  const [isRightPanelActive, setIsRightPanelActive] = useState(false);
  const [signInData, setSignInData] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
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
    try {
      const users = await getUsers();
      const userExists = users.some(u => u.username === signInData.username);
      const user = users.find(u => 
        u.username === signInData.username && 
        u.password === signInData.password
      );

      // Generate log ID first - will be used for the entire session
      const logId = generateLogId();

      if (!userExists) {
        // Log invalid username attempt
        await createUserLog({
          log_id: logId,
          username: "Invalid Username",
          action: "Login Attempt",
          date: new Date().toISOString().split('T')[0],
          time: new Date().toTimeString().split(' ')[0]
        });
        setError("Invalid username or password");
      } else if (!user) {
        // Log failed login attempt
        await createUserLog({
          log_id: logId,
          username: signInData.username,
          action: "Login Attempt",
          date: new Date().toISOString().split('T')[0],
          time: new Date().toTimeString().split(' ')[0]
        });
        setError("Invalid username or password");
      } else {
        // Log successful login
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
      }
    } catch (error) {
      console.error("Sign In Error:", error);
      setError("Sign In Failed: " + error.message);
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
