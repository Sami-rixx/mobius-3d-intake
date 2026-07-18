import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Background3D from './components/Background3D';
import Stepper from './components/Stepper';
import Step1 from './steps/Step1';
import { FormProvider } from './hooks/useFormContext';

function App() {
  const [currentStep, setCurrentStep] = useState(1);

  const handleNextStep = () => {
    setCurrentStep(prev => Math.min(prev + 1, 4));
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  return (
    <FormProvider>
      <div className="min-h-screen relative overflow-x-hidden">
        {/* 3D Background - Fixed behind UI */}
        <div className="fixed inset-0 z-0">
          <Background3D />
        </div>

        {/* Main Content */}
        <div className="relative z-10 min-h-screen p-4 md:p-6 lg:p-8">
          <div className="max-w-2xl mx-auto">
            {/* Header with Logo */}
            <motion.header
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="text-center mb-4"
            >
              <motion.h1
                className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-accent-teal to-accent-gold mb-2"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1, duration: 0.5 }}
              >
                Möbius Muse
              </motion.h1>
              <motion.p
                className="text-white/60 text-lg"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                Blueprint Intake
              </motion.p>
            </motion.header>

            {/* Stepper */}
            <Stepper currentStep={currentStep} />

            {/* Step Content */}
            <AnimatePresence mode="wait">
              {currentStep === 1 && (
                <Step1 onContinue={handleNextStep} />
              )}
              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.3 }}
                >
                  <h2 className="text-3xl font-bold text-white mb-6 text-center">
                    Step 2: Subject Roster
                  </h2>
                  <p className="text-center text-white/60 mb-8">
                    Coming in Milestone 2
                  </p>
                </motion.div>
              )}
              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.3 }}
                >
                  <h2 className="text-3xl font-bold text-white mb-6 text-center">
                    Step 3: Teachers
                  </h2>
                  <p className="text-center text-white/60 mb-8">
                    Coming in Milestone 3
                  </p>
                </motion.div>
              )}
              {currentStep === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.3 }}
                >
                  <h2 className="text-3xl font-bold text-white mb-6 text-center">
                    Step 4: Review & Submit
                  </h2>
                  <p className="text-center text-white/60 mb-8">
                    Coming in Milestone 4
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex gap-4 mt-8"
            >
              {currentStep > 1 && (
                <motion.button
                  type="button"
                  onClick={handlePrevStep}
                  className="glass-button flex-1 py-4 text-lg font-semibold"
                  style={{ background: 'linear-gradient(135deg, #4A5568 0%, #2D3748 100%)' }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98, y: 0 }}
                >
                  ← Back
                </motion.button>
              )}
              
              {currentStep < 4 && (
                <motion.button
                  type="button"
                  onClick={handleNextStep}
                  className="glass-button flex-1 py-4 text-lg font-semibold"
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98, y: 0 }}
                >
                  Continue →
                </motion.button>
              )}
            </motion.div>

            {/* Footer */}
            <motion.footer
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-center text-white/40 text-sm mt-12 pt-8 border-t border-white/10"
            >
              <p>Möbius Muse · Blueprint Intake</p>
            </motion.footer>
          </div>
        </div>
      </div>
    </FormProvider>
  );
}

export default App;
