import {
  ApiKeyAuthContext,
  AuthenticatedUser,
} from './authenticated-user.interface';
import { PlatformRole } from '../constants/roles.constant';

export type AuthMethod = 'privy' | 'api_key';

export interface SecurityContext {
  authMethod: AuthMethod;
  user?: AuthenticatedUser;
  apiKey?: ApiKeyAuthContext;
  organizationId?: string;
  roles: PlatformRole[];
}
