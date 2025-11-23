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
     * Lấy tất cả brands
     */
    @Override
    public List<BrandResponse> findAll() {
        log.info("Service: Getting all brands");
        return brandRepository.findAll().stream()
                .map(brandMapper::toResponse)
                .collect(Collectors.toList());
    }
}

