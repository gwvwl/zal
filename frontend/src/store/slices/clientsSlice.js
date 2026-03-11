import { createSlice } from '@reduxjs/toolkit'

const clientsSlice = createSlice({
  name: 'clients',
  initialState: {
    list: [],
    subscriptions: [],
  },
  reducers: {
    setClients(state, action) { state.list = action.payload },
    setSubscriptions(state, action) { state.subscriptions = action.payload },
    addClient(state, action) { state.list.push(action.payload) },
    updateClient(state, action) {
      const idx = state.list.findIndex(c => c.id === action.payload.id)
      if (idx !== -1) state.list[idx] = action.payload
    },
    addSubscription(state, action) { state.subscriptions.push(action.payload) },
    updateSubscription(state, action) {
      const idx = state.subscriptions.findIndex(s => s.id === action.payload.id)
      if (idx !== -1) state.subscriptions[idx] = action.payload
    },
    freezeSubscription(state, action) {
      // payload: { id, frozen_from, frozen_to }
      const sub = state.subscriptions.find(s => s.id === action.payload.id)
      if (sub) {
        sub.status = 'frozen'
        sub.frozen_from = action.payload.frozen_from
        sub.frozen_to = action.payload.frozen_to
      }
    },
    unfreezeSubscription(state, action) {
      const sub = state.subscriptions.find(s => s.id === action.payload)
      if (sub) {
        sub.status = 'active'
        delete sub.frozen_from
        delete sub.frozen_to
      }
    },
    replaceClientCard(state, action) {
      // payload: { id, code }
      const client = state.list.find(c => c.id === action.payload.id)
      if (client) client.code = action.payload.code
    },
  },
})

export const {
  setClients,
  setSubscriptions,
  addClient,
  updateClient,
  addSubscription,
  updateSubscription,
  freezeSubscription,
  unfreezeSubscription,
  replaceClientCard,
} = clientsSlice.actions

export default clientsSlice.reducer
