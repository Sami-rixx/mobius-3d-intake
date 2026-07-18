import { useState, useRef, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Environment, Float } from '@react-three/drei'
import * as THREE from 'three'

// Gatechecker Schema - Exact field names
const INITIAL_FORM_DATA = {
  // Personal Information
  teacher_name: '',
  email: '',
  phone: '',
  
  // School Information
  school_name: '',
  school_address: '',
  school_city: '',
  school_state: '',
  school_zip: '',
  school_country: 'United States',
  
  // Subject Information
  subject_code: '',
  subject_name: '',
  grade_level: '',
  
  // Class Information
  class_period: '',
  class_size: '',
  class_duration: '',
  
  // Additional Info
  special_requirements: '',
  preferred_contact_method: 'email',
  notes: '',
  
  // Metadata
  submission_date: '',
  form_version: '1.0.0',
}

// Floating 3D Card Component
function FloatingCard({ children, position, rotation, color = 'blue' }) {
  const meshRef = useRef()
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1
    }
  })
  
  const cardColors = {
    blue: '#0ea5e9',
    purple: '#8b5cf6',
    green: '#10b981',
    orange: '#f59e0b',
  }
  
  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <group position={position} rotation={rotation}>
        <mesh ref={meshRef} castShadow receiveShadow>
          <boxGeometry args={[3, 1.8, 0.1]} />
          <meshStandardMaterial 
            color={cardColors[color] || '#0ea5e9'}
            metalness={0.3}
            roughness={0.2}
            side={THREE.DoubleSide}
          />
        </mesh>
        <group position={[0, 0, 0.06]}>
          {children}
        </group>
      </group>
    </Float>
  )
}

// 3D Background Scene
function BackgroundScene() {
  return (
    <Canvas camera={{ position: [0, 0, 20], fov: 50 }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
      <pointLight position={[-10, -10, -10]} color="#0ea5e9" intensity={2} />
      <pointLight position={[10, 10, -10]} color="#8b5cf6" intensity={2} />
      
      <Environment preset="city" />
      
      {/* Floating geometric shapes */}
      <Float speed={1} rotationIntensity={0.5} floatIntensity={2}>
        <mesh position={[15, 5, -10]} castShadow>
          <dodecahedronGeometry args={[1.5]} />
          <meshStandardMaterial color="#0ea5e9" metalness={0.5} roughness={0.3} />
        </mesh>
      </Float>
      
      <Float speed={1.5} rotationIntensity={0.3} floatIntensity={1.5}>
        <mesh position={[-15, -5, -15]} castShadow>
          <icosahedronGeometry args={[1.2]} />
          <meshStandardMaterial color="#8b5cf6" metalness={0.5} roughness={0.3} />
        </mesh>
      </Float>
      
      <Float speed={0.8} rotationIntensity={0.4} floatIntensity={1}>
        <mesh position={[10, -8, -12]} castShadow>
          <octahedronGeometry args={[1]} />
          <meshStandardMaterial color="#10b981" metalness={0.5} roughness={0.3} />
        </mesh>
      </Float>
      
      <OrbitControls 
        enableZoom={false}
        enablePan={false}
        enableRotate={true}
        rotateSpeed={0.2}
      />
    </Canvas>
  )
}

// Form Section Component
function FormSection({ title, children, icon }) {
  return (
    <div className="glass-card p-6 mb-6 animate-slide-up">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">{icon}</span>
        <h2 className="text-xl font-semibold text-primary-400">{title}</h2>
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  )
}

// Input Component
function InputField({ 
  label, 
  type = 'text', 
  name, 
  value, 
  onChange, 
  placeholder = '',
  required = false,
  options = []
}) {
  if (options.length > 0) {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">
          {label}{required && <span className="text-red-500">*</span>}
        </label>
        <select 
          name={name}
          value={value}
          onChange={onChange}
          className="glass-input w-full"
          required={required}
        >
          <option value="">{placeholder || `Select ${label}`}</option>
          {options.map((option, index) => (
            <option key={index} value={option.value || option}>{option.label || option}</option>
          ))}
        </select>
      </div>
    )
  }
  
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-300">
        {label}{required && <span className="text-red-500">*</span>}
      </label>
      <input 
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="glass-input w-full"
        required={required}
      />
    </div>
  )
}

// Textarea Component
function TextareaField({ label, name, value, onChange, placeholder = '', required = false }) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-300">
        {label}{required && <span className="text-red-500">*</span>}
      </label>
      <textarea 
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={3}
        className="glass-input w-full resize-none"
        required={required}
      />
    </div>
  )
}

// Main App Component
function App() {
  const [formData, setFormData] = useState(INITIAL_FORM_DATA)
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [errors, setErrors] = useState({})
  
  const totalSteps = 4
  
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }
  
  const validateStep = (step) => {
    const newErrors = {}
    
    switch (step) {
      case 1:
        if (!formData.teacher_name.trim()) newErrors.teacher_name = 'Teacher name is required'
        if (!formData.email.trim()) {
          newErrors.email = 'Email is required'
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
          newErrors.email = 'Please enter a valid email'
        }
        if (!formData.phone.trim()) newErrors.phone = 'Phone is required'
        break
      
      case 2:
        if (!formData.school_name.trim()) newErrors.school_name = 'School name is required'
        if (!formData.school_address.trim()) newErrors.school_address = 'School address is required'
        if (!formData.school_city.trim()) newErrors.school_city = 'City is required'
        if (!formData.school_state.trim()) newErrors.school_state = 'State is required'
        if (!formData.school_zip.trim()) newErrors.school_zip = 'ZIP code is required'
        break
      
      case 3:
        if (!formData.subject_code.trim()) newErrors.subject_code = 'Subject code is required'
        if (!formData.subject_name.trim()) newErrors.subject_name = 'Subject name is required'
        if (!formData.grade_level.trim()) newErrors.grade_level = 'Grade level is required'
        break
      
      case 4:
        if (!formData.class_period.trim()) newErrors.class_period = 'Class period is required'
        if (!formData.class_size.trim()) newErrors.class_size = 'Class size is required'
        break
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps))
    }
  }
  
  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }
  
  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!validateStep(currentStep)) return
    
    setIsSubmitting(true)
    
    // Set submission date
    const finalData = {
      ...formData,
      submission_date: new Date().toISOString()
    }
    
    // Simulate API submission
    setTimeout(() => {
      console.log('Form submitted:', finalData)
      setIsSubmitting(false)
      setSubmitSuccess(true)
      
      // Download JSON
      const jsonStr = JSON.stringify(finalData, null, 2)
      const blob = new Blob([jsonStr], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `mobius-intake-${formData.teacher_name.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }, 2000)
  }
  
  const handleReset = () => {
    setFormData(INITIAL_FORM_DATA)
    setCurrentStep(1)
    setSubmitSuccess(false)
    setErrors({})
  }
  
  // Grade level options
  const gradeLevels = [
    { value: 'K', label: 'Kindergarten' },
    { value: '1', label: '1st Grade' },
    { value: '2', label: '2nd Grade' },
    { value: '3', label: '3rd Grade' },
    { value: '4', label: '4th Grade' },
    { value: '5', label: '5th Grade' },
    { value: '6', label: '6th Grade' },
    { value: '7', label: '7th Grade' },
    { value: '8', label: '8th Grade' },
    { value: '9', label: '9th Grade' },
    { value: '10', label: '10th Grade' },
    { value: '11', label: '11th Grade' },
    { value: '12', label: '12th Grade' },
    { value: 'College', label: 'College' },
    { value: 'Adult', label: 'Adult Education' },
  ]
  
  // US States
  const states = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ]
  
  // Contact methods
  const contactMethods = [
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone' },
    { value: 'text', label: 'Text Message' },
  ]
  
  // Class duration options
  const classDurations = [
    { value: '30', label: '30 minutes' },
    { value: '45', label: '45 minutes' },
    { value: '60', label: '60 minutes' },
    { value: '75', label: '75 minutes' },
    { value: '90', label: '90 minutes' },
    { value: '120', label: '2 hours' },
  ]
  
  // Generate JSON payload matching Gatechecker schema
  const generatePayload = () => {
    return {
      ...formData,
      submission_date: new Date().toISOString(),
    }
  }
  
  // Copy JSON to clipboard
  const copyToClipboard = () => {
    const payload = generatePayload()
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2))
      .then(() => alert('JSON copied to clipboard!'))
      .catch(() => alert('Failed to copy JSON'))
  }
  
  if (submitSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-card p-8 max-w-md text-center animate-fade-in">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-primary-400 mb-4">Form Submitted Successfully!</h2>
          <p className="text-gray-300 mb-6">
            Your intake form has been processed and the JSON file has been downloaded.
          </p>
          <div className="space-y-3">
            <button 
              onClick={copyToClipboard}
              className="glass-button w-full"
            >
              Copy JSON to Clipboard
            </button>
            <button 
              onClick={handleReset}
              className="glass-button w-full bg-gradient-to-r from-gray-600 to-gray-700"
            >
              Start New Form
            </button>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen relative overflow-x-hidden">
      {/* 3D Background */}
      <div className="fixed inset-0 z-0">
        <BackgroundScene />
      </div>
      
      {/* Main Content */}
      <div className="relative z-10 p-4 md:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <header className="text-center mb-8 animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-bold text-glow mb-2">
              Mobius 3D Intake
            </h1>
            <p className="text-gray-300 text-lg">
              Mobile-First 3D Styled Web Form
            </p>
            
            {/* Progress Indicator */}
            <div className="mt-6 flex justify-center gap-2">
              {Array.from({ length: totalSteps }).map((_, index) => (
                <div 
                  key={index}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    currentStep === index + 1 
                      ? 'bg-primary-500 ring-2 ring-primary-500 ring-opacity-50 scale-125' 
                      : currentStep > index + 1 
                        ? 'bg-primary-400' 
                        : 'bg-gray-600'
                  }`}
                />
              ))}
            </div>
            <p className="text-sm text-gray-400 mt-2">
              Step {currentStep} of {totalSteps}
            </p>
          </header>
          
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
              <FormSection title="Personal Information" icon="👤">
                <InputField
                  label="Teacher Name"
                  type="text"
                  name="teacher_name"
                  value={formData.teacher_name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  required
                  error={errors.teacher_name}
                />
                {errors.teacher_name && (
                  <p className="text-red-500 text-sm">{errors.teacher_name}</p>
                )}
                
                <InputField
                  label="Email Address"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your.email@school.edu"
                  required
                />
                {errors.email && (
                  <p className="text-red-500 text-sm">{errors.email}</p>
                )}
                
                <InputField
                  label="Phone Number"
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="(123) 456-7890"
                  required
                />
                {errors.phone && (
                  <p className="text-red-500 text-sm">{errors.phone}</p>
                )}
              </FormSection>
            )}
            
            {/* Step 2: School Information */}
            {currentStep === 2 && (
              <FormSection title="School Information" icon="🏫">
                <InputField
                  label="School Name"
                  type="text"
                  name="school_name"
                  value={formData.school_name}
                  onChange={handleChange}
                  placeholder="Enter school name"
                  required
                />
                {errors.school_name && (
                  <p className="text-red-500 text-sm">{errors.school_name}</p>
                )}
                
                <InputField
                  label="School Address"
                  type="text"
                  name="school_address"
                  value={formData.school_address}
                  onChange={handleChange}
                  placeholder="123 School Street"
                  required
                />
                {errors.school_address && (
                  <p className="text-red-500 text-sm">{errors.school_address}</p>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <InputField
                    label="City"
                    type="text"
                    name="school_city"
                    value={formData.school_city}
                    onChange={handleChange}
                    placeholder="City"
                    required
                  />
                  <InputField
                    label="State"
                    type="text"
                    name="school_state"
                    value={formData.school_state}
                    onChange={handleChange}
                    placeholder="State"
                    required
                  />
                  <InputField
                    label="ZIP Code"
                    type="text"
                    name="school_zip"
                    value={formData.school_zip}
                    onChange={handleChange}
                    placeholder="12345"
                    required
                  />
                </div>
                {(errors.school_city || errors.school_state || errors.school_zip) && (
                  <p className="text-red-500 text-sm">
                    {errors.school_city || errors.school_state || errors.school_zip}
                  </p>
                )}
                
                <InputField
                  label="Country"
                  type="text"
                  name="school_country"
                  value={formData.school_country}
                  onChange={handleChange}
                  placeholder="Country"
                />
              </FormSection>
            )}
            
            {/* Step 3: Subject Information */}
            {currentStep === 3 && (
              <FormSection title="Subject Information" icon="📚">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField
                    label="Subject Code"
                    type="text"
                    name="subject_code"
                    value={formData.subject_code}
                    onChange={handleChange}
                    placeholder="e.g., MATH-101"
                    required
                  />
                  <InputField
                    label="Subject Name"
                    type="text"
                    name="subject_name"
                    value={formData.subject_name}
                    onChange={handleChange}
                    placeholder="e.g., Algebra I"
                    required
                  />
                </div>
                {(errors.subject_code || errors.subject_name) && (
                  <p className="text-red-500 text-sm">
                    {errors.subject_code || errors.subject_name}
                  </p>
                )}
                
                <InputField
                  label="Grade Level"
                  name="grade_level"
                  value={formData.grade_level}
                  onChange={handleChange}
                  options={gradeLevels}
                  required
                />
                {errors.grade_level && (
                  <p className="text-red-500 text-sm">{errors.grade_level}</p>
                )}
              </FormSection>
            )}
            
            {/* Step 4: Class Information */}
            {currentStep === 4 && (
              <FormSection title="Class Information" icon="👥">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField
                    label="Class Period"
                    type="text"
                    name="class_period"
                    value={formData.class_period}
                    onChange={handleChange}
                    placeholder="e.g., 1st Period"
                    required
                  />
                  <InputField
                    label="Class Size"
                    type="number"
                    name="class_size"
                    value={formData.class_size}
                    onChange={handleChange}
                    placeholder="Number of students"
                    required
                  />
                </div>
                {(errors.class_period || errors.class_size) && (
                  <p className="text-red-500 text-sm">
                    {errors.class_period || errors.class_size}
                  </p>
                )}
                
                <InputField
                  label="Class Duration"
                  name="class_duration"
                  value={formData.class_duration}
                  onChange={handleChange}
                  options={classDurations}
                />
                
                <InputField
                  label="Preferred Contact Method"
                  name="preferred_contact_method"
                  value={formData.preferred_contact_method}
                  onChange={handleChange}
                  options={contactMethods}
                />
                
                <TextareaField
                  label="Special Requirements"
                  name="special_requirements"
                  value={formData.special_requirements}
                  onChange={handleChange}
                  placeholder="Any special requirements or accommodations needed"
                />
                
                <TextareaField
                  label="Additional Notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Any additional information or comments"
                />
              </FormSection>
            )}
            
            {/* Navigation Buttons */}
            <div className="flex gap-4 mt-8">
              {currentStep > 1 && (
                <button 
                  type="button"
                  onClick={handleBack}
                  className="glass-button flex-1 bg-gradient-to-r from-gray-600 to-gray-700"
                >
                  Back
                </button>
              )}
              
              {currentStep < totalSteps ? (
                <button 
                  type="button"
                  onClick={handleNext}
                  className="glass-button flex-1"
                >
                  Next
                </button>
              ) : (
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="glass-button flex-1"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
                      Submitting...
                    </span>
                  ) : (
                    'Submit Form'
                  )}
                </button>
              )}
            </div>
            
            {/* Preview JSON Button */}
            <div className="text-center mt-4">
              <button 
                type="button"
                onClick={copyToClipboard}
                className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
              >
                Preview JSON Payload
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default App
