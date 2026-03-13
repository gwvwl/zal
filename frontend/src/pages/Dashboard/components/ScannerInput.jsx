import { useEffect, useRef } from 'react'
import { useDispatch } from 'react-redux'
import { fetchClientByCode } from '../../../store/slices/clientsSlice.js'
import styles from '../../../styles/dashboard.module.css'

export default function ScannerInput({ onClientSelect }) {
  const dispatch = useDispatch()
  const bufferRef = useRef('')
  const lastKeyTime = useRef(0)

  useEffect(() => {
    function handleKey(e) {
      const tag = document.activeElement?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return

      const now = Date.now()
      const delta = now - lastKeyTime.current
      lastKeyTime.current = now

      if (e.key === 'Enter') {
        const code = bufferRef.current.trim()
        bufferRef.current = ''
        if (code.length > 3) {
          handleScannedCode(code)
        }
        return
      }

      if (delta > 100 && bufferRef.current.length > 0) {
        bufferRef.current = ''
      }

      if (e.key.length === 1) {
        bufferRef.current += e.key
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  async function handleScannedCode(code) {
    const result = await dispatch(fetchClientByCode(code))
    if (fetchClientByCode.fulfilled.match(result)) {
      onClientSelect && onClientSelect(result.payload.id)
    } else {
      alert(result.payload || `Клієнта з кодом "${code}" не знайдено`)
    }
  }

  return (
    <div className={styles.scanWrapper}>
      <span className={styles.scanIcon}>📷</span>
      <span className={styles.scanAlwaysOn}>Сканер активний</span>
    </div>
  )
}
