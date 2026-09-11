export type AdminOrderItem = {
  photoId: number;
  size: string;
  quantity: number;
  unitAmountCents: number;
  name?: string;
};

export type AdminOrderAddress = {
  city?: string | null;
  country?: string | null;
  line1?: string | null;
  line2?: string | null;
  postal_code?: string | null;
  state?: string | null;
};

export type OrderStatus = "paid" | "processing" | "shipped" | "delivered";

export type AdminOrder = {
  id: number;
  status: OrderStatus;
  items: AdminOrderItem[];
  totalCents: number;
  email: string | null;
  customerName: string | null;
  customerPhone: string | null;
  shippingAddress: AdminOrderAddress | null;
  shippingOption: string | null;
  shippingAmountCents: number | null;
  amountTotalCents: number | null;
  createdAt: string;
};
