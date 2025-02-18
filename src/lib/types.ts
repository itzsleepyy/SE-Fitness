import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface User {
  id: number;
  username: string;
  email: string;
  height?: number;
  weight?: number;
}

export interface Goal {
  id: number;
  title: string;
  description?: string;
  target_value: number;
  current_value: number;
  unit: string;
  type: 'calories_burned' | 'calories_consumed' | 'protein' | 'weight' | 'custom';
  status: 'in_progress' | 'completed' | 'failed';
  start_date: string;
  end_date?: string;
  period: 'daily' | 'weekly' | 'monthly' | 'total';
}

export type ActivityType = 
  | 'Run'
  | 'Cycle'
  | 'Swim'
  | 'Walk'
  | 'Strength Training'
  | 'Yoga'
  | 'HIIT'
  | 'Custom'
  | 'meal';

export type MealType =
  | 'Breakfast'
  | 'Lunch'
  | 'Dinner'
  | 'Snack'
  | 'Custom';

export interface Activity {
  id: number;
  type: 'exercise' | 'meal';
  activityType: ActivityType;
  mealType?: MealType;
  foodType?: string;
  name?: string;
  duration?: number;
  calories: number;
  protein?: number;
  notes?: string;
  performed_at: string;
}

export interface Group {
  id: number;
  name: string;
  description: string;
  created_by: number;
  created_at: string;
  member_count: number;
  is_member: boolean;
  is_creator: boolean;
}

export interface GroupInvite {
  id: string;
  group_id: number;
  email: string;
  code: string;
  expires_at: string;
  created_at: string;
  created_by: number;
  group: Group;
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}