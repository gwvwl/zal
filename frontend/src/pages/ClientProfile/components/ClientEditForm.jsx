import { useRef } from 'react'
import styles from '../../../styles/clientProfile.module.css'
import { photoUrl } from '../../../utils/photoUrl'

function EditField({ label, field, type = 'text', required, form, errors, onChange, children }) {
  return (
    <div className={styles.editField}>
      <label className={styles.editLabel}>
        {label}{required && <span className={styles.editReq}>*</span>}
      </label>
      {children || (
        <input
          className={`${styles.editInput} ${errors[field] ? styles.editInputError : ''}`}
          type={type}
          value={form[field] ?? ''}
          onChange={e => onChange(field, e.target.value)}
          placeholder={label}
        />
      )}
      {errors[field] && <span className={styles.editErrMsg}>{errors[field]}</span>}
    </div>
  )
}

export default function ClientEditForm({ form, errors, photo, onChange, onPhotoChange, onPhotoRemove, onCancel, onSave }) {
  const photoInputRef = useRef(null)

  return (
    <div className={styles.editBody}>
      <div className={styles.editGrid}>
        {/* Фото */}
        <div className={styles.editPhotoWrap}>
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={onPhotoChange}
          />
          <button
            type="button"
            className={styles.editPhotoBtn}
            onClick={() => photoInputRef.current.click()}
          >
            {photo
              ? <img src={photoUrl(photo)} className={styles.editPhotoPreview} alt="фото" />
              : <span className={styles.editPhotoPlaceholder}>📷<br />Фото</span>
            }
          </button>
          {photo && (
            <button
              type="button"
              className={styles.editPhotoRemove}
              onClick={() => { onPhotoRemove(); photoInputRef.current.value = '' }}
            >✕</button>
          )}
        </div>

        {/* Поля */}
        <div className={styles.editFields}>
          <div className={styles.editSection}>Особисті дані</div>
          <div className={styles.editRow3}>
            <EditField label="Прізвище" field="lastName" required form={form} errors={errors} onChange={onChange} />
            <EditField label="Ім'я" field="firstName" required form={form} errors={errors} onChange={onChange} />
            <EditField label="По батькові" field="middleName" form={form} errors={errors} onChange={onChange} />
          </div>
          <div className={styles.editRow2}>
            <EditField label="Телефон" field="phone" type="tel" required form={form} errors={errors} onChange={onChange} />
            <EditField label="Email" field="email" type="email" form={form} errors={errors} onChange={onChange} />
          </div>
          <div className={styles.editRow2}>
            <EditField label="Дата народження" field="birthDate" type="date" form={form} errors={errors} onChange={onChange} />
            <EditField label="Стать" field="gender" form={form} errors={errors} onChange={onChange}>
              <select
                className={styles.editInput}
                value={form.gender}
                onChange={e => onChange('gender', e.target.value)}
              >
                <option value="">— Оберіть —</option>
                <option value="male">Чоловік</option>
                <option value="female">Жінка</option>
              </select>
            </EditField>
          </div>

          <div className={styles.editSection}>Додаткова інформація</div>
          <div className={styles.editRow2}>
            <EditField label="Джерело" field="source" form={form} errors={errors} onChange={onChange}>
              <select
                className={styles.editInput}
                value={form.source}
                onChange={e => onChange('source', e.target.value)}
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
            </EditField>
            <EditField label="Коментар" field="comment" form={form} errors={errors} onChange={onChange}>
              <textarea
                className={styles.editTextarea}
                value={form.comment}
                onChange={e => onChange('comment', e.target.value)}
                placeholder="Довільний коментар..."
                rows={3}
              />
            </EditField>
          </div>
        </div>
      </div>

      <div className={styles.editActions}>
        <button className={styles.editCancelBtn} onClick={onCancel}>Скасувати</button>
        <button className={styles.editSaveBtn} onClick={onSave}>✅ Зберегти</button>
      </div>
    </div>
  )
}
