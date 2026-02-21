import { create } from 'zustand';
import { User } from '../../types';

interface UserState {
  currentUser: User | null;
  isAuthenticated: boolean;
  setCurrentUser: (user: User | null) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  currentUser: null,
  isAuthenticated: false,
  setCurrentUser: (user: User | null) =>
    set({
      currentUser: user,
      isAuthenticated: !!user,
    }),
  logout: () =>
    set({
      currentUser: null,
      isAuthenticated: false,
    }),
}));
