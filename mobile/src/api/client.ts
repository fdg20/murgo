import axios, { type InternalAxiosRequestConfig } from 'axios';
import { API_URL } from '../constants/config';

type TokenGetter = () => Promise<string | null>;

let authToken: string | null = null;
let tokenGetter: TokenGetter | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

export const setTokenGetter = (getter: TokenGetter | null) => {
  tokenGetter = getter;
};

export const getFreshAuthToken = async (): Promise<string | null> => {
  if (tokenGetter) {
    const token = await tokenGetter();
    if (token) {
      authToken = token;
      return token;
    }
  }
  return authToken;
};

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await getFreshAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as RetriableConfig | undefined;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      tokenGetter
    ) {
      originalRequest._retry = true;
      const token = await tokenGetter();
      if (token) {
        authToken = token;
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      }
    }

    const message =
      error.response?.data?.message ?? error.message ?? 'Request failed';
    return Promise.reject(new Error(message));
  },
);
