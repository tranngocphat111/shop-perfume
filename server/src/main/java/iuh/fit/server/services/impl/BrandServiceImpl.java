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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Implementation của BrandService
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class BrandServiceImpl implements BrandService {

    private final BrandRepository brandRepository;
    private final ProductRepository productRepository;
    private final BrandMapper brandMapper;
    private final CloudinaryService cloudinaryService;

    /**
     * Format brand URL to Cloudinary format
     * If URL is just a filename, prepend "brand/" path
     * Format: brand/{filename} (e.g., "brand/Yves_Saint_Laurent.png")
     */
    private void formatBrandUrl(BrandResponse response) {
        if (response.getUrl() != null && !response.getUrl().isEmpty()) {
            String url = response.getUrl();
            log.debug("Original brand URL for {}: {}", response.getName(), url);

            // If URL doesn't start with http, it's just a filename
            if (!url.startsWith("http://") && !url.startsWith("https://")) {
                // If URL doesn't already start with "brand/", add it
                if (!url.startsWith("brand/")) {
                    String formattedUrl = "brand/" + url;
                    response.setUrl(formattedUrl);
                    log.debug("Formatted brand URL for {}: {}", response.getName(), formattedUrl);
                } else {
                    log.debug("Brand URL already has 'brand/' prefix: {}", url);
                }
            } else {
                log.debug("Brand URL is full URL, keeping as is: {}", url);
            }
        } else {
            log.warn("Brand {} has no URL", response.getName());
        }
    }

    /**
     * Lấy tất cả brands
     */
    @Override
    public List<BrandResponse> findAll() {
        log.info("Service: Getting all brands");
        List<BrandResponse> brands = brandRepository.findAll().stream()
                .map(brandMapper::toResponse)
                .collect(Collectors.toList());

        // Format brand URLs
        brands.forEach(this::formatBrandUrl);

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
        responses.forEach(this::formatBrandUrl);

        return responses;
    }

    /**
     * Lấy brand theo ID
     */
    @Override
    @Transactional(readOnly = true)
    public BrandResponse findById(int id) {
        log.info("Service: Getting brand by id: {}", id);
        Brand brand = brandRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Brand not found with id: " + id));

        BrandResponse response = brandMapper.toResponse(brand);
        formatBrandUrl(response);

        return response;
    }

    /**
     * Tạo brand mới
     */
    @Override
    public BrandResponse createBrand(BrandRequest request, MultipartFile image) {
        log.info("Service: Creating new brand: {} with image: {}", request.getName(), image != null);

        Brand brand = new Brand();
        brand.setName(request.getName());
        brand.setCountry(request.getCountry());
        brand.setDescription(request.getDescription());

        // Upload image to Cloudinary if provided
        if (image != null && !image.isEmpty()) {
            try {
                String publicId = cloudinaryService.uploadImage(image);
                brand.setUrl(publicId);
                log.info("Image uploaded successfully: {}", publicId);
            } catch (Exception e) {
                log.error("Error uploading brand image", e);
                throw new RuntimeException("Failed to upload brand image: " + e.getMessage());
            }
        }

        Brand savedBrand = brandRepository.save(brand);
        log.info("Brand created successfully with id: {}", savedBrand.getBrandId());

        BrandResponse response = brandMapper.toResponse(savedBrand);
        formatBrandUrl(response);

        return response;
    }

    /**
     * Cập nhật brand
     */
    @Override
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

                // Upload new image
                String publicId = cloudinaryService.uploadImage(image);
                existingBrand.setUrl(publicId);
                log.info("New image uploaded successfully: {}", publicId);
            } catch (Exception e) {
                log.error("Error uploading brand image", e);
                throw new RuntimeException("Failed to upload brand image: " + e.getMessage());
            }
        }

        Brand updatedBrand = brandRepository.save(existingBrand);
        log.info("Brand updated successfully: {}", id);

        BrandResponse response = brandMapper.toResponse(updatedBrand);
        formatBrandUrl(response);

        return response;
    }

    /**
     * Xóa brand - Kiểm tra xem brand có sản phẩm ACTIVE hay không
     */
    @Override
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
