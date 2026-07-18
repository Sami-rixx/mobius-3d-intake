import { useState, useEffect } from 'react';
import { useForm } from '../hooks/useFormContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Plus, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  Edit2, 
  Check, 
  X, 
  AlertCircle,
  Crown,
  Sliders,
  Target,
  Clock,
  MessageSquare
} from 'lucide-react';

// Grade options for the grid
const GRADES = ['G4', 'G5', 'G6', 'G7', 'G8', 'G9'];

// Priority mapping
const PRIORITY_MAP = {
  1: { label: 'Preferred', color: '#2FA6A0', bgColor: 'bg-accent-teal/20', textColor: 'text-accent-teal' },
  2: { label: 'Normal', color: '#4A5568', bgColor: 'bg-white/10', textColor: 'text-white/80' },
  3: { label: 'Last Resort', color: '#C9A96E', bgColor: 'bg-accent-gold/20', textColor: 'text-accent-gold' },
};

// Priority Badge Component
function PriorityBadge({ priority, selected, onSelect }) {
  const config = PRIORITY_MAP[priority];
  
  return (
    <motion.button
      type="button"
      onClick={() => onSelect(priority)}
      className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
        selected === priority 
          ? `${config.bgColor} ${config.textColor} border border-current/30 shadow-lg`
          : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
      }`}
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95, y: 0 }}
    >
      {config.label}
    </motion.button>
  );
}

// Grade Toggle Chip
function GradeToggleChip({ 
  grade, 
  isSelected, 
  onToggle,
  disabled = false 
}) {
  return (
    <motion.button
      type="button"
      onClick={() => { if (!disabled) { onToggle(grade); if ('vibrate' in navigator) { navigator.vibrate(5); } } }}
      disabled={disabled}
      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
        isSelected 
          ? 'bg-accent-teal text-white shadow-lg shadow-accent-teal/30' 
          : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      whileTap={!disabled ? { scale: 0.95, y: 0 } : {}}
    >
      {grade}
    </motion.button>
  );
}

// Teacher Card Component
function TeacherCard({ 
  teacher, 
  index, 
  subjects,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ ...teacher });
  const [errors, setErrors] = useState({});

  // Generate teacher ID if not present
  useEffect(() => {
    if (!editData.teacher_id) {
      setEditData(prev => ({ ...prev, teacher_id: `T-${String(index + 1).padStart(3, '0')}` }));
    }
  }, [index]);

  // Sync with teacher data
  useEffect(() => {
    setEditData({ ...teacher });
  }, [teacher]);

  const { formData } = useForm();
  const existingTeachers = formData.teachers || [];

  const handleFieldChange = (field, value) => {
    setEditData(prev => ({ ...prev, [field]: value }));
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleGradeToggle = (subjectCode, grade) => {
    // Update capabilities
    const capabilityIndex = editData.capabilities?.findIndex(c => c.subject_code === subjectCode);
    
    if (capabilityIndex >= 0) {
      const newCapabilities = [...editData.capabilities];
      const grades = newCapabilities[capabilityIndex].grades_can_teach || [];
      
      if (grades.includes(grade)) {
        newCapabilities[capabilityIndex].grades_can_teach = grades.filter(g => g !== grade);
      } else {
        newCapabilities[capabilityIndex].grades_can_teach = [...grades, grade];
      }
      
      setEditData(prev => ({ ...prev, capabilities: newCapabilities }));
    } else {
      // Create new capability
      const newCapabilities = editData.capabilities || [];
      newCapabilities.push({
        teacher_id: editData.teacher_id,
        subject_code: subjectCode,
        grades_can_teach: [grade]
      });
      setEditData(prev => ({ ...prev, capabilities: newCapabilities }));
    }
    
    // Update preferences
    const preferenceIndex = editData.preferences?.findIndex(p => p.subject_code === subjectCode);
    if (preferenceIndex >= 0) {
      // Already exists, will be updated in the preference selection
    } else {
      const newPreferences = editData.preferences || [];
      newPreferences.push({
        teacher_id: editData.teacher_id,
        subject_code: subjectCode,
        grades: [],
        priority: 2,
        granularity: 'subject_level'
      });
      setEditData(prev => ({ ...prev, preferences: newPreferences }));
    }
  };

  const handlePrioritySelect = (subjectCode, priority) => {
    const preferenceIndex = editData.preferences?.findIndex(p => p.subject_code === subjectCode);
    
    if (preferenceIndex >= 0) {
      const newPreferences = [...editData.preferences];
      newPreferences[preferenceIndex].priority = priority;
      setEditData(prev => ({ ...prev, preferences: newPreferences }));
    } else {
      const newPreferences = editData.preferences || [];
      newPreferences.push({
        teacher_id: editData.teacher_id,
        subject_code: subjectCode,
        grades: [],
        priority: priority,
        granularity: 'subject_level'
      });
      setEditData(prev => ({ ...prev, preferences: newPreferences }));
    }
  };

  const handleSpecialistToggle = (value) => {
    setEditData(prev => ({ ...prev, specialist: value }));
  };

  const validate = () => {
    const newErrors = {};
    
    if (!editData.teacher_name?.trim()) {
      newErrors.teacher_name = 'Teacher name is required';
    }
    
    if (!editData.teacher_id?.trim()) {
      newErrors.teacher_id = 'Teacher ID is required';
    }
    
    // Check teacher ID uniqueness
    const idExists = existingTeachers.some((t, i) => 
      i !== index && t.teacher_id === editData.teacher_id
    );
    if (idExists) {
      newErrors.teacher_id = 'Teacher ID must be unique';
    }
    
    if (editData.max_periods_week !== undefined && editData.max_periods_week !== null) {
      if (editData.max_periods_week < 0) {
        newErrors.max_periods_week = 'Must be 0 or greater';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validate()) {
      // Ensure capabilities and preferences are properly structured
      const finalData = {
        ...editData,
        teacher_id: editData.teacher_id || `T-${String(index + 1).padStart(3, '0')}`,
        specialist: editData.specialist !== undefined ? editData.specialist : false,
        confidence: editData.confidence !== undefined ? editData.confidence : 1.0,
        flag_note: editData.flag_note || null,
        max_periods_week: editData.max_periods_week || 0,
        capabilities: editData.capabilities || [],
        preferences: editData.preferences || [],
      };
      
      onUpdate(index, finalData);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditData({ ...teacher });
    setIsEditing(false);
    setErrors({});
  };

  const handleDelete = () => {
    if (window.confirm(`Delete ${teacher.teacher_name || 'this teacher'} (${teacher.teacher_id || 'T-' + (index + 1)})?`)) {
      onDelete(index);
    }
  };

  // Get capability for a subject
  const getCapability = (subjectCode) => {
    return editData.capabilities?.find(c => c.subject_code === subjectCode);
  };

  // Get preference for a subject
  const getPreference = (subjectCode) => {
    return editData.preferences?.find(p => p.subject_code === subjectCode);
  };

  // Check if grade is selected for a subject
  const isGradeSelected = (subjectCode, grade) => {
    const capability = getCapability(subjectCode);
    return capability?.grades_can_teach?.includes(grade) || false;
  };

  // Get priority for a subject
  const getPriority = (subjectCode) => {
    const preference = getPreference(subjectCode);
    return preference?.priority || 2;
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="mb-4"
    >
      <motion.div
        className="glass-card border-l-4 border-accent-teal overflow-hidden"
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
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-teal/20 to-accent-gold/20 flex items-center justify-center">
              <User className="w-6 h-6 text-accent-teal" />
            </div>
            <div>
              <h4 className="font-semibold text-white text-lg">
                {editData.teacher_name || 'New Teacher'}
              </h4>
              <div className="flex items-center gap-3 text-sm text-white/60">
                <span className="font-mono">{editData.teacher_id || `T-${String(index + 1).padStart(3, '0')}`}</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-medium ${
                  editData.specialist 
                    ? 'bg-accent-gold/20 text-accent-gold' 
                    : 'bg-white/10 text-white/60'
                }">
                  {editData.specialist ? 'Specialist' : 'Generalist'}
                </span>
                <span className="text-white/40">|</span>
                <span className="text-xs">
                  Max: {editData.max_periods_week || 0} periods/week
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <motion.button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMoveUp(index);
              }}
              className="p-2 text-white/40 hover:text-white rounded-lg hover:bg-white/10"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title="Move up"
            >
              <ChevronUp className="w-5 h-5" />
            </motion.button>
            
            <motion.button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMoveDown(index);
              }}
              className="p-2 text-white/40 hover:text-white rounded-lg hover:bg-white/10"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title="Move down"
            >
              <ChevronDown className="w-5 h-5" />
            </motion.button>
            
            <motion.button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
              }}
              className="p-2 text-red-400 hover:text-red-300 rounded-lg hover:bg-red-400/10"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title="Delete"
            >
              <Trash2 className="w-5 h-5" />
            </motion.button>
            
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
                    {/* Teacher Name and Role */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-white/80">
                          Teacher Name <span className="text-accent-teal">*</span>
                        </label>
                        <input
                          type="text"
                          value={editData.teacher_name || ''}
                          onChange={(e) => handleFieldChange('teacher_name', e.target.value)}
                          placeholder="e.g., Tr. John Doe"
                          className={`glass-input w-full ${errors.teacher_name ? 'border-red-400' : ''}`}
                        />
                        {errors.teacher_name && (
                          <motion.p 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-red-400 text-sm flex items-center gap-1"
                          >
                            <AlertCircle className="w-4 h-4" />
                            {errors.teacher_name}
                          </motion.p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-white/80">
                          Role
                        </label>
                        <div className="flex gap-2">
                          <motion.button
                            type="button"
                            onClick={() => handleSpecialistToggle(false)}
                            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                              !editData.specialist 
                                ? 'bg-accent-teal text-white shadow-lg shadow-accent-teal/30' 
                                : 'bg-white/5 text-white/60 border border-white/10'
                            }`}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            Generalist
                          </motion.button>
                          <motion.button
                            type="button"
                            onClick={() => handleSpecialistToggle(true)}
                            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                              editData.specialist 
                                ? 'bg-accent-gold text-white shadow-lg shadow-accent-gold/30' 
                                : 'bg-white/5 text-white/60 border border-white/10'
                            }`}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            Specialist
                          </motion.button>
                        </div>
                      </div>
                    </div>

                    {/* Teacher ID and Max Periods */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-white/80">
                          Teacher ID <span className="text-accent-teal">*</span>
                        </label>
                        <input
                          type="text"
                          value={editData.teacher_id || `T-${String(index + 1).padStart(3, '0')}`}
                          onChange={(e) => handleFieldChange('teacher_id', e.target.value.toUpperCase())}
                          placeholder="e.g., T-001"
                          className={`glass-input w-full font-mono ${errors.teacher_id ? 'border-red-400' : ''}`}
                        />
                        {errors.teacher_id && (
                          <motion.p 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-red-400 text-sm flex items-center gap-1"
                          >
                            <AlertCircle className="w-4 h-4" />
                            {errors.teacher_id}
                          </motion.p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-white/80">
                          Max Periods/Week
                        </label>
                        <input
                          type="number"
                          value={editData.max_periods_week || 0}
                          onChange={(e) => handleFieldChange('max_periods_week', parseInt(e.target.value) || 0)}
                          min="0"
                          max="50"
                          placeholder="0"
                          className={`glass-input w-full ${errors.max_periods_week ? 'border-red-400' : ''}`}
                        />
                        {errors.max_periods_week && (
                          <motion.p 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-red-400 text-sm flex items-center gap-1"
                          >
                            <AlertCircle className="w-4 h-4" />
                            {errors.max_periods_week}
                          </motion.p>
                        )}
                      </div>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-white/80">
                        Notes / Exceptions
                      </label>
                      <textarea
                        value={editData.flag_note || ''}
                        onChange={(e) => handleFieldChange('flag_note', e.target.value)}
                        placeholder="Any special notes or exceptions..."
                        rows={2}
                        className="glass-input w-full resize-none"
                      />
                    </div>

                    {/* Subject × Grade Grid */}
                    <div className="space-y-4">
                      <h5 className="text-sm font-medium text-white/80 mb-3 flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        Subject × Grade Capabilities
                      </h5>
                      
                      <div className="space-y-3">
                        {subjects.map((subject) => (
                          <motion.div
                            key={subject.subject_code}
                            layout
                            className="bg-white/5 rounded-xl p-4 border border-white/10"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <span className="font-mono text-white">{subject.subject_code}</span>
                                <span className="text-white/80">{subject.subject_name}</span>
                              </div>
                              <div className="flex gap-2">
                                <span className="text-sm text-white/60">Priority:</span>
                                <div className="flex gap-1">
                                  {Object.keys(PRIORITY_MAP).map(priority => (
                                    <PriorityBadge
                                      key={priority}
                                      priority={parseInt(priority)}
                                      selected={getPriority(subject.subject_code)}
                                      onSelect={(p) => handlePrioritySelect(subject.subject_code, p)}
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                              {GRADES.map((grade) => (
                                <GradeToggleChip
                                  key={grade}
                                  grade={grade}
                                  isSelected={isGradeSelected(subject.subject_code, grade)}
                                  onToggle={(g) => handleGradeToggle(subject.subject_code, g)}
                                />
                              ))}
                            </div>
                          </motion.div>
                        ))}
                      </div>
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
                    {/* Teacher Info Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-white/80">
                          Teacher Name
                        </label>
                        <div className="glass-input w-full p-3 bg-white/5 border border-white/10 rounded-lg">
                          <span className="text-white">{editData.teacher_name || 'Not specified'}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-white/80">
                          Role
                        </label>
                        <div className="glass-input w-full p-3 bg-white/5 border border-white/10 rounded-lg">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            editData.specialist 
                              ? 'bg-accent-gold/20 text-accent-gold' 
                              : 'bg-accent-teal/20 text-accent-teal'
                          }`}>
                            {editData.specialist ? 'Specialist' : 'Generalist'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-white/80">
                          Teacher ID
                        </label>
                        <div className="glass-input w-full p-3 bg-white/5 border border-white/10 rounded-lg">
                          <span className="font-mono text-white">{editData.teacher_id || `T-${String(index + 1).padStart(3, '0')}`}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-white/80">
                          Max Periods/Week
                        </label>
                        <div className="glass-input w-full p-3 bg-white/5 border border-white/10 rounded-lg">
                          <span className="text-white">{editData.max_periods_week || 0} periods</span>
                        </div>
                      </div>
                    </div>

                    {editData.flag_note && (
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-white/80">
                          Notes
                        </label>
                        <div className="glass-input w-full p-3 bg-white/5 border border-white/10 rounded-lg">
                          <span className="text-white/80">{editData.flag_note}</span>
                        </div>
                      </div>
                    )}

                    {/* Capabilities Summary */}
                    <div className="space-y-4">
                      <h5 className="text-sm font-medium text-white/80 mb-3 flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        Teaching Capabilities
                      </h5>
                      
                      <div className="space-y-3">
                        {subjects.map((subject) => {
                          const capability = getCapability(subject.subject_code);
                          const preference = getPreference(subject.subject_code);
                          const grades = capability?.grades_can_teach || [];
                          const priority = preference?.priority || 2;
                          const priorityConfig = PRIORITY_MAP[priority];

                          return (
                            <motion.div
                              key={subject.subject_code}
                              layout
                              className="bg-white/5 rounded-xl p-4 border border-white/10"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                  <span className="font-mono text-white">{subject.subject_code}</span>
                                  <span className="text-white/80">{subject.subject_name}</span>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${priorityConfig.bgColor} ${priorityConfig.textColor}`}>
                                  {priorityConfig.label}
                                </span>
                              </div>
                              
                              {grades.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                  {grades.map(grade => (
                                    <span 
                                      key={grade}
                                      className="px-2 py-1 bg-accent-teal/20 text-accent-teal text-xs rounded-lg font-medium"
                                    >
                                      {grade}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-white/40 text-sm italic">No grades selected</p>
                              )}
                            </motion.div>
                          );
                        })}
                      </div>
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
                        Edit Teacher
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

// Step 3 Component
function Step3({ onContinue, onBack }) {
  const { formData, updateFormData } = useForm();
  const [errors, setErrors] = useState({});

  // Initialize teachers from form data or empty array
  const teachers = formData.teachers || [];
  const subjects = formData.subjects || [];

  // Sync with form data
  useEffect(() => {
    if (!formData.teachers) {
      updateFormData({ teachers: [] });
    }
    if (!formData.capabilities) {
      updateFormData({ capabilities: [] });
    }
    if (!formData.preferences) {
      updateFormData({ preferences: [] });
    }
  }, []);

  const handleUpdateTeacher = (index, updatedTeacher) => {
    const newTeachers = [...teachers];
    newTeachers[index] = updatedTeacher;
    
    // Update capabilities and preferences in form data
    const newCapabilities = newTeachers.flatMap(t => t.capabilities || []);
    const newPreferences = newTeachers.flatMap(t => t.preferences || []);
    
    updateFormData({
      teachers: newTeachers,
      capabilities: newCapabilities,
      preferences: newPreferences
    });
  };

  const handleDeleteTeacher = (index) => {
    const newTeachers = teachers.filter((_, i) => i !== index);
    const newCapabilities = newTeachers.flatMap(t => t.capabilities || []);
    const newPreferences = newTeachers.flatMap(t => t.preferences || []);
    
    updateFormData({
      teachers: newTeachers,
      capabilities: newCapabilities,
      preferences: newPreferences
    });
  };

  const handleMoveUp = (index) => {
    if (index > 0) {
      const newTeachers = [...teachers];
      [newTeachers[index], newTeachers[index - 1]] = [newTeachers[index - 1], newTeachers[index]];
      updateFormData({ teachers: newTeachers });
    }
  };

  const handleMoveDown = (index) => {
    if (index < teachers.length - 1) {
      const newTeachers = [...teachers];
      [newTeachers[index], newTeachers[index + 1]] = [newTeachers[index + 1], newTeachers[index]];
      updateFormData({ teachers: newTeachers });
    }
  };

  const handleAddTeacher = () => {
    const newTeacher = {
      teacher_id: `T-${String(teachers.length + 1).padStart(3, '0')}`,
      teacher_name: '',
      specialist: false,
      max_periods_week: 0,
      confidence: 1.0,
      flag_note: null,
      capabilities: [],
      preferences: [],
    };
    
    const newTeachers = [...teachers, newTeacher];
    updateFormData({ teachers: newTeachers });
  };

  const validate = () => {
    const newErrors = {};
    
    teachers.forEach((teacher, index) => {
      if (!teacher.teacher_name?.trim()) {
        newErrors[`teacher_${index}`] = 'Teacher name is required';
      }
      
      if (!teacher.teacher_id?.trim()) {
        newErrors[`teacher_${index}`] = 'Teacher ID is required';
      }
    });
    
    // Check for duplicate teacher IDs
    const idMap = {};
    teachers.forEach((teacher, index) => {
      const id = teacher.teacher_id;
      if (id && idMap[id] !== undefined) {
        newErrors[`teacher_${index}`] = `Duplicate teacher ID: ${id}`;
      }
      idMap[id] = index;
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

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="step3"
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
            Teachers
          </h2>
          <p className="text-white/60">
            Add and configure teacher information and capabilities
          </p>
        </motion.div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Teachers List */}
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <User className="w-6 h-6 text-accent-teal" />
                Teachers ({teachers.length})
              </h3>
              
              <motion.button
                type="button"
                onClick={handleAddTeacher}
                className="glass-button flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Plus className="w-5 h-5" />
                Add Another Teacher
              </motion.button>
            </div>

            {/* Teachers */}
            <AnimatePresence>
              {teachers.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="text-center py-12"
                >
                  <motion.div
                    className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/5 border-2 border-dashed border-white/20 flex items-center justify-center"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                  >
                    <User className="w-10 h-10 text-white/40" />
                  </motion.div>
                  <p className="text-white/60 mb-4">
                    No teachers added yet
                  </p>
                  <motion.button
                    type="button"
                    onClick={handleAddTeacher}
                    className="glass-button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Add First Teacher
                  </motion.button>
                </motion.div>
              ) : (
                teachers.map((teacher, index) => (
                  <TeacherCard
                    key={`${teacher.teacher_id}-${index}`}
                    teacher={teacher}
                    index={index}
                    subjects={subjects}
                    onUpdate={handleUpdateTeacher}
                    onDelete={handleDeleteTeacher}
                    onMoveUp={handleMoveUp}
                    onMoveDown={handleMoveDown}
                  />
                ))
              )}
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
      </motion.div>
    </AnimatePresence>
  );
}

export default Step3;
