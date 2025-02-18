// Types for user data
export interface User {
  id: number;
  username: string;
  email: string;
  height?: number;
  weight?: number;
}

// Function to check if user is authenticated
export async function checkAuth(): Promise<User | null> {
  try {
    const response = await fetch('http://localhost:3000/api/profile', {
      credentials: 'include',
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.user;
  } catch (error) {
    return null;
  }
}

// Function to handle logout
export async function logout(): Promise<void> {
  try {
    await fetch('http://localhost:3000/api/logout', {
      method: 'POST',
      credentials: 'include',
    });
  } catch (error) {
    console.error('Logout error:', error);
  }
}