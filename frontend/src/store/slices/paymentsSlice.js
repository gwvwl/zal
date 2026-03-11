import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import $api from '../../api/http.js'

const PER_PAGE = 50

export const fetchPayments = createAsyncThunk(
  'payments/fetch',
  async (page = 1, { rejectWithValue }) => {
    try {
      const { data } = await $api.get('/payments', {
        params: { limit: PER_PAGE, offset: (page - 1) * PER_PAGE },
      })
      return { ...data, page }
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Помилка завантаження')
    }
  }
)

export const createPaymentThunk = createAsyncThunk(
  'payments/create',
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await $api.post('/payments', payload)
      return data
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Помилка збереження')
    }
  }
)

const paymentsSlice = createSlice({
  name: 'payments',
  initialState: {
    items: [],
    total: 0,
    loading: false,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPayments.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchPayments.fulfilled, (state, action) => {
        state.items = action.payload.items
        state.total = action.payload.total
        state.loading = false
      })
      .addCase(fetchPayments.rejected, (state) => {
        state.loading = false
      })
  },
})

export default paymentsSlice.reducer
