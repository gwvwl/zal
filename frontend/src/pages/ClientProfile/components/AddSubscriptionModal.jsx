import { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchPresets, createSubscriptionThunk } from '../../../store/slices/subscriptionsSlice.js'
import { createPaymentThunk } from '../../../store/slices/paymentsSlice.js'
import styles from '../../../styles/clientProfile.module.css'

const CATEGORY_LABELS = { gym: 'Спортзал', group: 'Групові заняття' }

export default function AddSubscriptionModal({ clientId, onClose }) {
  const dispatch = useDispatch()
  const presets = useSelector(state => state.subscriptions.presets)

  const [presetIdx, setPresetIdx] = useState(0)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [price, setPrice] = useState(presets[0]?.price ?? 0)
  const [method, setMethod] = useState('cash')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const dropdownRef = useRef(null)
  const preset = presets[presetIdx]

  useEffect(() => {
    dispatch(fetchPresets())
  }, [dispatch])

  useEffect(() => {
    if (presets[presetIdx]) {
      setPrice(presets[presetIdx].price)
    }
  }, [presets, presetIdx])

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    if (dropdownOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [dropdownOpen])

  function handlePresetChange(idx) {
    setPresetIdx(idx)
    setPrice(presets[idx].price)
    setDropdownOpen(false)
  }

  async function handleSubmit() {
    if (!preset) return
    setLoading(true)
    setError('')

    const subResult = await dispatch(createSubscriptionThunk({
      clientId,
      type: preset.type,
      category: preset.category,
      label: preset.label,
      totalVisits: preset.type === 'visits' ? preset.total_visits : null,
      price: Number(price),
      durationDays: preset.duration_days,
    }))
    if (createSubscriptionThunk.rejected.match(subResult)) {
      setError(subResult.payload || 'Помилка збереження')
      setLoading(false)
      return
    }

    const payResult = await dispatch(createPaymentThunk({
      clientId,
      amount: Number(price),
      type: 'subscription',
      label: preset.label,
      method,
    }))
    if (createPaymentThunk.rejected.match(payResult)) {
      setError(payResult.payload || 'Помилка збереження')
      setLoading(false)
      return
    }

    onClose()
  }

  if (!preset) return null

  return (
    <div className={styles.subModalOverlay} onClick={e => { e.stopPropagation(); onClose() }}>
      <div className={styles.subModal} onClick={e => e.stopPropagation()}>
        <div className={styles.subModalHeader}>
          <h2 className={styles.subModalTitle}>Додати абонемент</h2>
          <button className={styles.subModalClose} onClick={onClose}>✕</button>
        </div>

        <div className={styles.subModalBody}>
          <div className={styles.subModalField}>
            <label className={styles.subModalLabel}>Абонемент</label>
            <div className={styles.subDropdown} ref={dropdownRef}>
              <button
                className={styles.subDropdownTrigger}
                onClick={() => setDropdownOpen(v => !v)}
                type="button"
              >
                <span className={styles.subDropdownTriggerLabel}>
                  <span className={styles.subDropdownTriggerCategory}>{CATEGORY_LABELS[preset.category]}</span>
                  {preset.label}
                </span>
                <span className={styles.subDropdownTriggerPrice}>{preset.price} грн</span>
                <span className={`${styles.subDropdownArrow} ${dropdownOpen ? styles.subDropdownArrowOpen : ''}`}>&#x25BE;</span>
              </button>
              {dropdownOpen && (
                <div className={styles.subDropdownMenu}>
                  {presets.map((p, i) => (
                    <button
                      key={i}
                      className={`${styles.subDropdownOption} ${presetIdx === i ? styles.subDropdownOptionActive : ''}`}
                      onClick={() => handlePresetChange(i)}
                      type="button"
                    >
                      <span className={styles.subDropdownOptionLabel}>
                        <span className={styles.subDropdownOptionCategory}>{CATEGORY_LABELS[p.category]}</span>
                        {p.label}
                      </span>
                      <span className={styles.subDropdownOptionPrice}>{p.price} грн</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
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
                Готівка
              </button>
              <button
                className={`${styles.subMethodBtn} ${method === 'card' ? styles.subMethodBtnActive : ''}`}
                onClick={() => setMethod('card')}
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
            {loading ? 'Зачекайте...' : `Придбати ${price} грн`}
          </button>
        </div>
      </div>
    </div>
  )
}
