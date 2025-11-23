package iuh.fit.server.services.impl;

import iuh.fit.server.dto.response.InventoryResponse;
import iuh.fit.server.dto.response.ProductResponse;
import iuh.fit.server.mapper.InventoryMapper;
import iuh.fit.server.mapper.ProductMapper;
import iuh.fit.server.model.entity.Inventory;
import iuh.fit.server.model.entity.Product;
import iuh.fit.server.repository.BrandRepository;
import iuh.fit.server.repository.CategoryRepository;
import iuh.fit.server.repository.InventoryRepository;
import iuh.fit.server.repository.ProductRepository;
import iuh.fit.server.services.ProductService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Implementation của ProductService
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class InventoryServiceImpl implements iuh.fit.server.services.InventoryService {
    private final InventoryMapper inventoryMapper;

    private final InventoryRepository inventoryRepository;

    @Override
    public List<InventoryResponse> findAll() {
        log.info("Finding all products");
        List<Inventory> inventories = inventoryRepository.findAll();
        return inventories.stream().map(inventoryMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public Page<InventoryResponse> findAllPaginated(Pageable pageable) {
        log.info("Finding all products with pagination: {}", pageable);
        Page<Inventory> inventories = inventoryRepository.findAll(pageable);
        return inventories.map(inventoryMapper::toResponse);
    }


}

