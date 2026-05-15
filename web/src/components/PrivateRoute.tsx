import { Navigate } from 'react-router-dom'
import { useAuthContext } from '../contexts/AuthContext'
import { CircularProgress, Box } from '@mui/material'
import { ReactNode } from 'react'

export const PrivateRoute = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuthContext()

  if (loading) {
    return (
      <Box className="flex items-center justify-center min-h-screen">
        <CircularProgress />
      </Box>
    )
  }

  return user ? <>{children}</> : <Navigate to="/login" replace />
}
