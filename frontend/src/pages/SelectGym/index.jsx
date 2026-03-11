import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { gymLogin, setToken } from '../../store/slices/authSlice.js'
import $api from '../../api/http.js'
import logo from '../../styles/images/logo.PNG'
import styles from '../../styles/selectGym.module.css'

export default function SelectGym() {
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const [gyms, setGyms] = useState([])
  const [selectedGymId, setSelectedGymId] = useState(null)
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    $api.get('/gyms').then(({ data }) => setGyms(data)).catch(() => {})
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data } = await $api.post('/auth/gym-login', { gym_id: selectedGymId, password })
      localStorage.setItem('access_token', data.token)
      dispatch(setToken(data.token))
      dispatch(gymLogin({ id: data.gym.id, name: data.gym.name }))
      navigate('/select-worker')
    } catch (err) {
      const msg = err.response?.data?.error || 'Невірний пароль'
      setError(msg)
      setPassword('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <img src={logo} alt="Зал" className={styles.logoImg} />
          <h1 className={styles.title}>CRM</h1>
          <p className={styles.subtitle}>Оберіть зал та введіть пароль</p>
        </div>

        <div className={styles.gymGrid}>
          {gyms.map(gym => (
            <button
              key={gym.id}
              type="button"
              className={`${styles.gymCard} ${selectedGymId === gym.id ? styles.gymCardActive : ''}`}
              onClick={() => { setSelectedGymId(gym.id); setError('') }}
            >
              <span className={styles.gymCardIcon}>🏋️</span>
              <span className={styles.gymCardName}>{gym.name}</span>
            </button>
          ))}
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label}>Пароль</label>
            <div className={styles.passWrap}>
              <input
                className={styles.input}
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); setError('') }}
                placeholder="Введіть пароль"
                autoComplete="current-password"
              />
              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowPass(v => !v)}
                tabIndex={-1}
              >
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button
            className={styles.btn}
            type="submit"
            disabled={!selectedGymId || !password || loading}
          >
            {loading ? 'Вхід...' : 'Увійти'}
          </button>
        </form>
      </div>
    </div>
  )
}
