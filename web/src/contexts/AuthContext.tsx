import { createContext, useContext, ReactNode } from 'react'
import { User } from 'firebase/auth'
import { useAuth } from '../hooks/useAuth'

interface AuthContextValue {
  user: User | null
  loading: boolean
}

const AuthContext = createContext<AuthContextValue>({ user: null, loading: true })

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const auth = useAuth()
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
}

export const useAuthContext = () => useContext(AuthContext)
