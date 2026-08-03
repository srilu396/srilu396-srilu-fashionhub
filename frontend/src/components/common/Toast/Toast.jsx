import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, Info, CircleAlert, Loader2, X } from 'lucide-react';

const Toast = ({ id, type = 'success', title, message, duration = 3500, onClose }) => {
  const [progress, setProgress] = useState(100);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (isHovered || duration === Infinity) return;

    const intervalTime = 40;
    const decrement = (intervalTime / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= decrement) {
          clearInterval(timer);
          onClose(id);
          return 0;
        }
        return prev - decrement;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [id, duration, isHovered, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={16} />;
      case 'error':
        return <XCircle size={16} />;
      case 'warning':
        return <AlertTriangle size={16} />;
      case 'validation':
        return <CircleAlert size={16} />;
      case 'loading':
        return <Loader2 size={16} className="toast-spin" />;
      case 'info':
      default:
        return <Info size={16} />;
    }
  };

  const getDefaultTitle = () => {
    switch (type) {
      case 'success':
        return 'Success';
      case 'error':
        return 'Action Failed';
      case 'warning':
        return 'Attention Required';
      case 'validation':
        return 'Validation Alert';
      case 'loading':
        return 'Processing...';
      case 'info':
      default:
        return 'Notification';
    }
  };

  const isAlert = type === 'error' || type === 'validation';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 60, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.9, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={`toast-item toast-${type}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role={isAlert ? 'alert' : 'status'}
      aria-live={isAlert ? 'assertive' : 'polite'}
    >
      <div className="toast-icon-wrapper">
        {getIcon()}
      </div>

      <div className="toast-body">
        <span className="toast-title">{title || getDefaultTitle()}</span>
        {message && <span className="toast-message">{message}</span>}
      </div>

      <button
        onClick={() => onClose(id)}
        className="toast-close-btn"
        aria-label="Close notification"
      >
        <X size={15} />
      </button>

      {duration !== Infinity && (
        <div
          className="toast-progress"
          style={{ width: `${progress}%` }}
        />
      )}
    </motion.div>
  );
};

export default Toast;
