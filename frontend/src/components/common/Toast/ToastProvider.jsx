import React, { useState, useCallback, useRef } from 'react';
import { ToastContext } from './ToastContext';
import ToastContainer from './ToastContainer';
import './toast.css';

const MAX_VISIBLE_TOASTS = 4;
const DUPLICATE_WINDOW_MS = 2000;

const DEFAULT_DURATIONS = {
  success: 3000,
  info: 3000,
  warning: 4000,
  error: 5000,
  validation: 5000,
  loading: Infinity
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const recentToastsRef = useRef([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const showToast = useCallback(({ type = 'success', title, message, duration }) => {
    const effectiveDuration = duration !== undefined ? duration : (DEFAULT_DURATIONS[type] || 3500);
    const key = `${type}:${title || ''}:${message || ''}`;
    const now = Date.now();

    // Prevent identical toast duplicates within 2 seconds
    if (type !== 'loading') {
      const isDuplicate = recentToastsRef.current.some(
        (item) => item.key === key && now - item.timestamp < DUPLICATE_WINDOW_MS
      );
      if (isDuplicate) return;

      recentToastsRef.current.push({ key, timestamp: now });
      recentToastsRef.current = recentToastsRef.current.filter(
        (item) => now - item.timestamp < 5000
      );
    }

    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newToast = { id, type, title, message, duration: effectiveDuration };

    setToasts((prev) => {
      const truncated = prev.length >= MAX_VISIBLE_TOASTS ? prev.slice(prev.length - (MAX_VISIBLE_TOASTS - 1)) : prev;
      return [...truncated, newToast];
    });

    return id;
  }, []);

  const updateToast = useCallback((id, { type, title, message, duration }) => {
    const effectiveDuration = duration !== undefined ? duration : (DEFAULT_DURATIONS[type] || 3500);
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, type, title, message, duration: effectiveDuration } : t))
    );
  }, []);

  // Shorthand helpers
  const success = useCallback((message, title = '✓ Success', options = {}) => {
    return showToast({ type: 'success', title, message, ...options });
  }, [showToast]);

  const error = useCallback((message, title = '✕ Error', options = {}) => {
    return showToast({ type: 'error', title, message, ...options });
  }, [showToast]);

  const warning = useCallback((message, title = '⚠ Warning', options = {}) => {
    return showToast({ type: 'warning', title, message, ...options });
  }, [showToast]);

  const info = useCallback((message, title = 'ℹ Info', options = {}) => {
    return showToast({ type: 'info', title, message, ...options });
  }, [showToast]);

  const validation = useCallback((message, title = '⚠ Validation Error', options = {}) => {
    return showToast({ type: 'validation', title, message, ...options });
  }, [showToast]);

  const loading = useCallback((message = 'Processing request...', title = '⏳ Please wait', options = {}) => {
    return showToast({ type: 'loading', title, message, duration: Infinity, ...options });
  }, [showToast]);

  const promise = useCallback(async (promiseInstance, msgs = {}, options = {}) => {
    const toastId = loading(msgs.loading || 'Processing...', msgs.loadingTitle || '⏳ Processing', options);
    try {
      const result = await promiseInstance;
      updateToast(toastId, {
        type: 'success',
        title: msgs.successTitle || '✓ Success',
        message: typeof msgs.success === 'function' ? msgs.success(result) : (msgs.success || 'Action completed successfully.'),
        duration: DEFAULT_DURATIONS.success
      });
      return result;
    } catch (err) {
      updateToast(toastId, {
        type: 'error',
        title: msgs.errorTitle || '✕ Action Failed',
        message: typeof msgs.error === 'function' ? msgs.error(err) : (msgs.error || err.message || 'An unexpected error occurred.'),
        duration: DEFAULT_DURATIONS.error
      });
      throw err;
    }
  }, [loading, updateToast]);

  const contextValue = {
    showToast,
    success,
    error,
    warning,
    info,
    validation,
    loading,
    promise,
    updateToast,
    removeToast,
    clearAllToasts
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </ToastContext.Provider>
  );
};

export default ToastProvider;
