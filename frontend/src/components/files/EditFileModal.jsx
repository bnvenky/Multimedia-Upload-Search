import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useUpdateFileMutation } from '../../hooks/useFileQueries';
import { showToast } from '../../store/toastsSlice';
import { getFieldErrors } from '../../utils/errors';
import Button from '../common/Button';
import Modal from '../common/Modal';
import TagInput from '../common/TagInput';
import TextField from '../common/TextField';
import VisibilityToggle from '../upload/VisibilityToggle';

/** Mounted only while open, so the form always starts from the latest file data. */
const EditFileModal = ({ file, onClose }) => {
  const dispatch = useDispatch();
  const updateFile = useUpdateFileMutation();
  const [form, setForm] = useState({
    title: file.title,
    description: file.description,
    tags: file.tags,
    visibility: file.visibility,
  });

  const fieldErrors = getFieldErrors(updateFile.error);
  const setField = (key) => (value) => setForm((current) => ({ ...current, [key]: value }));

  const handleSubmit = (event) => {
    event.preventDefault();
    updateFile.mutate(
      { id: file.id, ...form, title: form.title.trim() },
      {
        // Failures are reported as toasts by the global mutation error handler.
        onSuccess: () => {
          dispatch(showToast({ type: 'success', title: 'Changes saved' }));
          onClose();
        },
      },
    );
  };

  return (
    <Modal
      open
      title="Edit details"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={updateFile.isPending}>
            Cancel
          </Button>
          <Button type="submit" form="edit-file-form" loading={updateFile.isPending}>
            Save changes
          </Button>
        </>
      }
    >
      <form id="edit-file-form" onSubmit={handleSubmit} className="grid gap-4">
        <TextField label="Title" value={form.title} maxLength={120} required error={fieldErrors.title} onChange={(event) => setField('title')(event.target.value)} />
        <TextField
          as="textarea"
          label="Description"
          rows={3}
          maxLength={1000}
          value={form.description}
          error={fieldErrors.description}
          onChange={(event) => setField('description')(event.target.value)}
        />
        <TagInput value={form.tags} onChange={setField('tags')} />
        <VisibilityToggle value={form.visibility} onChange={setField('visibility')} />
      </form>
    </Modal>
  );
};

export default EditFileModal;
