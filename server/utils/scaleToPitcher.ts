// Pitcher scaling utility with unit conversions and 0.25oz rounding

interface ScaledIngredient {
  name: string;
  amount: number;
  unit: string;
  originalAmount: number;
  originalUnit: string;
}

interface ScaleResult {
  ingredients: ScaledIngredient[];
  totalOz: number;
  targetOz: number;
}

// Unit conversion constants (to oz)
const UNIT_TO_OZ: Record<string, number> = {
  'oz': 1,
  'ml': 1 / 29.5735,
  'tbsp': 0.5,
  'tsp': 0.1667,
  'barspoon': 0.1667, // Same as tsp
  'dash': 0.02,
  'part': 1, // Will be calculated dynamically for parts
  'parts': 1 // Plural form
};

function parseIngredientLine(line: string): { amount: number; unit: string; name: string } | null {
  // Match patterns like "2 oz bourbon", "1/2 tbsp simple syrup", "3 dashes bitters"
  const match = line.match(/^(\d+(?:\/\d+)?(?:\.\d+)?)\s*([a-zA-Z]+)\s+(.+)$/i);
  if (!match) return null;

  const [, amountStr, unit, name] = match;
  
  // Handle fractions
  let amount: number;
  if (amountStr.includes('/')) {
    const [numerator, denominator] = amountStr.split('/').map(Number);
    amount = numerator / denominator;
  } else {
    amount = parseFloat(amountStr);
  }

  return { amount, unit: unit.toLowerCase(), name: name.trim() };
}

function convertToOz(amount: number, unit: string): number {
  const multiplier = UNIT_TO_OZ[unit.toLowerCase()] || 1;
  return amount * multiplier;
}

function roundToQuarter(oz: number): number {
  return Math.round(oz * 4) / 4;
}

export function scaleToPitcher(
  ingredientLines: string[],
  targetOz: number = 64
): ScaleResult {
  const parsed = ingredientLines
    .map(parseIngredientLine)
    .filter(Boolean) as Array<{ amount: number; unit: string; name: string }>;

  if (parsed.length === 0) {
    return { ingredients: [], totalOz: 0, targetOz };
  }

  // Check if we're dealing with "parts" system
  const hasPartsSystem = parsed.some(p => 
    p.unit.toLowerCase() === 'part' || p.unit.toLowerCase() === 'parts'
  );

  let scaledIngredients: ScaledIngredient[];

  if (hasPartsSystem) {
    // Parts system: calculate oz per part
    const totalParts = parsed.reduce((sum, p) => {
      if (p.unit.toLowerCase() === 'part' || p.unit.toLowerCase() === 'parts') {
        return sum + p.amount;
      }
      // Convert non-parts to oz and then to parts equivalent
      const ozValue = convertToOz(p.amount, p.unit);
      return sum + ozValue;
    }, 0);

    const ozPerPart = targetOz / totalParts;

    scaledIngredients = parsed.map(p => {
      let scaledOz: number;
      if (p.unit.toLowerCase() === 'part' || p.unit.toLowerCase() === 'parts') {
        scaledOz = p.amount * ozPerPart;
      } else {
        scaledOz = convertToOz(p.amount, p.unit) * ozPerPart;
      }

      const roundedOz = roundToQuarter(scaledOz);
      
      return {
        name: p.name,
        amount: roundedOz,
        unit: 'oz',
        originalAmount: p.amount,
        originalUnit: p.unit
      };
    });
  } else {
    // Regular scaling: convert all to oz, calculate scale factor
    const baseTotal = parsed.reduce((sum, p) => sum + convertToOz(p.amount, p.unit), 0);
    const scaleFactor = targetOz / baseTotal;

    scaledIngredients = parsed.map(p => {
      const baseOz = convertToOz(p.amount, p.unit);
      const scaledOz = baseOz * scaleFactor;
      const roundedOz = roundToQuarter(scaledOz);

      return {
        name: p.name,
        amount: roundedOz,
        unit: 'oz',
        originalAmount: p.amount,
        originalUnit: p.unit
      };
    });
  }

  // Check if total exceeds target after rounding
  let currentTotal = scaledIngredients.reduce((sum, ing) => sum + ing.amount, 0);

  // If over target, iteratively reduce largest contributors by 0.25oz
  while (currentTotal > targetOz && scaledIngredients.some(ing => ing.amount > 0.25)) {
    // Find ingredient with largest amount that can be reduced
    const largest = scaledIngredients
      .filter(ing => ing.amount > 0.25)
      .reduce((max, ing) => ing.amount > max.amount ? ing : max);
    
    largest.amount = roundToQuarter(largest.amount - 0.25);
    currentTotal = scaledIngredients.reduce((sum, ing) => sum + ing.amount, 0);
  }

  return {
    ingredients: scaledIngredients,
    totalOz: currentTotal,
    targetOz
  };
}

// Helper function to format scaled recipe for display
export function formatScaledRecipe(result: ScaleResult): string {
  const lines = result.ingredients.map(ing => 
    `${ing.amount} ${ing.unit} ${ing.name}`
  );
  
  lines.push(`\nTotal: ${result.totalOz} oz (target: ${result.targetOz} oz)`);
  
  return lines.join('\n');
}