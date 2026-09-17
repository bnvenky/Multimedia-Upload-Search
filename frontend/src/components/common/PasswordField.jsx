import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import IconButton from './IconButton';
import TextField from './TextField';

const PasswordField = (props) => {
  const [visible, setVisible] = useState(false);

  return (
    <TextField
      {...props}
      type={visible ? 'text' : 'password'}
      trailing={
        <IconButton size="sm" onClick={() => setVisible((current) => !current)} aria-label={visible ? 'Hide password' : 'Show password'}>
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </IconButton>
      }
    />
  );
};

export default PasswordField;
