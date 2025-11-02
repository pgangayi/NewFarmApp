// Cloudflare API client with authentication
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

const getAuthToken = () => {
  return localStorage.getItem('auth_token')
}

export const apiClient = {
  async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`
    const token = getAuthToken()

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `API request failed: ${response.statusText}`)
    }

    return response.json()
  },

  get(endpoint: string) {
    return this.request(endpoint, { method: 'GET' })
  },

  post(endpoint: string, data: Record<string, unknown>) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  put(endpoint: string, data: Record<string, unknown>) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  delete(endpoint: string) {
    return this.request(endpoint, { method: 'DELETE' })
  },

  // File upload method (doesn't set Content-Type to allow FormData boundary)
  upload(endpoint: string, formData: FormData) {
    const url = `${API_BASE_URL}${endpoint}`
    const token = getAuthToken()

    return fetch(url, {
      method: 'POST',
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: formData,
    }).then(async (response) => {
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Upload failed: ${response.statusText}`)
      }
      return response.json()
    })
  },
}

export const getCurrentUser = async () => {
  try {
    const response = await apiClient.get('/api/auth/validate')
    return response.user || null
  } catch (err) {
    return null
  }
}

export const signIn = async (email: string, password: string) => {
  const response = await apiClient.post('/api/auth/login', { email, password })
  if (response.token) {
    localStorage.setItem('auth_token', response.token)
  }
  return { data: response, error: null }
}

export const signUp = async (email: string, password: string, name: string) => {
  const response = await apiClient.post('/api/auth/signup', { email, password, name })
  if (response.token) {
    localStorage.setItem('auth_token', response.token)
  }
  return { data: response, error: null }
}

export const signOut = async () => {
  localStorage.removeItem('auth_token')
  return { error: null }
}