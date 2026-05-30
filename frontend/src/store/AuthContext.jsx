import React, { createContext, useReducer, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const initialState = {
  user: null,
  accessToken: localStorage.getItem('accessToken') || null,
  refreshToken: localStorage.getItem('refreshToken') || null,
  isLoading: true,
};

function authReducer(state, action) {
  switch (action.type) {
    case 'LOGIN':
      localStorage.setItem('accessToken', action.payload.accessToken);
      localStorage.setItem('refreshToken', action.payload.refreshToken);
      return {
        ...state,
        user: action.payload.user,
        accessToken: action.payload.accessToken,
        refreshToken: action.payload.refreshToken,
        isLoading: false,
      };
    case 'LOGOUT':
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      return {
        ...state,
        user: null,
        accessToken: null,
        refreshToken: null,
        isLoading: false,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    default:
      return state;
  }
}

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Validate active tokens on app launch
  useEffect(() => {
    const initializeAuth = async () => {
      if (!state.accessToken) {
        dispatch({ type: 'SET_LOADING', payload: false });
        return;
      }

      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1'}/auth/me`,
          {
            headers: {
              Authorization: `Bearer ${state.accessToken}`,
            },
          }
        );

        if (response.data?.success) {
          dispatch({
            type: 'LOGIN',
            payload: {
              user: response.data.data.user,
              accessToken: state.accessToken,
              refreshToken: state.refreshToken,
            },
          });
        } else {
          dispatch({ type: 'LOGOUT' });
        }
      } catch (error) {
        // If access token is expired, try rotating session using refresh token
        if (state.refreshToken) {
          try {
            const refreshRes = await axios.post(
              `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1'}/auth/refresh`,
              { refreshToken: state.refreshToken }
            );

            if (refreshRes.data?.success) {
              const { accessToken: newAccess, refreshToken: newRefresh } = refreshRes.data.data;
              
              // Load user details with new token
              const userRes = await axios.get(
                `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1'}/auth/me`,
                { headers: { Authorization: `Bearer ${newAccess}` } }
              );

              dispatch({
                type: 'LOGIN',
                payload: {
                  user: userRes.data.data.user,
                  accessToken: newAccess,
                  refreshToken: newRefresh,
                },
              });
              return;
            }
          } catch (e) {
            console.error('Session restoration failed:', e);
          }
        }
        dispatch({ type: 'LOGOUT' });
      }
    };

    initializeAuth();
  }, [state.accessToken, state.refreshToken]);

  const login = (payload) => {
    dispatch({ type: 'LOGIN', payload });
  };

  const logout = async () => {
    try {
      const apiURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';
      await axios.post(
        `${apiURL}/auth/logout`,
        {},
        {
          headers: {
            Authorization: `Bearer ${state.accessToken}`,
          },
        }
      );
    } catch (e) {
      console.warn('Backend session revoking skipped or failed.');
    }
    dispatch({ type: 'LOGOUT' });
  };

  const updateUser = (userData) => {
    dispatch({ type: 'UPDATE_USER', payload: userData });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be executed within an AuthProvider container.');
  }
  return context;
};
