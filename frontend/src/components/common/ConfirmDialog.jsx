import Button from './Button';
import Modal from './Modal';

const ConfirmDialog = ({ open, title, message, confirmLabel = 'Confirm', danger = false, loading = false, onConfirm, onCancel }) => (
  <Modal
    open={open}
    title={title}
    onClose={onCancel}
    size="sm"
    footer={
      <>
        <Button variant="ghost" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>
          {confirmLabel}
        </Button>
      </>
    }
  >
    <p className="text-muted">{message}</p>
  </Modal>
);

export default ConfirmDialog;
