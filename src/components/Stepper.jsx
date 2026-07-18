import { motion } from 'framer-motion';

const steps = [
  { id: 1, label: 'School & Policy' },
  { id: 2, label: 'Subject Roster' },
  { id: 3, label: 'Teachers' },
  { id: 4, label: 'Review & Submit' },
];

function Stepper({ currentStep }) {
  return (
    <div className="w-full mb-8">
      {/* Stepper line */}
      <div className="relative flex items-center justify-between">
        {/* Line connecting steps */}
        <div className="absolute top-4 left-0 right-0 h-1 bg-white/10 rounded-full" />
        
        {/* Step indicators */}
        <div className="relative flex w-full justify-between">
          {steps.map((step, index) => {
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            const isFirst = index === 0;
            const isLast = index === steps.length - 1;

            return (
              <motion.div
                key={step.id}
                className="relative z-10 flex flex-col items-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                {/* Step circle */}
                <motion.div
                  className={`relative flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 ${
                    isActive 
                      ? 'bg-accent-teal border-accent-teal shadow-0 0 0 15px rgba(47, 166, 160, 0.3)'
                      : isCompleted
                        ? 'bg-accent-teal/30 border-accent-teal/50'
                        : 'bg-night border-white/10'
                  }`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isCompleted ? (
                    <motion.svg
                      className="w-6 h-6 text-accent-teal"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    >
                      <motion.path
                        d="M5 13l4 4L19 7"
                        strokeDasharray="100"
                        strokeDashoffset={isCompleted ? 0 : 100}
                        animate={{ strokeDashoffset: isCompleted ? 0 : 100 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                      />
                    </motion.svg>
                  ) : (
                    <span className={`font-bold text-lg ${
                      isActive ? 'text-white' : 'text-white/40'
                    }`}>
                      {step.id}
                    </span>
                  )}
                </motion.div>

                {/* Step label */}
                <motion.p
                  className={`mt-3 text-sm font-medium text-center ${
                    isActive 
                      ? 'text-accent-teal'
                      : isCompleted
                        ? 'text-accent-teal/70'
                        : 'text-white/40'
                  }`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 + 0.2 }}
                >
                  {step.label}
                </motion.p>

                {/* Connector line (hidden for last step) */}
                {!isLast && (
                  <div className="absolute top-6 left-full w-full h-0.5 bg-gradient-to-r from-accent-teal to-transparent" />
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-4">
        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-accent-teal to-accent-teal/50"
            initial={{ width: 0 }}
            animate={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
        <p className="text-center text-white/60 text-sm mt-2">
          Step {currentStep} of {steps.length}
        </p>
      </div>
    </div>
  );
}

export default Stepper;
