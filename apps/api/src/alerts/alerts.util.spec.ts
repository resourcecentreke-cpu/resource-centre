import { channelToWire, channelToPrisma, statusToWire, targetHit } from './alerts.util';

describe('alerts.util', () => {
  it('maps channels and status', () => {
    expect(channelToWire('EMAIL' as never)).toBe('email');
    expect(channelToPrisma('whatsapp')).toBe('WHATSAPP');
    expect(statusToWire('TRIGGERED' as never)).toBe('triggered');
  });
  it('evaluates target hit at the boundary', () => {
    expect(targetHit(140000, 140000)).toBe(true);
    expect(targetHit(139000, 140000)).toBe(true);
    expect(targetHit(141000, 140000)).toBe(false);
  });
});
