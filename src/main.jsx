import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { Auth0Provider } from '@auth0/auth0-react'

createRoot(document.getElementById('root')).render(
  <Auth0Provider
      domain={import.meta.env.VITE_AUTH0_DOMAIN || 'dev-vlbhbshl7b1pxe8e.us.auth0.com'}
      clientId={import.meta.env.VITE_AUTH0_CLIENT_ID || 'Crpd23BOSB8wodfqgphMHA16oteWzVK2'}
      authorizationParams={{
        audience: import.meta.env.VITE_AUTH0_AUDIENCE || 'https://dev-vlbhbshl7b1pxe8e.us.auth0.com/api/v2/',
        redirect_uri: window.location.origin
      }}
    >
    <App />
  </Auth0Provider>,
)
