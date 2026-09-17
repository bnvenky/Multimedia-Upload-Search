import { useId } from 'react';
import { cn } from '../../utils/cn';
import { inputClass, labelClass } from '../../utils/styles';

const TextField = ({ label, error, hint, as: Control = 'input', className, trailing, ...inputProps }) => {
  const id = useId();
  const messageId = `${id}-message`;

  return (
    <div className={cn('grid min-w-0 gap-1.5', className)}>
      {label && (
        <label htmlFor={id} className={labelClass}>
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        <Control
          id={id}
          aria-invalid={Boolean(error)}
          aria-describedby={error || hint ? messageId : undefined}
          className={cn(inputClass, trailing && 'pr-11', error && 'border-danger focus:border-danger focus:ring-danger/15')}
          {...inputProps}
        />
        {trailing && <div className="absolute right-1.5">{trailing}</div>}
      </div>
      {error ? (
        <p id={messageId} role="alert" className="text-[0.8rem] text-danger">
          {error}
        </p>
      ) : (
        hint && (
          <p id={messageId} className="text-[0.8rem] text-subtle">
            {hint}
          </p>
        )
      )}
    </div>
  );
};

export default TextField;
