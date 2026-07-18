import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Background3D from './components/Background3D';
import Stepper from './components/Stepper';
import Step1 from './steps/Step1';
import Step2 from './steps/Step2';
import Step3 from './steps/Step3';
import Step4 from './steps/Step4';
import { FormProvider } from './hooks/useFormContext';

function App() {
  const [currentStep, setCurrentStep] = useState(1);

  const handleNextStep = () => {
    setCurrentStep(prev => Math.min(prev + 1, 4));
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleReset = () => {
    setCurrentStep(1);
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
                <Step2 onContinue={handleNextStep} onBack={handlePrevStep} />
              )}
              {currentStep === 3 && (
                <Step3 onContinue={handleNextStep} onBack={handlePrevStep} />
              )}
              {currentStep === 4 && (
                <Step4 onBack={handlePrevStep} />
              )}
            </AnimatePresence>

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
