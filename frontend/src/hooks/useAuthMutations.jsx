import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import { loginRequest, logoutAllRequest, logoutRequest, registerRequest } from '../api/authApi';
import { sessionCleared, sessionReceived } from '../store/authSlice';

/** Server call via TanStack Query; the resulting session is stored in Redux. Errors become toasts globally. */
const useSessionMutation = (mutationFn, errorTitle) => {
  const dispatch = useDispatch();
  return useMutation({
    mutationFn,
    meta: { errorTitle },
    onSuccess: (session) => dispatch(sessionReceived(session)),
  });
};

/** Signs out locally even if the server call fails, and drops all cached server data. */
const useEndSessionMutation = (mutationFn) => {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    meta: { errorTitle: 'Sign-out did not reach the server' },
    onSettled: () => {
      dispatch(sessionCleared());
      queryClient.clear();
    },
  });
};

export const useLoginMutation = () => useSessionMutation(loginRequest, 'Sign-in failed');
export const useRegisterMutation = () => useSessionMutation(registerRequest, 'Could not create your account');
export const useLogoutMutation = () => useEndSessionMutation(logoutRequest);
export const useLogoutAllMutation = () => useEndSessionMutation(logoutAllRequest);
