import { useEffect, useState } from 'react';
import { Activity, Target, Utensils, Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { fetchGoals, fetchActivities, deleteGoal, deleteActivity, updateGoal } from '@/lib/api';
import type { Goal, Activity as ActivityType } from '@/lib/types';
import { format } from 'date-fns';
import { AddActivityDialog } from '@/components/AddActivityDialog';
import { AddGoalDialog } from '@/components/AddGoalDialog';
import { EditActivityDialog } from '@/components/EditActivityDialog';
import { EditGoalDialog } from '@/components/EditGoalDialog';
import { calculateGoalProgress, updateGoalStatus } from '@/lib/goalProgress';
import { GoalProgressBar } from '@/components/GoalProgressBar';

export function Dashboard() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [activities, setActivities] = useState<ActivityType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ActivityType | null>(null);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [goalsData, activitiesData] = await Promise.all([
          fetchGoals(),
          fetchActivities(),
        ]);
        setGoals(goalsData);
        setActivities(activitiesData);
      } catch (err) {
        setError('Failed to load dashboard data');
        console.error('Dashboard data loading error:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Update goal progress when activities change
  useEffect(() => {
    const updateGoals = async () => {
      for (const goal of goals) {
        const currentProgress = calculateGoalProgress(goal, activities, user?.weight);
        const newStatus = updateGoalStatus(goal, currentProgress);
        
        if (goal.current_value !== currentProgress || goal.status !== newStatus) {
          try {
            await updateGoal(goal.id, {
              current_value: currentProgress,
              status: newStatus
            });
            
            // Update local state
            setGoals(prevGoals => 
              prevGoals.map(g => 
                g.id === goal.id 
                  ? { ...g, current_value: currentProgress, status: newStatus }
                  : g
              )
            );
          } catch (error) {
            console.error('Failed to update goal progress:', error);
          }
        }
      }
    };

    if (goals.length > 0 && activities.length > 0) {
      updateGoals();
    }
  }, [goals, activities, user?.weight]);

  const handleActivityAdded = (activity: ActivityType) => {
    setActivities((prev) => [activity, ...prev]);
  };

  const handleGoalAdded = (goal: Goal) => {
    setGoals((prev) => [goal, ...prev]);
  };

  const handleActivityUpdated = (updatedActivity: ActivityType) => {
    setActivities((prev) =>
      prev.map((activity) =>
        activity.id === updatedActivity.id ? updatedActivity : activity
      )
    );
    setEditingActivity(null);
  };

  const handleGoalUpdated = (updatedGoal: Goal) => {
    setGoals((prev) =>
      prev.map((goal) => (goal.id === updatedGoal.id ? updatedGoal : goal))
    );
    setEditingGoal(null);
  };

  const handleDeleteActivity = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this activity?')) {
      try {
        const success = await deleteActivity(id);
        if (success) {
          setActivities((prev) => prev.filter((activity) => activity.id !== id));
        }
      } catch (err) {
        console.error('Error deleting activity:', err);
      }
    }
  };

  const handleDeleteGoal = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this goal?')) {
      try {
        const success = await deleteGoal(id);
        if (success) {
          setGoals((prev) => prev.filter((goal) => goal.id !== id));
        }
      } catch (err) {
        console.error('Error deleting goal:', err);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-lg text-gray-500">Loading your dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="text-sm text-red-700">{error}</div>
      </div>
    );
  }

  // Calculate calories consumed (from meals)
  const caloriesConsumed = activities
    .filter(activity => activity.type === 'meal')
    .reduce((sum, activity) => sum + (activity.calories || 0), 0);

  // Calculate calories burned (from exercises)
  const caloriesBurned = activities
    .filter(activity => activity.type === 'exercise')
    .reduce((sum, activity) => sum + (activity.calories || 0), 0);

  // Calculate stats from real data
  const stats = [
    {
      name: 'Current Weight',
      value: `${user?.weight || 0} kg`,
      change: 'Updated from profile',
      changeType: 'neutral',
    },
    {
      name: 'Active Goals',
      value: goals.filter(g => g.status === 'in_progress').length.toString(),
      change: `${goals.filter(g => g.status === 'completed').length} completed`,
      changeType: 'increase',
    },
    {
      name: 'Calories Consumed',
      value: caloriesConsumed.toString(),
      change: 'From tracked meals',
      changeType: 'neutral',
    },
    {
      name: 'Recent Activities',
      value: activities.length.toString(),
      change: 'Last 10 activities',
      changeType: 'neutral',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6"
          >
            <dt className="truncate text-sm font-medium text-gray-500">
              {stat.name}
            </dt>
            <dd className="mt-1 flex items-baseline justify-between md:block lg:flex">
              <div className="flex items-baseline text-2xl font-semibold text-gray-900">
                {stat.value}
              </div>
              <div
                className={`inline-flex items-baseline rounded-full px-2.5 py-0.5 text-sm font-medium md:mt-2 lg:mt-0
                  ${
                    stat.changeType === 'increase'
                      ? 'bg-green-100 text-green-800'
                      : stat.changeType === 'decrease'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
              >
                {stat.change}
              </div>
            </dd>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium text-gray-900">
                  Recent Activities
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Total calories burned: {caloriesBurned}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddActivity(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Activity
              </Button>
            </div>
            <div className="mt-6 flow-root">
              <ul className="-my-5 divide-y divide-gray-200">
                {activities.map((activity) => (
                  <li key={activity.id} className="py-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        {activity.type === 'exercise' ? (
                          <Activity className="h-6 w-6 text-indigo-600" />
                        ) : (
                          <Utensils className="h-6 w-6 text-green-600" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900">
                          {activity.name}
                          {activity.type === 'meal' && activity.mealType && (
                            <span className="ml-2 text-gray-500">
                              ({activity.mealType})
                            </span>
                          )}
                        </p>
                        <p className="truncate text-sm text-gray-500">
                          {activity.duration
                            ? `${activity.duration} mins • ${activity.calories} calories burned`
                            : `${activity.calories} calories consumed ${
                                activity.protein ? `• ${activity.protein}g protein` : ''
                              }`}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="text-sm text-gray-500">
                          {format(new Date(activity.performed_at), 'MMM d, HH:mm')}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingActivity(activity)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteActivity(activity.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">Current Goals</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddGoal(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Goal
              </Button>
            </div>
            <div className="mt-6 space-y-4">
              {goals.map((goal) => {
                const progress = calculateGoalProgress(goal, activities, user?.weight);
                
                return (
                  <div
                    key={goal.id}
                    className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Target className="h-5 w-5 text-indigo-600" />
                        <h3 className="ml-2 text-sm font-medium text-gray-900">
                          {goal.title}
                        </h3>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            goal.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : goal.status === 'failed'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {goal.status.charAt(0).toUpperCase() +
                            goal.status.slice(1).replace('_', ' ')}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingGoal(goal)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteGoal(goal.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                    {goal.description && (
                      <p className="mt-2 text-sm text-gray-500">
                        {goal.description}
                      </p>
                    )}
                    <div className="mt-4">
                      <GoalProgressBar goal={goal} progress={progress} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <AddActivityDialog
        open={showAddActivity}
        onClose={() => setShowAddActivity(false)}
        onActivityAdded={handleActivityAdded}
      />

      <AddGoalDialog
        open={showAddGoal}
        onClose={() => setShowAddGoal(false)}
        onGoalAdded={handleGoalAdded}
      />

      <EditActivityDialog
        activity={editingActivity}
        open={!!editingActivity}
        onClose={() => setEditingActivity(null)}
        onActivityUpdated={handleActivityUpdated}
      />

      <EditGoalDialog
        goal={editingGoal}
        open={!!editingGoal}
        onClose={() => setEditingGoal(null)}
        onGoalUpdated={handleGoalUpdated}
      />
    </div>
  );
}