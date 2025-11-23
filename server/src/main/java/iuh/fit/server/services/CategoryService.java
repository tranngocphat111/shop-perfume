package iuh.fit.server.services;

import iuh.fit.server.dto.response.CategoryResponse;

import java.util.List;

public interface CategoryService {
    List<CategoryResponse> findAll();
}
