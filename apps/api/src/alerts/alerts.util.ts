import { AlertChannel as PrismaChannel, AlertStatus as PrismaStatus } from '@rc/db';
import type { AlertChannel, AlertStatusWire } from '@rc/types';

export function channelToWire(c: PrismaChannel): AlertChannel {
  return c.toLowerCase() as AlertChannel;
}
export function channelToPrisma(c: string): PrismaChannel {
  return c.toUpperCase() as PrismaChannel;
}
export function statusToWire(s: PrismaStatus): AlertStatusWire {
  return s.toLowerCase() as AlertStatusWire;
}
export function targetHit(currentPrice: number, targetPrice: number): boolean {
  return currentPrice <= targetPrice;
}
