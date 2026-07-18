import { useState, useEffect } from 'react';
import { useForm } from '../hooks/useFormContext';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Plus, Trash2, ChevronDown, ChevronUp, Edit2, Check, X, AlertCircle } from 'lucide-react';

// Default subjects as specified
const DEFAULT_SUBJECTS = [
  { subject_code: 'ENG', subject_name: 'English', grade_levels: ['upper_primary', 'junior_school'], periods_per_week: [5, 5], double_lessons_allowed: true },
  { subject_code: 'MATH', subject_name: 'Mathematics', grade_levels: ['upper_primary', 'junior_school'], periods_per_week: [5, 5], double_lessons_allowed: true },
  { subject_code: 'SCI', subject_name: 'Science & Technology', grade_levels: ['junior_school'], periods_per_week: [0, 3], double_lessons_allowed: true },
  { subject_code: 'SST', subject_name: 'Social Studies', grade_levels: ['upper_primary', 'junior_school'], periods_per_week: [3, 3], double_lessons_allowed: true },
  { subject_code: 'INTSCI', subject_name: 'Integrated Science', grade_levels: ['junior_school'], periods_per_week: [0, 4], double_lessons_allowed: true },
  { subject_code: 'PRETECH', subject_name: 'Pre-Technical Studies', grade_levels: ['junior_school'], periods_per_week: [0, 2], double_lessons_allowed: true },
  { subject_code: 'AGRI', subject_name: 'Agriculture & Nutrition', grade_levels: ['upper_primary', 'junior_school'], periods_per_week: [2, 2], double_lessons_allowed: false },
  { subject_code: 'CTS', subject_name: 'Creative & Technology Studies', grade_levels: ['upper_primary', 'junior_school'], periods_per_week: [2, 2], double_lessons_allowed: true },
  { subject_code: 'RE', subject_name: 'Religious Education', grade_levels: ['upper_primary', 'junior_school'], periods_per_week: [2, 2], double_lessons_allowed: false },
  { subject_code: 'LOCAL', subject_name: 'Local Language', grade_levels: ['upper_primary', 'junior_school'], periods_per_week: [3, 3], double_lessons_allowed: false },
];

// Grade band labels
const GRADE_BANDS = [
  { id: 'upper_primary', label: 'Upper Primary', grades: ['G4', 'G5'] },
  { id: 'junior_school', label: 'Junior School', grades: ['G6', 'G7', 'G8', 'G9'] },
];

// N/A exclusion rules: subjects that don't apply to certain grade bands
const NA_EXCLUSIONS = {
  SCI: ['upper_primary'], // Science only applies to Junior School
  INTSCI: ['upper_primary'], // Integrated Science only applies to Junior School
  PRETECH: ['upper_primary'], // Pre-Technical Studies only applies to Junior School
};

// Subject Row Component
function SubjectRow({ 
  subject, 
  index, 
  onUpdate, 
  onDelete,
  isCustom = false
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ ...subject });
  const [errors, setErrors] = useState({});

  // Check if subject code is unique
  const { formData } = useForm();
  const existingSubjects = formData.subjects || [];

  useEffect(() => {
    setEditData({ ...subject });
  }, [subject]);

  const handleFieldChange = (field, value) => {
    setEditData(prev => ({ ...prev, [field]: value }));
    
    // Clear error
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handlePeriodsChange = (bandIndex, value) => {
    const newPeriods = [...(editData.periods_per_week || [])];
    newPeriods[bandIndex] = parseInt(value) || 0;
    setEditData(prev => ({ ...prev, periods_per_week: newPeriods }));
  };

  const handleDoubleLessonsChange = (value) => {
    setEditData(prev => ({ ...prev, double_lessons_allowed: value }));
  };

  const validateEdit = () => {
    const newErrors = {};
    
    if (!editData.subject_code?.trim()) {
      newErrors.subject_code = 'Subject code is required';
    }
    
    // Check uniqueness
    const codeExists = existingSubjects.some((s, i) => 
      i !== index && s.subject_code?.toUpperCase() === editData.subject_code?.toUpperCase()
    );
    if (codeExists) {
      newErrors.subject_code = 'Subject code must be unique';
    }
    
    if (!editData.subject_name?.trim()) {
      newErrors.subject_name = 'Subject name is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateEdit()) {
      onUpdate(index, editData);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditData({ ...subject });
    setIsEditing(false);
    setErrors({});
  };

  const handleDelete = () => {
    if (window.confirm(`Delete ${subject.subject_name} (${subject.subject_code})?`)) {
      onDelete(index);
    }
  };

  // Check if subject has N/A exclusions
  const hasNAExclusions = NA_EXCLUSIONS[subject.subject_code];
  
  // Get applicable grade bands for this subject
  const applicableBands = GRADE_BANDS.filter(band => 
    !hasNAExclusions || !hasNAExclusions.includes(band.id)
  );

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="mb-4"
    >
      <motion.div
        className={`glass-card border-l-4 ${isCustom ? 'border-accent-gold' : 'border-accent-teal'} overflow-hidden`}
        whileHover={{ y: -2 }}
      >
        {/* Header */}
        <motion.button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full p-4 flex items-center justify-between text-left"
          whileTap={{ scale: 0.99 }}
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent-teal/20 to-accent-gold/20 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-accent-teal" />
            </div>
            <div>
              <h4 className="font-semibold text-white text-lg">
                {editData.subject_name || 'Untitled Subject'}
              </h4>
              <p className="text-sm text-white/60 font-mono">
                {editData.subject_code || 'N/A'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isCustom && (
              <motion.button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete();
                }}
                className="p-2 text-red-400 hover:text-red-300 rounded-lg hover:bg-red-400/10"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Trash2 className="w-5 h-5" />
              </motion.button>
            )}
            
            <motion.button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 text-white/60 hover:text-white rounded-lg hover:bg-white/10"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </motion.button>
          </div>
        </motion.button>

        {/* Expanded Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="px-4 pb-4 border-t border-white/10"
            >
              <AnimatePresence mode="wait">
                {isEditing ? (
                  <motion.div
                    key="edit"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    {/* Subject Code and Name */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-white/80">
                          Subject Code <span className="text-accent-teal">*</span>
                        </label>
                        <input
                          type="text"
                          value={editData.subject_code || ''}
                          onChange={(e) => handleFieldChange('subject_code', e.target.value.toUpperCase())}
                          placeholder="e.g., ENG"
                          className={`glass-input w-full font-mono ${errors.subject_code ? 'border-red-400' : ''}`}
                        />
                        {errors.subject_code && (
                          <motion.p 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-red-400 text-sm flex items-center gap-1"
                          >
                            <AlertCircle className="w-4 h-4" />
                            {errors.subject_code}
                          </motion.p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-white/80">
                          Subject Name <span className="text-accent-teal">*</span>
                        </label>
                        <input
                          type="text"
                          value={editData.subject_name || ''}
                          onChange={(e) => handleFieldChange('subject_name', e.target.value)}
                          placeholder="e.g., English"
                          className={`glass-input w-full ${errors.subject_name ? 'border-red-400' : ''}`}
                        />
                        {errors.subject_name && (
                          <motion.p 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-red-400 text-sm flex items-center gap-1"
                          >
                            <AlertCircle className="w-4 h-4" />
                            {errors.subject_name}
                          </motion.p>
                        )}
                      </div>
                    </div>

                    {/* Grade Bands Table */}
                    <div className="space-y-4">
                      <h5 className="text-sm font-medium text-white/80 mb-3">
                        Periods per Week by Grade Band
                      </h5>
                      
                      <div className="space-y-3">
                        {applicableBands.map((band, bandIndex) => {
                          // Check if this band is N/A for this subject
                          const isNA = hasNAExclusions && hasNAExclusions.includes(band.id);
                          
                          return (
                            <motion.div
                              key={band.id}
                              layout
                              className={`flex items-center justify-between p-3 rounded-lg ${
                                isNA 
                                  ? 'bg-red-400/10 border border-red-400/20 opacity-50' 
                                  : 'bg-white/5 border border-white/10'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-medium text-white/80">
                                  {band.label}
                                </span>
                                <span className="text-xs text-white/40">
                                  {band.grades.join(', ')}
                                </span>
                                {isNA && (
                                  <span className="px-2 py-1 bg-red-400/20 text-red-400 text-xs rounded-full font-medium">
                                    N/A
                                  </span>
                                )}
                              </div>
                              
                              {!isNA ? (
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    value={editData.periods_per_week?.[bandIndex] || 0}
                                    onChange={(e) => handlePeriodsChange(bandIndex, e.target.value)}
                                    min="0"
                                    max="10"
                                    className="glass-input w-20 text-center font-mono"
                                  />
                                  <span className="text-white/40 text-sm">periods/week</span>
                                </div>
                              ) : (
                                <div className="text-white/30 text-sm">
                                  Not applicable
                                </div>
                              )}
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Double Lessons Toggle */}
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-white/80">
                          Double Lessons Allowed
                        </span>
                      </div>
                      <motion.button
                        type="button"
                        onClick={() => handleDoubleLessonsChange(!editData.double_lessons_allowed)}
                        className={`relative px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                          editData.double_lessons_allowed 
                            ? 'bg-accent-teal text-white' 
                            : 'bg-white/10 text-white/60'
                        }`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {editData.double_lessons_allowed ? 'Yes' : 'No'}
                      </motion.button>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                      <motion.button
                        type="button"
                        onClick={handleCancel}
                        className="flex-1 py-3 px-4 bg-white/10 text-white/60 rounded-lg font-medium hover:bg-white/15 transition-colors"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Cancel
                      </motion.button>
                      <motion.button
                        type="button"
                        onClick={handleSave}
                        className="flex-1 py-3 px-4 bg-accent-teal text-white rounded-lg font-medium hover:bg-accent-teal/90 transition-colors"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Save Changes
                      </motion.button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="view"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-4"
                  >
                    {/* Grade Bands Summary */}
                    <div className="space-y-3">
                      {applicableBands.map((band, bandIndex) => {
                        const isNA = hasNAExclusions && hasNAExclusions.includes(band.id);
                        const periods = editData.periods_per_week?.[bandIndex] || 0;
                        
                        return (
                          <motion.div
                            key={band.id}
                            layout
                            className={`flex items-center justify-between p-3 rounded-lg ${
                              isNA 
                                ? 'bg-red-400/10 border border-red-400/20 opacity-50' 
                                : 'bg-white/5 border border-white/10'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-medium text-white/80">
                                {band.label}
                              </span>
                              <span className="text-xs text-white/40">
                                {band.grades.join(', ')}
                              </span>
                              {isNA && (
                                <span className="px-2 py-1 bg-red-400/20 text-red-400 text-xs rounded-full font-medium">
                                  N/A
                                </span>
                              )}
                            </div>
                            
                            {!isNA ? (
                              <div className="flex items-center gap-2">
                                <span className="text-lg font-mono text-white">
                                  {periods}
                                </span>
                                <span className="text-white/40 text-sm">periods/week</span>
                              </div>
                            ) : (
                              <span className="text-white/30 text-sm">Excluded</span>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>

                    {/* Double Lessons Summary */}
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                      <span className="text-sm font-medium text-white/80">
                        Double Lessons Allowed
                      </span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        editData.double_lessons_allowed 
                          ? 'bg-accent-teal/20 text-accent-teal' 
                          : 'bg-white/10 text-white/60'
                      }`}>
                        {editData.double_lessons_allowed ? 'Yes' : 'No'}
                      </span>
                    </div>

                    {/* Edit Button */}
                    <div className="pt-4">
                      <motion.button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        className="w-full py-3 px-4 bg-white/10 text-white/80 rounded-lg font-medium hover:bg-white/15 transition-colors flex items-center justify-center gap-2"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Edit2 className="w-5 h-5" />
                        Edit Subject
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

// Add Custom Subject Form
function AddCustomSubject({ onAdd, onCancel }) {
  const [newSubject, setNewSubject] = useState({
    subject_code: '',
    subject_name: '',
    grade_levels: ['upper_primary', 'junior_school'],
    periods_per_week: [0, 0],
    double_lessons_allowed: true,
  });
  const [errors, setErrors] = useState({});
  
  const { formData } = useForm();
  const existingSubjects = formData.subjects || [];

  const handleChange = (field, value) => {
    setNewSubject(prev => ({ ...prev, [field]: value }));
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handlePeriodsChange = (bandIndex, value) => {
    const newPeriods = [...newSubject.periods_per_week];
    newPeriods[bandIndex] = parseInt(value) || 0;
    setNewSubject(prev => ({ ...prev, periods_per_week: newPeriods }));
  };

  const validate = () => {
    const newErrors = {};
    
    if (!newSubject.subject_code?.trim()) {
      newErrors.subject_code = 'Subject code is required';
    }
    
    // Check uniqueness
    const codeExists = existingSubjects.some(s => 
      s.subject_code?.toUpperCase() === newSubject.subject_code?.toUpperCase()
    );
    if (codeExists) {
      newErrors.subject_code = 'Subject code must be unique';
    }
    
    if (!newSubject.subject_name?.trim()) {
      newErrors.subject_name = 'Subject name is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validate()) {
      onAdd(newSubject);
      setNewSubject({
        subject_code: '',
        subject_name: '',
        grade_levels: ['upper_primary', 'junior_school'],
        periods_per_week: [0, 0],
        double_lessons_allowed: true,
      });
      setErrors({});
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        className="glass-card max-w-md w-full max-h-[90vh] overflow-y-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white">
              Add Custom Subject
            </h3>
            <motion.button
              type="button"
              onClick={onCancel}
              className="p-2 text-white/60 hover:text-white rounded-lg hover:bg-white/10"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X className="w-5 h-5" />
            </motion.button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white/80">
                Subject Code <span className="text-accent-teal">*</span>
              </label>
              <input
                type="text"
                value={newSubject.subject_code}
                onChange={(e) => handleChange('subject_code', e.target.value.toUpperCase())}
                placeholder="e.g., CUSTOM"
                className={`glass-input w-full font-mono ${errors.subject_code ? 'border-red-400' : ''}`}
              />
              {errors.subject_code && (
                <motion.p 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-red-400 text-sm flex items-center gap-1"
                >
                  <AlertCircle className="w-4 h-4" />
                  {errors.subject_code}
                </motion.p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-white/80">
                Subject Name <span className="text-accent-teal">*</span>
              </label>
              <input
                type="text"
                value={newSubject.subject_name}
                onChange={(e) => handleChange('subject_name', e.target.value)}
                placeholder="e.g., Custom Subject"
                className={`glass-input w-full ${errors.subject_name ? 'border-red-400' : ''}`}
              />
              {errors.subject_name && (
                <motion.p 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-red-400 text-sm flex items-center gap-1"
                >
                  <AlertCircle className="w-4 h-4" />
                  {errors.subject_name}
                </motion.p>
              )}
            </div>

            <div className="space-y-3">
              <h5 className="text-sm font-medium text-white/80">
                Periods per Week
              </h5>
              
              {GRADE_BANDS.map((band, bandIndex) => (
                <div key={band.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-white/80">
                      {band.label}
                    </span>
                    <span className="text-xs text-white/40">
                      {band.grades.join(', ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={newSubject.periods_per_week[bandIndex] || 0}
                      onChange={(e) => handlePeriodsChange(bandIndex, e.target.value)}
                      min="0"
                      max="10"
                      className="glass-input w-20 text-center font-mono"
                    />
                    <span className="text-white/40 text-sm">periods/week</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
              <span className="text-sm font-medium text-white/80">
                Double Lessons Allowed
              </span>
              <motion.button
                type="button"
                onClick={() => handleChange('double_lessons_allowed', !newSubject.double_lessons_allowed)}
                className={`relative px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  newSubject.double_lessons_allowed 
                    ? 'bg-accent-teal text-white' 
                    : 'bg-white/10 text-white/60'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {newSubject.double_lessons_allowed ? 'Yes' : 'No'}
              </motion.button>
            </div>

            <div className="flex gap-3 pt-6">
              <motion.button
                type="button"
                onClick={onCancel}
                className="flex-1 py-3 px-4 bg-white/10 text-white/60 rounded-lg font-medium hover:bg-white/15 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Cancel
              </motion.button>
              <motion.button
                type="submit"
                className="flex-1 py-3 px-4 bg-accent-teal text-white rounded-lg font-medium hover:bg-accent-teal/90 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Add Subject
              </motion.button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Step 2 Component
function Step2({ onContinue, onBack }) {
  const { formData, updateFormData } = useForm();
  const [showAddForm, setShowAddForm] = useState(false);
  const [errors, setErrors] = useState({});

  // Initialize subjects from form data or defaults
  const subjects = formData.subjects && formData.subjects.length > 0 
    ? formData.subjects 
    : [...DEFAULT_SUBJECTS];

  // Sync with form data
  useEffect(() => {
    if (formData.subjects && formData.subjects.length === 0) {
      updateFormData({ subjects: [...DEFAULT_SUBJECTS] });
    }
  }, [formData.subjects]);

  const handleUpdateSubject = (index, updatedSubject) => {
    const newSubjects = [...subjects];
    newSubjects[index] = updatedSubject;
    updateFormData({ subjects: newSubjects });
  };

  const handleDeleteSubject = (index) => {
    const newSubjects = subjects.filter((_, i) => i !== index);
    updateFormData({ subjects: newSubjects });
  };

  const handleAddSubject = (newSubject) => {
    const newSubjects = [...subjects, newSubject];
    updateFormData({ subjects: newSubjects });
    setShowAddForm(false);
  };

  const validate = () => {
    const newErrors = {};
    
    // Check for duplicate subject codes
    const codeMap = {};
    subjects.forEach((subject, index) => {
      const code = subject.subject_code?.toUpperCase();
      if (code && codeMap[code] !== undefined) {
        newErrors[`subject_${index}`] = `Duplicate subject code: ${code}`;
      }
      codeMap[code] = index;
    });
    
    // Check for empty subject codes
    subjects.forEach((subject, index) => {
      if (!subject.subject_code?.trim()) {
        newErrors[`subject_${index}`] = 'Subject code is required';
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validate()) {
      onContinue();
    }
  };

  // Test N/A exclusion logic
  const testNAExclusion = () => {
    console.log('Testing N/A exclusion logic:');
    subjects.forEach(subject => {
      const hasNA = NA_EXCLUSIONS[subject.subject_code];
      if (hasNA) {
        console.log(`Subject ${subject.subject_code} (${subject.subject_name}):`, {
          hasNAExclusions: hasNA,
          grade_levels: subject.grade_levels,
          periods_per_week: subject.periods_per_week,
        });
        
        // Verify that N/A grade bands are excluded from grade_levels
        const hasExcludedBands = hasNA.some(band => subject.grade_levels.includes(band));
        if (hasExcludedBands) {
          console.warn(`WARNING: Subject ${subject.subject_code} includes excluded grade bands!`);
        }
      }
    });
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="step2"
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
            Subject Roster & Grade Bands
          </h2>
          <p className="text-white/60">
            Configure subjects and their grade level assignments
          </p>
        </motion.div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Subjects List */}
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-accent-teal" />
                Subjects ({subjects.length})
              </h3>
              
              <motion.button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="glass-button flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Plus className="w-5 h-5" />
                Add Custom Subject
              </motion.button>
            </div>

            {/* N/A Exclusion Notice */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-accent-gold/10 border border-accent-gold/20 rounded-lg p-4 mb-6"
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-accent-gold flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-accent-gold mb-1">
                    N/A Exclusion Logic
                  </h4>
                  <p className="text-sm text-white/70">
                    Subjects marked N/A for a grade band are completely excluded from 
                    <code className="bg-white/10 px-1 rounded text-xs">grade_levels[]</code> 
                    and <code className="bg-white/10 px-1 rounded text-xs">periods_per_week[]</code>.
                    Currently: SCI, INTSCI, PRETECH exclude Upper Primary.
                  </p>
                  <motion.button
                    type="button"
                    onClick={testNAExclusion}
                    className="mt-2 px-3 py-1 bg-accent-gold/20 text-accent-gold text-xs rounded-lg font-medium"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Test N/A Logic
                  </motion.button>
                </div>
              </div>
            </motion.div>

            {/* Subjects */}
            <AnimatePresence>
              {subjects.map((subject, index) => (
                <SubjectRow
                  key={`${subject.subject_code}-${index}`}
                  subject={subject}
                  index={index}
                  onUpdate={handleUpdateSubject}
                  onDelete={handleDeleteSubject}
                  isCustom={!DEFAULT_SUBJECTS.some(d => d.subject_code === subject.subject_code)}
                />
              ))}
            </AnimatePresence>
          </motion.div>

          {/* Navigation Buttons */}
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
              type="submit"
              className="glass-button flex-1 py-4 text-lg font-semibold"
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98, y: 0 }}
            >
              Continue →
            </motion.button>
          </motion.div>
        </form>

        {/* Add Custom Subject Modal */}
        <AnimatePresence>
          {showAddForm && (
            <AddCustomSubject
              onAdd={handleAddSubject}
              onCancel={() => setShowAddForm(false)}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}

export default Step2;
