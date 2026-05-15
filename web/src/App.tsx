import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { AuthProvider } from './contexts/AuthContext'
import { PrivateRoute } from './components/PrivateRoute'
import { AppLayout } from './components/AppLayout'
import { LoginPage } from './pages/LoginPage'
import { ConnectionsPage } from './pages/ConnectionsPage'
import { ContactsPage } from './pages/ContactsPage'
import { MessagesPage } from './pages/MessagesPage'

const theme = createTheme({
  palette: {
    primary: { main: '#1d4ed8' },
  },
})

const App = () => (
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/connections"
            element={
              <PrivateRoute>
                <AppLayout>
                  <ConnectionsPage />
                </AppLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/connections/:connectionId/contacts"
            element={
              <PrivateRoute>
                <AppLayout>
                  <ContactsPage />
                </AppLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/connections/:connectionId/messages"
            element={
              <PrivateRoute>
                <AppLayout>
                  <MessagesPage />
                </AppLayout>
              </PrivateRoute>
            }
          />
          <Route path="*" element={<Navigate to="/connections" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </ThemeProvider>
)

export default App
