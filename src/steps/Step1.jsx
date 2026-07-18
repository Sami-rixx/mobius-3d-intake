import { useState, useEffect } from 'react';
import { useForm } from '../hooks/useFormContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, User, Building, Clock, ShieldCheck, AlertTriangle, Target, Lock } from 'lucide-react';

// Toggle Chip Component
function ToggleChip({ 
  label, 
  value, 
  onChange, 
  activeColor = 'bg-accent-teal', 
  inactiveColor = 'bg-white/10',
  activeText = 'Yes',
  inactiveText = 'No'
}) {
  const [isActive, setIsActive] = useState(value);

  useEffect(() => {
    setIsActive(value);
  }, [value]);

  const handleToggle = () => {
    const newValue = !isActive;
    setIsActive(newValue);
    onChange(newValue);
    
    // Haptic feedback on mobile
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  };

  return (
    <motion.button
      type="button"
      onClick={handleToggle}
      className={`relative inline-flex items-center h-12 rounded-full p-1 cursor-pointer transition-all duration-200 ${
        isActive ? activeColor : inactiveColor
      }`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      {/* Background */}
      <span 
        className={`absolute inset-0 rounded-full transition-all duration-200 ${
          isActive 
            ? 'bg-accent-teal shadow-lg shadow-accent-teal/30' 
            : 'bg-white/10'
        }`}
      />
      
      {/* Toggle circle */}
      <motion.span
        className="relative z-10 w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center"
        animate={{ 
          x: isActive ? 'calc(100% - 44px)' : '4px',
          backgroundColor: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.2)'
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        {isActive ? (
          <ShieldCheck className="w-5 h-5 text-accent-teal" />
        ) : (
          <AlertTriangle className="w-5 h-5 text-white/60" />
        )}
      </motion.span>

      {/* Labels */}
      <span className="relative z-10 px-4 text-white font-medium text-sm">
        {isActive ? activeText : inactiveText}
      </span>
    </motion.button>
  );
}

// Radio Chip Component
function RadioChip({ 
  label, 
  value, 
  selectedValue,
  onChange,
  color = 'bg-accent-teal'
}) {
  const isSelected = selectedValue === value;

  const handleClick = () => {
    onChange(value);
    
    // Haptic feedback on mobile
    if ('vibrate' in navigator) {
      navigator.vibrate(5);
    }
  };

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      className={`relative px-6 py-3 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer ${
        isSelected 
          ? `${color} text-white shadow-lg shadow-current/30`
          : 'bg-white/10 text-white/60 border border-white/10'
      }`}
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95, y: 0 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
    >
      {isSelected && (
        <motion.div
          className="absolute inset-0 rounded-full bg-current opacity-20"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      )}
      <span className="relative">{label}</span>
    </motion.button>
  );
}

// Input Field Component
function InputField({ 
  icon: Icon,
  label,
  type = 'text',
  name,
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false
}) {
  return (
    <motion.div
      className="space-y-2"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
    >
      <label className="flex items-center gap-2 text-sm font-medium text-white/80">
        {Icon && <Icon className="w-4 h-4" />}
        {label}
        {required && <span className="text-accent-teal">*</span>}
      </label>
      <div className="relative">
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className="glass-input w-full pr-12"
          required={required}
        />
        {Icon && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Date Picker Component
function DatePicker({ 
  icon: Icon,
  label,
  name,
  value,
  onChange,
  required = false
}) {
  return (
    <motion.div
      className="space-y-2"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
    >
      <label className="flex items-center gap-2 text-sm font-medium text-white/80">
        {Icon && <Icon className="w-4 h-4" />}
        {label}
        {required && <span className="text-accent-teal">*</span>}
      </label>
      <div className="relative">
        <input
          type="date"
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className="glass-input w-full pr-12"
          required={required}
        />
        {Icon && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Policy Question Component
function PolicyQuestion({ 
  icon: Icon,
  question,
  children
}) {
  return (
    <motion.div
      className="bg-white/5 rounded-xl p-6 mb-6 border border-white/10"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
    >
      <div className="flex items-start gap-3 mb-4">
        {Icon && (
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-accent-teal/20 flex items-center justify-center">
            <Icon className="w-5 h-5 text-accent-teal" />
          </div>
        )}
        <h3 className="text-lg font-semibold text-white">{question}</h3>
      </div>
      <div className="flex flex-wrap gap-3">
        {children}
      </div>
    </motion.div>
  );
}

// Step 1 Component
function Step1({ onContinue }) {
  const { formData, updateNestedFormData } = useForm();
  const [errors, setErrors] = useState({});

  // Sync form data
  const school = formData.school || {};
  const policy = formData.policy || {};

  const handleChange = (e) => {
    const { name, value } = e.target;
    updateNestedFormData(`school.${name}`, value);
    
    // Clear error
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleDateChange = (e) => {
    const { value } = e.target;
    updateNestedFormData('school.filled_at', value);
  };

  const handleToggleChange = (name, value) => {
    updateNestedFormData(`policy.${name}`, value);
  };

  const handleRadioChange = (name, value) => {
    updateNestedFormData(`policy.${name}`, value);
  };

  const validate = () => {
    const newErrors = {};
    
    if (!school.name?.trim()) {
      newErrors.name = 'School name is required';
    }
    if (!school.filled_by?.trim()) {
      newErrors.filled_by = 'Your name is required';
    }
    if (!school.filled_at?.trim()) {
      newErrors.filled_at = 'Date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validate()) {
      onContinue();
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="step1"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h2 className="text-3xl font-bold text-white mb-2">
            School & Policy
          </h2>
          <p className="text-white/60">
            Basic information and policy settings
          </p>
        </motion.div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* School Information */}
          <motion.div
            className="glass-card p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <Building className="w-6 h-6 text-accent-teal" />
              School Information
            </h3>

            <div className="space-y-4">
              <InputField
                icon={Building}
                label="School Name"
                type="text"
                name="name"
                value={school.name || ''}
                onChange={handleChange}
                placeholder="Enter school name"
                required
              />
              {errors.name && (
                <motion.p 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-red-400 text-sm"
                >
                  {errors.name}
                </motion.p>
              )}

              <InputField
                icon={User}
                label="Filled In By"
                type="text"
                name="filled_by"
                value={school.filled_by || ''}
                onChange={handleChange}
                placeholder="Your name"
                required
              />
              {errors.filled_by && (
                <motion.p 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-red-400 text-sm"
                >
                  {errors.filled_by}
                </motion.p>
              )}

              <DatePicker
                icon={Calendar}
                label="Date"
                name="filled_at"
                value={school.filled_at || ''}
                onChange={handleDateChange}
                required
              />
              {errors.filled_at && (
                <motion.p 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-red-400 text-sm"
                >
                  {errors.filled_at}
                </motion.p>
              )}
            </div>
          </motion.div>

          {/* Policy Questions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <Lock className="w-6 h-6 text-accent-teal" />
              Policy Settings
            </h3>

            {/* Q1: Generalists Grade Scope */}
            <PolicyQuestion
              icon={Target}
              question="Q1: Can generalists teach any grade?"
            >
              <ToggleChip
                label="Generalists can teach any grade"
                value={policy.generalists_grade_scope === 'unrestricted'}
                onChange={(value) => handleToggleChange(
                  'generalists_grade_scope', 
                  value ? 'unrestricted' : 'explicit_only'
                )}
                activeText="Yes"
                inactiveText="No"
              />
            </PolicyQuestion>

            {/* Q2: Overload Policy */}
            <PolicyQuestion
              icon={AlertTriangle}
              question="Q2: If insufficient hours, what should happen?"
            >
              <RadioChip
                label="Stop and tell me"
                value="block"
                selectedValue={policy.overload_policy || 'block'}
                onChange={(value) => handleRadioChange('overload_policy', value)}
                color="bg-accent-teal"
              />
              <RadioChip
                label="Go ahead anyway"
                value="allow-overload"
                selectedValue={policy.overload_policy || 'block'}
                onChange={(value) => handleRadioChange('overload_policy', value)}
                color="bg-accent-gold"
              />
            </PolicyQuestion>

            {/* Q3: Ambiguous Data Policy */}
            <PolicyQuestion
              icon={ShieldCheck}
              question="Q3: If data is unclear?"
            >
              <RadioChip
                label="Use sensible default"
                value="use_default_and_warn"
                selectedValue={policy.ambiguous_data_policy || 'use_default_and_warn'}
                onChange={(value) => handleRadioChange('ambiguous_data_policy', value)}
                color="bg-accent-teal"
              />
              <RadioChip
                label="Stop and resolve"
                value="block_until_resolved"
                selectedValue={policy.ambiguous_data_policy || 'use_default_and_warn'}
                onChange={(value) => handleRadioChange('ambiguous_data_policy', value)}
                color="bg-accent-gold"
              />
            </PolicyQuestion>

            {/* Q4: Specialist Scope Lock */}
            <PolicyQuestion
              icon={Lock}
              question="Q4: Do specialist teachers exist?"
            >
              <ToggleChip
                label="Specialist teachers exist"
                value={policy.specialist_scope_lock !== false}
                onChange={(value) => handleToggleChange('specialist_scope_lock', value)}
                activeText="Yes"
                inactiveText="No"
              />
            </PolicyQuestion>
          </motion.div>

          {/* Continue Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="pt-4"
          >
            <motion.button
              type="submit"
              className="glass-button w-full py-4 text-lg font-semibold"
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98, y: 0 }}
            >
              Continue →
            </motion.button>
          </motion.div>
        </form>
      </motion.div>
    </AnimatePresence>
  );
}

export default Step1;
