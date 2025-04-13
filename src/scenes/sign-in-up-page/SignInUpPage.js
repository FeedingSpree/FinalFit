import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../../firebase.tsx"; // adjust the path as needed
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import "./style.css";

function SignInUpPage() {
  const [isRightPanelActive, setIsRightPanelActive] = useState(false);
  const [signInData, setSignInData] = useState({ email: "", password: "" });
  const [signUpData, setSignUpData] = useState({ name: "", email: "", password: "" });
  const navigate = useNavigate();

  const handleSignInClick = () => setIsRightPanelActive(false);
  const handleSignUpClick = () => setIsRightPanelActive(true);

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

  const handleSignUpSubmit = async (event) => {
    event.preventDefault();
    try {
      await createUserWithEmailAndPassword(auth, signUpData.email, signUpData.password);
      alert("Account created! You can now sign in.");
      setIsRightPanelActive(false);
    } catch (error) {
      alert("Sign Up Failed: " + error.message);
    }
  };

  return (
    <div className="page-container">
      <div className={`container ${isRightPanelActive ? "right-panel-active" : ""}`} id="container">
        <div className="form-container sign-in-container">
          <form onSubmit={handleSignInSubmit}>
            <h1>Sign in</h1>
            <div className="social-container">
              <a href="#" className="social"><i className="fab fa-facebook-f"></i></a>
              <a href="#" className="social"><i className="fab fa-google-plus-g"></i></a>
              <a href="#" className="social"><i className="fab fa-linkedin-in"></i></a>
            </div>
            <span>or use your account</span>
            <div className="infield">
              <input
                type="email"
                placeholder="Email"
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
            <a href="#" className="forgot">Forgot your password?</a>
            <button type="submit">Sign In</button>
          </form>
        </div>

        <div className="form-container sign-up-container">
          <form onSubmit={handleSignUpSubmit}>
            <h1>Create Account</h1>
            <div className="social-container">
              <a href="#" className="social"><i className="fab fa-facebook-f"></i></a>
              <a href="#" className="social"><i className="fab fa-google-plus-g"></i></a>
              <a href="#" className="social"><i className="fab fa-linkedin-in"></i></a>
            </div>
            <span>or use your email for registration</span>
            <div className="infield">
              <input
                type="text"
                placeholder="Name"
                name="name"
                value={signUpData.name}
                onChange={handleSignUpChange}
                required
              />
            </div>
            <div className="infield">
              <input
                type="email"
                placeholder="Email"
                name="email"
                value={signUpData.email}
                onChange={handleSignUpChange}
                required
              />
            </div>
            <div className="infield">
              <input
                type="password"
                placeholder="Password"
                name="password"
                value={signUpData.password}
                onChange={handleSignUpChange}
                required
              />
            </div>
            <button type="submit">Sign Up</button>
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
              <h1>Hello, Friend!</h1>
              <p>Enter your personal details and start your journey with us</p>
              <button className="ghost" onClick={handleSignUpClick}>Sign Up</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignInUpPage;
