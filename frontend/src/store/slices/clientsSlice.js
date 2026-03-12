import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import $api from '../../api/http.js'

export const fetchClient = createAsyncThunk(
  'clients/fetchClient',
  async (clientId, { rejectWithValue }) => {
    try {
      const { data } = await $api.get(`/clients/${clientId}`)
      return data
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Помилка завантаження клієнта')
    }
  }
)

export const fetchClientByCode = createAsyncThunk(
  'clients/fetchClientByCode',
  async (code, { rejectWithValue }) => {
    try {
      const { data } = await $api.get(`/clients/by-code/${encodeURIComponent(code)}`)
      return data
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || `Клієнта з кодом "${code}" не знайдено`)
    }
  }
)

export const searchClients = createAsyncThunk(
  'clients/search',
  async (q, { rejectWithValue }) => {
    try {
      const { data } = await $api.get('/clients', { params: { q, limit: 15 } })
      return data
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Помилка пошуку')
    }
  }
)

export const fetchBirthdayClients = createAsyncThunk(
  'clients/fetchBirthdays',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await $api.get('/clients', { params: { limit: 500 } })
      return data
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Помилка завантаження')
    }
  }
)

export const createClientThunk = createAsyncThunk(
  'clients/create',
  async (formData, { rejectWithValue }) => {
    try {
      const { data } = await $api.post('/clients', formData)
      return data
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Помилка збереження')
    }
  }
)

export const updateClientThunk = createAsyncThunk(
  'clients/update',
  async ({ clientId, formData }, { rejectWithValue }) => {
    try {
      const { data } = await $api.put(`/clients/${clientId}`, formData)
      return data
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Помилка збереження')
    }
  }
)

export const replaceCardThunk = createAsyncThunk(
  'clients/replaceCard',
  async ({ clientId, code, paid, amount, method }, { rejectWithValue }) => {
    try {
      const { data } = await $api.post(`/clients/${clientId}/replace-card`, { code, paid, amount, method })
      return data
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Помилка заміни картки')
    }
  }
)

const clientsSlice = createSlice({
  name: 'clients',
  initialState: {
    currentClient: null,
    searchResults: [],
    searchLoading: false,
    birthdayClients: [],
    birthdayLoading: false,
  },
  reducers: {
    clearSearch(state) {
      state.searchResults = []
    },
    clearCurrentClient(state) {
      state.currentClient = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchClient.fulfilled, (state, action) => {
        state.currentClient = action.payload
      })
      .addCase(updateClientThunk.fulfilled, (state, action) => {
        state.currentClient = action.payload
      })
      .addCase(replaceCardThunk.fulfilled, (state, action) => {
        if (state.currentClient) {
          state.currentClient.code = action.payload.client.code
        }
      })
      .addCase(searchClients.pending, (state) => {
        state.searchLoading = true
      })
      .addCase(searchClients.fulfilled, (state, action) => {
        state.searchResults = action.payload
        state.searchLoading = false
      })
      .addCase(searchClients.rejected, (state) => {
        state.searchResults = []
        state.searchLoading = false
      })
      .addCase(fetchBirthdayClients.pending, (state) => {
        state.birthdayLoading = true
      })
      .addCase(fetchBirthdayClients.fulfilled, (state, action) => {
        state.birthdayClients = action.payload
        state.birthdayLoading = false
      })
      .addCase(fetchBirthdayClients.rejected, (state) => {
        state.birthdayLoading = false
      })
  },
})

export const { clearSearch, clearCurrentClient } = clientsSlice.actions
export default clientsSlice.reducer
