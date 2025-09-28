// src/store/authSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  email: '',
  role: '',
  first_name: '',
  last_name: '',
  profileImage: '',
  hostId: '',
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setLogin: (state, action) => {
      const {
        email,
        role,
        first_name,
        last_name,
        profileImage,
        id
        } = action.payload;

      state.email = email;
      state.role = role;
      state.first_name = first_name;
      state.last_name = last_name;
      state.profileImage = profileImage;
      state.id = id;

    },

    logout: (state) => {
      // Clear on logout
      return initialState;
    },
  },
});

export const { setLogin, logout } = authSlice.actions;
export default authSlice.reducer;
