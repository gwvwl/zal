import { createSlice } from '@reduxjs/toolkit'

const paymentsSlice = createSlice({
  name: 'payments',
  initialState: { list: [] },
  reducers: {
    setPayments(state, action) { state.list = action.payload },
    addPayment(state, action) { state.list.unshift(action.payload) },
  },
})

export const { setPayments, addPayment } = paymentsSlice.actions
export default paymentsSlice.reducer
