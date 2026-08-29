// Numeric input parsing shared by the intake steps.
// Keep decimal input intact so validation can reject it instead of truncating it.
export function parseNumericInput(value) {
  return value === '' ? 0 : Number(value);
}
