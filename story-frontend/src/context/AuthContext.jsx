import { createContext, useState, useCallback } from "react";
import AuthPromptModal from "../components/AuthPromptModal";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || null;
    } catch {
      return null;
    }
  });

  const [promptState, setPromptState] = useState({
    isOpen: false,
    type: "read", // "read" | "write"
    title: "",
    message: "",
    targetPath: "",
  });

  const login = (data) => {
    setUser(data);
    localStorage.setItem("user", JSON.stringify(data));
  };

  const register = (data) => {
    setUser(data);
    localStorage.setItem("user", JSON.stringify(data));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  /**
   * Giriş kontrolü yapar.
   * Kullanıcı giriş yapmamışsa uyarı modalını açar.
   * Kullanıcı giriş yapmışsa verilen callback fonksiyonunu çalıştırır.
   * @param {Object} options - { type: 'read' | 'write', title, message, targetPath, onAuthorized }
   * @returns {boolean} Kullanıcının oturum açıp açmadığı
   */
  const requireAuth = useCallback(
    ({ type = "read", title, message, targetPath, onAuthorized }) => {
      if (user) {
        if (typeof onAuthorized === "function") {
          onAuthorized();
        }
        return true;
      }

      setPromptState({
        isOpen: true,
        type,
        title,
        message,
        targetPath: targetPath || (typeof window !== "undefined" ? window.location.pathname : "/"),
      });
      return false;
    },
    [user]
  );

  const closeAuthPrompt = useCallback(() => {
    setPromptState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        requireAuth,
        closeAuthPrompt,
      }}
    >
      {children}
      <AuthPromptModal
        isOpen={promptState.isOpen}
        onClose={closeAuthPrompt}
        type={promptState.type}
        title={promptState.title}
        message={promptState.message}
        targetPath={promptState.targetPath}
      />
    </AuthContext.Provider>
  );
};
