import { ReactNode, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Divider,
  Avatar,
  Tooltip,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import WifiIcon from '@mui/icons-material/Wifi'
import LogoutIcon from '@mui/icons-material/Logout'
import BroadcastOnPersonalIcon from '@mui/icons-material/BroadcastOnPersonal'
import { logout } from '../services/auth'
import { useAuthContext } from '../contexts/AuthContext'

const DRAWER_WIDTH = 220

interface Props {
  children: ReactNode
}

export const AppLayout = ({ children }: Props) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [open, setOpen] = useState(true)
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuthContext()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const drawerContent = (
    <>
      <Toolbar>
        <BroadcastOnPersonalIcon sx={{ color: 'primary.main', mr: 1 }} />
        <Typography variant="h6" fontWeight={700} color="primary.main">
          Broadcast
        </Typography>
      </Toolbar>
      <Divider />
      <List sx={{ pt: 1, px: 1 }}>
        <ListItemButton
          selected={location.pathname.startsWith('/connections')}
          onClick={() => {
            navigate('/connections')
            if (isMobile) setOpen(false)
          }}
          sx={{
            borderRadius: 2,
            '&.Mui-selected': {
              bgcolor: 'primary.main',
              color: 'white',
              '& .MuiListItemIcon-root': { color: 'white' },
              '&:hover': { bgcolor: 'primary.dark' },
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 36 }}>
            <WifiIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Conexões" primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }} />
        </ListItemButton>
      </List>
    </>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'grey.50' }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          bgcolor: 'white',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Toolbar variant="dense" sx={{ minHeight: 56 }}>
          <IconButton edge="start" onClick={() => setOpen((prev) => !prev)} sx={{ color: 'text.primary', mr: 1 }}>
            <MenuIcon />
          </IconButton>
          <Box sx={{ flex: 1 }} />
          <Typography variant="body2" sx={{ color: 'text.secondary', display: { xs: 'none', sm: 'block' }, mr: 1.5, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.email}
          </Typography>
          <Tooltip title={user?.email ?? ''}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 13, cursor: 'pointer' }}>
              {user?.email?.[0]?.toUpperCase()}
            </Avatar>
          </Tooltip>
          <Tooltip title="Sair">
            <IconButton onClick={handleLogout} sx={{ color: 'text.secondary', ml: 0.5 }}>
              <LogoutIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      {isMobile ? (
        <Drawer
          variant="temporary"
          open={open}
          onClose={() => setOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}
        >
          {drawerContent}
        </Drawer>
      ) : (
        <Drawer
          variant="permanent"
          open={open}
          sx={{
            width: open ? DRAWER_WIDTH : 0,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
              transform: open ? 'none' : `translateX(-${DRAWER_WIDTH}px)`,
              transition: 'transform 0.2s ease',
              borderRight: '1px solid',
              borderColor: 'divider',
              bgcolor: 'white',
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Toolbar variant="dense" sx={{ minHeight: 56, flexShrink: 0 }} />
        <Box sx={{ p: { xs: 2, sm: 3 }, flexGrow: 1 }}>
          {children}
        </Box>
      </Box>
    </Box>
  )
}
