import { createSlice, createSelector, createAsyncThunk } from '@reduxjs/toolkit'
import $api from '../../api/http.js'

export const fetchCurrentVisits = createAsyncThunk(
  'gym/fetchCurrentVisits',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await $api.get('/visits', { params: { inGym: true } })
      return data
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Помилка завантаження')
    }
  }
)

export const fetchTodayVisits = createAsyncThunk(
  'gym/fetchTodayVisits',
  async (_, { rejectWithValue }) => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const { data } = await $api.get('/visits', { params: { date: today } })
      return data
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Помилка завантаження')
    }
  }
)

export const fetchClientVisits = createAsyncThunk(
  'gym/fetchClientVisits',
  async (clientId, { rejectWithValue }) => {
    try {
      const { data } = await $api.get('/visits', { params: { clientId } })
      return data
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Помилка завантаження')
    }
  }
)

export const enterGymThunk = createAsyncThunk(
  'gym/enter',
  async ({ clientId, subscriptionId, clientData, subscriptionData }, { rejectWithValue }) => {
    try {
      const { data: visit } = await $api.post('/visits/enter', { clientId, subscriptionId })
      return { ...visit, client: clientData, subscription: subscriptionData }
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Помилка входу')
    }
  }
)

export const exitGymThunk = createAsyncThunk(
  'gym/exit',
  async ({ visitId, clientId }, { rejectWithValue }) => {
    try {
      const { data } = await $api.patch(`/visits/${visitId}/exit`)
      return { client_id: clientId, exited_at: data.exited_at }
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Помилка виходу')
    }
  }
)

const gymSlice = createSlice({
  name: 'gym',
  initialState: {
    visits: [],
    clientVisits: [],
    clientVisitsLoading: false,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCurrentVisits.fulfilled, (state, action) => {
        state.visits = action.payload
      })
      .addCase(fetchTodayVisits.fulfilled, (state, action) => {
        const ids = new Set(state.visits.map(v => v.id))
        for (const v of action.payload) {
          if (!ids.has(v.id)) state.visits.push(v)
        }
      })
      .addCase(fetchClientVisits.pending, (state) => {
        state.clientVisitsLoading = true
      })
      .addCase(fetchClientVisits.fulfilled, (state, action) => {
        state.clientVisits = action.payload.sort(
          (a, b) => new Date(b.entered_at) - new Date(a.entered_at)
        )
        state.clientVisitsLoading = false
      })
      .addCase(fetchClientVisits.rejected, (state) => {
        state.clientVisitsLoading = false
      })
      .addCase(enterGymThunk.fulfilled, (state, action) => {
        const existing = state.visits.find(
          v => v.client_id === action.payload.client_id && v.exited_at === null
        )
        if (!existing) {
          state.visits.push({ ...action.payload, exited_at: null })
        }
      })
      .addCase(exitGymThunk.fulfilled, (state, action) => {
        const visit = state.visits.find(
          v => v.client_id === action.payload.client_id && v.exited_at === null
        )
        if (visit) {
          visit.exited_at = action.payload.exited_at
        }
      })
  },
})

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
