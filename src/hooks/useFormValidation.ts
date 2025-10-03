// hooks/useFormValidation.ts
import { useState } from "react";
import { validateField, ValidationRule } from "../utils/validators";

export function useFormValidation<T extends Record<string, any>>(initialValues: T) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});

  const handleChange = (field: keyof T, value: string, rules?: ValidationRule[]) => {
    setValues({ ...values, [field]: value });

    if (rules) {
      const errorMessage = validateField(value, rules);
      setErrors({ ...errors, [field]: errorMessage ?? "" });
    }
  };

  const validateForm = (rulesMap: Record<keyof T, ValidationRule[]>) => {
    let valid = true;
    const newErrors: Partial<Record<keyof T, string>> = {};

    for (const key in rulesMap) {
      const error = validateField(values[key], rulesMap[key]);
      if (error) {
        newErrors[key] = error;
        valid = false;
      }
    }

    setErrors(newErrors);
    return valid;
  };

  return { values, errors, handleChange, validateForm };
}
