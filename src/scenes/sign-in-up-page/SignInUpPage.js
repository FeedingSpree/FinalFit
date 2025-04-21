import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUsers } from "../../services/userService.ts";
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
        // Store user info in sessionStorage or context if needed
        sessionStorage.setItem('user', JSON.stringify(user));
        navigate("/dashboard");
      } else {
        setError("Invalid username or password");
      }
    } catch (error) {
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
