import { useState } from 'react';
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { createGoal } from '@/lib/api';
import type { Goal } from '@/lib/types';

interface AddGoalDialogProps {
  open: boolean;
  onClose: () => void;
  onGoalAdded: (goal: Goal) => void;
}

const GOAL_TYPES = [
  { value: 'weight', label: 'Weight', unit: 'kg' },
  { value: 'calories_burned', label: 'Calories Burned', unit: 'calories' },
  { value: 'calories_consumed', label: 'Calories Consumed', unit: 'calories' },
  { value: 'protein', label: 'Protein Intake', unit: 'grams' },
  { value: 'custom', label: 'Custom Goal', unit: '' }
] as const;

const GOAL_PERIODS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'total', label: 'Total' }
] as const;

export function AddGoalDialog({ open, onClose, onGoalAdded }: AddGoalDialogProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    target_value: '',
    type: 'weight' as Goal['type'],
    unit: 'kg',
    period: 'daily' as Goal['period'],
    end_date: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoalTypeChange = (type: string) => {
    const goalType = GOAL_TYPES.find(t => t.value === type);
    setFormData(prev => ({
      ...prev,
      type: type as Goal['type'],
      unit: goalType?.unit || prev.unit
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const goal = await createGoal({
        title: formData.title,
        description: formData.description || undefined,
        target_value: Number(formData.target_value),
        type: formData.type,
        unit: formData.unit,
        period: formData.period,
        end_date: formData.end_date || undefined,
      });

      onGoalAdded(goal);
      onClose();
      setFormData({
        title: '',
        description: '',
        target_value: '',
        type: 'weight',
        unit: 'kg',
        period: 'daily',
        end_date: '',
      });
    } catch (err) {
      setError('Failed to create goal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <DialogHeader>
          <DialogTitle>Add New Goal</DialogTitle>
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
                Goal Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => handleGoalTypeChange(e.target.value)}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                {GOAL_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Target Value ({formData.unit})
              </label>
              <input
                type="number"
                value={formData.target_value}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, target_value: e.target.value }))
                }
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Period
              </label>
              <select
                value={formData.period}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, period: e.target.value as Goal['period'] }))
                }
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                {GOAL_PERIODS.map((period) => (
                  <option key={period.value} value={period.value}>
                    {period.label}
                  </option>
                ))}
              </select>
            </div>

            {formData.type === 'custom' && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Unit
                </label>
                <input
                  type="text"
                  value={formData.unit}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, unit: e.target.value }))
                  }
                  required
                  placeholder="e.g., steps, minutes, km"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">
                End Date
              </label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, end_date: e.target.value }))
                }
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
            {loading ? 'Adding...' : 'Add Goal'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}