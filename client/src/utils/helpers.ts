import type { Product, ProductImage } from '../types';

const CLOUDINARY_BASE_URL = 'https://res.cloudinary.com/piin/image/upload/';

/**
 * Lấy URL của ảnh primary từ mảng images của product
 */
export const getPrimaryImageUrl = (product: Product): string => {
  if (!product.images || product.images.length === 0) {
    return 'https://via.placeholder.com/300x360/f0f0f0/333333?text=No+Image';
  }

  // Tìm ảnh primary
  const primaryImage = product.images.find((img) => img.primary);

  // Nếu có ảnh primary thì dùng, không thì lấy ảnh đầu tiên
  const imageToUse = primaryImage || product.images[0];

  return imageToUse?.url
    ? `${CLOUDINARY_BASE_URL}${imageToUse.url}`
    : 'https://via.placeholder.com/300x360/f0f0f0/333333?text=No+Image';
};

/**
 * Lấy tất cả URLs của images từ product
 */
export const getImageUrls = (product: Product): string[] => {
  return product.images.map((img) => `${CLOUDINARY_BASE_URL}${img.url}`);
};

export const getProductImages = (product: Product): ProductImage[] => {
  return product.images.map((img) => {
    return {
      ...img,
      url: `${CLOUDINARY_BASE_URL}${img.url}`
    }
  });
};

/**
 * Format số tiền VND
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN').format(amount);
};

/**
 * Format SKU từ product
 */
export const formatSKU = (product: Product): string => {
  return `${product.brand.name}-${product.productId}`;
};

/**
 * Tính subtotal của cart item
 */
export const calculateSubtotal = (unitPrice: number, quantity: number): number => {
  return unitPrice * quantity;
};

/**
 * Cloudinary base URL constant để export
 */
export { CLOUDINARY_BASE_URL };
