/** Espejo exacto de com.bubblesessence.common.response.ApiResponse */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}
