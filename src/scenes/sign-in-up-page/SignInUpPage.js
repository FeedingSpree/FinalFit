import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../../firebase.tsx"; // adjust the path as needed
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import "./style.css";
import Logo from "../../assets/campusfit_logo.png";  // Update path to src/assets

function SignInUpPage() {
  const [isRightPanelActive, setIsRightPanelActive] = useState(false);
  const [signInData, setSignInData] = useState({ email: "", password: "" });
  const [signUpData, setSignUpData] = useState({ name: "", email: "", password: "" });
  const navigate = useNavigate();

  const handleSignInClick = () => setIsRightPanelActive(false);

  const handleSignInChange = (e) => {
    const { name, value } = e.target;
    setSignInData({ ...signInData, [name]: value });
  };

  const handleSignUpChange = (e) => {
    const { name, value } = e.target;
    setSignUpData({ ...signUpData, [name]: value });
  };

  const handleSignInSubmit = async (event) => {
    event.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, signInData.email, signInData.password);
      navigate("/dashboard");
    } catch (error) {
      alert("Sign In Failed: " + error.message);
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
                type="email"
                placeholder="Username"
                name="email"
                value={signInData.email}
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
