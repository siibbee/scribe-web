import { useContext, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { loginUser } from "../services/authService";
import InfoIcon from "@mui/icons-material/InfoOutlined";
import "./auth.css";

export default function Login() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const redirectTarget = location.state?.from || "/";
  const redirectMessage = location.state?.message;

  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await loginUser(
        formData.email,
        formData.password
      );

      login(res.data);
      navigate(redirectTarget);

    } catch (err) {
      console.error(err);
      setError("Email veya şifre hatalı.");
    }

    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-box">

          <h1>Giriş Yap</h1>
          <p>Devam etmek için hesabınıza giriş yapın</p>

          {redirectMessage && (
            <div className="auth-notice-banner">
              <InfoIcon fontSize="small" />
              <span>{redirectMessage}</span>
            </div>
          )}

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="ornek@email.com"
                required
              />
            </div>

            <div className="form-group">
              <label>Şifre</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Şifrenizi girin"
                required
              />
            </div>

            <button 
              type="submit" 
              className="submit-btn"
              disabled={loading}
            >
              {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
            </button>
          </form>

          <p className="auth-footer">
            Hesabınız yok mu?
            <span onClick={() => navigate("/register", { state: { from: redirectTarget } })}>
              Üye Ol
            </span>
          </p>

        </div>
      </div>
    </div>
  );
}
