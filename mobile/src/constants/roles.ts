import { UserRole } from '../types';

export type SignupRole = Exclude<UserRole, 'ADMIN'>;

export const SIGNUP_ROLES: {
  role: SignupRole;
  title: string;
  description: string;
}[] = [
  {
    role: 'CUSTOMER',
    title: 'Customer',
    description: 'Order food from local merchants in Murcia & Bacolod',
  },
  {
    role: 'MERCHANT',
    title: 'Merchant',
    description: 'Manage your store, products, and orders',
  },
  {
    role: 'RIDER',
    title: 'Rider',
    description: 'Deliver orders and earn in Murcia & Bacolod',
  },
];
