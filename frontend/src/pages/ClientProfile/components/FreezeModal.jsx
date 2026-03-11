import { useState } from 'react'
import $api from '../../../api/http.js'
import styles from '../../../styles/clientProfile.module.css'

function addDays(dateStr, days) {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

const today = new Date().toISOString().split('T')[0]

export default function FreezeModal({ subscriptionId, onClose }) {
  const [frozenTo, setFrozenTo] = useState(addDays(today, 7))
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    if (frozenTo <= today) {
      setError('Дата кінця має бути пізніше сьогодні')
      return
    }
    setLoading(true)
    try {
      await $api.patch(`/subscriptions/${subscriptionId}/freeze`, { frozenTo })
      onClose()
    } catch (err) {
      setError(err.response?.data?.error || 'Помилка заморозки')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.subModalOverlay} onClick={e => { e.stopPropagation(); onClose() }}>
      <div className={`${styles.subModal} ${styles.subModalSm}`} onClick={e => e.stopPropagation()}>
        <div className={styles.subModalHeader}>
          <h2 className={styles.subModalTitle}>Заморозка абонементу</h2>
          <button className={styles.subModalClose} onClick={onClose}>✕</button>
        </div>

        <div className={styles.subModalBody}>
          <p className={styles.subModalHint}>Заморозка починається з сьогодні. При розморозці дні, що залишилися, будуть додані до кінця абонементу.</p>
          <div className={styles.subModalField}>
            <label className={styles.subModalLabel}>Заморозити до</label>
            <input
              className={styles.subModalInput}
              type="date"
              value={frozenTo}
              min={addDays(today, 1)}
              onChange={e => { setFrozenTo(e.target.value); setError('') }}
            />
          </div>
          {error && <span className={styles.subModalError}>{error}</span>}
        </div>

        <div className={styles.subModalFooter}>
          <button className={styles.subModalCancel} onClick={onClose}>Скасувати</button>
          <button className={styles.subModalSubmit} onClick={handleSubmit} disabled={loading}>
            {loading ? 'Зачекайте...' : 'Заморозити'}
          </button>
        </div>
      </div>
    </div>
  )
}
