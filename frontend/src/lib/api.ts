const API_BASE_URL = '/api';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

interface CreateGroupRequest {
  name: string;
  description?: string;
  createdBy: string;
  memberEmails: string[];
}

interface Group {
  id: string;
  name: string;
  description: string | null;
  createdBy: string;
  inviteCode: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  members: Array<{
    id: string;
    userId: string;
    role: 'ADMIN' | 'MEMBER';
    joinedAt: string;
    isActive: boolean;
    user: {
      id: string;
      firstName: string;
      lastName: string | null;
      email: string | null;
      tonWalletAddress: string;
    };
  }>;
  creator: {
    id: string;
    firstName: string;
    lastName: string | null;
    email: string | null;
  };
}

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    const response = await fetch(url, { ...defaultOptions, ...options });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Group APIs
  async createGroup(data: CreateGroupRequest): Promise<Group> {
    const response = await this.request<Group>('/group', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  async getUserGroups(userId: string): Promise<Group[]> {
    const response = await this.request<Group[]>(`/group/user/${userId}`);
    return response.data;
  }

  async getGroupById(groupId: string): Promise<Group> {
    const response = await this.request<Group>(`/group/${groupId}`);
    return response.data;
  }

  async validateInvite(token: string): Promise<{
    isValid: boolean;
    groupName?: string;
    email?: string;
    message?: string;
  }> {
    const response = await this.request<{
      isValid: boolean;
      groupName?: string;
      email?: string;
      message?: string;
    }>(`/group/invite/validate/${token}`);
    return response.data;
  }

  async acceptInvite(token: string, userId: string): Promise<Group> {
    const response = await this.request<Group>('/group/invite/accept', {
      method: 'POST',
      body: JSON.stringify({ token, userId }),
    });
    return response.data;
  }
}

export const apiService = new ApiService();
export type { Group, CreateGroupRequest }; 