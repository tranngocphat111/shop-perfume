package iuh.fit.server.services.impl;

import iuh.fit.server.dto.response.CategoryResponse;
import iuh.fit.server.mapper.CategoryMapper;
import iuh.fit.server.repository.CategoryRepository;
import iuh.fit.server.services.BrandService;
import iuh.fit.server.services.CategoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Implementation của categoryService
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;
    private final CategoryMapper categoryMapper;

    /**
     * Lấy tất cả categories
     */
    @Override
    public List<CategoryResponse> findAll() {
        log.info("Service: Getting all categories");
        return categoryRepository.findAll().stream()
                .map(categoryMapper::toResponse)
                .collect(Collectors.toList());
    }
}

