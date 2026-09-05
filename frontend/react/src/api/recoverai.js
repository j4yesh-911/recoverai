import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const api = axios.create({
  baseURL: API_URL,
  timeout: 60000,
  headers: {
    "Content-Type": "application/json",
  },
});

export const getMetrics = () => {
  return api.get("/payments/metrics");
};

export const getPayments = () => {
  return api.get("/payments/list");
};

export const getActivity = () => {
  return api.get("/payments/activity");
};

export const getAuditLogs = () => {
  return api.get("/payments/audit");
};

export const analyzePayment = (paymentId) => {
  return api.get(`/payments/${paymentId}/ai-decision`);
};

export const recoverPayment = (paymentId) => {
  return api.post(`/payments/${paymentId}/recover`);
};

export const runSimulation = (count = 10000) => {
  return api.post(`/payments/simulate?count=${count}`);
};

export const getDatabaseHealth = () => {
  return api.get("/payments/system/database-health");
};

export const getBackendHealth = () => {
  return api.get("/health");
};

export default api;