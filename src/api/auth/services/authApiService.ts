import API from "@/lib/axios-client";
import {
  loginType,
  registerType,
  LoginResponseType,
  CurrentUserResponseType,
  UpdateProfileType,
} from "@/types/api.type";

export const authApiService = {
  login: async (data: loginType): Promise<LoginResponseType> => {
    const response = await API.post("/pm-auth/login", data);
    return response.data;
  },

  register: async (data: registerType) => {
    const response = await API.post("/pm-auth/register", data);
    return response.data;
  },

  forgotPassword: async (data: { email: string }) => {
    const response = await API.post("/pm-auth/forgot-password", data);
    return response.data;
  },

  resendOtp: async (data: { email: string }) => {
    const response = await API.post("/pm-auth/resend-otp", data);
    return response.data;
  },

  resetPassword: async (data: { token: string; newPassword: string }) => {
    const response = await API.post("/pm-auth/reset-password", data);
    return response.data;
  },

  changePassword: async (data: {
    currentPassword: string;
    newPassword: string;
  }) => {
    const response = await API.post("/pm-auth/change-password", data);
    return response.data;
  },

  logout: async () => {
    const response = await API.post("/pm-auth/logout");
    return response.data;
  },

  logoutAndClearAuth: async () => {
    const response = await API.post("/pm-auth/logout");
    try {
      delete API.defaults.headers.common["Authorization"];
    } catch {
      // Ignore errors
    }
    return response.data;
  },

  getCurrentUser: async (): Promise<CurrentUserResponseType> => {
    const response = await API.get("/pm-user/current");
    return response.data;
  },

  updateProfile: async (
    data: UpdateProfileType,
  ): Promise<CurrentUserResponseType> => {
    const response = await API.patch("/pm-user/profile", data);
    return response.data;
  },

  uploadProfilePicture: async (file: File) => {
    const form = new FormData();
    form.append("file", file);
    const response = await API.post("/pm-user/profile-picture", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  deleteAccount: async (options?: { deleteOwnedWorkspaces?: boolean }) => {
    const response = await API.delete("/pm-user/account", {
      data: {
        deleteOwnedWorkspaces: !!options?.deleteOwnedWorkspaces,
      },
    });
    try {
      delete API.defaults.headers.common["Authorization"];
      localStorage.removeItem("accessToken");
    } catch {
      // Ignore errors
    }
    return response.data;
  },
};
