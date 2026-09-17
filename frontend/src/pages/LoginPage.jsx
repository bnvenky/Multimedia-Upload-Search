import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';
import PasswordField from '../components/common/PasswordField';
import TextField from '../components/common/TextField';
import { useLoginMutation } from '../hooks/useAuthMutations';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { getFieldErrors } from '../utils/errors';
import AuthLayout from './AuthLayout';

const LoginPage = () => {
  useDocumentTitle('Sign in');
  const navigate = useNavigate();
  const location = useLocation();
  const login = useLoginMutation();
  const [form, setForm] = useState({ email: '', password: '' });

  // Errors are shown as toasts globally; field-level validation messages also appear under the inputs.
  const fieldErrors = getFieldErrors(login.error);

  const handleChange = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const handleSubmit = (event) => {
    event.preventDefault();
    login.mutate(form, { onSuccess: () => navigate(location.state?.from ?? '/', { replace: true }) });
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to search and manage your media library.">
      <form onSubmit={handleSubmit} noValidate className="grid gap-4">
        <TextField label="Email" name="email" type="email" autoComplete="email" required value={form.email} onChange={handleChange} error={fieldErrors.email} />
        <PasswordField label="Password" name="password" autoComplete="current-password" required value={form.password} onChange={handleChange} error={fieldErrors.password} />
        <Button type="submit" size="lg" block loading={login.isPending}>
          Sign in
        </Button>
      </form>
      <p className="mt-6 text-center text-[0.9rem] text-muted">
        New here?{' '}
        <Link to="/register" className="font-semibold text-accent">
          Create an account
        </Link>
      </p>
    </AuthLayout>
  );
};

export default LoginPage;
