import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../api/config';
import { invalidateFileQueries, queryKeys } from '../api/queryClient';
import { refreshSession } from '../api/session';
import { selectAccessToken, selectCurrentUser, selectIsAuthenticated } from '../store/authSlice';
import { showToast } from '../store/toastsSlice';
import { realtimeStatusChanged } from '../store/uiSlice';

const AUTH_ERRORS = new Set(['TOKEN_EXPIRED', 'INVALID_TOKEN', 'UNAUTHORIZED']);

/**
 * Keeps a Socket.IO connection open while signed in:
 * - uploads / edits / deletions refresh cached queries instantly
 * - uploads by other people show a toast notification
 * - when the short-lived access token expires, the session is refreshed and the socket reconnects
 */
export const useRealtime = () => {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const accessToken = useSelector(selectAccessToken);
  const currentUser = useSelector(selectCurrentUser);

  // Refs let the long-lived socket read the latest values without reconnecting.
  const tokenRef = useRef(accessToken);
  const userIdRef = useRef(currentUser?.id);

  useEffect(() => {
    tokenRef.current = accessToken;
    userIdRef.current = currentUser?.id;
  }, [accessToken, currentUser?.id]);

  useEffect(() => {
    if (!isAuthenticated) return undefined;

    dispatch(realtimeStatusChanged('connecting'));
    const socket = io(SOCKET_URL, {
      auth: (send) => send({ token: tokenRef.current }),
      transports: ['websocket', 'polling'],
      autoConnect: false,
    });
    // Connect on the next tick: React StrictMode mounts effects twice in development, and the
    // first (immediately cleaned up) mount should not open a socket at all.
    const connectTimer = setTimeout(() => socket.connect(), 0);

    const reconnectWithFreshToken = async () => {
      const token = await refreshSession(dispatch);
      if (token && !socket.connected) socket.connect();
    };

    socket.on('connect', () => dispatch(realtimeStatusChanged('live')));

    socket.on('disconnect', (reason) => {
      dispatch(realtimeStatusChanged('offline'));
      // The server closes the socket when the access token expires.
      if (reason === 'io server disconnect') reconnectWithFreshToken();
    });

    socket.on('connect_error', (error) => {
      dispatch(realtimeStatusChanged('offline'));
      if (AUTH_ERRORS.has(error.message)) reconnectWithFreshToken();
    });

    socket.on('file:uploaded', ({ file }) => {
      invalidateFileQueries(queryClient);
      if (file.owner.id !== userIdRef.current) {
        dispatch(
          showToast({
            type: 'info',
            title: 'New upload',
            message: `${file.owner.name} uploaded “${file.title}”`,
            link: `/files/${file.id}`,
          }),
        );
      }
    });

    socket.on('file:updated', ({ file }) => {
      queryClient.setQueryData(queryKeys.files.detail(file.id), (current) => (current ? { ...current, ...file } : current));
      invalidateFileQueries(queryClient);
    });

    socket.on('file:deleted', () => invalidateFileQueries(queryClient));

    return () => {
      clearTimeout(connectTimer);
      socket.removeAllListeners();
      socket.disconnect();
      dispatch(realtimeStatusChanged('offline'));
    };
  }, [isAuthenticated, dispatch, queryClient]);
};
