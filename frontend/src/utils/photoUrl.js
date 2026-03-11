import { API_URL } from '../api/http'

export const photoUrl = (path) => {
  if (!path) return null
  if (path.startsWith('http') || path.startsWith('blob:')) return path
  return `${API_URL}${path}`
}
