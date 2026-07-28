/**
 * Order status styling, in one place.
 *
 * Three pages each carried their own copy of this switch and they had already
 * drifted — the artisan dashboard had no `shipped` or `cancelled` case, so those
 * orders rendered in the neutral "unknown" grey.
 *
 * Backend statuses include `pending` (order created, payment not yet confirmed
 * by the Stripe webhook) and `paid`.
 */
export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'confirmed'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | (string & {});

const STYLES: Record<string, string> = {
  pending: 'bg-haldi-soft text-haldi border-haldi/40',
  paid: 'bg-accent text-primary border-primary/30',
  confirmed: 'bg-accent text-primary border-primary/30',
  shipped: 'bg-accent text-primary border-primary/30',
  delivered: 'bg-neem-soft text-neem border-neem/30',
  cancelled: 'bg-destructive/10 text-destructive border-destructive/30',
  refunded: 'bg-destructive/10 text-destructive border-destructive/30',
};

const LABELS: Record<string, string> = {
  pending: 'Awaiting payment',
  paid: 'Paid',
  confirmed: 'Confirmed',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

export function orderStatusClass(status: OrderStatus): string {
  return STYLES[String(status).toLowerCase()] ?? 'bg-muted text-muted-foreground border-border';
}

export function orderStatusLabel(status: OrderStatus): string {
  const key = String(status).toLowerCase();
  return LABELS[key] ?? (key ? key[0].toUpperCase() + key.slice(1) : 'Unknown');
}
