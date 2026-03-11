import { useState, useRef } from 'react'
import { useDispatch } from 'react-redux'
import { createClientThunk } from '../../store/slices/clientsSlice.js'
import styles from '../../styles/newClient.module.css'

const defaultForm = {
  lastName: '',
  firstName: '',
  middleName: '',
  phone: '',
  email: '',
  birthDate: '',
  gender: '',
  source: '',
  comment: '',
}

function Field({ label, field, type = 'text', required, form, errors, onChange, children }) {
  return (
    <div className={styles.field}>
      <label className={styles.label}>
        {label}{required && <span className={styles.req}>*</span>}
      </label>
      {children || (
        <input
          className={`${styles.input} ${errors[field] ? styles.inputError : ''}`}
          type={type}
          value={form[field]}
          onChange={e => onChange(field, e.target.value)}
          placeholder={label}
        />
      )}
      {errors[field] && <span className={styles.errMsg}>{errors[field]}</span>}
    </div>
  )
}

export default function NewClient({ onClose, onCreated }) {
  const dispatch = useDispatch()
  const [form, setForm] = useState(defaultForm)
  const [errors, setErrors] = useState({})
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')
  const photoInputRef = useRef(null)

  function handlePhotoChange(e) {
    const file = e.target.files[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  function validate() {
    const e = {}
    if (!form.lastName.trim()) e.lastName = "Обов'язкове поле"
    if (!form.firstName.trim()) e.firstName = "Обов'язкове поле"
    if (!form.phone.trim()) e.phone = "Обов'язкове поле"
    return e
  }

  function handleChange(field, value) {
    setForm(f => ({ ...f, [field]: value }))
    setErrors(e => ({ ...e, [field]: undefined }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setLoading(true)
    setApiError('')
    const formData = new FormData()
    Object.entries(form).forEach(([k, v]) => formData.append(k, v))
    if (photoFile) formData.append('photo', photoFile)
    const result = await dispatch(createClientThunk(formData))
    if (createClientThunk.fulfilled.match(result)) {
      onCreated(result.payload.id)
    } else {
      setApiError(result.payload || 'Помилка збереження')
    }
    setLoading(false)
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <span className={styles.modalTitle}>Новий клієнт</span>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div className={styles.modalBody}>
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.formCard}>
              <h2 className={styles.section}>Особисті дані</h2>

              <div className={styles.photoRow}>
                <div className={styles.photoWrap}>
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    className={styles.photoInput}
                    onChange={handlePhotoChange}
                  />
                  <button
                    type="button"
                    className={styles.photoBtn}
                    onClick={() => photoInputRef.current.click()}
                  >
                    {photoPreview
                      ? <img src={photoPreview} className={styles.photoPreview} alt="фото" />
                      : <span className={styles.photoPlaceholder}>📷<br />Фото</span>
                    }
                  </button>
                  {photoPreview && (
                    <button
                      type="button"
                      className={styles.photoRemove}
                      onClick={() => { setPhotoFile(null); setPhotoPreview(null); photoInputRef.current.value = '' }}
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className={styles.photoFields}>
                  <div className={styles.grid3}>
                    <Field label="Прізвище" field="lastName" required form={form} errors={errors} onChange={handleChange} />
                    <Field label="Ім'я" field="firstName" required form={form} errors={errors} onChange={handleChange} />
                    <Field label="По батькові" field="middleName" form={form} errors={errors} onChange={handleChange} />
                  </div>
                  <div className={styles.grid2}>
                    <Field label="Телефон" field="phone" type="tel" required form={form} errors={errors} onChange={handleChange} />
                    <Field label="Email" field="email" type="email" form={form} errors={errors} onChange={handleChange} />
                  </div>
                  <div className={styles.grid2}>
                    <Field label="Дата народження" field="birthDate" type="date" form={form} errors={errors} onChange={handleChange} />
                    <Field label="Стать" field="gender" form={form} errors={errors} onChange={handleChange}>
                      <select
                        className={`${styles.input} ${errors.gender ? styles.inputError : ''}`}
                        value={form.gender}
                        onChange={e => handleChange('gender', e.target.value)}
                      >
                        <option value="">— Оберіть —</option>
                        <option value="male">Чоловік</option>
                        <option value="female">Жінка</option>
                      </select>
                    </Field>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.formCard}>
              <h2 className={styles.section}>Додаткова інформація</h2>
              <div className={styles.grid2}>
                <Field label="Джерело" field="source" form={form} errors={errors} onChange={handleChange}>
                  <select
                    className={styles.input}
                    value={form.source}
                    onChange={e => handleChange('source', e.target.value)}
                  >
                    <option value="">— Оберіть —</option>
                    <option>Instagram</option>
                    <option>TikTok</option>
                    <option>Google</option>
                    <option>Від друзів</option>
                    <option>Тренер</option>
                    <option>Вивіска</option>
                    <option>Інше</option>
                  </select>
                </Field>
                <Field label="Коментар" field="comment" form={form} errors={errors} onChange={handleChange}>
                  <textarea
                    className={styles.textarea}
                    value={form.comment}
                    onChange={e => handleChange('comment', e.target.value)}
                    placeholder="Довільний коментар..."
                    rows={3}
                  />
                </Field>
              </div>
            </div>

            {apiError && <p className={styles.errMsg}>{apiError}</p>}
            <div className={styles.formActions}>
              <button type="button" className={styles.cancelBtn} onClick={onClose}>
                Скасувати
              </button>
              <button type="submit" className={styles.submitBtn} disabled={loading}>
                {loading ? 'Збереження...' : '✅ Зареєструвати клієнта'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
