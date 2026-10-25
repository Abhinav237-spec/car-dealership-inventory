import { request } from './client'
import type { Credentials, Session } from './types'

export const login = (credentials: Credentials) =>
  request<Session>('/api/auth/login', { method: 'POST', body: credentials })

export const register = (credentials: Credentials) =>
  request<Session>('/api/auth/register', { method: 'POST', body: credentials })
