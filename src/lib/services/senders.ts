import { api } from '../api';

export interface Sender {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  approval_reason: string | null;
  approved_at: string | null;
  rejected_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateSenderData {
  name: string;
  description: string;
}

export interface UpdateSenderData {
  name?: string;
  description?: string;
}

export class SendersService {
  static async getSenders() {
    const response = await api.get('/senders');
    return response.data;
  }

  static async getSender(id: string) {
    const response = await api.get(`/senders/${id}`);
    return response.data;
  }

  static async createSender(data: CreateSenderData) {
    const requestData = {
      sender: data
    };
    
    console.log('Creating sender:', requestData);
    const response = await api.post('/senders', requestData);
    return response.data;
  }

  static async updateSender(id: string, data: UpdateSenderData) {
    const requestData = {
      sender: data
    };
    
    console.log('Updating sender:', id, requestData);
    const response = await api.put(`/senders/${id}`, requestData);
    return response.data;
  }

  static async deleteSender(id: string) {
    const response = await api.delete(`/senders/${id}`);
    return response.data;
  }
} 