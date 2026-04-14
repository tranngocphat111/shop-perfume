package iuh.fit.server.services.impl;

import iuh.fit.server.dto.request.CategoryRequest;
import iuh.fit.server.dto.response.CategoryResponse;
import iuh.fit.server.exception.BadRequestException;
import iuh.fit.server.exception.ResourceNotFoundException;
import iuh.fit.server.mapper.CategoryMapper;
import iuh.fit.server.model.entity.Category;
import iuh.fit.server.model.entity.Product;
import iuh.fit.server.model.enums.ProductStatus;
import iuh.fit.server.repository.CategoryRepository;
import iuh.fit.server.repository.ProductRepository;
import iuh.fit.server.services.CategoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheConfig;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

import iuh.fit.server.config.CacheNames;

/**
 * Implementation của CategoryService
 */
@Service
@RequiredArgsConstructor
@Slf4j
@CacheConfig(cacheNames = CacheNames.CATEGORIES)
@Transactional
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final CategoryMapper categoryMapper;

    /**
     * Lấy tất cả categories
     */
    @Override
    @Transactional(readOnly = true)
    @Cacheable(key = "'all'")
    public List<CategoryResponse> findAll() {
        log.info("Service: Getting all categories");
        return categoryRepository.findAll().stream()
                .map(categoryMapper::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Lấy categories theo phân trang với tìm kiếm
     */
    @Override
    @Transactional(readOnly = true)
    public Page<CategoryResponse> findAllPaginated(Pageable pageable, String search) {
        log.info("Service: Getting categories with pagination: {}, search: {}", pageable, search);

        Page<Category> categories;
        if (search != null && !search.trim().isEmpty()) {
            categories = categoryRepository.findByNameContainingIgnoreCaseOrDescriptionContainingIgnoreCase(
                    search.trim(), search.trim(), pageable);
        } else {
            categories = categoryRepository.findAll(pageable);
        }

        return categories.map(categoryMapper::toResponse);
    }

    /**
     * Lấy category theo ID
     */
    @Override
    @Transactional(readOnly = true)
    @Cacheable(key = "'id:' + #id")
    public CategoryResponse findById(int id) {
        log.info("Service: Getting category by id: {}", id);
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + id));

        return categoryMapper.toResponse(category);
    }

    /**
     * Tạo mới category
     */
    @Override
        @Caching(evict = {
            @CacheEvict(allEntries = true),
            @CacheEvict(cacheNames = CacheNames.PRODUCTS, allEntries = true)
        })
    public CategoryResponse createCategory(CategoryRequest request) {
        log.info("Service: Creating new category: {}", request.getName());

        Category category = new Category();
        category.setName(request.getName());
        category.setDescription(request.getDescription());
        category.setGender(request.getGender());

        Category savedCategory = categoryRepository.save(category);
        log.info("Category created successfully with id: {}", savedCategory.getCategoryId());

        return categoryMapper.toResponse(savedCategory);
    }

    /**
     * Cập nhật category
     */
    @Override
        @Caching(evict = {
            @CacheEvict(allEntries = true),
            @CacheEvict(cacheNames = CacheNames.PRODUCTS, allEntries = true)
        })
    public CategoryResponse updateCategory(int id, CategoryRequest request) {
        log.info("Service: Updating category id {}: {}", id, request.getName());

        Category existingCategory = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + id));

        existingCategory.setName(request.getName());
        existingCategory.setDescription(request.getDescription());
        existingCategory.setGender(request.getGender());

        Category updatedCategory = categoryRepository.save(existingCategory);
        log.info("Category updated successfully: {}", id);

        return categoryMapper.toResponse(updatedCategory);
    }

    /**
     * Xóa category
     * Kiểm tra xem có sản phẩm ACTIVE nào sử dụng category này không
     */
    @Override
        @Caching(evict = {
            @CacheEvict(allEntries = true),
            @CacheEvict(cacheNames = CacheNames.PRODUCTS, allEntries = true)
        })
    public void deleteCategory(int id) {
        log.info("Service: Attempting to delete category id: {}", id);

        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + id));

        // Kiểm tra xem có sản phẩm ACTIVE nào sử dụng category này không
        List<Product> activeProducts = productRepository.findByCategoryAndStatus(category, ProductStatus.ACTIVE);

        if (!activeProducts.isEmpty()) {
            log.warn("Cannot delete category {} - has {} ACTIVE products", id, activeProducts.size());
            throw new BadRequestException(
                    String.format("Cannot delete category '%s'. It is being used by %d ACTIVE product(s). " +
                            "Please deactivate or remove these products first.",
                            category.getName(), activeProducts.size()));
        }

        categoryRepository.delete(category);
        log.info("Category deleted successfully: {}", id);
    }
}
