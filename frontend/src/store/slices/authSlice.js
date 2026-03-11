import { createSlice } from '@reduxjs/toolkit'

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    token: null,
    // Gym-level auth (login/password → backend)
    selectedGym: null,      // { id, name }
    gymAuthenticated: false,
    // Worker-level auth (PIN)
    currentWorker: null,    // { id, name, role }
    isAuthenticated: false,
  },
  reducers: {
    gymLogin(state, action) {
      // payload: { id, name } — mock; when backend: also pass token
      state.selectedGym = action.payload
      state.gymAuthenticated = true
    },
    gymLogout(state) {
      state.token = null
      state.selectedGym = null
      state.gymAuthenticated = false
      state.currentWorker = null
      state.isAuthenticated = false
    },
    login(state, action) {
      // payload: { id, name, role } — mock; when backend: also pass token
      state.currentWorker = action.payload
      state.isAuthenticated = true
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
})

export const { gymLogin, gymLogout, login, logout, setToken } = authSlice.actions
export default authSlice.reducer
