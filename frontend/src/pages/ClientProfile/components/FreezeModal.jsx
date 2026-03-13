import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { freezeSubscriptionThunk } from '../../../store/slices/subscriptionsSlice.js'
import styles from '../../../styles/clientProfile.module.css'

function addDays(dateStr, days) {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

const today = new Date().toISOString().split('T')[0]

export default function FreezeModal({ subscriptionId, onClose }) {
  const dispatch = useDispatch()
  const [frozenFrom, setFrozenFrom] = useState(today)
  const [frozenTo, setFrozenTo] = useState(addDays(today, 7))
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    if (!frozenFrom) {
      setError('Вкажіть дату початку заморозки')
      return
    }
    if (frozenTo && frozenTo <= frozenFrom) {
      setError('Дата кінця має бути пізніше дати початку')
      return
    }
    setLoading(true)
    const result = await dispatch(freezeSubscriptionThunk({ subscriptionId, frozenFrom, frozenTo: frozenTo || undefined }))
    if (freezeSubscriptionThunk.fulfilled.match(result)) {
      onClose()
    } else {
      setError(result.payload || 'Помилка заморозки')
    }
    setLoading(false)
  }

  return (
    <div className={styles.subModalOverlay} onClick={e => { e.stopPropagation(); onClose() }}>
      <div className={`${styles.subModal} ${styles.subModalSm}`} onClick={e => e.stopPropagation()}>
        <div className={styles.subModalHeader}>
          <h2 className={styles.subModalTitle}>Заморозка абонементу</h2>
          <button className={styles.subModalClose} onClick={onClose}>✕</button>
        </div>

        <div className={styles.subModalBody}>
          <p className={styles.subModalHint}>При розморозці дні заморозки будуть додані до кінця абонементу.</p>

          <div className={styles.subModalField}>
            <label className={styles.subModalLabel}>Заморозити з</label>
            <input
              className={styles.subModalInput}
              type="date"
              value={frozenFrom}
              onChange={e => { setFrozenFrom(e.target.value); setError('') }}
            />
          </div>

          <div className={styles.subModalField}>
            <label className={styles.subModalLabel}>Заморозити до (необов'язково)</label>
            <input
              className={styles.subModalInput}
              type="date"
              value={frozenTo}
              min={addDays(frozenFrom || today, 1)}
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
