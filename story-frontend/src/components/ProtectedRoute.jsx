import { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext.jsx";

export default function ProtectedRoute({ children }) {
  const { user } = useContext(AuthContext);
  const location = useLocation();

  if (!user) {
    const isReading = location.pathname.includes("/read/");
    const isWriting =
      location.pathname.includes("/add-book") ||
      location.pathname.includes("/add-chapter") ||
      location.pathname.includes("/edit-chapter");

    const message = isReading
      ? "Kitabı okuyabilmek için giriş yapmanız lazım."
      : isWriting
      ? "Kitap yazabilmek için giriş yapmanız lazım."
      : "Bu sayfaya erişebilmek için giriş yapmanız lazım.";

    return (
      <Navigate
        to="/login"
        state={{ from: location.pathname, message }}
        replace
      />
    );
  }

  return children;
}
