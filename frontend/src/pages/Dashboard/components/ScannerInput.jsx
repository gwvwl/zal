import { useEffect, useRef, useState } from 'react'
import $api from '../../../api/http.js'
import styles from '../../../styles/dashboard.module.css'

export default function ScannerInput({ onClientSelect }) {
  const [isListening, setIsListening] = useState(false)
  const bufferRef = useRef('')
  const lastKeyTime = useRef(0)

  useEffect(() => {
    function handleF7(e) {
      if (e.key === 'F7') {
        e.preventDefault()
        setIsListening(v => !v)
      }
    }
    window.addEventListener('keydown', handleF7)
    return () => window.removeEventListener('keydown', handleF7)
  }, [])

  useEffect(() => {
    if (!isListening) return

    function handleKey(e) {
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

      bufferRef.current += e.key
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isListening])

  async function handleScannedCode(code) {
    setIsListening(false)
    try {
      const { data } = await $api.get(`/clients/by-code/${encodeURIComponent(code)}`)
      onClientSelect && onClientSelect(data.id)
    } catch (err) {
      const msg = err.response?.data?.error || `Клієнта з кодом "${code}" не знайдено`
      alert(msg)
    }
  }

  return (
    <div className={styles.scanWrapper}>
      <button
        className={`${styles.scanBtn} ${isListening ? styles.scanActive : ''}`}
        onClick={() => setIsListening(v => !v)}
      >
        <span className={styles.scanIcon}>📷</span>
        {isListening ? 'Очікую сканування...' : 'Сканувати карту (F7)'}
      </button>
      {isListening && (
        <div className={styles.scanHint}>
          Підведіть сканер до штрих-коду клієнта
          <button className={styles.scanCancel} onClick={() => setIsListening(false)}>✕ Скасувати</button>
        </div>
      )}
    </div>
  )
}
