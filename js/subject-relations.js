// Keep subject-code references aligned while a custom subject is edited.
export function renameSubjectCode(state, subjectIndex, nextSubjectCode) {
  const subject = state.subjects[subjectIndex];
  const previousSubjectCode = subject.subject_code;

  subject.subject_code = nextSubjectCode;
  if (previousSubjectCode === nextSubjectCode) return;

  state.capabilities.forEach(capability => {
    if (capability.subject_code === previousSubjectCode) {
      capability.subject_code = nextSubjectCode;
    }
  });

  state.preferences.forEach(preference => {
    if (preference.subject_code === previousSubjectCode) {
      preference.subject_code = nextSubjectCode;
    }
  });
}
