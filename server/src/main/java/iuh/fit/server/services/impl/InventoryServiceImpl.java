package iuh.fit.server.services.impl;

import iuh.fit.server.dto.response.InventoryResponse;
import iuh.fit.server.mapper.InventoryMapper;
import iuh.fit.server.model.entity.Inventory;
import iuh.fit.server.model.enums.Method;
import iuh.fit.server.model.enums.PaymentStatus;
import iuh.fit.server.repository.InventoryRepository;
import iuh.fit.server.repository.OrderItemRepository;
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
    private final OrderItemRepository orderItemRepository;


    @Override
    public Long getLowStockItem() {
        return inventoryRepository.getLowStockItem();
    }

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

    @Override
    @Transactional(readOnly = true)
    public List<InventoryResponse> findBestSellers(int limit) {
        log.info("Finding best selling inventories with limit: {}", limit);
        
        // Get best selling product IDs from order_item table
        List<Object[]> bestSellingData = orderItemRepository.findBestSellingProductsWithLimit(limit);
        
        if (bestSellingData.isEmpty()) {
            log.warn("No best selling products found, returning empty list");
            return List.of();
        }
        
        // Extract product IDs
        List<Integer> productIds = bestSellingData.stream()
                .map(row -> ((Number) row[0]).intValue())
                .collect(Collectors.toList());
        
        log.info("Found {} best selling product IDs: {}", productIds.size(), productIds);
        
        // Fetch inventories for these products
        List<Inventory> inventories = inventoryRepository.findByProductIds(productIds);
        
        // Sort by productIds order (best sellers first) to maintain ranking
        List<Inventory> bestSellerInventories = new java.util.ArrayList<>();
        for (Integer productId : productIds) {
            inventories.stream()
                    .filter(inv -> inv.getProduct().getProductId() == productId)
                    .findFirst()
                    .ifPresent(bestSellerInventories::add);
        }
        
        // Map to response
        List<InventoryResponse> responses = bestSellerInventories.stream()
                .map(inventoryMapper::toResponse)
                .collect(Collectors.toList());
        
        log.info("Returning {} best selling inventories", responses.size());
        return responses;
    }

    @Override
    @Transactional(readOnly = true)
    public InventoryResponse findById(Integer inventoryId) {
        log.info("Finding inventory by inventoryId: {}", inventoryId);
        Inventory inventory = inventoryRepository.findById(inventoryId).orElse(null);
        if (inventory == null) {
            log.warn("Inventory not found for inventoryId: {}", inventoryId);
            return null;
        }
        return inventoryMapper.toResponse(inventory);
    }

    @Override
    @Transactional(readOnly = true)
    public InventoryResponse findByProductId(Integer productId) {
        log.info("Finding inventory by productId: {}", productId);
        Inventory inventory = inventoryRepository.findByProductId(productId);
        if (inventory == null) {
            log.warn("Inventory not found for productId: {}", productId);
            return null;
        }
        return inventoryMapper.toResponse(inventory);
    }

    @Override
    public InventoryResponse updateQuantity(Integer inventoryId, Integer quantity) {
        log.info("Updating inventory {} with new quantity: {}", inventoryId, quantity);
        
        Inventory inventory = inventoryRepository.findById(inventoryId)
                .orElseThrow(() -> new RuntimeException("Inventory not found with id: " + inventoryId));
        
        inventory.setQuantity(quantity);
        Inventory updatedInventory = inventoryRepository.save(inventory);
        
        log.info("Inventory {} updated successfully with quantity: {}", inventoryId, quantity);
        return inventoryMapper.toResponse(updatedInventory);
    }

    @Override
    @Transactional(readOnly = true)
    public Integer getAvailableStock(Integer productId) {
        log.info("Getting available stock for product: {}", productId);
        
        Inventory inventory = inventoryRepository.findByProductId(productId);
        if (inventory == null) {
            log.warn("Inventory not found for product: {}", productId);
            return 0;
        }
        
        // Available stock = quantity trong inventory (đã được trừ khi tạo order)
        int availableStock = inventory.getQuantity();
        
        log.info("Product {}: available stock={}", productId, availableStock);
        
        return Math.max(0, availableStock); // Đảm bảo không âm
    }
    
    @Override
    @Transactional(readOnly = true)
    public Page<InventoryResponse> searchInventories(String searchTerm, Pageable pageable) {
        log.info("Searching inventories with term '{}' and pagination: {}", searchTerm, pageable);
        Page<Inventory> inventories = inventoryRepository.searchInventories(searchTerm, pageable);
        return inventories.map(inventoryMapper::toResponse);
    }

}

