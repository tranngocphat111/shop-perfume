package iuh.fit.server.services;

import iuh.fit.server.dto.request.CategoryRequest;
import iuh.fit.server.dto.response.CategoryResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface CategoryService {
    List<CategoryResponse> findAll();

    Page<CategoryResponse> findAllPaginated(Pageable pageable, String search);

    CategoryResponse findById(int id);

    CategoryResponse createCategory(CategoryRequest request);

    CategoryResponse updateCategory(int id, CategoryRequest request);

    void deleteCategory(int id);
}
