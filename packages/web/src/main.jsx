import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './styles/index.css'

// Initialize Mixpanel early
import mixpanelService from './services/mixpanelService'
mixpanelService.init()

// Initialize auth state
import { useAuthStore } from './store/authStore'
useAuthStore.getState().initialize()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <App />
        <Toaster
          position="bottom-right"
          reverseOrder={false}
          gutter={8}
          toastOptions={{
            duration: 3000,
            style: {
              background: '#1e293b',
              color: '#f1f5f9',
              borderRadius: '8px',
              border: '1px solid #475569'
            }
          }}
        />
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>,
)

