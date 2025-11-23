package iuh.fit.server.services;

import iuh.fit.server.dto.response.BrandResponse;

import java.util.List;

/**
 * Interface định nghĩa các phương thức business logic cho Brand
 */
public interface BrandService {

    /**
     * Lấy tất cả brands
     */
    List<BrandResponse> findAll();
}

