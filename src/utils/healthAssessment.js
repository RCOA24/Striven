/**
 * Comprehensive health risk assessment based on user's nutritional profile
 * Uses evidence-based thresholds and physician-sourced ranges
 */

export const assessHealthRisks = (payload) => {
  const { gender, age, height, weight, activity, goal, bmr, tdee, target, water, macros } = payload;
  const warnings = [];
  const ageNum = parseFloat(age);
  const weightNum = parseFloat(weight);
  const heightM = parseFloat(height) / 100;
  const bmi = weightNum / (heightM * heightM);
  
  // Age and gender-specific minimum calories (evidence-based)
  let minCalories = 1200; // Default minimum
  if (gender === 'male') {
    if (ageNum < 30) minCalories = 1500;
    else if (ageNum < 50) minCalories = 1400;
    else minCalories = 1300;
  } else {
    if (ageNum < 30) minCalories = 1300;
    else if (ageNum < 50) minCalories = 1200;
    else minCalories = 1100;
  }

  // Very low calorie check
  if (target < minCalories) {
    warnings.push({
      level: 'critical',
      message: `Target (${target} kcal) is below the safe minimum of ${minCalories} kcal for your age and gender. This may cause nutrient deficiencies and metabolic slowdown.`
    });
  }

  // BMI-based recommendations
  const deficit = tdee - target;
  const surplus = target - tdee;
  
  if (goal === 'cut' && deficit > 0) {
    let maxDeficit = 500; // Default
    if (bmi > 30) maxDeficit = 750; // Obese: can handle larger deficit
    else if (bmi > 25) maxDeficit = 600; // Overweight
    else if (bmi < 22) maxDeficit = 300; // Lean: smaller deficit safer
    
    if (deficit > maxDeficit) {
      warnings.push({
        level: 'warning',
        message: `Calorie deficit of ${deficit} kcal is aggressive. For your BMI (${bmi.toFixed(1)}), aim for ${maxDeficit - 200}-${maxDeficit} kcal deficit to preserve muscle and energy.`
      });
    }
  }

  if (goal === 'bulk' && surplus > 0) {
    let maxSurplus = 500; // Default
    if (bmi < 20) maxSurplus = 600; // Underweight: can handle more
    else if (bmi > 25) maxSurplus = 300; // Overweight: smaller surplus to minimize fat gain
    
    if (surplus > maxSurplus) {
      warnings.push({
        level: 'warning',
        message: `Calorie surplus of ${surplus} kcal may lead to excess fat gain. For your BMI (${bmi.toFixed(1)}), aim for ${maxSurplus - 200}-${maxSurplus} kcal surplus for lean muscle growth.`
      });
    }
  }

  // Protein adequacy (minimum 0.8g/kg for sedentary, up to 2.2g/kg for athletes)
  const proteinPerKg = macros.protein / weightNum;
  const minProtein = parseFloat(activity) > 1.5 ? 1.6 : 1.2; // Active people need more
  if (proteinPerKg < minProtein) {
    const recommendedProtein = Math.round(weightNum * minProtein);
    warnings.push({
      level: 'info',
      message: `Protein intake (${macros.protein}g, ${proteinPerKg.toFixed(1)}g/kg) is low for your activity level. Aim for at least ${recommendedProtein}g to preserve muscle mass.`
    });
  }

  // Water safety check
  const maxWater = Math.min(5000, weightNum * 70); // Max 5L or 70ml/kg
  if (water > maxWater) {
    warnings.push({
      level: 'warning',
      message: `Water target (${water}ml) is very high. Excessive intake beyond ${Math.round(maxWater)}ml may cause hyponatremia. Drink to thirst.`
    });
  }

  // BMI category warnings
  if (bmi < 18.5 && goal === 'cut') {
    warnings.push({
      level: 'critical',
      message: `Your BMI (${bmi.toFixed(1)}) indicates underweight. Weight loss is not recommended. Consider 'Maintain' or 'Gain' for health.`
    });
  }
  if (bmi > 30 && goal === 'bulk') {
    warnings.push({
      level: 'warning',
      message: `Your BMI (${bmi.toFixed(1)}) indicates obesity. Consider 'Lose' or 'Maintain' goals for health. Consult a healthcare provider.`
    });
  }

  return { warnings, bmi };
};
