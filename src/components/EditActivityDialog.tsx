import { useState, useEffect } from 'react';
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { updateActivity } from '@/lib/api';
import type { Activity, ActivityType, MealType } from '@/lib/types';

interface EditActivityDialogProps {
  activity: Activity | null;
  open: boolean;
  onClose: () => void;
  onActivityUpdated: (activity: Activity) => void;
}

const EXERCISE_TYPES: ActivityType[] = [
  'Run',
  'Cycle',
  'Swim',
  'Walk',
  'Strength Training',
  'Yoga',
  'HIIT',
  'Custom'
];

const MEAL_TYPES: MealType[] = [
  'Breakfast',
  'Lunch',
  'Dinner',
  'Snack',
  'Custom'
];

const COMMON_FOOD_TYPES = [
  'Fruits',
  'Vegetables',
  'Grains',
  'Protein',
  'Dairy',
  'Beverages',
  'Snacks',
  'Custom'
];

export function EditActivityDialog({
  activity,
  open,
  onClose,
  onActivityUpdated,
}: EditActivityDialogProps) {
  const [formData, setFormData] = useState({
    type: 'exercise',
    activityType: 'Run' as ActivityType,
    mealType: 'Breakfast' as MealType,
    foodType: COMMON_FOOD_TYPES[0],
    customName: '',
    customFoodType: '',
    duration: '',
    calories: '',
    protein: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (activity) {
      setFormData({
        type: activity.type,
        activityType: activity.activityType,
        mealType: activity.mealType || 'Breakfast',
        foodType: activity.foodType || COMMON_FOOD_TYPES[0],
        customName: activity.name || '',
        customFoodType: activity.name || '',
        duration: activity.duration?.toString() || '',
        calories: activity.calories.toString(),
        protein: activity.protein?.toString() || '',
        notes: activity.notes || '',
      });
    }
  }, [activity]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activity) return;
    
    setError(null);
    setLoading(true);

    try {
      const updatedActivity = await updateActivity(activity.id, {
        type: formData.type as 'exercise' | 'meal',
        activityType: formData.type === 'meal' ? 'meal' : formData.activityType,
        mealType: formData.type === 'meal' ? formData.mealType : undefined,
        foodType: formData.type === 'meal' ? 
          (formData.foodType === 'Custom' ? formData.customFoodType : formData.foodType) : 
          undefined,
        name: formData.type === 'exercise' ? 
          (formData.activityType === 'Custom' ? formData.customName : formData.activityType) :
          (formData.foodType === 'Custom' ? formData.customFoodType : formData.foodType),
        duration: formData.type === 'exercise' ? Number(formData.duration) : undefined,
        calories: Number(formData.calories),
        protein: formData.type === 'meal' ? Number(formData.protein) : undefined,
        notes: formData.notes || undefined,
      });

      onActivityUpdated(updatedActivity);
      onClose();
    } catch (err) {
      setError('Failed to update activity. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <DialogHeader>
          <DialogTitle>Edit Activity</DialogTitle>
        </DialogHeader>

        <DialogContent>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Activity Category
              </label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    type: e.target.value,
                    activityType: e.target.value === 'exercise' ? 'Run' : 'meal',
                    mealType: e.target.value === 'meal' ? 'Breakfast' : prev.mealType
                  }))
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="exercise">Exercise</option>
                <option value="meal">Meal</option>
              </select>
            </div>

            {formData.type === 'exercise' && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Exercise Type
                </label>
                <select
                  value={formData.activityType}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      activityType: e.target.value as ActivityType
                    }))
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  {EXERCISE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {formData.type === 'meal' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Meal Type
                  </label>
                  <select
                    value={formData.mealType}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        mealType: e.target.value as MealType
                      }))
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    {MEAL_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Food/Drink Type
                  </label>
                  <select
                    value={formData.foodType}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        foodType: e.target.value
                      }))
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    {COMMON_FOOD_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {formData.type === 'exercise' && formData.activityType === 'Custom' && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Custom Activity Name
                </label>
                <input
                  type="text"
                  value={formData.customName}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, customName: e.target.value }))
                  }
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            )}

            {formData.type === 'meal' && formData.foodType === 'Custom' && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Custom Food/Drink Name
                </label>
                <input
                  type="text"
                  value={formData.customFoodType}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, customFoodType: e.target.value }))
                  }
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            )}

            {formData.type === 'exercise' && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, duration: e.target.value }))
                  }
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Calories
              </label>
              <input
                type="number"
                value={formData.calories}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, calories: e.target.value }))
                }
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            {formData.type === 'meal' && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Protein (grams)
                </label>
                <input
                  type="number"
                  value={formData.protein}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, protein: e.target.value }))
                  }
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, notes: e.target.value }))
                }
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div>
        </DialogContent>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Updating...' : 'Update Activity'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}