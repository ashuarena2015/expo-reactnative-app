import { MiddlewareAPI, Dispatch, AnyAction } from "redux";

import axiosInstance from "../axios";

// Define the action payload structure
interface ApiRequestPayload {
  url: string;
  method: "get" | "post" | "put" | "delete";
  params?: Record<string, any>;
  onSuccess?: string;
  onError?: string;
  dispatchType?: string;
  body?: Record<string, any>;
}

// Type-safe Redux middleware
const api =
  ({ dispatch }: MiddlewareAPI<Dispatch<AnyAction>, any>) =>
  (next: Dispatch) =>
  async (action: AnyAction) => {
    if (action.type !== "apiRequest") {
      return next(action);
    }

    const isLoading = (status: boolean) => {
      dispatch({
        type: "users/isLoading",
        payload: { loading: status },
      });
    };

    try {
      isLoading(true);

      const { url, method, params, dispatchType, body = {}, onSuccess } =
        action.payload as ApiRequestPayload;

      const response = await axiosInstance(url, {
        params,
        method,
        data: body,
      });

      if (dispatchType === "authLogin") {
        dispatch({
          type: "users/authLogin",
          payload: {
            user: response?.data?.user,
          },
        });
        return { isAuthLogin: response?.data?.isAuthLogin };
      }
      if (dispatchType === "accountCreation") {
        dispatch({
          type: "global/globalMessage",
          payload: {
            message: "",
            type: "",
          },
        });
        dispatch({
          type: "users/accountCreation",
          payload: {
            user: response?.data?.user,
          },
        });
        const { token, isLoginOtpSent } = response?.data
        console.log('response?.data', response?.data);
        if(isLoginOtpSent) {
          return { isOtpSent: isLoginOtpSent };
        }
        return { token };
      }
    } catch (error: any) {
      if(error?.status !== 403) {
        dispatch({
          type: "global/globalMessage",
          payload: {
            message: error.response?.data?.message || "Something went wrong!",
            type: "danger",
          },
        });
      }
    } finally {
      isLoading(false);
    }
  };

export default api;
