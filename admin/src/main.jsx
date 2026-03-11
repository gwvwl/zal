import { createRoot } from 'react-dom/client'
import { ToastProvider } from './components/Toast.jsx'
import { ConfirmProvider } from './components/ConfirmDialog.jsx'
import App from './App.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <ToastProvider>
    <ConfirmProvider>
      <App />
    </ConfirmProvider>
  </ToastProvider>
)
