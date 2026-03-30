export type AuthProvider = 'supabase' | 'api_key';

export interface AuthUser {
  id: string;
  email?: string;
  provider: AuthProvider;
  roles: string[];
  createdAt: string;
}

export interface AuthResult {
  success: boolean;
  user?: AuthUser;
  error?: string;
}

export interface ApiKeyInfo {
  keyId: string;
  userId: string;
  name: string;
  permissions: string[];
  rateLimit: number;
  expiresAt?: string;
}

export class AuthService {
  private apiKeys: Map<string, ApiKeyInfo> = new Map();

  registerApiKey(info: ApiKeyInfo): void {
    this.apiKeys.set(info.keyId, info);
  }

  revokeApiKey(keyId: string): void {
    this.apiKeys.delete(keyId);
  }

  async validateApiKey(key: string): Promise<AuthResult> {
    const keyInfo = this.apiKeys.get(key);

    if (!keyInfo) {
      return { success: false, error: 'Invalid API key' };
    }

    if (keyInfo.expiresAt && new Date(keyInfo.expiresAt) < new Date()) {
      return { success: false, error: 'API key expired' };
    }

    return {
      success: true,
      user: {
        id: keyInfo.userId,
        provider: 'api_key',
        roles: keyInfo.permissions,
        createdAt: new Date().toISOString(),
      },
    };
  }

  async hasPermission(key: string, permission: string): Promise<boolean> {
    const keyInfo = this.apiKeys.get(key);

    if (!keyInfo) {
      return false;
    }

    return keyInfo.permissions.includes(permission) || keyInfo.permissions.includes('*');
  }
}

export const authService = new AuthService();
