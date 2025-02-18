import { useState } from 'react';
import { User, Mail, Ruler, Weight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { updateProfile } from '@/lib/api';

export function Profile() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    height: user?.height?.toString() || '',
    weight: user?.weight?.toString() || '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
        await updateProfile({
          username: formData.username,
          email: formData.email,
          height: formData.height ? Number(formData.height) : undefined,
          weight: formData.weight ? Number(formData.weight) : undefined,
        });

      // Update the global user state
      // Note: You'll need to implement this in your AuthContext
      if (typeof window !== 'undefined') {
        window.location.reload(); // Temporary solution to refresh user data
      }

      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl py-8">
      <div className="space-y-6">
        <div className="border-b border-gray-200 pb-6">
          <h2 className="text-2xl font-bold text-gray-900">Profile</h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage your personal information and preferences.
          </p>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center space-x-6 mb-6">
              <div className="h-24 w-24 rounded-full bg-indigo-100 flex items-center justify-center">
                <User className="h-12 w-12 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-xl font-medium text-gray-900">
                  {user?.username}
                </h3>
                <p className="text-sm text-gray-500">Member since 2024</p>
              </div>
            </div>

            {error && (
              <div className="mb-4 rounded-md bg-red-50 p-4">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="username"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Username
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        id="username"
                        value={formData.username}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            username: e.target.value,
                          }))
                        }
                        className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Email
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="email"
                        id="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }))
                        }
                        className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="height"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Height (cm)
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Ruler className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="number"
                        id="height"
                        value={formData.height}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            height: e.target.value,
                          }))
                        }
                        className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="weight"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Weight (kg)
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Weight className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="number"
                        id="weight"
                        value={formData.weight}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            weight: e.target.value,
                          }))
                        }
                        className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Username</h4>
                    <p className="mt-1 flex items-center text-sm text-gray-900">
                      <User className="mr-2 h-4 w-4 text-gray-400" />
                      {user?.username}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Email</h4>
                    <p className="mt-1 flex items-center text-sm text-gray-900">
                      <Mail className="mr-2 h-4 w-4 text-gray-400" />
                      {user?.email}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Height</h4>
                    <p className="mt-1 flex items-center text-sm text-gray-900">
                      <Ruler className="mr-2 h-4 w-4 text-gray-400" />
                      {user?.height} cm
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Weight</h4>
                    <p className="mt-1 flex items-center text-sm text-gray-900">
                      <Weight className="mr-2 h-4 w-4 text-gray-400" />
                      {user?.weight} kg
                    </p>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}