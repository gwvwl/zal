import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchBirthdayClients } from '../../../store/slices/clientsSlice.js'
import styles from '../../../styles/dashboard.module.css'
import { photoUrl } from '../../../utils/photoUrl'

function daysUntilBirthday(birthDateStr) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const bday = new Date(birthDateStr)
  const next = new Date(today.getFullYear(), bday.getMonth(), bday.getDate())
  if (next < today) next.setFullYear(today.getFullYear() + 1)
  return Math.floor((next - today) / (1000 * 60 * 60 * 24))
}

function formatBirthday(birthDateStr) {
  const d = new Date(birthDateStr)
  return d.toLocaleDateString('uk-UA', { day: '2-digit', month: 'long' })
}

function calcAge(birthDateStr) {
  const today = new Date()
  const bday = new Date(birthDateStr)
  let age = today.getFullYear() - bday.getFullYear()
  const m = today.getMonth() - bday.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < bday.getDate())) age--
  return age + 1
}

export default function BirthdayModal({ onClose, onClientSelect }) {
  const dispatch = useDispatch()
  const birthdayClients = useSelector(state => state.clients.birthdayClients)
  const loading = useSelector(state => state.clients.birthdayLoading)

  useEffect(() => {
    dispatch(fetchBirthdayClients())
  }, [dispatch])

  const upcoming = birthdayClients
    .filter(c => c.birth_date)
    .map(c => ({ ...c, days: daysUntilBirthday(c.birth_date) }))
    .filter(c => c.days <= 7)
    .sort((a, b) => a.days - b.days)

  function handleSelect(id) {
    onClose()
    onClientSelect(id)
  }

  return (
    <div className={styles.smOverlay} onClick={onClose}>
      <div className={styles.smModal} onClick={e => e.stopPropagation()}>
        <div className={styles.smHeader}>
          <h2 className={styles.smTitle}>🎂 Дні народження</h2>
          <button className={styles.smCloseBtn} onClick={onClose}>✕</button>
        </div>

        {loading ? (
          <p className={styles.smHint}>Завантаження...</p>
        ) : upcoming.length === 0 ? (
          <p className={styles.smHint}>Найближчі 7 днів — немає іменинників</p>
        ) : (
          <div className={styles.bmList}>
            {upcoming.map(client => (
              <button
                key={client.id}
                className={styles.bmItem}
                onClick={() => handleSelect(client.id)}
              >
                <div className={styles.smAvatar}>
                  {client.photo
                    ? <img src={photoUrl(client.photo)} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} alt="" />
                    : `${client.first_name?.[0] ?? ''}${client.last_name?.[0] ?? ''}`
                  }
                </div>
                <div className={styles.smInfo}>
                  <span className={styles.smName}>
                    {client.last_name} {client.first_name}
                  </span>
                  <span className={styles.smMeta}>
                    {formatBirthday(client.birth_date)} · виповнюється {calcAge(client.birth_date)} р.
                  </span>
                </div>
                <span className={client.days === 0 ? styles.bmTagToday : styles.bmTagSoon}>
                  {client.days === 0 ? '🎉 Сьогодні!' : client.days === 1 ? 'Завтра' : `Через ${client.days} дн.`}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
