import { createContext, useContext, useState } from 'react';

// Initial form data structure matching the canonical JSON contract
const initialFormData = {
  schema_version: '1.0.0',
  school: {
    name: '',
    filled_by: '',
    filled_at: new Date().toISOString().split('T')[0],
  },
  policy: {
    generalists_grade_scope: 'explicit_only',
    overload_policy: 'block',
    ambiguous_data_policy: 'use_default_and_warn',
    specialist_scope_lock: true,
  },
  subjects: [],
  teachers: [],
  capabilities: [],
  preferences: [],
};

// Create Form Context
const FormContext = createContext();

// Form Provider Component
export function FormProvider({ children }) {
  const [formData, setFormData] = useState(initialFormData);
  const [currentStep, setCurrentStep] = useState(1);

  // Update form data
  const updateFormData = (updates) => {
    setFormData(prev => ({
      ...prev,
      ...updates,
    }));
  };

  // Update nested form data
  const updateNestedFormData = (path, value) => {
    setFormData(prev => {
      const newData = { ...prev };
      const pathParts = path.split('.');
      
      let current = newData;
      for (let i = 0; i < pathParts.length - 1; i++) {
        if (!current[pathParts[i]]) {
          current[pathParts[i]] = {};
        }
        current = current[pathParts[i]];
      }
      
      current[pathParts[pathParts.length - 1]] = value;
      return newData;
    });
  };

  // Reset form
  const resetForm = () => {
    setFormData(initialFormData);
    setCurrentStep(1);
  };

  // Navigation
  const nextStep = () => {
    setCurrentStep(prev => Math.min(prev + 1, 4));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const goToStep = (step) => {
    setCurrentStep(Math.max(1, Math.min(step, 4)));
  };

  const value = {
    formData,
    setFormData,
    updateFormData,
    updateNestedFormData,
    currentStep,
    setCurrentStep,
    nextStep,
    prevStep,
    goToStep,
    resetForm,
  };

  return (
    <FormContext.Provider value={value}>
      {children}
    </FormContext.Provider>
  );
}

// Custom hook to use form context
export function useForm() {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error('useForm must be used within a FormProvider');
  }
  return context;
}

// Export context for direct usage
export { FormContext, initialFormData };
