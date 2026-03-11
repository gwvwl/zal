import { useState, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { searchClients, clearSearch } from '../../../store/slices/clientsSlice.js'
import styles from '../../../styles/dashboard.module.css'

export default function SearchModal({ onClose, onClientSelect }) {
  const dispatch = useDispatch()
  const results = useSelector(state => state.clients.searchResults)
  const loading = useSelector(state => state.clients.searchLoading)
  const [query, setQuery] = useState('')
  const timerRef = useRef(null)

  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      dispatch(clearSearch())
      return
    }
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      dispatch(searchClients(q))
    }, 300)
    return () => clearTimeout(timerRef.current)
  }, [query, dispatch])

  function handleSelect(client) {
    onClientSelect(client.id)
  }

  return (
    <div className={styles.smOverlay} onClick={onClose}>
      <div className={styles.smModal} onClick={e => e.stopPropagation()}>
        <div className={styles.smHeader}>
          <h2 className={styles.smTitle}>🔍 Пошук клієнта</h2>
          <button className={styles.smCloseBtn} onClick={onClose}>✕</button>
        </div>

        <input
          className={styles.smInput}
          type="text"
          placeholder="Введіть прізвище або ім'я..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          autoFocus
        />

        <div className={styles.smResults}>
          {query.trim().length > 0 && query.trim().length < 2 && (
            <p className={styles.smHint}>Введіть мінімум 2 символи</p>
          )}
          {loading && <p className={styles.smHint}>Пошук...</p>}
          {!loading && results.length === 0 && query.trim().length >= 2 && (
            <p className={styles.smHint}>Клієнтів не знайдено</p>
          )}
          {results.map(client => (
            <button
              key={client.id}
              className={styles.smResultItem}
              onClick={() => handleSelect(client)}
            >
              <div className={styles.smAvatar}>
                {client.first_name?.[0]}{client.last_name?.[0]}
              </div>
              <div className={styles.smInfo}>
                <span className={styles.smName}>
                  {client.last_name} {client.first_name} {client.middle_name}
                </span>
                <span className={styles.smMeta}>📞 {client.phone} · #{client.code}</span>
              </div>
              <span className={styles.smArrow}>→</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
