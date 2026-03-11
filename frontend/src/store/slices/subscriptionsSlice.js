import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import $api from '../../api/http.js'

const FALLBACK_PRESETS = [
  { label: 'Безліміт (1 міс.)', type: 'unlimited', category: 'gym', duration_days: 30, price: 1200 },
  { label: 'Безліміт (3 міс.)', type: 'unlimited', category: 'gym', duration_days: 90, price: 3200 },
  { label: '12 групових занять', type: 'visits', category: 'group', duration_days: 30, total_visits: 12, price: 1000 },
  { label: '20 групових занять', type: 'visits', category: 'group', duration_days: 30, total_visits: 20, price: 1600 },
]

export const fetchPresets = createAsyncThunk(
  'subscriptions/fetchPresets',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await $api.get('/subscriptions/presets')
      return data
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Помилка завантаження')
    }
  }
)

export const fetchClientSubscriptions = createAsyncThunk(
  'subscriptions/fetchClientSubs',
  async (clientId, { rejectWithValue }) => {
    try {
      const { data } = await $api.get('/subscriptions', { params: { clientId } })
      return data
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Помилка завантаження абонементів')
    }
  }
)

export const createSubscriptionThunk = createAsyncThunk(
  'subscriptions/create',
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await $api.post('/subscriptions', payload)
      return data
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Помилка збереження')
    }
  }
)

export const activateSubscriptionThunk = createAsyncThunk(
  'subscriptions/activate',
  async (id, { rejectWithValue }) => {
    try {
      await $api.patch(`/subscriptions/${id}/activate`)
      return id
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Помилка активації')
    }
  }
)

export const freezeSubscriptionThunk = createAsyncThunk(
  'subscriptions/freeze',
  async ({ subscriptionId, frozenTo }, { rejectWithValue }) => {
    try {
      await $api.patch(`/subscriptions/${subscriptionId}/freeze`, { frozenTo })
      return subscriptionId
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Помилка заморозки')
    }
  }
)

export const unfreezeSubscriptionThunk = createAsyncThunk(
  'subscriptions/unfreeze',
  async (id, { rejectWithValue }) => {
    try {
      await $api.patch(`/subscriptions/${id}/unfreeze`)
      return id
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Помилка розморозки')
    }
  }
)

const subscriptionsSlice = createSlice({
  name: 'subscriptions',
  initialState: {
    presets: FALLBACK_PRESETS,
    clientSubs: [],
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPresets.fulfilled, (state, action) => {
        if (action.payload.length > 0) {
          state.presets = action.payload
        }
      })
      .addCase(fetchClientSubscriptions.fulfilled, (state, action) => {
        state.clientSubs = action.payload
      })
  },
})

export default subscriptionsSlice.reducer
