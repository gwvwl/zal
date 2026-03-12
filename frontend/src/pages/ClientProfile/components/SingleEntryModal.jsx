import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { singleEntryThunk } from '../../../store/slices/gymSlice.js'
import styles from '../../../styles/clientProfile.module.css'

export default function SingleEntryModal({ clientId, clientData, onClose, onSuccess }) {
  const dispatch = useDispatch()
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('cash')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    if (!amount || Number(amount) <= 0) {
      setError('Введіть суму більше 0')
      return
    }
    setLoading(true)
    const result = await dispatch(singleEntryThunk({ clientId, amount: Number(amount), method, clientData }))
    if (singleEntryThunk.fulfilled.match(result)) {
      onSuccess?.()
      onClose()
    } else {
      setError(result.payload || 'Помилка разового входу')
    }
    setLoading(false)
  }

  return (
    <div className={styles.subModalOverlay} onClick={e => { e.stopPropagation(); onClose() }}>
      <div className={`${styles.subModal} ${styles.subModalSm}`} onClick={e => e.stopPropagation()}>
        <div className={styles.subModalHeader}>
          <h2 className={styles.subModalTitle}>Разовий вхід</h2>
          <button className={styles.subModalClose} onClick={onClose}>✕</button>
        </div>

        <div className={styles.subModalBody}>
          <div className={styles.subModalField}>
            <label className={styles.subModalLabel}>Сума (грн)</label>
            <input
              className={styles.subModalInput}
              type="number"
              min="1"
              placeholder="0"
              value={amount}
              onChange={e => { setAmount(e.target.value); setError('') }}
              autoFocus
            />
          </div>
          <div className={styles.subModalField}>
            <label className={styles.subModalLabel}>Спосіб оплати</label>
            <div className={styles.methodToggle}>
              <button
                className={`${styles.methodBtn} ${method === 'cash' ? styles.methodBtnActive : ''}`}
                onClick={() => setMethod('cash')}
                type="button"
              >
                Готівка
              </button>
              <button
                className={`${styles.methodBtn} ${method === 'card' ? styles.methodBtnActive : ''}`}
                onClick={() => setMethod('card')}
                type="button"
              >
                Картка
              </button>
            </div>
          </div>
          {error && <span className={styles.subModalError}>{error}</span>}
        </div>

        <div className={styles.subModalFooter}>
          <button className={styles.subModalCancel} onClick={onClose}>Скасувати</button>
          <button className={styles.subModalSubmit} onClick={handleSubmit} disabled={loading}>
            {loading ? 'Зачекайте...' : 'Підтвердити вхід'}
          </button>
        </div>
      </div>
    </div>
  )
}
