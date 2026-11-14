import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  if (!toast) return null;

  const isSuccess = toast.type === 'success';
  const isError = toast.type === 'error';

  return (
    <div className="toast-container" role="status" aria-live="polite">
      <div className={`toast-banner toast-${toast.type || 'info'}`}>
        <div className="toast-icon">
          {isSuccess && <CheckCircle2 size={19} className="toast-icon-svg success" />}
          {isError && <AlertCircle size={19} className="toast-icon-svg error" />}
          {!isSuccess && !isError && <Info size={19} className="toast-icon-svg info" />}
        </div>
        <div className="toast-message">{toast.message}</div>
        <button 
          type="button" 
          className="toast-close" 
          onClick={onClose}
          aria-label="Dismiss notification"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
