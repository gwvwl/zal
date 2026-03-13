import styles from '../../../styles/clientProfile.module.css'
import { photoUrl } from '../../../utils/photoUrl'

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('uk-UA')
}

function calcAge(birthDate) {
  if (!birthDate) return null
  const diff = Date.now() - new Date(birthDate)
  return Math.floor(diff / (365.25 * 24 * 3600 * 1000))
}

function isBirthdayToday(birthDate) {
  if (!birthDate) return false
  const today = new Date()
  const bd = new Date(birthDate)
  return bd.getDate() === today.getDate() && bd.getMonth() === today.getMonth()
}

const genderMap = { male: 'Чоловік', female: 'Жінка' }

export default function ClientInfoCard({ client, onPhotoClick }) {
  const age = calcAge(client.birth_date)
  const isToday = isBirthdayToday(client.birth_date)

  return (
    <>
      <div className={styles.clientCard}>
        <div>
          {client.photo
            ? <img
                src={photoUrl(client.photo)}
                className={styles.avatarPhoto}
                alt="фото"
                onClick={onPhotoClick}
              />
            : <div className={styles.avatarLg}>
                {client.first_name?.[0]}{client.last_name?.[0]}
              </div>
          }
        </div>
        <div className={styles.clientInfo}>
          <h1 className={styles.clientName}>
            {client.last_name} {client.first_name} {client.middle_name}
            {isToday && (
              <span style={{ marginLeft: 8, fontSize: 14, fontWeight: 600, color: '#e65100', background: '#fff3e0', padding: '2px 10px', borderRadius: 999, verticalAlign: 'middle' }}>
                🎂 Сьогодні день народження!
              </span>
            )}
          </h1>
          <div className={styles.clientMeta}>
            {client.phone && <span>📞 {client.phone}</span>}
            {client.email && <span>✉️ {client.email}</span>}
            {client.birth_date && (
              <span>🎂 {formatDate(client.birth_date)}{age ? ` (${age} р.)` : ''}</span>
            )}
            {client.gender && <span>{genderMap[client.gender]}</span>}
          </div>
          {client.source && (
            <div className={styles.clientSource}>📣 {client.source}</div>
          )}
          <p className={styles.clientSince}>
            В клубі з {formatDate(client.created_at)} · #{client.code}
          </p>
        </div>
      </div>

    </>
  )
}
