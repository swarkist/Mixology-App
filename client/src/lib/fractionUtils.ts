// Utility functions for converting decimal measurements to fractions

const commonFractions: Record<string, string> = {
  '0.125': '1/8',
  '0.25': '1/4', 
  '0.33': '1/3',
  '0.333': '1/3',
  '0.5': '1/2',
  '0.67': '2/3',
  '0.667': '2/3',
  '0.75': '3/4',
  '0.875': '7/8',
  '1.25': '1 1/4',
  '1.33': '1 1/3',
  '1.5': '1 1/2',
  '1.67': '1 2/3',
  '1.75': '1 3/4',
  '2.25': '2 1/4',
  '2.5': '2 1/2',
  '2.75': '2 3/4',
  '3.5': '3 1/2',
  '4.5': '4 1/2'
};

/**
 * Converts decimal amounts to fractions for cocktail measurements
 * @param amount - The amount as a string (e.g., "0.75", "2", "1.5")
 * @returns The formatted amount with fractions (e.g., "3/4", "2", "1 1/2")
 */
export function formatMeasurementWithFractions(amount: string): string {
  // Handle empty or non-numeric amounts
  if (!amount || amount.trim() === '') return amount;
  
  // Handle already formatted fractions
  if (amount.includes('/') || amount.includes(' ')) return amount;
  
  // Handle special cases like "splash", "dash", "whole", etc.
  const nonNumeric = /^[a-zA-Z]/;
  if (nonNumeric.test(amount)) return amount;
  
  // Parse the numeric value
  const numericValue = parseFloat(amount);
  if (isNaN(numericValue)) return amount;
  
  // Check exact matches in common fractions
  const exactMatch = commonFractions[amount];
  if (exactMatch) return exactMatch;
  
  // For values close to common fractions (accounting for rounding)
  const tolerance = 0.01;
  for (const [decimal, fraction] of Object.entries(commonFractions)) {
    if (Math.abs(parseFloat(decimal) - numericValue) < tolerance) {
      return fraction;
    }
  }
  
  // If it's a whole number, return as is
  if (numericValue === Math.floor(numericValue)) {
    return numericValue.toString();
  }
  
  // For other decimals, try to convert to simple fractions
  const decimalPart = numericValue - Math.floor(numericValue);
  const wholePart = Math.floor(numericValue);
  
  // Check common decimal patterns
  if (Math.abs(decimalPart - 0.25) < tolerance) {
    return wholePart > 0 ? `${wholePart} 1/4` : '1/4';
  }
  if (Math.abs(decimalPart - 0.5) < tolerance) {
    return wholePart > 0 ? `${wholePart} 1/2` : '1/2';
  }
  if (Math.abs(decimalPart - 0.75) < tolerance) {
    return wholePart > 0 ? `${wholePart} 3/4` : '3/4';
  }
  if (Math.abs(decimalPart - 0.33) < tolerance || Math.abs(decimalPart - 0.333) < tolerance) {
    return wholePart > 0 ? `${wholePart} 1/3` : '1/3';
  }
  if (Math.abs(decimalPart - 0.67) < tolerance || Math.abs(decimalPart - 0.667) < tolerance) {
    return wholePart > 0 ? `${wholePart} 2/3` : '2/3';
  }
  
  // If no fraction match, return original
  return amount;
}

/**
 * Formats a complete ingredient measurement with fractions
 * @param amount - The amount as a string
 * @param unit - The unit (oz, ml, dash, etc.)
 * @returns Formatted string like "3/4 oz" or "2 dashes"
 */
export function formatIngredientMeasurement(amount: string, unit: string): string {
  const formattedAmount = formatMeasurementWithFractions(amount);
  
  // Handle special units that don't need space
  const noSpaceUnits = ['dash', 'dashes', 'drop', 'drops'];
  if (noSpaceUnits.includes(unit.toLowerCase())) {
    return `${formattedAmount} ${unit}`;
  }
  
  // Handle plural/singular for certain units
  const numericValue = parseFloat(amount);
  if (!isNaN(numericValue)) {
    if (unit === 'dash' && numericValue !== 1) unit = 'dashes';
    if (unit === 'drop' && numericValue !== 1) unit = 'drops';
    if (unit === 'slice' && numericValue !== 1) unit = 'slices';
    if (unit === 'wedge' && numericValue !== 1) unit = 'wedges';
  }
  
  return `${formattedAmount} ${unit}`;
}