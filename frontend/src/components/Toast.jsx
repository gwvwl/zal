import { useState, useEffect, useCallback, createContext, useContext } from 'react'
import styles from '../styles/toast.module.css'

const ToastContext = createContext(null)

export function useToast() {
  return useContext(ToastContext)
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'error') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }, [])

  const toast = useCallback((message) => addToast(message, 'error'), [addToast])
  toast.success = useCallback((message) => addToast(message, 'success'), [addToast])
  toast.error = useCallback((message) => addToast(message, 'error'), [addToast])

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className={styles.container}>
        {toasts.map(t => (
          <div key={t.id} className={`${styles.toast} ${t.type === 'success' ? styles.success : styles.error}`}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
