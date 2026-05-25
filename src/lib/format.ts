export function formatQty(value: number | null | undefined): string {
  if (value == null) return "0";
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 3 });
}

export function formatCurrency(value: number | null | undefined): string {
  if (value == null) return "R$ 0,00";
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
