package iuh.fit.server.services.impl;

import iuh.fit.server.dto.request.BrandRequest;
import iuh.fit.server.dto.response.BrandResponse;
import iuh.fit.server.exception.BadRequestException;
import iuh.fit.server.exception.ResourceNotFoundException;
import iuh.fit.server.mapper.BrandMapper;
import iuh.fit.server.model.entity.Brand;
import iuh.fit.server.model.entity.Product;
import iuh.fit.server.model.enums.ProductStatus;
import iuh.fit.server.repository.BrandRepository;
import iuh.fit.server.repository.ProductRepository;
import iuh.fit.server.services.BrandService;
import iuh.fit.server.services.CloudinaryService;
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
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.stream.Collectors;

import iuh.fit.server.config.CacheNames;

/**
 * Implementation của BrandService
 */
@Service
@RequiredArgsConstructor
@Slf4j
@CacheConfig(cacheNames = CacheNames.BRANDS)
@Transactional
public class BrandServiceImpl implements BrandService {

    private final BrandRepository brandRepository;
    private final ProductRepository productRepository;
    private final BrandMapper brandMapper;
    private final CloudinaryService cloudinaryService;

    /**
     * Lấy tất cả brands
     */
    @Override
    @Cacheable(key = "'all'")
    public List<BrandResponse> findAll() {
        log.info("Service: Getting all brands");
        List<BrandResponse> brands = brandRepository.findAll().stream()
                .map(brandMapper::toResponse)
                .collect(Collectors.toList());

        return brands;
    }

    /**
     * Lấy brands theo phân trang với tìm kiếm
     */
    @Override
    @Transactional(readOnly = true)
    public Page<BrandResponse> findAllPaginated(Pageable pageable, String search) {
        log.info("Service: Getting brands with pagination: {}, search: {}", pageable, search);

        Page<Brand> brands;
        if (search != null && !search.trim().isEmpty()) {
            brands = brandRepository.findByNameContainingIgnoreCaseOrCountryContainingIgnoreCase(
                    search.trim(), search.trim(), pageable);
        } else {
            brands = brandRepository.findAll(pageable);
        }

        Page<BrandResponse> responses = brands.map(brandMapper::toResponse);

        return responses;
    }

    /**
     * Lấy brand theo ID
     */
    @Override
    @Transactional(readOnly = true)
    @Cacheable(key = "'id:' + #id")
    public BrandResponse findById(int id) {
        log.info("Service: Getting brand by id: {}", id);
        Brand brand = brandRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Brand not found with id: " + id));

        BrandResponse response = brandMapper.toResponse(brand);

        return response;
    }

    /**
     * Tạo brand mới
     */
    @Override
        @Caching(evict = {
            @CacheEvict(allEntries = true),
            @CacheEvict(cacheNames = CacheNames.PRODUCTS, allEntries = true)
        })
    public BrandResponse createBrand(BrandRequest request, MultipartFile image) {
        log.info("Service: Creating new brand: {} with image: {}", request.getName(), image != null);

        Brand brand = new Brand();
        brand.setName(request.getName());
        brand.setCountry(request.getCountry());
        brand.setDescription(request.getDescription());

        // Upload image to Cloudinary if provided
        if (image != null && !image.isEmpty()) {
            try {
                String publicId = cloudinaryService.uploadImageToFolder(image, "brand");
                brand.setUrl(publicId);
                log.info("Image uploaded successfully to brand folder: {}", publicId);
            } catch (Exception e) {
                log.error("Error uploading brand image", e);
                throw new RuntimeException("Failed to upload brand image: " + e.getMessage());
            }
        }

        Brand savedBrand = brandRepository.save(brand);
        log.info("Brand created successfully with id: {}", savedBrand.getBrandId());

        BrandResponse response = brandMapper.toResponse(savedBrand);

        return response;
    }

    /**
     * Cập nhật brand
     */
    @Override
        @Caching(evict = {
            @CacheEvict(allEntries = true),
            @CacheEvict(cacheNames = CacheNames.PRODUCTS, allEntries = true)
        })
    public BrandResponse updateBrand(int id, BrandRequest request, MultipartFile image) {
        log.info("Service: Updating brand id {}: {} with new image: {}", id, request.getName(), image != null);

        Brand existingBrand = brandRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Brand not found with id: " + id));

        existingBrand.setName(request.getName());
        existingBrand.setCountry(request.getCountry());
        existingBrand.setDescription(request.getDescription());

        // Upload new image to Cloudinary if provided
        if (image != null && !image.isEmpty()) {
            try {
                // Delete old image if exists
                if (existingBrand.getUrl() != null && !existingBrand.getUrl().isEmpty()) {
                    try {
                        cloudinaryService.deleteImage(existingBrand.getUrl());
                        log.info("Deleted old brand image: {}", existingBrand.getUrl());
                    } catch (Exception e) {
                        log.warn("Could not delete old brand image: {}", e.getMessage());
                    }
                }

                // Upload new image to brand folder
                String publicId = cloudinaryService.uploadImageToFolder(image, "brand");
                existingBrand.setUrl(publicId);
                log.info("New image uploaded successfully to brand folder: {}", publicId);
            } catch (Exception e) {
                log.error("Error uploading brand image", e);
                throw new RuntimeException("Failed to upload brand image: " + e.getMessage());
            }
        }

        Brand updatedBrand = brandRepository.save(existingBrand);
        log.info("Brand updated successfully: {}", id);

        BrandResponse response = brandMapper.toResponse(updatedBrand);

        return response;
    }

    /**
     * Xóa brand - Kiểm tra xem brand có sản phẩm ACTIVE hay không
     */
    @Override
        @Caching(evict = {
            @CacheEvict(allEntries = true),
            @CacheEvict(cacheNames = CacheNames.PRODUCTS, allEntries = true)
        })
    public void deleteBrand(int id) {
        log.info("Service: Attempting to delete brand id: {}", id);

        Brand brand = brandRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Brand not found with id: " + id));

        // Kiểm tra xem có sản phẩm ACTIVE nào sử dụng brand này không
        List<Product> activeProducts = productRepository.findByBrandAndStatus(brand, ProductStatus.ACTIVE);

        if (!activeProducts.isEmpty()) {
            log.warn("Cannot delete brand {} - has {} ACTIVE products", id, activeProducts.size());
            throw new BadRequestException(
                    String.format("Cannot delete brand '%s'. It is being used by %d ACTIVE product(s). " +
                            "Please deactivate or remove these products first.",
                            brand.getName(), activeProducts.size()));
        }

        brandRepository.delete(brand);
        log.info("Brand deleted successfully: {}", id);
    }
}
