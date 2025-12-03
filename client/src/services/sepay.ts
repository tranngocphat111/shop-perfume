/**
 * Sepay QR Code Service
 * Documentation: https://docs.sepay.vn/tao-qr-code-vietqr-dong.html
 */

export interface SepayQRConfig {
  account: string; // Số tài khoản ngân hàng
  bank: string; // Tên ngân hàng (VD: Vietcombank, MBBank, VietinBank)
  amount?: number; // Số tiền (tùy chọn)
  description?: string; // Nội dung chuyển khoản (tùy chọn)
}

/**
 * Generate Sepay QR Code URL
 * Format: https://qr.sepay.vn/img?acc=SO_TAI_KHOAN&bank=NGAN_HANG&amount=SO_TIEN&des=NOI_DUNG
 */
export const generateSepayQRUrl = (config: SepayQRConfig): string => {
  const params = new URLSearchParams();
  
  params.append('acc', config.account);
  params.append('bank', config.bank);
  
  if (config.amount !== undefined && config.amount > 0) {
    params.append('amount', Math.floor(config.amount).toString());
  }
  
  if (config.description) {
    params.append('des', config.description);
  }
  
  return `https://qr.sepay.vn/img?${params.toString()}`;
};

/**
 * Default Sepay configuration
 * TODO: Move to environment variables
 */
export const DEFAULT_SEPAY_CONFIG: Omit<SepayQRConfig, 'amount' | 'description'> = {
  account: '0963360910', // Số tài khoản MB Bank
  bank: 'MBBank', // Tên ngân hàng (format cho Sepay API)
};

/**
 * Generate QR code for order payment
 * NOTE: For testing purposes, the amount is divided by 100 to allow testing with smaller amounts
 */
export const generateOrderQRCode = (
  orderId: number | string,
  amount: number,
  customConfig?: Partial<SepayQRConfig>
): string => {
  // Divide amount by 100 for testing (student demo purposes)
  const testAmount = Math.floor(amount / 100);
  
  const config: SepayQRConfig = {
    ...DEFAULT_SEPAY_CONFIG,
    amount: testAmount,
    description: `STNP_${orderId}`,
    ...customConfig,
  };
  
  return generateSepayQRUrl(config);
};

