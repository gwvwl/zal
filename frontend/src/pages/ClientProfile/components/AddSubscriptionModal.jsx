import { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchPresets, createSubscriptionThunk } from '../../../store/slices/subscriptionsSlice.js'
import { createPaymentThunk } from '../../../store/slices/paymentsSlice.js'
import $api from '../../../api/http.js'
import styles from '../../../styles/clientProfile.module.css'

const CATEGORY_LABELS = { gym: 'Спортзал', group: 'Групові заняття' }

export default function AddSubscriptionModal({ clientId, onClose }) {
  const dispatch = useDispatch()
  const presets = useSelector(state => state.subscriptions.presets)

  const [selectedPresetId, setSelectedPresetId] = useState(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [price, setPrice] = useState(0)
  const [method, setMethod] = useState('cash')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [takenLockerLabels, setTakenLockerLabels] = useState([])

  const dropdownRef = useRef(null)
  const searchInputRef = useRef(null)

  const availablePresets = presets.filter(p =>
    !(p.category === 'locker' && takenLockerLabels.includes(p.label))
  )
  const preset = availablePresets.find(p => p.id === selectedPresetId) ?? availablePresets[0]
  const filtered = availablePresets.filter(p =>
    p.label.toLowerCase().includes(search.toLowerCase())
  )

  useEffect(() => {
    dispatch(fetchPresets())
    $api.get('/subscriptions', { params: { category: 'locker' } }).then(({ data }) => {
      const taken = data
        .filter(s => ['active', 'purchased', 'frozen'].includes(s.status))
        .map(s => s.label)
      setTakenLockerLabels(taken)
    }).catch(() => {})
  }, [dispatch, clientId])

  useEffect(() => {
    if (preset) setPrice(preset.price)
  }, [preset])

  useEffect(() => {
    if (dropdownOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 0)
    } else {
      setSearch('')
    }
  }, [dropdownOpen])

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    if (dropdownOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [dropdownOpen])

  function handlePresetSelect(p) {
    setSelectedPresetId(p.id)
    setPrice(p.price)
    setSearch('')
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
      durationMonths: preset.duration_months,
      multiGym: preset.multi_gym || false,
    }))
    if (createSubscriptionThunk.rejected.match(subResult)) {
      setError(subResult.payload || 'Помилка збереження')
      setLoading(false)
      return
    }

    const payResult = await dispatch(createPaymentThunk({
      clientId,
      subscriptionId: subResult.payload?.id || null,
      amount: Number(price),
      type: preset.category === 'locker' ? 'locker' : 'subscription',
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
                  <input
                    ref={searchInputRef}
                    className={styles.subDropdownSearch}
                    placeholder="Пошук..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                  <div className={styles.subDropdownList}>
                    {filtered.length === 0 ? (
                      <div style={{ padding: '12px 14px', fontSize: 13, color: 'var(--gray-400)' }}>Нічого не знайдено</div>
                    ) : filtered.map(p => (
                      <button
                        key={p.id}
                        className={`${styles.subDropdownOption} ${preset.id === p.id ? styles.subDropdownOptionActive : ''}`}
                        onClick={() => handlePresetSelect(p)}
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
