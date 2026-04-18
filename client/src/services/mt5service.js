import api from "./api";

export const connectMT5 = (data, token) =>
  api.post("/mt5/add", data, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });