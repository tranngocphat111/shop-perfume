package iuh.fit.server.services.impl;

import iuh.fit.server.dto.request.ProductRequest;
import iuh.fit.server.dto.response.ProductResponse;
import iuh.fit.server.exception.ResourceNotFoundException;
import iuh.fit.server.mapper.ProductMapper;
import iuh.fit.server.model.entity.Brand;
import iuh.fit.server.model.entity.Category;
import iuh.fit.server.model.entity.Image;
import iuh.fit.server.model.entity.Product;
import iuh.fit.server.repository.BrandRepository;
import iuh.fit.server.repository.CategoryRepository;
import iuh.fit.server.repository.ImageRepository;
import iuh.fit.server.repository.OrderItemRepository;
import iuh.fit.server.repository.ProductRepository;
import iuh.fit.server.services.CloudinaryService;
import iuh.fit.server.services.ProductService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Implementation của ProductService
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final BrandRepository brandRepository;
    private final CategoryRepository categoryRepository;
    private final ImageRepository imageRepository;
    private final OrderItemRepository orderItemRepository;
    private final ProductMapper productMapper;
    private final CloudinaryService cloudinaryService;

    @Override
    @Transactional(readOnly = true)
    public List<ProductResponse> findAll() {
        log.info("Finding all products");
        List<Product> products = productRepository.findAll();
        return products.stream()
                .map(productMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ProductResponse> findAllPaginated(Pageable pageable) {
        log.info("Finding all products with pagination: {}", pageable);
        Page<Product> products = productRepository.findAll(pageable);
        return products.map(productMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ProductResponse> searchProducts(String searchTerm, Pageable pageable) {
        log.info("Searching products with term '{}' and pagination: {}", searchTerm, pageable);
        Page<Product> products = productRepository.searchProducts(searchTerm, pageable);
        return products.map(productMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public ProductResponse findById(int productId) {
        log.info("Finding product by id: {}", productId);
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + productId));
        return productMapper.toResponse(product);
    }

    @Override
    public ProductResponse create(ProductRequest request) {
        log.info("Creating new product: {}", request);
        
        // Validate brand
        Brand brand = brandRepository.findById(request.getBrandId())
                .orElseThrow(() -> new ResourceNotFoundException("Brand not found with id: " + request.getBrandId()));
        
        // Validate category
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + request.getCategoryId()));
        
        // Create product entity
        Product product = productMapper.toEntity(request);
        product.setBrand(brand);
        product.setCategory(category);
        
        // Save
        Product savedProduct = productRepository.save(product);
        log.info("Product created successfully with id: {}", savedProduct.getProductId());
        
        return productMapper.toResponse(savedProduct);
    }

    @Override
    public ProductResponse createWithImages(ProductRequest request, List<MultipartFile> images, int primaryImageIndex) {
        log.info("Creating new product with {} images", images.size());
        
        // Validate brand
        Brand brand = brandRepository.findById(request.getBrandId())
                .orElseThrow(() -> new ResourceNotFoundException("Brand not found with id: " + request.getBrandId()));
        
        // Validate category
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + request.getCategoryId()));
        
        // Create product entity
        Product product = productMapper.toEntity(request);
        product.setBrand(brand);
        product.setCategory(category);
        
        // Save product first to get ID
        Product savedProduct = productRepository.save(product);
        log.info("Product created successfully with id: {}", savedProduct.getProductId());
        
        // Upload images to Cloudinary in parallel
        List<String> publicIds;
        try {
            publicIds = cloudinaryService.uploadImagesParallel(images).join();
            log.info("Parallel upload completed for {} images", publicIds.size());
        } catch (Exception e) {
            log.error("Error uploading images in parallel", e);
            throw new RuntimeException("Failed to upload images: " + e.getMessage());
        }
        
        // Create Image entities with uploaded URLs
        List<Image> imageEntities = new ArrayList<>();
        for (int i = 0; i < publicIds.size(); i++) {
            Image image = new Image();
            image.setUrl(publicIds.get(i));
            image.setPrimary(i == primaryImageIndex);
            image.setProduct(savedProduct);
            imageEntities.add(image);
        }
        
        // Save all images
        imageRepository.saveAll(imageEntities);
        log.info("Saved {} images for product {}", imageEntities.size(), savedProduct.getProductId());
        
        // Set images to product for response
        savedProduct.setImages(imageEntities);
        
        return productMapper.toResponse(savedProduct);
    }

    @Override
    public ProductResponse update(int productId, ProductRequest request) {
        log.info("Updating product id {}: {}", productId, request);
        
        // Check if product exists
        Product existingProduct = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + productId));
        
        // Validate brand
        Brand brand = brandRepository.findById(request.getBrandId())
                .orElseThrow(() -> new ResourceNotFoundException("Brand not found with id: " + request.getBrandId()));
        
        // Validate category
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + request.getCategoryId()));
        
        // Update fields
        existingProduct.setName(request.getName());
        existingProduct.setDescription(request.getDescription());
        existingProduct.setPerfumeLongevity(request.getPerfumeLongevity());
        existingProduct.setPerfumeConcentration(request.getPerfumeConcentration());
        existingProduct.setReleaseYear(request.getReleaseYear());
        existingProduct.setColumeMl(request.getColumeMl());
        existingProduct.setUnitPrice(request.getUnitPrice());
        existingProduct.setStatus(request.getStatus());
        existingProduct.setBrand(brand);
        existingProduct.setCategory(category);
        
        // Save
        Product updatedProduct = productRepository.save(existingProduct);
        log.info("Product updated successfully: {}", productId);
        
        return productMapper.toResponse(updatedProduct);
    }

    @Override
    public ProductResponse updateWithImages(int productId, ProductRequest request, List<MultipartFile> newImages, List<Integer> imagesToDelete, Integer primaryImageId) {
        log.info("Updating product {} with images management", productId);
        
        // Check if product exists
        Product existingProduct = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + productId));
        
        // Validate brand
        Brand brand = brandRepository.findById(request.getBrandId())
                .orElseThrow(() -> new ResourceNotFoundException("Brand not found with id: " + request.getBrandId()));
        
        // Validate category
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + request.getCategoryId()));
        
        // Update product fields
        existingProduct.setName(request.getName());
        existingProduct.setDescription(request.getDescription());
        existingProduct.setPerfumeLongevity(request.getPerfumeLongevity());
        existingProduct.setPerfumeConcentration(request.getPerfumeConcentration());
        existingProduct.setReleaseYear(request.getReleaseYear());
        existingProduct.setColumeMl(request.getColumeMl());
        existingProduct.setUnitPrice(request.getUnitPrice());
        existingProduct.setStatus(request.getStatus());
        existingProduct.setBrand(brand);
        existingProduct.setCategory(category);
        
        // Save product first
        Product savedProduct = productRepository.save(existingProduct);
        
        // Delete specified images in parallel
        if (imagesToDelete != null && !imagesToDelete.isEmpty()) {
            List<String> publicIdsToDelete = new ArrayList<>();
            List<Integer> imageIdsToDelete = new ArrayList<>();
            
            // Collect URLs and IDs
            for (Integer imageId : imagesToDelete) {
                Image imageToDelete = imageRepository.findById(imageId).orElse(null);
                if (imageToDelete != null) {
                    publicIdsToDelete.add(imageToDelete.getUrl());
                    imageIdsToDelete.add(imageId);
                }
            }
            
            // Delete from Cloudinary in parallel (async, non-blocking)
            if (!publicIdsToDelete.isEmpty()) {
                cloudinaryService.deleteImagesParallel(publicIdsToDelete)
                        .thenRun(() -> log.info("Async deletion completed for {} images", publicIdsToDelete.size()))
                        .exceptionally(e -> {
                            log.error("Error during parallel image deletion from Cloudinary", e);
                            return null;
                        });
            }
            
            // Delete from database immediately
            imageRepository.deleteAllById(imageIdsToDelete);
            log.info("Deleted {} images from product {}", imageIdsToDelete.size(), productId);
        }
        
        // Upload new images in parallel
        if (newImages != null && !newImages.isEmpty()) {
            List<String> publicIds;
            try {
                publicIds = cloudinaryService.uploadImagesParallel(newImages).join();
                log.info("Parallel upload completed for {} new images", publicIds.size());
            } catch (Exception e) {
                log.error("Error uploading new images in parallel", e);
                throw new RuntimeException("Failed to upload new images: " + e.getMessage());
            }
            
            // Create Image entities with uploaded URLs
            List<Image> imageEntities = new ArrayList<>();
            for (String publicId : publicIds) {
                Image image = new Image();
                image.setUrl(publicId);
                image.setPrimary(false); // New images are not primary by default
                image.setProduct(savedProduct);
                imageEntities.add(image);
            }
            
            // Save all new images
            imageRepository.saveAll(imageEntities);
            log.info("Added {} new images to product {}", imageEntities.size(), productId);
        }
        
        // Update primary image if specified
        if (primaryImageId != null) {
            // Reset all images to non-primary
            List<Image> allImages = savedProduct.getImages();
            allImages.forEach(img -> img.setPrimary(false));
            imageRepository.saveAll(allImages);
            
            // Set new primary image
            Image primaryImage = imageRepository.findById(primaryImageId).orElse(null);
            if (primaryImage != null && primaryImage.getProduct().getProductId() == productId) {
                primaryImage.setPrimary(true);
                imageRepository.save(primaryImage);
                log.info("Set image {} as primary for product {}", primaryImageId, productId);
            }
        }
        
        log.info("Product {} updated successfully with images", productId);
        
        // Reload product to get updated images
        Product reloadedProduct = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + productId));
        
        return productMapper.toResponse(reloadedProduct);
    }

    @Override
    public void delete(int productId) {
        log.info("Deleting product: {}", productId);
        
        // Check if product exists
        if (!productRepository.existsById(productId)) {
            throw new ResourceNotFoundException("Product not found with id: " + productId);
        }
        
        // Delete
        productRepository.deleteById(productId);
        log.info("Product deleted successfully: {}", productId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductResponse> findBestSellers(int limit) {
        log.info("Finding best selling products with limit: {}", limit);
        
        // Get best selling product IDs from order_item table
        List<Object[]> bestSellingData = orderItemRepository.findBestSellingProductsWithLimit(limit);
        
        if (bestSellingData.isEmpty()) {
            log.warn("No best selling products found, returning empty list");
            return new ArrayList<>();
        }
        
        // Extract product IDs
        List<Integer> productIds = bestSellingData.stream()
                .map(row -> ((Number) row[0]).intValue())
                .collect(Collectors.toList());
        
        log.info("Found {} best selling product IDs: {}", productIds.size(), productIds);
        
        // Fetch products by IDs, maintaining the order
        List<Product> products = productRepository.findAllById(productIds);
        
        // Sort products to maintain the order from query (best sellers first)
        products.sort((p1, p2) -> {
            int index1 = productIds.indexOf(p1.getProductId());
            int index2 = productIds.indexOf(p2.getProductId());
            return Integer.compare(index1, index2);
        });
        
        // Map to response
        List<ProductResponse> responses = products.stream()
                .map(productMapper::toResponse)
                .collect(Collectors.toList());
        
        log.info("Returning {} best selling products", responses.size());
        return responses;
    }

}

