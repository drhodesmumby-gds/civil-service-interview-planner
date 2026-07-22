import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import 'govuk-frontend/dist/govuk/govuk-frontend.min.css';
import '@ministryofjustice/frontend/moj/moj-frontend.min.css';
import '@uiw/react-md-editor/markdown-editor.css';
import { initAll } from 'govuk-frontend';

// Initialize GOV.UK Frontend JavaScript components
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    initAll();
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);