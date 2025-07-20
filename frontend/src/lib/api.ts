const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || '/api';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

interface CreateGroupRequest {
  name: string;
  description?: string;
  createdBy: string;
  userIds: string[];
}

interface CreateExpenseRequest {
  groupId: string;
  payerId: string;
  description?: string;
  amount: number;
  category?: string;
  receiptImage?: string;
  splitType: 'EQUAL' | 'CUSTOM';
  participants: Array<{
    userId: string;
    amountOwed: number;
  }>;
}

interface UserStats {
  totalExpenses: number;
  totalSpent: number;
  totalOwed: number;
  totalToReceive: number;
  groupsCount: number;
  settledExpenses: number;
}

interface GroupBalance {
  balance: number;
  totalPaid: number;
  totalOwed: number;
  status: 'owe' | 'receive' | 'settled';
}

interface ExpenseHistory {
  id: string;
  description: string;
  amount: number;
  category: string;
  userAmountOwed: number;
  isSettled: boolean;
  settledAt: string | null;
  createdAt: string;
  group: { id: string; name: string };
  payer: { firstName: string; lastName: string };
}

interface ExpenseHistoryOptions {
  limit?: number;
  offset?: number;
  status?: 'all' | 'paid' | 'unpaid';
}

interface UserSearchResult {
  id: string;
  firstName: string;
  lastName: string | null;
  username: string | null;
  tonWalletAddress: string;
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

interface Expense {
  id: string;
  groupId: string;
  payerId: string;
  description: string | null;
  amount: number;
  category: string | null;
  receiptImage: string | null;
  splitType: 'EQUAL' | 'CUSTOM';
  createdAt: string;
  updatedAt: string;
  group: Group;
  payer: {
    id: string;
    telegramId: string;
    username: string | null;
    firstName: string;
    lastName: string | null;
    email: string | null;
    tonWalletAddress: string;
    createdAt: string;
    updatedAt: string;
  };
  participants: Array<{
    id: string;
    expenseId: string;
    userId: string;
    amountOwed: number;
    isSettled: boolean;
    settledAt: string | null;
    user: {
      id: string;
      telegramId: string;
      username: string | null;
      firstName: string;
      lastName: string | null;
      email: string | null;
      tonWalletAddress: string;
      createdAt: string;
      updatedAt: string;
    };
  }>;
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

    const data = await response.json();
    
    // Se o backend retornar um array diretamente, criar o formato esperado
    if (Array.isArray(data)) {
      return {
        success: true,
        data: data as T,
        message: 'Success'
      };
    }
    
    return data;
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

  // Expense APIs
  async createExpense(data: CreateExpenseRequest): Promise<Expense> {
    const response = await this.request<Expense>('/expenses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  async getExpenses(groupId?: string): Promise<Expense[]> {
    const url = groupId ? `/expenses?groupId=${groupId}` : '/expenses';
    const response = await this.request<Expense[]>(url);
    return response.data;
  }

  async getExpensesByUser(userId: string): Promise<Expense[]> {
    const response = await this.request<Expense[]>(`/expenses?userId=${userId}`);
    return response.data;
  }

  async getExpenseById(expenseId: string): Promise<Expense> {
    const response = await this.request<Expense>(`/expenses/${expenseId}`);
    return response.data;
  }

  async updateExpense(expenseId: string, data: Partial<CreateExpenseRequest>): Promise<Expense> {
    const response = await this.request<Expense>(`/expenses/${expenseId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  async updateExpenseParticipant(expenseId: string, participantId: string, data: { isSettled: boolean }): Promise<Expense> {
    const response = await this.request<Expense>(`/expenses/${expenseId}/participants/${participantId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  async deleteExpense(expenseId: string): Promise<{ message: string }> {
    const response = await this.request<{ message: string }>(`/expenses/${expenseId}`, {
      method: 'DELETE',
    });
    return response.data;
  }

  // User APIs
  async createUser(data: {
    tonWalletAddress: string;
    firstName: string;
    lastName?: string;
    email?: string;
    username?: string;
  }): Promise<any> {
    const response = await this.request<any>('/user', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  async findUserByWalletAddress(walletAddress: string): Promise<any> {
    const response = await this.request<any>(`/user/wallet/${walletAddress}`);
    return response.data;
  }

  async findUserById(id: string): Promise<any> {
    const response = await this.request<any>(`/user/${id}`);
    return response.data;
  }

  async updateUser(id: string, data: Partial<{
    firstName: string;
    lastName: string;
    email: string;
    username: string;
  }>): Promise<any> {
    const response = await this.request<any>(`/user/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  // User Stats APIs
  async getUserStats(userId: string): Promise<UserStats> {
    const response = await this.request<UserStats>(`/user/${userId}/stats`);
    return response.data;
  }

  // Group Balance APIs
  async getGroupBalance(groupId: string, userId: string): Promise<GroupBalance> {
    const response = await this.request<GroupBalance>(`/group/${groupId}/balance/${userId}`);
    return response.data;
  }

  // Expense History APIs
  async getExpenseHistory(
    userId: string,
    options: ExpenseHistoryOptions = {}
  ): Promise<ExpenseHistory[]> {
    const params = new URLSearchParams();
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.offset) params.append('offset', options.offset.toString());
    if (options.status && options.status !== 'all') params.append('status', options.status);
    
    const url = `/expenses/history/${userId}${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await this.request<ExpenseHistory[]>(url);
    return response.data;
  }

  // User Search APIs
  async searchUser(identifier: string): Promise<UserSearchResult | null> {
    const response = await this.request<UserSearchResult>(`/user/search/${encodeURIComponent(identifier)}`);
    return response.data;
  }
}

export const apiService = new ApiService();
export type { 
  Group, 
  CreateGroupRequest, 
  Expense, 
  CreateExpenseRequest,
  UserStats,
  GroupBalance,
  ExpenseHistory,
  ExpenseHistoryOptions,
  UserSearchResult
}; 