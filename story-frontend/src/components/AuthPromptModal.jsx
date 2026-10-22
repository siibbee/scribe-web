import React from 'react';
import { useNavigate } from 'react-router-dom';
import BookIcon from '@mui/icons-material/MenuBookRounded';
import EditIcon from '@mui/icons-material/DriveFileRenameOutlineRounded';
import CloseIcon from '@mui/icons-material/Close';
import './authPrompt.css';

export default function AuthPromptModal({ isOpen, onClose, type, title, message, targetPath }) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const isWrite = type === 'write';
  const defaultTitle = isWrite ? 'Kitap Yazmak İçin Giriş Yapın' : 'Kitabı Okumak İçin Giriş Yapın';
  const defaultMessage = isWrite
    ? 'Kendi hikayenizi yazmak ve Scribe topluluğuyla buluşturmak için giriş yapmanız lazım.'
    : 'Bu hikayeyi okumaya devam etmek için giriş yapmanız lazım.';

  const handleLoginClick = () => {
    onClose();
    navigate('/login', { state: { from: targetPath, message: message || defaultMessage } });
  };

  const handleRegisterClick = () => {
    onClose();
    navigate('/register', { state: { from: targetPath } });
  };

  return (
    <div className="apm-backdrop" onClick={onClose}>
      <div className="apm-card" onClick={(e) => e.stopPropagation()}>
        <button className="apm-close-btn" onClick={onClose} aria-label="Kapat">
          <CloseIcon fontSize="small" />
        </button>

        <div className="apm-icon-wrapper">
          {isWrite ? (
            <EditIcon className="apm-icon" />
          ) : (
            <BookIcon className="apm-icon" />
          )}
        </div>

        <h3 className="apm-title">{title || defaultTitle}</h3>
        <p className="apm-message">{message || defaultMessage}</p>

        <div className="apm-actions">
          <button className="apm-btn apm-btn-primary" onClick={handleLoginClick}>
            Giriş Yap
          </button>
          <button className="apm-btn apm-btn-secondary" onClick={handleRegisterClick}>
            Hesap Oluştur
          </button>
          <button className="apm-btn-cancel" onClick={onClose}>
            Şimdilik Vazgeç
          </button>
        </div>
      </div>
    </div>
  );
}
