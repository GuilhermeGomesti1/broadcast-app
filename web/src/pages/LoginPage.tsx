import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Button,
  Card,
  CardContent,
  Tab,
  Tabs,
  TextField,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
} from '@mui/material'
import EmailIcon from '@mui/icons-material/Email'
import LockIcon from '@mui/icons-material/Lock'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import BroadcastOnPersonalIcon from '@mui/icons-material/BroadcastOnPersonal'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { login, register } from '../services/auth'

const schema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})
type FormData = z.infer<typeof schema>

export const LoginPage = () => {
  const [tab, setTab] = useState(0)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()

  const {
    register: reg,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setError('')
    try {
      if (tab === 0) {
        await login(data.email, data.password)
      } else {
        await register(data.email, data.password)
      }
      navigate('/connections')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : ''
      if (msg.includes('invalid-credential') || msg.includes('wrong-password')) {
        setError('E-mail ou senha inválidos')
      } else if (msg.includes('email-already-in-use')) {
        setError('E-mail já cadastrado')
      } else if (msg.includes('user-not-found')) {
        setError('Usuário não encontrado')
      } else {
        setError('Ocorreu um erro. Tente novamente.')
      }
    }
  }

  return (
    <Box className="min-h-screen flex flex-col md:flex-row">
      <Box className="hidden md:flex flex-col justify-center items-center w-5/12 bg-blue-700 p-12 gap-6">
        <BroadcastOnPersonalIcon sx={{ fontSize: 72, color: 'white' }} />
        <Typography variant="h3" className="text-white font-bold text-center">
          Broadcast
        </Typography>
        <Typography variant="body1" className="text-blue-100 text-center max-w-xs">
          Gerencie suas conexões, contatos e mensagens em um só lugar.
        </Typography>
      </Box>

      <Box className="flex flex-1 items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md shadow-lg" elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
          <CardContent className="p-8">
            <Box className="flex md:hidden justify-center mb-6">
              <Box className="flex items-center gap-2">
                <BroadcastOnPersonalIcon className="text-blue-700" sx={{ fontSize: 36 }} />
                <Typography variant="h5" className="font-bold text-blue-700">
                  Broadcast
                </Typography>
              </Box>
            </Box>

            <Typography variant="h5" className="font-bold mb-1 text-gray-800">
              {tab === 0 ? 'Bem-vindo de volta' : 'Criar conta'}
            </Typography>
            <Typography variant="body2" className="text-gray-500 mb-6">
              {tab === 0 ? 'Entre com sua conta para continuar' : 'Preencha os dados para se cadastrar'}
            </Typography>

            <Tabs
              value={tab}
              onChange={(_, value) => { setTab(value); setError('') }}
              className="mb-6"
              sx={{ borderBottom: '1px solid', borderColor: 'divider' }}
            >
              <Tab label="Entrar" sx={{ fontWeight: 600 }} />
              <Tab label="Cadastrar" sx={{ fontWeight: 600 }} />
            </Tabs>

            {error && (
              <Alert severity="error" className="mb-4" onClose={() => setError('')}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <TextField
                label="E-mail"
                type="email"
                fullWidth
                {...reg('email')}
                error={!!errors.email}
                helperText={errors.email?.message}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon fontSize="small" className="text-gray-400" />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                label="Senha"
                type={showPassword ? 'text' : 'password'}
                fullWidth
                {...reg('password')}
                error={!!errors.password}
                helperText={errors.password?.message}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon fontSize="small" className="text-gray-400" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setShowPassword((prev) => !prev)} edge="end">
                        {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={isSubmitting}
                className="mt-2"
                sx={{ py: 1.5, fontWeight: 700, borderRadius: 2 }}
              >
                {isSubmitting ? 'Aguarde...' : tab === 0 ? 'Entrar' : 'Criar conta'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  )
}
