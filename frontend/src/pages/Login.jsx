
import { useState } from "react";
import { Sparkles, Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import API_BASE_URL from "../config";



function Login({ onLogin }) {
  const [isSignup, setIsSignup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (isSignup && name.trim().length < 2) {
      setError("Please enter your full name.");
      return;
    }

    if (!email.trim() || !password) {
      setError("Please fill in all required fields.");
      return;
    }

    if (isSignup && password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    setIsLoading(true);

    try {
      const endpoint = isSignup ? "signup" : "login";

      const response = await fetch(
        `${API_BASE_URL}/api/auth/${endpoint}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(
            isSignup
              ? {
                  name: name.trim(),
                  email: email.trim(),
                  password,
                }
              : {
                  email: email.trim(),
                  password,
                }
          ),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.detail || "Authentication failed."
        );
      }

      if (isSignup) {
        setSuccess("Account created successfully! Logging you in...");
      }

      if (typeof onLogin === "function") {
        onLogin(result);
      }
    } catch (err) {
      setError(
        err.message || "Could not connect to the server."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">

        <div className="auth-brand">
          <div className="auth-brand-icon">
            <Sparkles size={26} />
          </div>

          <h1>DocuMind</h1>

          <p>DOCUMENT INTELLIGENCE</p>
        </div>

        <div className="auth-heading">
          <h2>
            {isSignup
              ? "Create your account"
              : "Welcome back!"}
          </h2>

          <p>
            {isSignup
              ? "Start managing your documents intelligently."
              : "Sign in to continue to your workspace."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">

          {isSignup && (
            <div className="auth-field">
              <label>Full Name</label>

              <div className="auth-input-wrapper">
                <User size={18} />

                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  required
                  minLength={2}
                  maxLength={100}
                />
              </div>
            </div>
          )}

          <div className="auth-field">
            <label>Email Address</label>

            <div className="auth-input-wrapper">
              <Mail size={18} />

              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="auth-field">
            <label>Password</label>

            <div className="auth-input-wrapper">
              <Lock size={18} />

              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={
                  isSignup ? "new-password" : "current-password"
                }
                minLength={isSignup ? 8 : undefined}
                maxLength={128}
                required
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={
                  showPassword ? "Hide password" : "Show password"
                }
              >
                {showPassword
                  ? <EyeOff size={18} />
                  : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}

          {success && (
            <div className="auth-success">
              {success}
            </div>
          )}

          <button
            type="submit"
            className="auth-submit-button"
            disabled={isLoading}
          >
            {isLoading
              ? "Please wait..."
              : isSignup
                ? "Create Account"
                : "Sign In"}
          </button>

        </form>

        <div className="auth-switch">
          {isSignup
            ? "Already have an account?"
            : "Don't have an account?"}

          <button
            type="button"
            onClick={() => {
              setIsSignup(!isSignup);
              setError("");
              setSuccess("");
            }}
          >
            {isSignup ? "Sign In" : "Sign Up"}
          </button>
        </div>

        <p className="auth-footer">
          Your documents. Your workspace. Your intelligence.
        </p>

      </div>
    </div>
  );
}

export default Login;
