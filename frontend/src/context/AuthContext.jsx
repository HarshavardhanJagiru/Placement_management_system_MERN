import React, { createContext, useState, useEffect } from 'react';
import API from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user info and token exist in storage
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');

    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const { data } = await API.post('/auth/login', { username, password });
      setUser(data);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data));
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed. Please check credentials.',
        notVerified: error.response?.data?.notVerified,
        pendingUserId: error.response?.data?.pendingUserId
      };
    }
  };

  const register = async (username, email, password, fullName, department, cgpa) => {
    try {
      const { data } = await API.post('/auth/register', {
        username,
        email,
        password,
        fullName,
        department,
        cgpa
      });
      return { success: true, pendingUserId: data.pendingUserId };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed.'
      };
    }
  };

  const verifyEmail = async (pendingUserId, otpCode) => {
    try {
      const { data } = await API.post('/auth/verify-email', { pendingUserId, otpCode });
      setUser(data);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data));
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Verification failed.'
      };
    }
  };

  const forgotPassword = async (email) => {
    try {
      await API.post('/auth/forgot-password', { email });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Request failed.'
      };
    }
  };

  const resetPassword = async (email, otpCode, newPassword, confirmPassword) => {
    try {
      await API.post('/auth/reset-password', {
        email,
        otpCode,
        newPassword,
        confirmPassword
      });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Reset password failed.'
      };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const changePassword = async (currentPassword, newPassword, confirmPassword) => {
    try {
      const { data } = await API.post('/auth/change-password', {
        currentPassword,
        newPassword,
        confirmPassword
      });
      return { success: true, message: data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Change password failed.'
      };
    }
  };

  const updateProfile = async (formData) => {
    try {
      const { data } = await API.post('/student/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Update local storage user state with new student details
      if (user && data.student) {
        const updatedUser = { ...user, studentDetails: data.student };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
      return { success: true, message: data.message, student: data.student };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Update profile failed.'
      };
    }
  };

  const deleteAccount = async () => {
    try {
      await API.post('/student/delete-account');
      logout();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Account deletion failed.'
      };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        verifyEmail,
        forgotPassword,
        resetPassword,
        logout,
        changePassword,
        updateProfile,
        deleteAccount
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
