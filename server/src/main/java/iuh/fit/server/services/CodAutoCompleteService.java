package iuh.fit.server.services;

/**
 * Service để tự động hoàn thành thanh toán COD sau 5 phút
 */
public interface CodAutoCompleteService {
    /**
     * Tự động set các đơn COD thành công sau 5 phút
     */
    void autoCompleteCodOrders();
}

