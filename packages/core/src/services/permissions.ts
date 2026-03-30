export type Permission =
  | 'trip:read'
  | 'trip:write'
  | 'trip:delete'
  | 'itinerary:read'
  | 'itinerary:write'
  | 'capture:read'
  | 'capture:write'
  | 'memory:read'
  | 'memory:write'
  | 'share:read'
  | 'share:write'
  | 'admin:*';

export interface PermissionContext {
  userId: string;
  roles: string[];
  apiKeyId?: string;
 灰度组?: string;
}

export class PermissionsService {
  private permissions = new Map<string, Set<Permission>>();

  grantPermissions(userId: string, permissions: Permission[]): void {
    const existing = this.permissions.get(userId) || new Set();
    for (const perm of permissions) {
      existing.add(perm);
    }
    this.permissions.set(userId, existing);
  }

  revokePermissions(userId: string, permissions: Permission[]): void {
    const existing = this.permissions.get(userId);
    if (!existing) return;

    for (const perm of permissions) {
      existing.delete(perm);
    }
  }

  hasPermission(context: PermissionContext, permission: Permission): boolean {
    const userPerms = this.permissions.get(context.userId);

    if (!userPerms) {
      return false;
    }

    if (userPerms.has('admin:*')) {
      return true;
    }

    return userPerms.has(permission);
  }

  hasAnyPermission(context: PermissionContext, permissions: Permission[]): boolean {
    for (const perm of permissions) {
      if (this.hasPermission(context, perm)) {
        return true;
      }
    }
    return false;
  }

  hasAllPermissions(context: PermissionContext, permissions: Permission[]): boolean {
    for (const perm of permissions) {
      if (!this.hasPermission(context, perm)) {
        return false;
      }
    }
    return true;
  }

  canAccessTrip(context: PermissionContext, tripOwnerId: string): boolean {
    if (this.hasPermission(context, 'admin:*')) {
      return true;
    }

    return context.userId === tripOwnerId;
  }

  filterAccessibleTrips<T extends { user_id: string }>(
    context: PermissionContext,
    trips: T[]
  ): T[] {
    if (this.hasPermission(context, 'admin:*')) {
      return trips;
    }

    return trips.filter(trip => trip.user_id === context.userId);
  }
}

export const permissionsService = new PermissionsService();
