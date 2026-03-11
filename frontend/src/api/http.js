import axios from 'axios'

export const API_URL = import.meta.env.VITE_API_URL

const $api = axios.create({
  withCredentials: true,
  baseURL: API_URL,
})

$api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

let isRefreshing = false
let queue = []

$api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true

      if (isRefreshing) {
        return new Promise((resolve) => {
          queue.push((token) => {
            original.headers.Authorization = `Bearer ${token}`
            resolve($api(original))
          })
        })
      }

      isRefreshing = true
      try {
        const { data } = await axios.post(
          `${API_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        )
        const newToken = data.access_token
        localStorage.setItem('access_token', newToken)
        queue.forEach((cb) => cb(newToken))
        queue = []
        original.headers.Authorization = `Bearer ${newToken}`
        return $api(original)
      } catch {
        localStorage.removeItem('access_token')
        queue = []
        window.dispatchEvent(new Event('forceLogout'))
        return Promise.reject(error)
      } finally {
        isRefreshing = false
      }
    }

    if (error.response?.status === 403) {
      window.dispatchEvent(new Event('forceLogout'))
    }

    throw error
  }
)

export default $api
