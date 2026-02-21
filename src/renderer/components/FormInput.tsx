import React from 'react';

interface FormInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helpText?: string;
}

export const FormInput: React.FC<FormInputProps> = ({
  label,
  error,
  helpText,
  id,
  ...inputProps
}) => {
  const inputId = id || `input-${Math.random()}`;

  return (
    <div className="mb-5">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-zinc-700 mb-1.5"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        {...inputProps}
        className={`w-full px-4 py-2.5 border rounded-xl bg-white text-zinc-900 placeholder:text-zinc-400 transition-all duration-200 focus:outline-none focus:ring-2 disabled:bg-zinc-50 disabled:text-zinc-400 disabled:cursor-not-allowed ${
          error
            ? 'border-red-300 bg-red-50/50 focus:ring-red-500/20 focus:border-red-500'
            : 'border-zinc-200 focus:ring-brand-500/20 focus:border-brand-500 hover:border-zinc-300'
        }`}
      />
      {error && (
        <p className="text-sm text-red-600 mt-1">{error}</p>
      )}
      {helpText && !error && (
        <p className="text-sm text-zinc-500 mt-1">{helpText}</p>
      )}
    </div>
  );
};
