import React from 'react';
import { AnimatePresence } from 'framer-motion';
import Toast from './Toast';

const ToastContainer = ({ toasts, onClose }) => {
  return (
    <div className="toast-viewport">
      <AnimatePresence mode="sync">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            id={toast.id}
            type={toast.type}
            title={toast.title}
            message={toast.message}
            duration={toast.duration}
            onClose={onClose}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ToastContainer;
