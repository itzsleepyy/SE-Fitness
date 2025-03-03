import { Goal } from '@/lib/types';
import { getProgressColor } from '@/lib/goalProgress';
import { format } from 'date-fns';

interface GoalProgressBarProps {
  goal: Goal;
  progress: number;
}

export function GoalProgressBar({ goal, progress }: GoalProgressBarProps) {
  // Ensure progress is a number
  const numericProgress = Number(progress) || 0;
  const percentage = Math.min(Math.round((numericProgress / goal.target_value) * 100), 100);
  const progressColor = getProgressColor(numericProgress, goal.target_value);

  // Format progress value based on the goal type
  const formattedProgress = goal.type === 'weight' 
    ? numericProgress.toFixed(1) 
    : Math.round(numericProgress).toString();

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>
          Progress: {formattedProgress} / {goal.target_value} {goal.unit}
        </span>
        <span>{percentage}%</span>
      </div>
      <div className="relative h-2">
        <div className="absolute w-full h-2 bg-gray-200 rounded-full" />
        <div
          className={`absolute h-2 rounded-full transition-all duration-500 ${progressColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {goal.end_date && (
        <div className="text-xs text-gray-500">
          Due: {format(new Date(goal.end_date), 'MMM d, yyyy')}
        </div>
      )}
    </div>
  );
}