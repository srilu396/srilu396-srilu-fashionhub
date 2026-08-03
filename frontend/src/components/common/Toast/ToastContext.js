import { createContext } from 'react';

export const ToastContext = createContext({
  showToast: () => {},
  success: () => {},
  error: () => {},
  warning: () => {},
  info: () => {},
  removeToast: () => {},
  clearAllToasts: () => {}
});
