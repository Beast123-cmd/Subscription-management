// Exact sorting for non-negative decimal strings returned by the billing API.
export function compareDecimal(a: string, b: string): number {
  const [ai = '0', af = ''] = a.split('.');
  const [bi = '0', bf = ''] = b.split('.');
  const wholeA = ai.replace(/^0+(?=\d)/, '');
  const wholeB = bi.replace(/^0+(?=\d)/, '');
  return wholeA.length - wholeB.length || wholeA.localeCompare(wholeB) || af.padEnd(Math.max(af.length, bf.length), '0').localeCompare(bf.padEnd(Math.max(af.length, bf.length), '0'));
}
