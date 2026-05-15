import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Fab,
  FormControlLabel,
  FormGroup,
  IconButton,
  Paper,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
  Avatar,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import SendIcon from '@mui/icons-material/Send'
import ScheduleIcon from '@mui/icons-material/Schedule'
import MessageIcon from '@mui/icons-material/Message'
import PersonIcon from '@mui/icons-material/Person'
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs, { Dayjs } from 'dayjs'
import 'dayjs/locale/pt-br'
import { useAuthContext } from '../contexts/AuthContext'
import { useMessages } from '../hooks/useMessages'
import { useContacts } from '../hooks/useContacts'
import { useConnections } from '../hooks/useConnections'
import { createMessage, updateMessage, deleteMessage } from '../services/messages'
import { ConfirmDialog } from '../components/ConfirmDialog'
import type { Message, MessageStatus } from '../types'

const TABS: { value: MessageStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'scheduled', label: 'Agendadas' },
  { value: 'sent', label: 'Enviadas' },
]

export const MessagesPage = () => {
  const { connectionId } = useParams<{ connectionId: string }>()
  const { user } = useAuthContext()
  const navigate = useNavigate()

  const [statusFilter, setStatusFilter] = useState<MessageStatus | 'all'>('all')
  const { messages, loading } = useMessages(user?.uid, connectionId, statusFilter)
  const { contacts } = useContacts(user?.uid, connectionId)
  const { connections } = useConnections(user?.uid)
  const connection = connections.find((conn) => conn.id === connectionId)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Message | null>(null)
  const [content, setContent] = useState('')
  const [contentError, setContentError] = useState('')
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([])
  const [contactError, setContactError] = useState('')
  const [scheduledAt, setScheduledAt] = useState<Dayjs>(dayjs().add(1, 'hour'))
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Message | null>(null)

  const openCreate = () => {
    setEditing(null); setContent(''); setContentError('')
    setSelectedContactIds([]); setContactError('')
    setScheduledAt(dayjs().add(1, 'hour'))
    setDialogOpen(true)
  }

  const openEdit = (msg: Message) => {
    if (msg.status === 'sent') return
    setEditing(msg); setContent(msg.content); setContentError('')
    setSelectedContactIds(msg.contactIds); setContactError('')
    setScheduledAt(dayjs(msg.scheduledAt))
    setDialogOpen(true)
  }

  const toggleContact = (id: string) => {
    setSelectedContactIds((prev) => prev.includes(id) ? prev.filter((contactId) => contactId !== id) : [...prev, id])
    setContactError('')
  }

  const handleSave = async () => {
    let valid = true
    if (!content.trim()) { setContentError('Mensagem é obrigatória'); valid = false }
    if (selectedContactIds.length === 0) { setContactError('Selecione ao menos um contato'); valid = false }
    if (!scheduledAt.isValid() || scheduledAt.isBefore(dayjs())) { setContentError('Escolha uma data futura'); valid = false }
    if (!valid) return
    setSaving(true)
    if (editing) {
      await updateMessage(editing.id, { content: content.trim(), contactIds: selectedContactIds, scheduledAt: scheduledAt.valueOf() })
    } else {
      await createMessage(user!.uid, connectionId!, selectedContactIds, content.trim(), scheduledAt.valueOf())
    }
    setSaving(false)
    setDialogOpen(false)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    await deleteMessage(deleteTarget.id)
    setDeleteTarget(null)
  }

  const getContactNames = (ids: string[]) =>
    ids.map((id) => contacts.find((contact) => contact.id === id)?.name ?? '—').join(', ')

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <IconButton onClick={() => navigate(`/connections/${connectionId}/contacts`)} size="small" sx={{ border: '1px solid', borderColor: 'divider', mt: 0.5 }}>
            <ArrowBackIcon fontSize="small" />
          </IconButton>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h5" fontWeight={700} color="text.primary">Mensagens</Typography>
            {connection && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                <Typography variant="body2" color="text.secondary">Conexão:</Typography>
                <Chip label={connection.name} size="small" color="primary" variant="outlined" />
              </Box>
            )}
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openCreate}
            sx={{ borderRadius: 2, fontWeight: 600, display: { xs: 'none', sm: 'flex' } }}
          >
            Nova mensagem
          </Button>
        </Box>

        <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 3 }}>
          <Tabs value={statusFilter} onChange={(_, value) => setStatusFilter(value)} sx={{ px: 1 }}>
            {TABS.map((tabItem) => (
              <Tab key={tabItem.value} label={tabItem.label} value={tabItem.value} sx={{ fontWeight: 600, fontSize: 13 }} />
            ))}
          </Tabs>
        </Paper>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 16 }}>
            <CircularProgress />
          </Box>
        ) : messages.length === 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 16, gap: 2 }}>
            <Box sx={{ width: 72, height: 72, borderRadius: '50%', bgcolor: 'primary.50', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MessageIcon sx={{ fontSize: 36, color: 'primary.main' }} />
            </Box>
            <Typography variant="h6" color="text.secondary" fontWeight={600}>Nenhuma mensagem encontrada</Typography>
            <Typography variant="body2" color="text.disabled" textAlign="center">
              {statusFilter === 'all' ? 'Crie sua primeira mensagem agendada' : `Sem mensagens ${statusFilter === 'scheduled' ? 'agendadas' : 'enviadas'}`}
            </Typography>
            {statusFilter === 'all' && (
              <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} sx={{ borderRadius: 2, mt: 1 }}>
                Nova mensagem
              </Button>
            )}
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {messages.map((msg) => (
              <Paper key={msg.id} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                <Box sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <Box sx={{ width: 40, height: 40, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, bgcolor: msg.status === 'sent' ? 'success.50' : 'warning.50' }}>
                      {msg.status === 'sent'
                        ? <SendIcon sx={{ fontSize: 18, color: 'success.700' }} />
                        : <ScheduleIcon sx={{ fontSize: 18, color: 'warning.800' }} />}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                        <Chip
                          size="small"
                          label={msg.status === 'sent' ? 'Enviada' : 'Agendada'}
                          color={msg.status === 'sent' ? 'success' : 'warning'}
                          sx={{ fontWeight: 600, fontSize: 11 }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {msg.status === 'sent'
                            ? `Enviada em ${dayjs(msg.sentAt!).format('DD/MM/YYYY [às] HH:mm')}`
                            : `Agendada para ${dayjs(msg.scheduledAt).format('DD/MM/YYYY [às] HH:mm')}`}
                        </Typography>
                      </Box>
                      <Typography variant="body1" fontWeight={500} sx={{ wordBreak: 'break-word', mb: 1.5 }}>
                        {msg.content}
                      </Typography>
                      <Divider sx={{ mb: 1.5 }} />
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <PersonIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                        <Typography variant="caption" color="text.secondary">{getContactNames(msg.contactIds)}</Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                      {msg.status === 'scheduled' && (
                        <Tooltip title="Editar">
                          <IconButton size="small" onClick={() => openEdit(msg)}>
                            <EditIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Excluir">
                        <IconButton size="small" color="error" onClick={() => setDeleteTarget(msg)}>
                          <DeleteIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                </Box>
              </Paper>
            ))}
          </Box>
        )}

        <Fab color="primary" onClick={openCreate} sx={{ position: 'fixed', bottom: 32, right: 32, display: { xs: 'flex', sm: 'none' } }}>
          <AddIcon />
        </Fab>

        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
          <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
            {editing ? 'Editar mensagem' : 'Nova mensagem'}
          </DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            <Box>
              <Typography variant="body2" fontWeight={500} color="text.secondary" sx={{ mb: 0.75 }}>Mensagem</Typography>
              <TextField
                multiline
                rows={3}
                fullWidth
                value={content}
                onChange={(e) => { setContent(e.target.value); setContentError('') }}
                error={!!contentError}
                helperText={contentError}
                placeholder="Digite o conteúdo da mensagem..."
                autoFocus
              />
            </Box>

            <Box>
              <Typography variant="body2" fontWeight={500} color="text.secondary" sx={{ mb: 0.75 }}>Destinatários</Typography>
              {contacts.length === 0 ? (
                <Alert severity="warning" sx={{ borderRadius: 2 }}>Esta conexão não tem contatos. Adicione contatos primeiro.</Alert>
              ) : (
                <Paper variant="outlined" sx={{ borderRadius: 2, maxHeight: 200, overflowY: 'auto', p: 1 }}>
                  <FormGroup>
                    {contacts.map((c) => (
                      <FormControlLabel
                        key={c.id}
                        control={<Checkbox checked={selectedContactIds.includes(c.id)} onChange={() => toggleContact(c.id)} size="small" />}
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ width: 24, height: 24, fontSize: 11, bgcolor: 'primary.main' }}>{c.name[0]}</Avatar>
                            <Typography variant="body2">{c.name}</Typography>
                            <Typography variant="caption" color="text.secondary">{c.phone}</Typography>
                          </Box>
                        }
                      />
                    ))}
                  </FormGroup>
                </Paper>
              )}
              {contactError && <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>{contactError}</Typography>}
            </Box>

            <Box>
              <Typography variant="body2" fontWeight={500} color="text.secondary" sx={{ mb: 0.75 }}>Agendar para</Typography>
              <DateTimePicker
                value={scheduledAt}
                onChange={(value) => value && setScheduledAt(value)}
                minDateTime={dayjs()}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Box>
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
          title="Excluir mensagem"
          description="Deseja excluir esta mensagem? Esta ação não pode ser desfeita."
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      </Box>
    </LocalizationProvider>
  )
}
