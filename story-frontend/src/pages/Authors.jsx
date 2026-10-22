import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import "./authors.css";

export default function Authors() {
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const controller = new AbortController();

    const fetchAuthors = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/api/users?has_book=true",
          { signal: controller.signal }
        );

        setAuthors(response.data);
        setLoading(false); 
      } catch (err) {
        if (err.name !== "CanceledError") {
          setError("Yazarlar yüklenirken bir hata oluştu.");
          setLoading(false); 
          console.error(err);
        }
      }
    };

    fetchAuthors();

    return () => controller.abort();
  }, []);

  
  if (loading) {
    return (
      <div className="authors-page">
        <div className="authors-container">
          <h2 className="authors-title">Yazarlar</h2>
          <div className="authors-grid">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={n} className="author-card skeleton-card">
                <div className="skeleton-text"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  
  if (error) {
    return (
      <div className="authors-page">
        <div className="authors-error">
          {error}
        </div>
      </div>
    );
  }

  
  if (!loading && authors.length === 0) {
    return (
      <div className="authors-page">
        <div className="authors-loading">
          Henüz yazar bulunamadı.
        </div>
      </div>
    );
  }

  
  return (
    <div className="authors-page">
      <div className="authors-container">
        <h2 className="authors-title">Yazarlar</h2>

        <div className="authors-grid">
          {authors.map((author) => (
            <div
              key={author.id}
              className="author-card"
              onClick={() => navigate(`/author/${author.id}`)}
            >
              <h3 className="author-name">
                {author.username || "Bilinmeyen Kullanıcı"}
              </h3>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}