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
    <div className="mb-4">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        {...inputProps}
        className={`w-full px-4 py-2 border rounded-lg transition focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          error
            ? 'border-red-300 bg-red-50 focus:ring-red-500'
            : 'border-gray-300 bg-white hover:border-gray-400'
        }`}
      />
      {error && (
        <p className="text-sm text-red-600 mt-1">{error}</p>
      )}
      {helpText && !error && (
        <p className="text-sm text-gray-500 mt-1">{helpText}</p>
      )}
    </div>
  );
};
