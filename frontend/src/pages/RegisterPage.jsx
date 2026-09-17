import { Check } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';
import PasswordField from '../components/common/PasswordField';
import TextField from '../components/common/TextField';
import { useRegisterMutation } from '../hooks/useAuthMutations';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { cn } from '../utils/cn';
import { getFieldErrors } from '../utils/errors';
import { isPasswordValid, PASSWORD_RULES } from '../utils/validation';
import AuthLayout from './AuthLayout';

const RegisterPage = () => {
  useDocumentTitle('Create account');
  const navigate = useNavigate();
  const register = useRegisterMutation();
  const [form, setForm] = useState({ name: '', email: '', password: '' });

  // Errors are shown as toasts globally; field-level validation messages also appear under the inputs.
  const fieldErrors = getFieldErrors(register.error);
  const canSubmit = isPasswordValid(form.password) && form.name.trim() && form.email.trim();

  const handleChange = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const handleSubmit = (event) => {
    event.preventDefault();
    register.mutate(form, { onSuccess: () => navigate('/', { replace: true }) });
  };

  return (
    <AuthLayout title="Create your account" subtitle="Start uploading and searching your media in seconds.">
      <form onSubmit={handleSubmit} noValidate className="grid gap-4">
        <TextField label="Name" name="name" autoComplete="name" required value={form.name} onChange={handleChange} error={fieldErrors.name} />
        <TextField label="Email" name="email" type="email" autoComplete="email" required value={form.email} onChange={handleChange} error={fieldErrors.email} />
        <PasswordField label="Password" name="password" autoComplete="new-password" required value={form.password} onChange={handleChange} error={fieldErrors.password} />

        <ul aria-label="Password requirements" className="-mt-1 flex flex-wrap gap-x-3.5 gap-y-1.5 text-[0.8rem] text-subtle">
          {PASSWORD_RULES.map((rule) => {
            const met = rule.test(form.password);
            return (
              <li key={rule.label} data-met={met} className={cn('inline-flex items-center gap-1 transition-colors', met && 'text-success')}>
                <Check size={14} aria-hidden className={cn(!met && 'opacity-35')} /> {rule.label}
                <span className="sr-only">{met ? '(done)' : '(not yet)'}</span>
              </li>
            );
          })}
        </ul>

        <Button type="submit" size="lg" block loading={register.isPending} disabled={!canSubmit}>
          Create account
        </Button>
      </form>
      <p className="mt-6 text-center text-[0.9rem] text-muted">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-accent">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
};

export default RegisterPage;
