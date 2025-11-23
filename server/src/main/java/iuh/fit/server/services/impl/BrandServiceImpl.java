package iuh.fit.server.services.impl;

import iuh.fit.server.dto.response.BrandResponse;
import iuh.fit.server.mapper.BrandMapper;
import iuh.fit.server.repository.BrandRepository;
import iuh.fit.server.services.BrandService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
    private final BrandMapper brandMapper;

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
}

