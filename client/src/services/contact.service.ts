import { apiService } from "./api";

export interface ContactRequest {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

export interface ContactResponse {
  message: string;
  success: boolean;
}

export const contactService = {
  /**
   * Gửi email liên hệ đến chủ website
   */
  sendContactEmail: async (
    request: ContactRequest
  ): Promise<ContactResponse> => {
    return apiService.post<ContactResponse>("/contact/send-email", request);
  },
};
