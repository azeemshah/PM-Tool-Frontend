import { useMutation, useQuery } from '@tanstack/react-query';
import { authApiService } from '../services';
import { loginType, registerType, LoginResponseType, CurrentUserResponseType } from '@/types/api.type';

export const useLogin = () => {
  return useMutation({
    mutationFn: (data: loginType) => authApiService.login(data),
  });
};

export const useRegister = () => {
  return useMutation({
    mutationFn: (data: registerType) => authApiService.register(data),
  });
};

export const useForgotPassword = () => {
  return useMutation({
    mutationFn: (data: { email: string }) =>
      authApiService.forgotPassword(data),
  });
};

export const useResetPassword = () => {
  return useMutation({
    mutationFn: (data: { token: string; newPassword: string }) =>
      authApiService.resetPassword(data),
  });
};

export const useChangePassword = () => {
  return useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      authApiService.changePassword(data),
  });
};

export const useLogout = () => {
  return useMutation({
    mutationFn: () => authApiService.logoutAndClearAuth(),
  });
};

export const useGetCurrentUser = (enabled = true) => {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: () => authApiService.getCurrentUser(),
    enabled,
  });
};

export const useUploadProfilePicture = () => {
  return useMutation({
    mutationFn: (file: File) => authApiService.uploadProfilePicture(file),
  });
};
