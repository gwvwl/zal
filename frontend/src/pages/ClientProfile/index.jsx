import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  fetchClient,
  updateClientThunk,
  clearCurrentClient,
} from "../../store/slices/clientsSlice.js";
import {
  fetchClientSubscriptions,
  activateSubscriptionThunk,
  unfreezeSubscriptionThunk,
} from "../../store/slices/subscriptionsSlice.js";
import {
  enterGymThunk,
  exitGymThunk,
  selectIsInGym,
  selectCurrentVisit,
} from "../../store/slices/gymSlice.js";
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

  const client = useSelector(state => state.clients.currentClient);
  const clientSubs = useSelector(state => state.subscriptions.clientSubs);
  const isInGym = useSelector((state) => selectIsInGym(state, clientId));
  const currentVisit = useSelector((state) => selectCurrentVisit(state, clientId));

  const STATUS_ORDER = { active: 0, frozen: 1, purchased: 2 };
  const activeSubs = clientSubs
    .filter(s => s.status === "active" || s.status === "frozen" || s.status === "purchased")
    .sort((a, b) => (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9));

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => {
    dispatch(clearCurrentClient());
    dispatch(fetchClient(clientId));
    dispatch(fetchClientSubscriptions(clientId));
  }, [clientId, dispatch]);

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
    const formData = new FormData();
    Object.entries(editForm).forEach(([k, v]) => formData.append(k, v));
    if (editPhotoFile) formData.append("photo", editPhotoFile);
    const result = await dispatch(updateClientThunk({ clientId, formData }));
    if (updateClientThunk.fulfilled.match(result)) {
      setIsEditing(false);
      setEditForm(null);
      setEditPhotoFile(null);
      setEditPhotoPreview(null);
    } else {
      toast(result.payload || "Помилка збереження");
    }
  }

  async function doEnter(subscriptionId) {
    const sub = subscriptionId ? clientSubs.find(s => s.id === subscriptionId) : null;
    const result = await dispatch(enterGymThunk({
      clientId,
      subscriptionId,
      clientData: client
        ? { id: client.id, first_name: client.first_name, last_name: client.last_name, phone: client.phone, photo: client.photo }
        : null,
      subscriptionData: sub
        ? { id: sub.id, label: sub.label, category: sub.category, status: sub.status }
        : null,
    }));
    if (enterGymThunk.fulfilled.match(result)) {
      dispatch(fetchClientSubscriptions(clientId));
    } else {
      toast(result.payload || "Помилка входу");
    }
  }

  async function handleExit() {
    if (!currentVisit) return;
    const result = await dispatch(exitGymThunk({ visitId: currentVisit.id, clientId }));
    if (exitGymThunk.rejected.match(result)) {
      toast(result.payload || "Помилка виходу");
    }
  }

  function handleSingleEntry() {
    toast("Разовий вхід — буде реалізовано пізніше");
  }

  async function handleActivate(id) {
    const ok = await confirm("Активувати абонемент? Почнеться відлік днів.");
    if (!ok) return;
    const result = await dispatch(activateSubscriptionThunk(id));
    if (activateSubscriptionThunk.fulfilled.match(result)) {
      dispatch(fetchClientSubscriptions(clientId));
    } else {
      toast(result.payload || "Помилка активації");
    }
  }

  function handleFreeze(id) {
    setFreezeSubId(id);
  }

  async function handleUnfreeze(id) {
    const ok = await confirm("Розморозити абонемент?");
    if (!ok) return;
    const result = await dispatch(unfreezeSubscriptionThunk(id));
    if (unfreezeSubscriptionThunk.fulfilled.match(result)) {
      dispatch(fetchClientSubscriptions(clientId));
    } else {
      toast(result.payload || "Помилка розморозки");
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
            <p>Завантаження...</p>
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
          onClose={() => {
            setShowAddSub(false);
            dispatch(fetchClientSubscriptions(clientId));
          }}
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
          onClose={() => {
            setFreezeSubId(null);
            dispatch(fetchClientSubscriptions(clientId));
          }}
        />
      )}

    </div>
  );
}
