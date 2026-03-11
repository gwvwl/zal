import { useEffect, useRef, useState } from 'react'
import $api from '../../../api/http.js'
import styles from '../../../styles/clientProfile.module.css'

const FALLBACK_PRESETS = [
  { label: 'Безліміт (1 міс.)', type: 'unlimited', category: 'gym',   duration_days: 30,  price: 1200 },
  { label: 'Безліміт (3 міс.)', type: 'unlimited', category: 'gym',   duration_days: 90,  price: 3200 },
  { label: '12 групових занять', type: 'visits',   category: 'group', duration_days: 30,  total_visits: 12, price: 1000 },
  { label: '20 групових занять', type: 'visits',   category: 'group', duration_days: 30,  total_visits: 20, price: 1600 },
]

const CATEGORY_LABELS = { gym: 'Спортзал', group: 'Групові заняття' }

export default function AddSubscriptionModal({ clientId, onClose }) {

  const [presets, setPresets] = useState(FALLBACK_PRESETS)
  const [presetIdx, setPresetIdx] = useState(0)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [price, setPrice] = useState(FALLBACK_PRESETS[0].price)
  const [method, setMethod] = useState('cash')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const dropdownRef = useRef(null)
  const preset = presets[presetIdx]

  useEffect(() => {
    $api.get('/subscriptions/presets')
      .then(({ data }) => {
        if (data.length > 0) {
          setPresets(data)
          setPresetIdx(0)
          setPrice(data[0].price)
        }
      })
      .catch(() => {})
  }, [])

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
    const p = preset
    setLoading(true)
    setError('')
    try {
      const { data: newSub } = await $api.post('/subscriptions', {
        clientId,
        type: p.type,
        category: p.category,
        label: p.label,
        totalVisits: p.type === 'visits' ? p.total_visits : null,
        price: Number(price),
        durationDays: p.duration_days,
      })
      await $api.post('/payments', {
        clientId,
        amount: Number(price),
        type: 'subscription',
        label: p.label,
        method,
      })

      onClose()
    } catch (err) {
      setError(err.response?.data?.error || 'Помилка збереження')
    } finally {
      setLoading(false)
    }
  }

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
