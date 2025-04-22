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
  const createUserLog = async (username, action) => {
    const log = {
      log_id: generateLogId(),
      username: username,
      action: action,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().split(' ')[0]
    };
    await addUserLog(log);
  };

  const handleSignInSubmit = async (event) => {
    event.preventDefault();
    try {
      const users = await getUsers();
      const user = users.find(
        (u) => 
          u.username === signInData.username && 
          u.password === signInData.password
      );

      if (user) {
        // Generate log ID
        const logId = generateLogId();
        
        // Log successful login
        await createUserLog(signInData.username, "Logged In");
        
        // Store user info and log_id
        sessionStorage.setItem('user', JSON.stringify({
          ...user,
          log_id: logId
        }));
        
        navigate("/dashboard");
      } else {
        // Log failed login attempt
        await createUserLog(signInData.username, "Login Attempt");
        setError("Invalid username or password");
      }
    } catch (error) {
      // Log error during login
      await createUserLog(signInData.username, "Login Attempt");
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
