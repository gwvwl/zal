import { configureStore } from '@reduxjs/toolkit'
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import { combineReducers } from 'redux'
import authReducer from './slices/authSlice.js'
import clientsReducer from './slices/clientsSlice.js'
import gymReducer from './slices/gymSlice.js'
import paymentsReducer from './slices/paymentsSlice.js'
import subscriptionsReducer from './slices/subscriptionsSlice.js'

const rootReducer = combineReducers({
  auth: authReducer,
  clients: clientsReducer,
  gym: gymReducer,
  payments: paymentsReducer,
  subscriptions: subscriptionsReducer,
})

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth'], // only persist auth; data is always loaded from API
}

const persistedReducer = persistReducer(persistConfig, rootReducer)

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
})

export const persistor = persistStore(store)
