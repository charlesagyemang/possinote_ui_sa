import { api } from '../api';
import { ApiKey, CreateApiKeyData } from '@/types';

export class ApiKeyService {
  static async getApiKeys() {
    const response = await api.get('/api_keys');
    return response.data;
  }

  static async createApiKey(data: CreateApiKeyData) {
    const response = await api.post('/api_keys', {
      api_key: data
    });
    return response.data;
  }

  static async revokeApiKey(id: string) {
    const response = await api.delete(`/api_keys/${id}`);
    return response.data;
  }

  static async getApiKeyDetails(id: string) {
    const response = await api.get(`/api_keys/${id}`);
    return response.data;
  }
} 