import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { EventProvider } from './context/EventContext'
import { NotificationProvider } from './context/NotificationContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <EventProvider>
          <NotificationProvider>
            <App />
          </NotificationProvider>
        </EventProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
)
