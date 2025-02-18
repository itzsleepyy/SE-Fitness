import { Goal, Activity, User, Group } from './types';

const API_URL = 'http://localhost:3000/api';

export async function fetchGoals(): Promise<Goal[]> {
  const response = await fetch(`${API_URL}/goals`, {
    credentials: 'include',
  });
  const data = await response.json();
  return data.goals;
}

export async function fetchActivities(): Promise<Activity[]> {
  const response = await fetch(`${API_URL}/activities`, {
    credentials: 'include',
  });
  const data = await response.json();
  return data.activities;
}

export async function createActivity(activity: Omit<Activity, 'id' | 'performed_at'>) {
  const response = await fetch(`${API_URL}/activities`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(activity),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create activity');
  }
  
  const data = await response.json();
  return data.activity;
}

export async function updateActivity(id: number, activity: Partial<Activity>) {
  const response = await fetch(`${API_URL}/activities/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(activity),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update activity');
  }
  
  const data = await response.json();
  return data.activity;
}

export async function deleteActivity(id: number) {
  const response = await fetch(`${API_URL}/activities/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  return response.ok;
}

export async function createGoal(goal: Omit<Goal, 'id' | 'current_value' | 'status' | 'start_date'>) {
  // Get current progress for the start value
  const response = await fetch(`${API_URL}/goals/initial-value`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(goal),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create goal');
  }
  
  const data = await response.json();
  return data.goal;
}

export async function updateGoal(id: number, updates: Partial<Goal>) {
  const response = await fetch(`${API_URL}/goals/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(updates),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update goal');
  }
  
  const data = await response.json();
  return data.goal;
}

export async function deleteGoal(id: number) {
  const response = await fetch(`${API_URL}/goals/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  return response.ok;
}

export async function updateProfile(updates: Partial<User>) {
  const response = await fetch(`${API_URL}/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(updates),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update profile');
  }
  
  const data = await response.json();
  return data.user;
}

export async function getGoalProgress(goalId: number): Promise<number> {
  const response = await fetch(`${API_URL}/goals/${goalId}/progress`, {
    credentials: 'include',
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch goal progress');
  }
  
  const data = await response.json();
  return data.progress;
}

export async function getActivitiesForPeriod(
  startDate: string,
  endDate: string
): Promise<Activity[]> {
  const response = await fetch(
    `${API_URL}/activities?start=${startDate}&end=${endDate}`,
    {
      credentials: 'include',
    }
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch activities');
  }
  
  const data = await response.json();
  return data.activities;
}

export async function fetchGroups(): Promise<Group[]> {
  const response = await fetch(`${API_URL}/groups`, {
    credentials: 'include',
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch groups');
  }
  
  const data = await response.json();
  return data.groups;
}

export async function createGroup(name: string, description: string): Promise<Group> {
  const response = await fetch(`${API_URL}/groups`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ name, description }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create group');
  }
  
  const data = await response.json();
  return data.group;
}

export async function inviteToGroup(groupId: number, email: string): Promise<void> {
  const response = await fetch(`${API_URL}/groups/${groupId}/invite`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ email }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to send invitation');
  }
}

export async function joinGroup(code: string): Promise<Group> {
  const response = await fetch(`${API_URL}/groups/join`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ code }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to join group');
  }
  
  const data = await response.json();
  return data.group;
}

export async function leaveGroup(groupId: number): Promise<void> {
  const response = await fetch(`${API_URL}/groups/${groupId}/leave`, {
    method: 'POST',
    credentials: 'include',
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to leave group');
  }
}

export async function shareGoal(groupId: number, goalId: number): Promise<void> {
  const response = await fetch(`${API_URL}/groups/${groupId}/goals/${goalId}/share`, {
    method: 'POST',
    credentials: 'include',
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to share goal');
  }
}

export async function acceptSharedGoal(code: string): Promise<Goal> {
  const response = await fetch(`${API_URL}/goals/accept`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ code }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to accept goal');
  }
  
  const data = await response.json();
  return data.goal;
}