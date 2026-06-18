export enum AlertChannel { EMAIL = 'EMAIL', SMS = 'SMS', WHATSAPP = 'WHATSAPP' }
export enum AlertStatus { ACTIVE = 'ACTIVE', TRIGGERED = 'TRIGGERED', PAUSED = 'PAUSED', CANCELLED = 'CANCELLED' }
export enum ReviewType { PRODUCT = 'PRODUCT', STORE = 'STORE' }
export enum ReviewStatus { PENDING = 'PENDING', APPROVED = 'APPROVED', REJECTED = 'REJECTED' }
export enum StockStatus { IN = 'IN', LOW = 'LOW', OUT = 'OUT' }
export enum SellerStatus { PENDING = 'PENDING', ACTIVE = 'ACTIVE', SUSPENDED = 'SUSPENDED' }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Prisma = any;
