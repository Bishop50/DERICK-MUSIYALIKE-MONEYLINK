import { User } from '../types';

export const saveUserToLocalStorage = (user: User) => {
  try {
    // Strip out large image data
    const { nrcFront, nrcBack, selfiePhoto, passportPhoto, ...userWithoutImages } = user;
    localStorage.setItem('moneylink_current_user', JSON.stringify(userWithoutImages));
  } catch (error) {
    console.error('Error saving user to localStorage:', error);
    // If quota exceeded, try to clear other potentially large items
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      localStorage.removeItem('moneylink_notifications');
      localStorage.removeItem('moneylink_recent_searches');
      // Try again
      try {
        const { nrcFront, nrcBack, selfiePhoto, passportPhoto, ...userWithoutImages } = user;
        localStorage.setItem('moneylink_current_user', JSON.stringify(userWithoutImages));
      } catch (e) {
        console.error('Still unable to save user to localStorage:', e);
      }
    }
  }
};

export const getUserFromLocalStorage = (): User | null => {
  const savedUser = localStorage.getItem('moneylink_current_user');
  if (!savedUser) return null;
  try {
    return JSON.parse(savedUser);
  } catch (error) {
    console.error('Error parsing user from localStorage:', error);
    localStorage.removeItem('moneylink_current_user');
    return null;
  }
};

export const removeUserFromLocalStorage = () => {
  localStorage.removeItem('moneylink_current_user');
};
