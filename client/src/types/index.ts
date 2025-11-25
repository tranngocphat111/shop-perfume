export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  numberOfElements: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface Product {
  productId: number;
  name: string;
  description: string;
  perfumeLongevity: string;
  perfumeConcentration: string;
  releaseYear: string;
  columeMl: number;
  status: "ACTIVE" | "INACTIVE";
  unitPrice: number;
  createdAt: string;
  lastUpdated: string;
  createdBy: string;
  lastUpdatedBy: string;
  brand: {
    brandId: number;
    name: string;
  };
  category: {
    categoryId: number;
    name: string;
  };
  gender?: {
    genderId: number;
    name: string;
  };
  images: ProductImage[];
}

export interface Brand {
  brandId: number;
  name: string;
  description?: string;
  url?: string;
}

export interface Category {
  categoryId: number;
  name: string;
  description?: string;
}

export interface Supplier {
  supplierId: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  createdAt: string;
  lastUpdated: string;
  createdBy?: string;
  lastUpdatedBy?: string;
}

export interface ProductImage {
  imageId: number;
  url: string;
  primary: boolean;
}

export interface Inventory {
  inventoryId: number;
  product: Product;
  quantity: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Cart {
  items: CartItem[];
  total: number;
  totalItems: number;
}

export interface Order {
  orderId: number;
  userId: number;
  items: CartItem[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress: Address;
  paymentMethod: 'COD' | 'VNPAY';
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  district: string;
  ward: string;
  note?: string;
}

export interface User {
  userId: number;
  username: string;
  email: string;
  phone?: string;
  address?: string;
}

// Checkout types
export interface CheckoutFormData {
  fullName: string;
  phone: string;
  email: string;
  city: string;
  cityCode: string;
  district: string;
  districtCode: string;
  ward: string;
  wardCode: string;
  address: string;
  note?: string;
  paymentMethod: 'cod' | 'qr-payment' | 'bank-transfer';
}

export interface Province {
  code: number;
  name: string;
}

export interface District {
  code: number;
  name: string;
}

export interface Ward {
  code: number;
  name: string;
}

export interface ProvinceDetail extends Province {
  districts: District[];
}

export interface DistrictDetail extends District {
  wards: Ward[];
}

// Order types
export interface OrderRequest {
  fullName: string;
  phone: string;
  email: string;
  city: string;
  district: string;
  ward: string;
  address: string;
  note?: string;
  paymentMethod: string;
  cartItems: CartItem[];
  totalAmount: number;
}

export interface OrderResponse {
  orderId: number;
  orderDate: string;
  totalAmount: number;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  guestAddress: string;
  payment?: {
    paymentId: number;
    method: string;
    amount: number;
    status: string;
    paymentDate?: string;
  };
  orderItems: Array<{
    orderItemId: number;
    productId: number;
    productName: string;
    quantity: number;
    price: number;
    subTotal: number;
  }>;
}

// QR Payment types
export interface QRPaymentInfo {
  orderId: string;
  amount: number;
  accountName: string;
  accountNo: string;
  bankCode: string;
  bankName: string;
  qrUrl: string;
}

export interface PaymentCheckResponse {
  paid: boolean;
  orderId?: string;
  transactionId?: string;
  amount?: number;
  paymentDate?: string;
}

// Re-export home types for convenience
export type {
  HeroSlide,
  HeroCarouselProps,
  HomeCategory,
  CategoriesSectionProps,
  BestSellersSectionProps,
} from "./home";