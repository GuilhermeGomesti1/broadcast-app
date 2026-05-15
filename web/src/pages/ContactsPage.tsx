import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Box,
  Button,
  Chip,
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
  Card,
  CardContent,
  Avatar,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import MessageIcon from '@mui/icons-material/Message'
import PersonIcon from '@mui/icons-material/Person'
import PhoneIcon from '@mui/icons-material/Phone'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuthContext } from '../contexts/AuthContext'
import { useContacts } from '../hooks/useContacts'
import { useConnections } from '../hooks/useConnections'
import { createContact, updateContact, deleteContact } from '../services/contacts'
import { ConfirmDialog } from '../components/ConfirmDialog'
import type { Contact } from '../types'

const schema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  phone: z.string().min(1, 'Telefone é obrigatório'),
})
type FormData = z.infer<typeof schema>

export const ContactsPage = () => {
  const { connectionId } = useParams<{ connectionId: string }>()
  const { user } = useAuthContext()
  const { contacts, loading } = useContacts(user?.uid, connectionId)
  const { connections } = useConnections(user?.uid)
  const navigate = useNavigate()

  const connection = connections.find((conn) => conn.id === connectionId)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Contact | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Contact | null>(null)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } =
    useForm<FormData>({ resolver: zodResolver(schema) })

  const openCreate = () => {
    setEditing(null)
    reset({ name: '', phone: '' })
    setDialogOpen(true)
  }

  const openEdit = (contact: Contact) => {
    setEditing(contact)
    reset({ name: contact.name, phone: contact.phone })
    setDialogOpen(true)
  }

  const onSubmit = async (data: FormData) => {
    if (editing) {
      await updateContact(editing.id, data.name, data.phone)
    } else {
      await createContact(user!.uid, connectionId!, data.name, data.phone)
    }
    setDialogOpen(false)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    await deleteContact(deleteTarget.id)
    setDeleteTarget(null)
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <IconButton onClick={() => navigate('/connections')} size="small" sx={{ border: '1px solid', borderColor: 'divider', mt: 0.5 }}>
          <ArrowBackIcon fontSize="small" />
        </IconButton>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h5" fontWeight={700} color="text.primary">
            Contatos
          </Typography>
          {connection && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
              <Typography variant="body2" color="text.secondary">Conexão:</Typography>
              <Chip label={connection.name} size="small" color="primary" variant="outlined" />
            </Box>
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<MessageIcon />}
            onClick={() => navigate(`/connections/${connectionId}/messages`)}
            sx={{ borderRadius: 2 }}
          >
            Mensagens
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openCreate}
            sx={{ borderRadius: 2, fontWeight: 600, display: { xs: 'none', sm: 'flex' } }}
          >
            Novo contato
          </Button>
        </Box>
      </Box>

      {!loading && contacts.length > 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {contacts.length} {contacts.length === 1 ? 'contato' : 'contatos'}
        </Typography>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 16 }}>
          <CircularProgress />
        </Box>
      ) : contacts.length === 0 ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 16, gap: 2 }}>
          <Box sx={{ width: 72, height: 72, borderRadius: '50%', bgcolor: 'primary.50', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PersonIcon sx={{ fontSize: 36, color: 'primary.main' }} />
          </Box>
          <Typography variant="h6" color="text.secondary" fontWeight={600}>Nenhum contato ainda</Typography>
          <Typography variant="body2" color="text.disabled">Adicione contatos para enviar mensagens</Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} sx={{ borderRadius: 2, mt: 1 }}>
            Adicionar contato
          </Button>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {contacts.map((contact) => (
            <Card key={contact.id} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, '&:hover': { boxShadow: 1 } }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main', width: 42, height: 42, fontSize: 16, flexShrink: 0 }}>
                    {contact.name[0].toUpperCase()}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle2" fontWeight={600} noWrap>{contact.name}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                      <PhoneIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
                      <Typography variant="caption" color="text.secondary">{contact.phone}</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                    <Tooltip title="Editar">
                      <IconButton size="small" onClick={() => openEdit(contact)}>
                        <EditIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Excluir">
                      <IconButton size="small" color="error" onClick={() => setDeleteTarget(contact)}>
                        <DeleteIcon sx={{ fontSize: 18 }} />
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
          {editing ? 'Editar contato' : 'Novo contato'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" id="contact-form" onSubmit={handleSubmit(onSubmit)} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            <Box>
              <Typography variant="body2" fontWeight={500} color="text.secondary" sx={{ mb: 0.75 }}>Nome</Typography>
              <TextField
                fullWidth
                autoFocus
                placeholder="Nome do contato"
                {...register('name')}
                error={!!errors.name}
                helperText={errors.name?.message}
              />
            </Box>
            <Box>
              <Typography variant="body2" fontWeight={500} color="text.secondary" sx={{ mb: 0.75 }}>Telefone</Typography>
              <TextField
                fullWidth
                placeholder="(11) 99999-9999"
                {...register('phone')}
                error={!!errors.phone}
                helperText={errors.phone?.message}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ borderRadius: 2 }}>Cancelar</Button>
          <Button type="submit" form="contact-form" variant="contained" disabled={isSubmitting} sx={{ borderRadius: 2, fontWeight: 600 }}>
            {isSubmitting ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Excluir contato"
        description={`Deseja excluir "${deleteTarget?.name}"?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </Box>
  )
}
