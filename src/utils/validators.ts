// utils/validators.ts
export type ValidationRule = {
  rule: (value: any) => boolean;  
  message: string;
};

export const required: ValidationRule = {
  rule: (value) => value.trim().length > 0,
  message: "This field is required",
};

export const documentRequired: ValidationRule = {
  rule: (value) => {
    // If it's a file input, check if a file exists
    if (value instanceof File) {
      return value.size > 0;
    }

    // If it's an array of files (e.g. multiple uploads)
    if (Array.isArray(value)) {
      return value.length > 0 && value.every(file => file instanceof File);
    }

    // If it's a string (maybe base64 or path)
    if (typeof value === "string") {
      return value.trim().length > 0;
    }

    return false;
  },
  message: "This document is required",
};

export const email: ValidationRule = {
  rule: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  message: "Invalid email address",
};

export const phone: ValidationRule = {
  rule: (value) => /^[0-9]{10}$/.test(value),
  message: "Phone number must be 10 digits",
};

export const year: ValidationRule = {
  rule: (value) => /^[0-9]{4}$/.test(value),
  message: "This field must contain 4 digits only",
};

export const numbersOnly: ValidationRule = {
  rule: (value) => /^[0-9]+(\.[0-9]+)?$/.test(value),
  message: "Only numbers are allowed",
};

export const positiveNumber: ValidationRule = {
  rule: (value) => {
    // allow string or number, convert to float
    const num = parseFloat(value);
    return !isNaN(num) && num > 0;
  },
  message: "Value must be a positive number greater than 0",
};

export const alphanumericWithSpaces: ValidationRule = {
  rule: (value) => /^[a-zA-Z0-9 ]+$/.test(value),
  message: "Only letters, numbers, and spaces are allowed",
};  

export const strongPassword: ValidationRule = {
  rule: (value) =>
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(
      value
    ),
  message:
    "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character",
};

export const atLeastOneSelected: ValidationRule = {
  rule: (value: any) => {
    // Check if value is an array and has at least one item
    return Array.isArray(value) && value.length > 0;
  },
  message: "Please select at least one option",
};

export function validateFieldsMatch(
  fieldTitle1: string,
  value1: string,
  fieldTitle2: string,
  value2: string
): string | null {
  if (value1 !== value2) {
    return `${fieldTitle1} and ${fieldTitle2} must match`;
  }
  return null;
}

export function validateField(value: string, rules: ValidationRule[]): string | null {
  for (const { rule, message } of rules) {
    if (!rule(value)) return message;
  }
  return null;
}

// Generic validator
export function validateFieldWithLabel(
  value: any,
  rules: ValidationRule[],
  fieldTitle: string
): string | null {
  for (const { rule, message } of rules) {
    if (!rule(value)) {
      // Field: Error
      return `${fieldTitle}: ${message}`;
    }
  }
  return null;
}

export function validateArrayOfObjects<T extends Record<string, any>>(
  items: T[],
  rulesMap: {
    [K in keyof T]?: { rules: ValidationRule[]; title: string };
  },
  sectionTitle: string
): string[] {
  const errors: string[] = [];

  items.forEach((item, index) => {
    
    for (const key in rulesMap) {
      const fieldConfig = rulesMap[key];

      if (fieldConfig) {
        const { rules, title } = fieldConfig;
        const value = item[key];

        for (const { rule, message } of rules) {
          if (!rule(value)) {
            errors.push(
              `${sectionTitle} ${index + 1} - ${title}: ${message}`
            );
            break; // stop at first error for this field
          }
        }
      }
    }
  });

  return errors;
}