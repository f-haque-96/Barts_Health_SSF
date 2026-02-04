import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

// Validate required environment variables at startup
const validateEnvVars = () => {
  // Note: Environment variables are optional in development
  // The app uses mock mode when env vars are not configured
  const envStatus = {
    configured: false,
    warnings: []
  };

  // Check if any Power Automate endpoints are configured
  const endpoints = [
    'VITE_API_SUBMIT_PBP',
    'VITE_API_PBP_DECISION',
    'VITE_API_SUBMIT_FORM',
    'VITE_API_GET_SUBMISSION',
    'VITE_API_PROCUREMENT_DECISION',
    'VITE_API_OPW_DECISION',
    'VITE_API_AP_COMPLETE',
    'VITE_API_UPLOAD_DOCUMENT'
  ];

  const configuredEndpoints = endpoints.filter(key => import.meta.env[key]);

  if (configuredEndpoints.length === 0) {
    // Running in MOCK mode - API endpoints not configured
    envStatus.configured = false;
  } else {
    envStatus.configured = true;
  }

  return envStatus;
};

// Validate environment on startup
validateEnvVars();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found. Cannot initialize application.');
}

createRoot(rootElement).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
