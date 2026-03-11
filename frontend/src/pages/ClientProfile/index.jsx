import { useState, useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  clientEnter,
  clientExit,
  selectIsInGym,
  selectCurrentVisit,
} from "../../store/slices/gymSlice.js";
import {
  updateClient,
} from "../../store/slices/clientsSlice.js";
import $api from "../../api/http.js";
import { useToast } from "../../components/Toast.jsx";
import { useConfirm } from "../../components/ConfirmDialog.jsx";
import ClientInfoCard from "./components/ClientInfoCard.jsx";
import ClientEditForm from "./components/ClientEditForm.jsx";
import SubscriptionCard from "./components/SubscriptionCard.jsx";
import VisitHistory from "./components/VisitHistory.jsx";
import SubscriptionHistory from "./components/SubscriptionHistory.jsx";
import AddSubscriptionModal from "./components/AddSubscriptionModal.jsx";
import ReplaceCardModal from "./components/ReplaceCardModal.jsx";
import FreezeModal from "./components/FreezeModal.jsx";

import styles from "../../styles/clientProfile.module.css";
import { photoUrl } from "../../utils/photoUrl";

export default function ClientProfile({ clientId, onClose }) {
  const dispatch = useDispatch();
  const toast = useToast();
  const confirm = useConfirm();
  const [tab, setTab] = useState("visits");
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [editErrors, setEditErrors] = useState({});
  const [editPhotoFile, setEditPhotoFile] = useState(null);
  const [editPhotoPreview, setEditPhotoPreview] = useState(null);
  const [showPhotoLightbox, setShowPhotoLightbox] = useState(false);
  const [showAddSub, setShowAddSub] = useState(false);
  const [showReplaceCard, setShowReplaceCard] = useState(false);
  const [freezeSubId, setFreezeSubId] = useState(null);
  const [clientSubs, setClientSubs] = useState([]);
  const [client, setClient] = useState(null);

  const isInGym = useSelector((state) => selectIsInGym(state, clientId));
  const currentVisit = useSelector((state) => selectCurrentVisit(state, clientId));

  const STATUS_ORDER = { active: 0, frozen: 1, purchased: 2 };
  const activeSubs = clientSubs
    .filter(s => s.status === 'active' || s.status === 'frozen' || s.status === 'purchased')
    .sort((a, b) => (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9));

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    $api.get(`/clients/${clientId}`)
      .then(({ data }) => setClient(data))
      .catch(() => toast('Не вдалося завантажити клієнта'));
  }, [clientId]);

  const loadSubs = useCallback(() => {
    $api.get("/subscriptions", { params: { clientId } })
      .then(({ data }) => setClientSubs(data))
      .catch(() => toast('Не вдалося завантажити абонементи'));
  }, [clientId, toast]);

  useEffect(() => { loadSubs(); }, [loadSubs]);

  function startEdit() {
    setEditForm({
      lastName: client.last_name || "",
      firstName: client.first_name || "",
      middleName: client.middle_name || "",
      phone: client.phone || "",
      email: client.email || "",
      birthDate: client.birth_date || "",
      gender: client.gender || "",
      source: client.source || "",
      comment: client.comment || "",
    });
    setEditPhotoFile(null);
    setEditPhotoPreview(null);
    setEditErrors({});
    setIsEditing(true);
  }

  function cancelEdit() {
    setIsEditing(false);
    setEditForm(null);
    setEditErrors({});
  }

  function handleEditChange(field, value) {
    setEditForm((f) => ({ ...f, [field]: value }));
    setEditErrors((e) => ({ ...e, [field]: undefined }));
  }

  function handlePhotoChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setEditPhotoFile(file);
    setEditPhotoPreview(URL.createObjectURL(file));
  }

  async function handleSave() {
    const errs = {};
    if (!editForm.lastName.trim()) errs.lastName = "Обов'язкове поле";
    if (!editForm.firstName.trim()) errs.firstName = "Обов'язкове поле";
    if (!editForm.phone.trim()) errs.phone = "Обов'язкове поле";
    if (Object.keys(errs).length > 0) {
      setEditErrors(errs);
      return;
    }
    try {
      const formData = new FormData();
      Object.entries(editForm).forEach(([k, v]) => formData.append(k, v));
      if (editPhotoFile) formData.append('photo', editPhotoFile);
      const { data } = await $api.put(`/clients/${clientId}`, formData);
      dispatch(updateClient(data));
      setClient(data);
      setIsEditing(false);
      setEditForm(null);
      setEditPhotoFile(null);
      setEditPhotoPreview(null);
    } catch (err) {
      toast(err.response?.data?.error || "Помилка збереження");
    }
  }

  async function doEnter(subscriptionId) {
    try {
      const { data: visit } = await $api.post("/visits/enter", { clientId, subscriptionId });
      const sub = subscriptionId ? clientSubs.find(s => s.id === subscriptionId) : null;
      dispatch(clientEnter({
        ...visit,
        client: client ? { id: client.id, first_name: client.first_name, last_name: client.last_name, phone: client.phone, photo: client.photo } : null,
        subscription: sub ? { id: sub.id, label: sub.label, category: sub.category, status: sub.status } : null,
      }));
      loadSubs();
    } catch (err) {
      toast(err.response?.data?.error || "Помилка входу");
    }
  }

  async function handleExit() {
    if (!currentVisit) return;
    try {
      const { data } = await $api.patch(`/visits/${currentVisit.id}/exit`);
      dispatch(clientExit({ client_id: clientId, exited_at: data.exited_at }));
    } catch (err) {
      toast(err.response?.data?.error || "Помилка виходу");
    }
  }

  function handleSingleEntry() {
    toast("Разовий вхід — буде реалізовано пізніше");
  }

  async function handleActivate(id) {
    const ok = await confirm("Активувати абонемент? Почнеться відлік днів.");
    if (!ok) return;
    try {
      await $api.patch(`/subscriptions/${id}/activate`);
      loadSubs();
    } catch (err) {
      toast(err.response?.data?.error || "Помилка активації");
    }
  }

  async function handleFreeze(id) {
    setFreezeSubId(id);
  }

  async function handleUnfreeze(id) {
    const ok = await confirm("Розморозити абонемент?");
    if (!ok) return;
    try {
      await $api.patch(`/subscriptions/${id}/unfreeze`);
      loadSubs();
    } catch (err) {
      toast(err.response?.data?.error || "Помилка розморозки");
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <span className={styles.modalTitle}>
            {isEditing ? "Редагування клієнта" : "Профіль клієнта"}
          </span>
          <div className={styles.modalHeaderActions}>
            {!isEditing && client && (
              <>
                <button className={styles.replaceCardBtn} onClick={() => setShowReplaceCard(true)}>
                  Замінити картку
                </button>
                <button className={styles.editBtn} onClick={startEdit}>
                  Редагувати
                </button>
              </>
            )}
            <button
              className={styles.closeBtn}
              onClick={isEditing ? cancelEdit : onClose}
            >
              ✕
            </button>
          </div>
        </div>

        {!client ? (
          <div className={styles.notFound}>
            <p>Клієнта не знайдено</p>
            <button onClick={onClose}>Закрити</button>
          </div>
        ) : isEditing ? (
          <ClientEditForm
            form={editForm}
            errors={editErrors}
            photo={editPhotoPreview || client.photo}
            onChange={handleEditChange}
            onPhotoChange={handlePhotoChange}
            onPhotoRemove={() => { setEditPhotoFile(null); setEditPhotoPreview(null); }}
            onCancel={cancelEdit}
            onSave={handleSave}
          />
        ) : (
          <div className={styles.content}>
            <div className={styles.topSection}>
              <div className={styles.leftCol}>
                <ClientInfoCard
                  client={client}
                  onPhotoClick={() => setShowPhotoLightbox(true)}
                />
                <div className={styles.subActions}>
                  <button className={styles.subBtnPrimary} onClick={() => setShowAddSub(true)}>
                    Додати абонемент
                  </button>
                  <button className={styles.subBtnSecondary} onClick={handleSingleEntry}>
                    Разовий вхід
                  </button>
                </div>
              </div>

              <div className={styles.rightCol}>
                <div className={styles.section}>
                  <SubscriptionCard
                    subscriptions={activeSubs}
                    onActivate={handleActivate}
                    onFreeze={handleFreeze}
                    onUnfreeze={handleUnfreeze}
                    onEnter={doEnter}
                    onExit={handleExit}
                    isInGym={isInGym}
                  />
                </div>
              </div>
            </div>

            <div className={styles.bottomSection}>
              <div className={styles.tabs}>
                <button
                  className={`${styles.tab} ${tab === "visits" ? styles.tabActive : ""}`}
                  onClick={() => setTab("visits")}
                >
                  Відвідування
                </button>
                <button
                  className={`${styles.tab} ${tab === "subscriptions" ? styles.tabActive : ""}`}
                  onClick={() => setTab("subscriptions")}
                >
                  Абонементи
                </button>
              </div>
              <div className={styles.tabContent}>
                {tab === "visits" && <VisitHistory clientId={clientId} />}
                {tab === "subscriptions" && (
                  <SubscriptionHistory subscriptions={clientSubs} />
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {showPhotoLightbox && client?.photo && (
        <div
          className={styles.lightbox}
          onClick={(e) => { e.stopPropagation(); setShowPhotoLightbox(false); }}
        >
          <img
            src={photoUrl(client.photo)}
            className={styles.lightboxImg}
            alt="фото клієнта"
          />
        </div>
      )}

      {showAddSub && (
        <AddSubscriptionModal
          clientId={clientId}
          onClose={() => { setShowAddSub(false); loadSubs(); }}
        />
      )}

      {showReplaceCard && (
        <ReplaceCardModal
          clientId={clientId}
          onClose={() => setShowReplaceCard(false)}
        />
      )}

      {freezeSubId && (
        <FreezeModal
          subscriptionId={freezeSubId}
          onClose={() => { setFreezeSubId(null); loadSubs(); }}
        />
      )}

    </div>
  );
}
