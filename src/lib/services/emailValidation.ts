export interface EmailValidationResponse {
  success: boolean;
  email?: string;
  message?: string;
  error?: string;
}

export class EmailValidationService {
  private static readonly API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.possinotify.com';

  static async validateEmail(email: string): Promise<EmailValidationResponse> {
    try {
      const response = await fetch(`${this.API_URL}/public/validate-emails`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emails: [email]
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          return {
            success: false,
            error: 'Rate limit exceeded. Please try again later.'
          };
        }
        
        return {
          success: false,
          error: 'Failed to validate email. Please try again.'
        };
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Email validation error:', error);
      return {
        success: false,
        error: 'Network error. Please check your connection and try again.'
      };
    }
  }

}
