import { Goal, Activity } from './types';
import { format, isWithinInterval, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

export function calculateGoalProgress(goal: Goal, activities: Activity[], currentWeight?: number): number {
  const now = new Date();
  let progress = 0;

  // Get activities within the relevant time period
  const relevantActivities = filterActivitiesByPeriod(activities, goal.period, now);

  switch (goal.type) {
    case 'calories_burned':
      progress = calculateCaloriesBurned(relevantActivities);
      break;
    case 'calories_consumed':
      progress = calculateCaloriesConsumed(relevantActivities);
      break;
    case 'protein':
      progress = calculateProteinIntake(relevantActivities);
      break;
    case 'weight':
      progress = currentWeight || 0;
      break;
    case 'custom':
      // For custom goals, use the current_value directly
      progress = goal.current_value;
      break;
  }

  return progress;
}

export function updateGoalStatus(goal: Goal, currentProgress: number): 'in_progress' | 'completed' | 'failed' {
  const now = new Date();
  const endDate = goal.end_date ? new Date(goal.end_date) : null;

  // Check if goal has expired
  if (endDate && now > endDate) {
    return currentProgress >= goal.target_value ? 'completed' : 'failed';
  }

  // For weight goals, check if target is reached
  if (goal.type === 'weight') {
    // If target is lower than starting weight (weight loss goal)
    if (goal.target_value < goal.current_value) {
      return currentProgress <= goal.target_value ? 'completed' : 'in_progress';
    }
    // If target is higher than starting weight (weight gain goal)
    return currentProgress >= goal.target_value ? 'completed' : 'in_progress';
  }

  // For other goals
  return currentProgress >= goal.target_value ? 'completed' : 'in_progress';
}

function filterActivitiesByPeriod(activities: Activity[], period: Goal['period'], date: Date) {
  let start: Date;
  let end: Date;

  switch (period) {
    case 'daily':
      start = startOfDay(date);
      end = endOfDay(date);
      break;
    case 'weekly':
      start = startOfWeek(date);
      end = endOfWeek(date);
      break;
    case 'monthly':
      start = startOfMonth(date);
      end = endOfMonth(date);
      break;
    case 'total':
      return activities;
  }

  return activities.filter(activity => {
    const activityDate = new Date(activity.performed_at);
    return isWithinInterval(activityDate, { start, end });
  });
}

function calculateCaloriesBurned(activities: Activity[]): number {
  return activities
    .filter(activity => activity.type === 'exercise')
    .reduce((sum, activity) => sum + activity.calories, 0);
}

function calculateCaloriesConsumed(activities: Activity[]): number {
  return activities
    .filter(activity => activity.type === 'meal')
    .reduce((sum, activity) => sum + activity.calories, 0);
}

function calculateProteinIntake(activities: Activity[]): number {
  return activities
    .filter(activity => activity.type === 'meal' && activity.protein)
    .reduce((sum, activity) => sum + (activity.protein || 0), 0);
}

export function getProgressColor(progress: number, target: number): string {
  const percentage = (progress / target) * 100;
  if (percentage >= 100) return 'bg-green-600';
  if (percentage >= 75) return 'bg-blue-600';
  if (percentage >= 50) return 'bg-yellow-600';
  return 'bg-red-600';
}