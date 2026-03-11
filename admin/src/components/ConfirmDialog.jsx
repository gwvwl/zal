import { useState, useCallback, createContext, useContext } from 'react'
import styles from '../styles/confirm.module.css'

const ConfirmContext = createContext(null)

export function useConfirm() {
  return useContext(ConfirmContext)
}

export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null)

  const confirm = useCallback((message) => {
    return new Promise((resolve) => {
      setState({ message, resolve })
    })
  }, [])

  function handleYes() {
    state?.resolve(true)
    setState(null)
  }

  function handleNo() {
    state?.resolve(false)
    setState(null)
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state && (
        <div className={styles.overlay} onClick={handleNo}>
          <div className={styles.dialog} onClick={e => e.stopPropagation()}>
            <p className={styles.message}>{state.message}</p>
            <div className={styles.actions}>
              <button className={styles.cancelBtn} onClick={handleNo}>Скасувати</button>
              <button className={styles.confirmBtn} onClick={handleYes}>Підтвердити</button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}
