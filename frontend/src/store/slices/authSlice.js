import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import $api from '../../api/http.js'

export const fetchGyms = createAsyncThunk(
  'auth/fetchGyms',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await $api.get('/gyms')
      return data
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Помилка завантаження залів')
    }
  }
)

export const gymLoginThunk = createAsyncThunk(
  'auth/gymLogin',
  async ({ gym_id, password }, { rejectWithValue }) => {
    try {
      const { data } = await $api.post('/auth/gym-login', { gym_id, password })
      localStorage.setItem('access_token', data.token)
      return data
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Невірний пароль')
    }
  }
)

export const fetchWorkers = createAsyncThunk(
  'auth/fetchWorkers',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await $api.get('/workers')
      return data
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Помилка завантаження співробітників')
    }
  }
)

export const workerLoginThunk = createAsyncThunk(
  'auth/workerLogin',
  async ({ worker_id, pin }, { rejectWithValue }) => {
    try {
      const { data } = await $api.post('/auth/worker-login', { worker_id, pin })
      localStorage.setItem('access_token', data.token)
      return data
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Невірний пароль')
    }
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    token: null,
    selectedGym: null,
    gymAuthenticated: false,
    currentWorker: null,
    isAuthenticated: false,
    gyms: [],
    workers: [],
    workersLoading: false,
  },
  reducers: {
    gymLogout(state) {
      state.token = null
      state.selectedGym = null
      state.gymAuthenticated = false
      state.currentWorker = null
      state.isAuthenticated = false
    },
    logout(state) {
      state.token = null
      state.currentWorker = null
      state.isAuthenticated = false
    },
    setToken(state, action) {
      state.token = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchGyms.fulfilled, (state, action) => {
        state.gyms = action.payload
      })
      .addCase(fetchWorkers.pending, (state) => {
        state.workersLoading = true
      })
      .addCase(fetchWorkers.fulfilled, (state, action) => {
        state.workers = action.payload
        state.workersLoading = false
      })
      .addCase(fetchWorkers.rejected, (state) => {
        state.workersLoading = false
      })
      .addCase(gymLoginThunk.fulfilled, (state, action) => {
        state.token = action.payload.token
        state.selectedGym = { id: action.payload.gym.id, name: action.payload.gym.name }
        state.gymAuthenticated = true
      })
      .addCase(workerLoginThunk.fulfilled, (state, action) => {
        state.token = action.payload.token
        state.currentWorker = {
          id: action.payload.worker.id,
          name: action.payload.worker.name,
          role: action.payload.worker.role,
        }
        state.isAuthenticated = true
      })
  },
})

export const { gymLogout, logout, setToken } = authSlice.actions
export default authSlice.reducer
