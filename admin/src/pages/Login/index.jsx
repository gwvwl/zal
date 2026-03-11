import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import $api from '../../api/http.js'
import styles from '../../styles/login.module.css'

export default function Login() {
  const navigate = useNavigate()
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await $api.post('/login', { login, password })
      localStorage.setItem('admin_token', data.token)
      localStorage.setItem('admin_data', JSON.stringify(data.admin))
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.response?.data?.error || 'Помилка входу')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>ZAL Admin</h1>
          <p className={styles.subtitle}>Вхід в панель адміністратора</p>
        </div>
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label}>Логін</label>
            <input
              className={styles.input}
              type="text"
              value={login}
              onChange={e => setLogin(e.target.value)}
              placeholder="admin"
              autoFocus
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Пароль</label>
            <input
              className={styles.input}
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Введіть пароль"
            />
          </div>
          {error && <div className={styles.error}>{error}</div>}
          <button className={styles.btn} type="submit" disabled={loading || !login || !password}>
            {loading ? 'Вхід...' : 'Увійти'}
          </button>
        </form>
      </div>
    </div>
  )
}
