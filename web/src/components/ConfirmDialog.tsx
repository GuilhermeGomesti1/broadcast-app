import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material'

interface Props {
  open: boolean
  title: string
  description: string
  onConfirm: () => void
  onCancel: () => void
}

export const ConfirmDialog = ({ open, title, description, onConfirm, onCancel }: Props) => (
  <Dialog open={open} onClose={onCancel}>
    <DialogTitle>{title}</DialogTitle>
    <DialogContent>
      <DialogContentText>{description}</DialogContentText>
    </DialogContent>
    <DialogActions>
      <Button onClick={onCancel}>Cancelar</Button>
      <Button onClick={onConfirm} color="error" variant="contained">
        Excluir
      </Button>
    </DialogActions>
  </Dialog>
)
