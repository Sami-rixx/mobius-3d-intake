import { useState, useEffect } from 'react';
import { useForm } from '../hooks/useFormContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Eye, 
  Download, 
  Copy, 
  Check, 
  ChevronDown,
  ChevronUp,
  Building,
  Lock,
  BookOpen,
  User,
  Target,
  Clock,
  AlertCircle
} from 'lucide-react';

// JSON Preview Component
function JSONPreview({ jsonData, isExpanded, onToggle }) {
  const jsonString = JSON.stringify(jsonData, null, 2);

  return (
    <motion.div
      layout
      className="bg-black/30 rounded-xl border border-white/10 overflow-hidden"
    >
      <motion.button
        type="button"
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between text-left"
        whileTap={{ scale: 0.99 }}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent-teal/20 flex items-center justify-center">
            <Eye className="w-5 h-5 text-accent-teal" />
          </div>
          <span className="font-semibold text-white">JSON Preview</span>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          className="text-white/60"
        >
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="px-4 pb-4"
          >
            <pre className="text-xs text-white/80 font-mono overflow-x-auto whitespace-pre-wrap max-h-96">
              {jsonString}
            </pre>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Section Summary Component
function SectionSummary({ 
  icon: Icon,
  title,
  children,
  isExpanded,
  onToggle
}) {
  return (
    <motion.div
      layout
      className="glass-card mb-4"
    >
      <motion.button
        type="button"
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between text-left"
        whileTap={{ scale: 0.99 }}
      >
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-teal/20 to-accent-gold/20 flex items-center justify-center">
              <Icon className="w-5 h-5 text-accent-teal" />
            </div>
          )}
          <h3 className="font-semibold text-white text-lg">{title}</h3>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          className="text-white/60"
        >
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="px-4 pb-4 border-t border-white/10"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Field Display Component
function FieldDisplay({ label, value, type = 'text' }) {
  return (
    <div className="mb-3">
      <label className="block text-sm font-medium text-white/60 mb-1">{label}</label>
      {type === 'code' ? (
        <code className="block px-3 py-2 bg-white/5 rounded-lg font-mono text-white/90 text-sm">
          {value}
        </code>
      ) : type === 'boolean' ? (
        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
          value ? 'bg-accent-teal/20 text-accent-teal' : 'bg-white/10 text-white/60'
        }`}>
          {value ? 'Yes' : 'No'}
        </span>
      ) : type === 'array' ? (
        <div className="flex flex-wrap gap-2">
          {value.map((item, index) => (
            <span key={index} className="px-2 py-1 bg-white/10 rounded-lg text-sm font-mono text-white/80">
              {item}
            </span>
          ))}
        </div>
      ) : type === 'object' ? (
        <pre className="text-xs text-white/80 font-mono bg-white/5 p-3 rounded-lg overflow-x-auto">
          {JSON.stringify(value, null, 2)}
        </pre>
      ) : (
        <div className="px-3 py-2 bg-white/5 rounded-lg text-white/90">
          {value}
        </div>
      )}
    </div>
  );
}

// Success Screen Component
function SuccessScreen({ onReset }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="min-h-screen flex items-center justify-center p-4"
    >
      <motion.div
        className="glass-card max-w-md w-full text-center p-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Animated Checkmark */}
        <motion.div
          className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-accent-teal/20 to-accent-gold/20 flex items-center justify-center"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        >
          <motion.svg
            className="w-12 h-12 text-accent-teal"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
            initial={{ strokeDasharray: 100, strokeDashoffset: 100 }}
            animate={{ strokeDashoffset: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <path d="M5 13l4 4L19 7" />
          </motion.svg>
        </motion.div>

        <motion.h2
          className="text-3xl font-bold text-white mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          Form Submitted Successfully!
        </motion.h2>

        <motion.p
          className="text-white/60 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          Your intake form has been processed and the JSON payload has been generated.
        </motion.p>

        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <motion.button
            type="button"
            onClick={() => {
              if ('vibrate' in navigator) {
                navigator.vibrate(20);
              }
              onReset();
            }}
            className="glass-button w-full py-4 text-lg font-semibold"
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98, y: 0 }}
          >
            Start New Form
          </motion.button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

// Step 4 Component
function Step4({ onBack }) {
  const { formData, resetForm } = useForm();
  const [isExpanded, setIsExpanded] = useState({
    school: true,
    policy: true,
    subjects: true,
    teachers: true,
    json: false,
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  // Toggle section expansion
  const toggleSection = (section) => {
    setIsExpanded(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
    
    // Haptic feedback on mobile
    if ('vibrate' in navigator) {
      navigator.vibrate(5);
    }
  };

  // Assemble canonical JSON payload
  const assemblePayload = () => {
    // Ensure all required fields are present
    const school = formData.school || {};
    const policy = formData.policy || {};
    const subjects = formData.subjects || [];
    const teachers = formData.teachers || [];
    const capabilities = formData.capabilities || [];
    const preferences = formData.preferences || [];

    // Build the canonical structure
    return {
      schema_version: '1.0.0',
      school: {
        name: school.name || '',
        filled_by: school.filled_by || '',
        filled_at: school.filled_at || new Date().toISOString().split('T')[0],
      },
      policy: {
        generalists_grade_scope: policy.generalists_grade_scope || 'explicit_only',
        overload_policy: policy.overload_policy || 'block',
        ambiguous_data_policy: policy.ambiguous_data_policy || 'use_default_and_warn',
        specialist_scope_lock: policy.specialist_scope_lock !== undefined ? policy.specialist_scope_lock : true,
      },
      subjects: subjects.map(subject => ({
        subject_code: subject.subject_code || '',
        subject_name: subject.subject_name || '',
        grade_levels: subject.grade_levels || [],
        periods_per_week: subject.periods_per_week || [],
        double_lessons_allowed: subject.double_lessons_allowed !== undefined ? subject.double_lessons_allowed : true,
      })),
      teachers: teachers.map(teacher => ({
        teacher_id: teacher.teacher_id || '',
        teacher_name: teacher.teacher_name || '',
        max_periods_week: teacher.max_periods_week || 0,
        specialist: teacher.specialist !== undefined ? teacher.specialist : false,
        confidence: teacher.confidence !== undefined ? teacher.confidence : 1.0,
        flag_note: teacher.flag_note || null,
      })),
      capabilities: capabilities.map(capability => ({
        teacher_id: capability.teacher_id || '',
        subject_code: capability.subject_code || '',
        grades_can_teach: capability.grades_can_teach || [],
      })),
      preferences: preferences.map(preference => ({
        teacher_id: preference.teacher_id || '',
        subject_code: preference.subject_code || '',
        grades: preference.grades || [],
        priority: preference.priority || 2,
        granularity: preference.granularity || 'subject_level',
      })),
    };
  };

  // Download JSON
  const handleDownload = () => {
    const payload = assemblePayload();
    const jsonStr = JSON.stringify(payload, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const schoolName = formData.school?.name || 'mobius-intake';
    const date = new Date().toISOString().split('T')[0];
    const filename = `${schoolName.replace(/\s+/g, '-').toLowerCase()}-${date}.json`;
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  };

  // Copy to Clipboard
  const handleCopy = async () => {
    const payload = assemblePayload();
    const jsonStr = JSON.stringify(payload, null, 2);
    
    try {
      await navigator.clipboard.writeText(jsonStr);
      setCopied(true);
      
      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(10);
      }
      
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      alert('Failed to copy JSON to clipboard');
    }
  };

  // Submit and show success
  const handleSubmit = () => {
    // Validate that we have at least some data
    const payload = assemblePayload();
    
    // Basic validation
    if (!payload.school.name) {
      alert('Please fill in the school name');
      return;
    }
    
    if (!payload.school.filled_by) {
      alert('Please fill in who filled the form');
      return;
    }
    
    // Show success screen
    setShowSuccess(true);
    
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(30);
    }
  };

  // Reset and go back
  const handleReset = () => {
    resetForm();
    setShowSuccess(false);
    setCopied(false);
  };

  // Get summary counts
  const summary = {
    subjects: formData.subjects?.length || 0,
    teachers: formData.teachers?.length || 0,
    capabilities: formData.capabilities?.length || 0,
    preferences: formData.preferences?.length || 0,
  };

  // Check if form is empty
  const isFormEmpty = !formData.school?.name && !formData.teachers?.length;

  return (
    <AnimatePresence mode="wait">
      {showSuccess ? (
        <SuccessScreen onReset={handleReset} />
      ) : (
        <motion.div
          key="step4"
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
              Review & Submit
            </h2>
            <p className="text-white/60">
              Review your data and export the JSON payload
            </p>
          </motion.div>

          {/* Summary Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
          >
            <motion.div
              className="glass-card p-4 text-center"
              whileHover={{ y: -4 }}
            >
              <div className="text-2xl font-bold text-accent-teal mb-1">
                {summary.subjects}
              </div>
              <div className="text-sm text-white/60">
                Subjects
              </div>
            </motion.div>
            
            <motion.div
              className="glass-card p-4 text-center"
              whileHover={{ y: -4 }}
            >
              <div className="text-2xl font-bold text-accent-teal mb-1">
                {summary.teachers}
              </div>
              <div className="text-sm text-white/60">
                Teachers
              </div>
            </motion.div>
            
            <motion.div
              className="glass-card p-4 text-center"
              whileHover={{ y: -4 }}
            >
              <div className="text-2xl font-bold text-accent-teal mb-1">
                {summary.capabilities}
              </div>
              <div className="text-sm text-white/60">
                Capabilities
              </div>
            </motion.div>
            
            <motion.div
              className="glass-card p-4 text-center"
              whileHover={{ y: -4 }}
            >
              <div className="text-2xl font-bold text-accent-teal mb-1">
                {summary.preferences}
              </div>
              <div className="text-sm text-white/60">
                Preferences
              </div>
            </motion.div>
          </motion.div>

          {/* Review Sections */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* School Section */}
            <SectionSummary
              icon={Building}
              title="School Information"
              isExpanded={isExpanded.school}
              onToggle={() => toggleSection('school')}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FieldDisplay 
                  label="School Name" 
                  value={formData.school?.name || 'Not specified'}
                />
                <FieldDisplay 
                  label="Filled By" 
                  value={formData.school?.filled_by || 'Not specified'}
                />
                <FieldDisplay 
                  label="Date" 
                  value={formData.school?.filled_at || 'Not specified'}
                />
              </div>
            </SectionSummary>

            {/* Policy Section */}
            <SectionSummary
              icon={Lock}
              title="Policy Settings"
              isExpanded={isExpanded.policy}
              onToggle={() => toggleSection('policy')}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FieldDisplay 
                  label="Generalists Grade Scope" 
                  value={formData.policy?.generalists_grade_scope || 'explicit_only'}
                  type="code"
                />
                <FieldDisplay 
                  label="Overload Policy" 
                  value={formData.policy?.overload_policy || 'block'}
                  type="code"
                />
                <FieldDisplay 
                  label="Ambiguous Data Policy" 
                  value={formData.policy?.ambiguous_data_policy || 'use_default_and_warn'}
                  type="code"
                />
                <FieldDisplay 
                  label="Specialist Scope Lock" 
                  value={formData.policy?.specialist_scope_lock !== undefined ? formData.policy.specialist_scope_lock : true}
                  type="boolean"
                />
              </div>
            </SectionSummary>

            {/* Subjects Section */}
            <SectionSummary
              icon={BookOpen}
              title={`Subjects (${summary.subjects})`}
              isExpanded={isExpanded.subjects}
              onToggle={() => toggleSection('subjects')}
            >
              {formData.subjects?.length > 0 ? (
                <div className="space-y-4">
                  {formData.subjects.map((subject, index) => (
                    <motion.div
                      key={`${subject.subject_code}-${index}`}
                      layout
                      className="bg-white/5 rounded-lg p-4 border border-white/10"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-white">{subject.subject_code}</span>
                          <span className="text-white/80">{subject.subject_name}</span>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          subject.double_lessons_allowed 
                            ? 'bg-accent-teal/20 text-accent-teal' 
                            : 'bg-white/10 text-white/60'
                        }`}>
                          {subject.double_lessons_allowed ? 'Double: Yes' : 'Double: No'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <FieldDisplay 
                          label="Grade Levels" 
                          value={subject.grade_levels || []}
                          type="array"
                        />
                        <FieldDisplay 
                          label="Periods/Week" 
                          value={subject.periods_per_week || []}
                          type="array"
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="text-white/40 text-center py-4">
                  No subjects added
                </p>
              )}
            </SectionSummary>

            {/* Teachers Section */}
            <SectionSummary
              icon={User}
              title={`Teachers (${summary.teachers})`}
              isExpanded={isExpanded.teachers}
              onToggle={() => toggleSection('teachers')}
            >
              {formData.teachers?.length > 0 ? (
                <div className="space-y-4">
                  {formData.teachers.map((teacher, index) => (
                    <motion.div
                      key={`${teacher.teacher_id}-${index}`}
                      layout
                      className="bg-white/5 rounded-lg p-4 border border-white/10"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-white">{teacher.teacher_id}</span>
                          <span className="text-white/80">{teacher.teacher_name}</span>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          teacher.specialist 
                            ? 'bg-accent-gold/20 text-accent-gold' 
                            : 'bg-accent-teal/20 text-accent-teal'
                        }`}>
                          {teacher.specialist ? 'Specialist' : 'Generalist'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <FieldDisplay 
                          label="Max Periods/Week" 
                          value={teacher.max_periods_week || 0}
                        />
                        <FieldDisplay 
                          label="Confidence" 
                          value={teacher.confidence !== undefined ? teacher.confidence : 1.0}
                        />
                      </div>
                      
                      {teacher.flag_note && (
                        <FieldDisplay 
                          label="Notes" 
                          value={teacher.flag_note}
                        />
                      )}

                      {/* Teacher Capabilities */}
                      <div className="mt-3 pt-3 border-t border-white/10">
                        <h5 className="text-sm font-medium text-white/80 mb-2">
                          Capabilities
                        </h5>
                        {teacher.capabilities?.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {teacher.capabilities.map((capability, capIndex) => (
                              <span 
                                key={capIndex}
                                className="px-2 py-1 bg-white/10 rounded-lg text-xs font-mono text-white/80"
                              >
                                {capability.subject_code}: {capability.grades_can_teach?.join(', ') || 'None'}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-white/40 text-xs italic">No capabilities defined</p>
                        )}
                      </div>

                      {/* Teacher Preferences */}
                      <div className="mt-3 pt-3 border-t border-white/10">
                        <h5 className="text-sm font-medium text-white/80 mb-2">
                          Preferences
                        </h5>
                        {teacher.preferences?.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {teacher.preferences.map((preference, prefIndex) => {
                              const priorityConfig = {
                                1: { label: 'Preferred', color: 'bg-accent-teal/20 text-accent-teal' },
                                2: { label: 'Normal', color: 'bg-white/10 text-white/60' },
                                3: { label: 'Last Resort', color: 'bg-accent-gold/20 text-accent-gold' },
                              };
                              const config = priorityConfig[preference.priority] || priorityConfig[2];
                              
                              return (
                                <span 
                                  key={prefIndex}
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}
                                >
                                  {preference.subject_code}: {config.label}
                                </span>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-white/40 text-xs italic">No preferences defined</p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="text-white/40 text-center py-4">
                  No teachers added
                </p>
              )}
            </SectionSummary>

            {/* JSON Preview */}
            <JSONPreview
              jsonData={assemblePayload()}
              isExpanded={isExpanded.json}
              onToggle={() => toggleSection('json')}
            />
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-4 pt-4"
          >
            <motion.button
              type="button"
              onClick={onBack}
              className="glass-button flex-1 py-4 text-lg font-semibold"
              style={{ background: 'linear-gradient(135deg, #4A5568 0%, #2D3748 100%)' }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98, y: 0 }}
            >
              ← Back
            </motion.button>
            
            <motion.button
              type="button"
              onClick={handleCopy}
              className="flex-1 py-4 text-lg font-semibold bg-white/10 text-white/80 rounded-xl border border-white/10 hover:bg-white/15 transition-colors flex items-center justify-center gap-2"
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98, y: 0 }}
            >
              <Copy className="w-5 h-5" />
              {copied ? 'Copied!' : 'Copy JSON'}
            </motion.button>
            
            <motion.button
              type="button"
              onClick={handleDownload}
              className="flex-1 py-4 text-lg font-semibold bg-white/10 text-white/80 rounded-xl border border-white/10 hover:bg-white/15 transition-colors flex items-center justify-center gap-2"
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98, y: 0 }}
            >
              <Download className="w-5 h-5" />
              Download JSON
            </motion.button>
            
            <motion.button
              type="button"
              onClick={handleSubmit}
              className="glass-button flex-1 py-4 text-lg font-semibold"
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98, y: 0 }}
            >
              <Check className="w-5 h-5" />
              Submit
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default Step4;
