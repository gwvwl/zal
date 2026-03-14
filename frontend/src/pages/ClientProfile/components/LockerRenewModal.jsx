import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { renewLockerThunk, dismissLockerThunk, fetchPresets } from '../../../store/slices/subscriptionsSlice.js'
import { createPaymentThunk } from '../../../store/slices/paymentsSlice.js'
import styles from '../../../styles/clientProfile.module.css'


export default function LockerRenewModal({ clientId, expiredSub, onClose, onSuccess }) {
  const dispatch = useDispatch()
  const presets = useSelector(state => state.subscriptions.presets)

  // Find preset matching this locker by label, fallback to any locker preset
  const matchedPreset = presets.find(p => p.category === 'locker' && p.label === expiredSub?.label)
    ?? presets.find(p => p.category === 'locker')

  const [startDate, setStartDate] = useState(expiredSub?.end_date?.split('T')[0] || new Date().toISOString().split('T')[0])
  const [price, setPrice] = useState(expiredSub?.price ?? 0)

  useEffect(() => {
    if (presets.length === 0) dispatch(fetchPresets())
  }, [dispatch, presets.length])

  useEffect(() => {
    if (matchedPreset) setPrice(matchedPreset.price)
  }, [matchedPreset?.id])
  const [method, setMethod] = useState('cash')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handlePay() {
    if (!startDate) { setError('Вкажіть дату початку'); return }
    if (!matchedPreset && !expiredSub) { setError('Не вдалося визначити пресет ящика'); return }
    setLoading(true)
    setError('')

    const preset = matchedPreset
    const subResult = await dispatch(renewLockerThunk({
      clientId,
      type: preset?.type ?? 'unlimited',
      category: 'locker',
      label: expiredSub.label,
      price: Number(price),
      durationDays: preset?.duration_days ?? 30,
      startDate,
    }))
    if (renewLockerThunk.rejected.match(subResult)) {
      setError(subResult.payload || 'Помилка збереження')
      setLoading(false)
      return
    }

    const payResult = await dispatch(createPaymentThunk({
      clientId,
      subscriptionId: subResult.payload?.id || null,
      amount: Number(price),
      type: 'locker',
      label: expiredSub.label,
      method,
    }))
    if (createPaymentThunk.rejected.match(payResult)) {
      setError(payResult.payload || 'Помилка платежу')
      setLoading(false)
      return
    }

    onSuccess && onSuccess()
    onClose()
  }

  async function handleDismiss() {
    setLoading(true)
    setError('')
    const result = await dispatch(dismissLockerThunk(expiredSub.id))
    if (dismissLockerThunk.rejected.match(result)) {
      setError(result.payload || 'Помилка')
      setLoading(false)
      return
    }
    onSuccess && onSuccess()
    onClose()
  }

  return (
    <div className={styles.subModalOverlay} onClick={e => { e.stopPropagation(); onClose() }}>
      <div className={`${styles.subModal} ${styles.subModalSm}`} onClick={e => e.stopPropagation()}>
        <div className={styles.subModalHeader}>
          <h2 className={styles.subModalTitle}>🔐 {expiredSub?.label}</h2>
          <button className={styles.subModalClose} onClick={onClose}>✕</button>
        </div>

        <div className={styles.subModalBody}>
          <div style={{ fontSize: 13, color: 'var(--gray-500)', background: 'var(--warning-light)', borderRadius: 8, padding: '10px 14px' }}>
            Прострочений з {new Date(expiredSub.end_date).toLocaleDateString('uk-UA')}
          </div>

          <div className={styles.subModalField}>
            <label className={styles.subModalLabel}>Дата початку нового терміну</label>
            <input
              className={styles.subModalInput}
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
            />
          </div>

          <div className={styles.subModalField}>
            <label className={styles.subModalLabel}>Ціна (грн)</label>
            <input
              className={styles.subModalInput}
              type="number"
              min="0"
              value={price}
              onChange={e => setPrice(e.target.value)}
            />
          </div>

          <div className={styles.subModalField}>
            <label className={styles.subModalLabel}>Спосіб оплати</label>
            <div className={styles.subMethodToggle}>
              <button
                className={`${styles.subMethodBtn} ${method === 'cash' ? styles.subMethodBtnActive : ''}`}
                onClick={() => setMethod('cash')}
              >
                💵 Готівка
              </button>
              <button
                className={`${styles.subMethodBtn} ${method === 'card' ? styles.subMethodBtnActive : ''}`}
                onClick={() => setMethod('card')}
              >
                💳 Картка
              </button>
            </div>
          </div>

          {error && <span className={styles.subModalError}>{error}</span>}
        </div>

        <div className={styles.subModalFooter}>
          <button
            className={styles.subModalCancel}
            onClick={handleDismiss}
            disabled={loading}
            style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
          >
            Відв'язати
          </button>
          <button className={styles.subModalSubmit} onClick={handlePay} disabled={loading}>
            {loading ? 'Зачекайте...' : `✅ Оплатити ${price} грн`}
          </button>
        </div>
      </div>
    </div>
  )
}
