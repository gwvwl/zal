import { useRef, useState } from 'react'
import { useDispatch } from 'react-redux'
import { replaceCardThunk } from '../../../store/slices/clientsSlice.js'
import styles from '../../../styles/clientProfile.module.css'

export default function ReplaceCardModal({ clientId, onClose }) {
  const dispatch = useDispatch()

  const [cardCode, setCardCode] = useState('')
  const [cardError, setCardError] = useState('')
  const [isPaid, setIsPaid] = useState(false)
  const amount = 100
  const [method, setMethod] = useState('cash')
  const [loading, setLoading] = useState(false)

  const inputRef = useRef(null)

  async function handleSubmit() {
    const trimmed = cardCode.trim()
    if (!trimmed) {
      setCardError('Відскануйте або введіть номер нової картки')
      inputRef.current?.focus()
      return
    }
    setLoading(true)
    setCardError('')
    const result = await dispatch(replaceCardThunk({
      clientId,
      code: trimmed,
      paid: isPaid,
      amount: isPaid ? amount : 0,
      method: isPaid ? method : 'cash',
    }))
    if (replaceCardThunk.fulfilled.match(result)) {
      onClose()
    } else {
      setCardError(result.payload || 'Помилка заміни картки')
      inputRef.current?.focus()
    }
    setLoading(false)
  }

  function handleCardKeyDown(e) {
    if (e.key === 'Enter') handleSubmit()
  }

  return (
    <div className={styles.subModalOverlay} onClick={e => { e.stopPropagation(); onClose() }}>
      <div className={`${styles.subModal} ${styles.subModalSm}`} onClick={e => e.stopPropagation()}>
        <div className={styles.subModalHeader}>
          <h2 className={styles.subModalTitle}>💳 Заміна картки</h2>
          <button className={styles.subModalClose} onClick={onClose}>✕</button>
        </div>

        <div className={styles.subModalBody}>
          <div className={styles.subModalField}>
            <label className={styles.subModalLabel}>Нова картка</label>
            <input
              ref={inputRef}
              autoFocus
              className={`${styles.subModalInput} ${cardError ? styles.subModalInputError : ''}`}
              type="text"
              placeholder="Відскануйте або введіть номер"
              value={cardCode}
              onChange={e => { setCardCode(e.target.value); setCardError('') }}
              onKeyDown={handleCardKeyDown}
            />
            {cardError && <span className={styles.subModalError}>{cardError}</span>}
          </div>

          <div className={styles.subModalField}>
            <label className={styles.subModalLabel}>Тип заміни</label>
            <div className={styles.subMethodToggle}>
              <button
                className={`${styles.subMethodBtn} ${!isPaid ? styles.subMethodBtnActive : ''}`}
                onClick={() => setIsPaid(false)}
              >
                ✅ Безкоштовна
              </button>
              <button
                className={`${styles.subMethodBtn} ${isPaid ? styles.subMethodBtnActive : ''}`}
                onClick={() => setIsPaid(true)}
              >
                💰 Платна
              </button>
            </div>
          </div>

          {isPaid && (
            <div className={styles.subModalRow}>
              <div className={styles.subModalField}>
                <label className={styles.subModalLabel}>Сума (грн)</label>
                <span className={styles.subModalAmountText}>{amount} грн</span>
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
            </div>
          )}
        </div>

        <div className={styles.subModalFooter}>
          <button className={styles.subModalCancel} onClick={onClose}>Скасувати</button>
          <button className={styles.subModalSubmit} onClick={handleSubmit} disabled={loading}>
            {loading ? 'Зачекайте...' : isPaid ? `✅ Підтвердити ${amount} грн` : '✅ Підтвердити'}
          </button>
        </div>
      </div>
    </div>
  )
}
