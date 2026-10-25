import React from 'react';
import ReactDOM from 'react-dom/client';
import { I18nProvider } from '@/i18n';
import App from './App.tsx';
import { followSystemTheme } from '@/utils/theme';
import '@/styles/globals.css';

followSystemTheme();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <I18nProvider>
      <App />
    </I18nProvider>
  </React.StrictMode>
);
