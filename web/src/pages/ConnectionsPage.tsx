import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Fab,
  IconButton,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import WifiIcon from '@mui/icons-material/Wifi'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { useAuthContext } from '../contexts/AuthContext'
import { useConnections } from '../hooks/useConnections'
import { createConnection, updateConnection, deleteConnection } from '../services/connections'
import { ConfirmDialog } from '../components/ConfirmDialog'
import type { Connection } from '../types'

export const ConnectionsPage = () => {
  const { user } = useAuthContext()
  const { connections, loading } = useConnections(user?.uid)
  const navigate = useNavigate()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Connection | null>(null)
  const [name, setName] = useState('')
  const [nameError, setNameError] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Connection | null>(null)

  const openCreate = () => {
    setEditing(null)
    setName('')
    setNameError('')
    setDialogOpen(true)
  }

  const openEdit = (conn: Connection) => {
    setEditing(conn)
    setName(conn.name)
    setNameError('')
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!name.trim()) { setNameError('Nome é obrigatório'); return }
    setSaving(true)
    if (editing) {
      await updateConnection(editing.id, name.trim())
    } else {
      await createConnection(user!.uid, name.trim())
    }
    setSaving(false)
    setDialogOpen(false)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    await deleteConnection(deleteTarget.id)
    setDeleteTarget(null)
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} color="text.primary">
            Conexões
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {connections.length} {connections.length === 1 ? 'conexão' : 'conexões'}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openCreate}
          sx={{ borderRadius: 2, fontWeight: 600, display: { xs: 'none', sm: 'flex' } }}
        >
          Nova conexão
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 16 }}>
          <CircularProgress />
        </Box>
      ) : connections.length === 0 ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 16, gap: 2 }}>
          <Box sx={{ width: 72, height: 72, borderRadius: '50%', bgcolor: 'primary.50', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <WifiIcon sx={{ fontSize: 36, color: 'primary.main' }} />
          </Box>
          <Typography variant="h6" color="text.secondary" fontWeight={600}>Nenhuma conexão ainda</Typography>
          <Typography variant="body2" color="text.disabled">Crie sua primeira conexão para começar</Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} sx={{ borderRadius: 2, mt: 1 }}>
            Criar conexão
          </Button>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {connections.map((conn) => (
            <Card
              key={conn.id}
              elevation={0}
              sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, '&:hover': { boxShadow: 2 }, transition: 'box-shadow 0.2s' }}
            >
              <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ width: 44, height: 44, borderRadius: 2.5, bgcolor: 'primary.50', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <WifiIcon sx={{ color: 'primary.main' }} />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle1" fontWeight={600} noWrap>{conn.name}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
                    <Tooltip title="Editar">
                      <IconButton size="small" onClick={() => openEdit(conn)}>
                        <EditIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Excluir">
                      <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); setDeleteTarget(conn) }}>
                        <DeleteIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Ver contatos">
                      <IconButton size="small" onClick={() => navigate(`/connections/${conn.id}/contacts`)} sx={{ color: 'text.disabled' }}>
                        <ChevronRightIcon sx={{ fontSize: 22 }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      <Fab
        color="primary"
        onClick={openCreate}
        sx={{ position: 'fixed', bottom: 32, right: 32, display: { xs: 'flex', sm: 'none' } }}
      >
        <AddIcon />
      </Fab>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
          {editing ? 'Editar conexão' : 'Nova conexão'}
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Nome</Typography>
          <TextField
            fullWidth
            autoFocus
            value={name}
            onChange={(e) => { setName(e.target.value); setNameError('') }}
            error={!!nameError}
            helperText={nameError}
            placeholder="Ex: WhatsApp Principal"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ borderRadius: 2 }}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving} sx={{ borderRadius: 2, fontWeight: 600 }}>
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Excluir conexão"
        description={`Deseja excluir "${deleteTarget?.name}"? Esta ação não pode ser desfeita.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </Box>
  )
}
