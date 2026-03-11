import { createSlice, createSelector } from '@reduxjs/toolkit'

const gymSlice = createSlice({
  name: 'gym',
  initialState: {
    visits: [],
  },
  reducers: {
    setVisits(state, action) { state.visits = action.payload },
    mergeVisits(state, action) {
      const ids = new Set(state.visits.map(v => v.id));
      for (const v of action.payload) {
        if (!ids.has(v.id)) state.visits.push(v);
      }
    },
    clientEnter(state, action) {
      // action.payload: visit object { id, client_id, entered_at, exited_at }
      const existing = state.visits.find(
        v => v.client_id === action.payload.client_id && v.exited_at === null
      )
      if (!existing) {
        state.visits.push({ ...action.payload, exited_at: null })
      }
    },
    clientExit(state, action) {
      // action.payload: { client_id, exited_at }
      const visit = state.visits.find(
        v => v.client_id === action.payload.client_id && v.exited_at === null
      )
      if (visit) {
        visit.exited_at = action.payload.exited_at
      }
    },
  },
})

export const { setVisits, mergeVisits, clientEnter, clientExit } = gymSlice.actions
export default gymSlice.reducer

// Selectors
const selectVisits = state => state.gym.visits

export const selectInGym = createSelector(
  selectVisits,
  visits => visits.filter(v => v.exited_at === null)
)

export const selectVisitsByClient = createSelector(
  selectVisits,
  (_, clientId) => clientId,
  (visits, clientId) =>
    visits
      .filter(v => v.client_id === clientId)
      .sort((a, b) => new Date(b.entered_at) - new Date(a.entered_at))
)

export const selectIsInGym = (state, clientId) =>
  state.gym.visits.some(v => v.client_id === clientId && v.exited_at === null)

export const selectCurrentVisit = (state, clientId) =>
  state.gym.visits.find(v => v.client_id === clientId && v.exited_at === null)

export const selectVisitorsToday = createSelector(
  selectVisits,
  visits => {
    const today = new Date().toDateString()
    return visits
      .filter(v => new Date(v.entered_at).toDateString() === today)
      .sort((a, b) => new Date(a.entered_at) - new Date(b.entered_at))
  }
)
