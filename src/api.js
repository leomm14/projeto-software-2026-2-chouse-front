const API_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')
export class ApiError extends Error {
  constructor(message, status) { super(message); this.status = status }
}
export async function request(path, { token, body, ...options } = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { ...(token && { Authorization: `Bearer ${token}` }), ...(body && { 'Content-Type': 'application/json' }) },
    ...(body && { body: JSON.stringify(body) }),
  })
  if (!response.ok) {
    const message = response.status === 409
      ? 'Você já participou deste confronto, ou ele ainda não tem votos suficientes para um palpite.'
      : response.status === 403 ? 'Sua conta não tem permissão para realizar esta ação.'
        : response.status === 401 ? 'Sua sessão expirou. Entre novamente para continuar.'
          : 'Não foi possível concluir a ação. Tente novamente em instantes.'
    throw new ApiError(message, response.status)
  }
  if (response.status === 204) return null
  if (!(response.headers.get('content-type') || '').includes('application/json')) throw new ApiError('O serviço está indisponível no momento.', 503)
  return response.json()
}
export function readRoles(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(base64))['https://social-insper.com/roles'] || []
  } catch { return [] }
}
