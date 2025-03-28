// Utility functions for grade calculations

// Calculate percentage from obtained and max score
export function calculatePercentage(obtained, max) {
  if (!obtained || !max || max === 0) return 0;
  return (obtained / max) * 100;
}

// Assign letter grade based on percentage
export function assignLetterGrade(percentage) {
  if (percentage >= 91) return { letter: 'A', status: 'Excelente' };
  if (percentage >= 81) return { letter: 'B', status: 'Muy bien' };
  if (percentage >= 71) return { letter: 'C', status: 'Aprobado' };
  if (percentage >= 61) return { letter: 'D', status: 'Aprobado con advertencia' };
  return { letter: 'F', status: 'Reprobado' };
}

// Get status class for styling based on letter grade
export function getStatusClass(letter) {
  switch(letter) {
    case 'A':
    case 'B':
    case 'C':
      return 'text-success';
    case 'D':
      return 'text-warning';
    case 'F':
      return 'text-danger';
    default:
      return 'text-gray-500';
  }
}

// Calculate category contribution to final grade
export function calculateCategoryContribution(category, activities) {
  if (!activities || activities.length === 0) return 0;
  
  // Filter out pending activities
  const completedActivities = activities.filter(act => !act.is_pending);
  
  if (completedActivities.length === 0) return 0;
  
  if (category.calculation_mode === 'dynamic') {
    // Calculate average percentage of completed activities
    const sum = completedActivities.reduce((acc, act) => 
      acc + calculatePercentage(act.obtained_score, act.max_score), 0);
    const avgPercentage = sum / completedActivities.length;
    
    // Apply category percentage weight
    return (avgPercentage / 100) * category.percentage;
  } else { // fixed mode
    // Each activity has a fixed contribution
    const activityWeight = category.percentage / category.total_activities;
    
    // Sum the contributions of completed activities
    return completedActivities.reduce((acc, act) => {
      const actPercentage = calculatePercentage(act.obtained_score, act.max_score);
      return acc + ((actPercentage / 100) * activityWeight);
    }, 0);
  }
}

// Calculate overall subject grade
export function calculateSubjectGrade(categories, activitiesByCategory) {
  if (!categories || categories.length === 0) return { 
    grade: 0, 
    letter: 'N/A', 
    status: 'Sin calificar',
    percentComplete: 0 
  };
  
  let totalContribution = 0;
  let percentageEvaluated = 0;
  
  categories.forEach(category => {
    const activities = activitiesByCategory[category.id] || [];
    const contribution = calculateCategoryContribution(category, activities);
    totalContribution += contribution;
    
    // Calculate how much of this category has been evaluated
    const completedActivities = activities.filter(act => !act.is_pending);
    
    if (category.calculation_mode === 'dynamic') {
      if (completedActivities.length > 0) {
        percentageEvaluated += category.percentage;
      }
    } else { // fixed mode
      if (category.total_activities > 0) {
        percentageEvaluated += (completedActivities.length / category.total_activities) * category.percentage;
      }
    }
  });
  
  const { letter, status } = assignLetterGrade(totalContribution);
  
  return {
    grade: Math.round(totalContribution * 100) / 100, // Round to 2 decimal places
    letter,
    status,
    percentComplete: Math.round(percentageEvaluated)
  };
}
