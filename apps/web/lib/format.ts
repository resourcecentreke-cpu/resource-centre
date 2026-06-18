export const fmtKES = (n: number): string => `KSh ${Math.round(n).toLocaleString('en-KE')}`;
export const stars = (n: number): string => '★'.repeat(Math.round(n)) + '☆'.repeat(5 - Math.round(n));
