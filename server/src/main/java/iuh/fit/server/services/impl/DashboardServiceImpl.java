package iuh.fit.server.services.impl;

import iuh.fit.server.dto.response.DashboardStatsResponse;
import iuh.fit.server.model.enums.PaymentStatus;
import iuh.fit.server.repository.*;
import iuh.fit.server.services.DashboardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class DashboardServiceImpl implements DashboardService {

    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final InventoryRepository inventoryRepository;
    private final CategoryRepository categoryRepository;
    private final BrandRepository brandRepository;

    @Override
    public DashboardStatsResponse getDashboardStats() {
        return getDashboardStats(null, null);
    }

    public DashboardStatsResponse getDashboardStats(String period, Integer year) {
        log.info("Fetching dashboard statistics for period {} and year {}", period, year);
        
        // Calculate date range based on period and year
        java.sql.Timestamp startTimestamp = null;
        java.sql.Timestamp endTimestamp = null;
        
        if (period != null && year != null) {
            java.time.LocalDate startDate = null;
            java.time.LocalDate endDate = null;
            
            if ("yearly".equals(period)) {
                // For yearly, year parameter is ignored, get data for all years
                startDate = null;
                endDate = null;
            } else if ("monthly".equals(period)) {
                // For monthly, get data for the entire year
                startDate = java.time.LocalDate.of(year, 1, 1);
                endDate = java.time.LocalDate.of(year, 12, 31);
            } else if ("quarterly".equals(period)) {
                // For quarterly, get data for the entire year
                startDate = java.time.LocalDate.of(year, 1, 1);
                endDate = java.time.LocalDate.of(year, 12, 31);
            }
            
            if (startDate != null) {
                startTimestamp = java.sql.Timestamp.valueOf(startDate.atStartOfDay());
                endTimestamp = java.sql.Timestamp.valueOf(endDate.atTime(23, 59, 59));
            }
        }
        
        // Basic counts
        Long totalProducts = productRepository.count();
        Long totalOrders = startTimestamp != null ? 
            orderRepository.countByOrderDateBetween(startTimestamp, endTimestamp) : 
            orderRepository.count();
        Long totalCategories = categoryRepository.count();
        Long totalBrands = brandRepository.count();
        
        // Count customers (users with CUSTOMER role) - filtered by date range
        Long totalCustomers = startTimestamp != null ?
            userRepository.countByRoleNameAndCreatedAtBetween("CUSTOMER", startTimestamp, endTimestamp) :
            userRepository.countByRoleName("CUSTOMER");
        
        // Calculate new customers - filtered by date range
        Long newCustomers = startTimestamp != null ?
            userRepository.countByRoleNameAndCreatedAtBetween("CUSTOMER", startTimestamp, endTimestamp) :
            userRepository.countByRoleName("CUSTOMER");
        
        // Revenue and order status with date filter
        Double totalRevenue = startTimestamp != null ?
            orderRepository.getTotalRevenueByDateRange(PaymentStatus.PAID, startTimestamp, endTimestamp) :
            orderRepository.getTotalRevenue(PaymentStatus.PAID);
        Long completedOrders = startTimestamp != null ?
            orderRepository.countByPaymentStatusAndOrderDateBetween(PaymentStatus.PAID, startTimestamp, endTimestamp) :
            orderRepository.getSizeOfOrdersHaveStatus(PaymentStatus.PAID);
        Long pendingOrders = startTimestamp != null ?
            orderRepository.countByPaymentStatusAndOrderDateBetween(PaymentStatus.PENDING, startTimestamp, endTimestamp) :
            orderRepository.getSizeOfOrdersHaveStatus(PaymentStatus.PENDING);
        Long failedOrders = startTimestamp != null ?
            orderRepository.countByPaymentStatusAndOrderDateBetween(PaymentStatus.FAILED, startTimestamp, endTimestamp) :
            orderRepository.getSizeOfOrdersHaveStatus(PaymentStatus.FAILED);
        Long refundedOrders = startTimestamp != null ?
            orderRepository.countByPaymentStatusAndOrderDateBetween(PaymentStatus.REFUNDED, startTimestamp, endTimestamp) :
            orderRepository.getSizeOfOrdersHaveStatus(PaymentStatus.REFUNDED);
        
        // Calculate Average Order Value
        Double averageOrderValue = completedOrders > 0 ? totalRevenue / completedOrders : 0.0;
        
        // Calculate Refund Rate
        Double refundRate = totalOrders > 0 ? (refundedOrders.doubleValue() / totalOrders) * 100 : 0.0;
        
        // Calculate New Orders - same as totalOrders (filtered by date range)
        Long newOrders = totalOrders;
        
        // Low stock items
        Long lowStockItems = inventoryRepository.countByQuantityLessThan(20);
        
        return DashboardStatsResponse.builder()
                .totalProducts(totalProducts)
                .totalOrders(totalOrders)
                .totalRevenue(totalRevenue)
                .averageOrderValue(averageOrderValue)
                .newCustomers(newCustomers)
                .newOrders(newOrders)
                .refundRate(refundRate)
                .lowStockItems(lowStockItems)
                .totalCustomers(totalCustomers)
                .pendingOrders(pendingOrders)
                .failedOrders(failedOrders)
                .refundedOrders(refundedOrders)
                .completedOrders(completedOrders)
                .totalCategories(totalCategories)
                .totalBrands(totalBrands)
                .build();
    }

    public java.util.List<iuh.fit.server.dto.response.TopProductResponse> getTopProducts(int limit) {
        log.info("Fetching top {} products", limit);
        
        // Query to get top selling products
        java.util.List<Object[]> results = orderRepository.getTopSellingProducts(
            PaymentStatus.PAID, 
            org.springframework.data.domain.PageRequest.of(0, limit)
        );
        
        return results.stream().map(result -> {
            Integer productId = (Integer) result[0];
            String productName = (String) result[1];
            String brandName = (String) result[2];
            Long totalSold = ((Number) result[3]).longValue();
            Double revenue = ((Number) result[4]).doubleValue();
            Double unitPrice = ((Number) result[5]).doubleValue();
            Integer volumeMl = (Integer) result[6];
            Integer stockQuantity = result[7] != null ? (Integer) result[7] : 0;
            
            return iuh.fit.server.dto.response.TopProductResponse.builder()
                    .productId(productId)
                    .productName(productName)
                    .brandName(brandName)
                    .totalSold(totalSold)
                    .revenue(revenue)
                    .unitPrice(unitPrice)
                    .volumeMl(volumeMl)
                    .stockQuantity(stockQuantity)
                    .build();
        }).collect(java.util.stream.Collectors.toList());
    }

    public java.util.List<iuh.fit.server.dto.response.RecentOrderResponse> getRecentOrders(int limit) {
        log.info("Fetching recent {} orders", limit);
        
        java.util.List<iuh.fit.server.model.entity.Order> orders = orderRepository.findTopByOrderByOrderDateDesc(
            org.springframework.data.domain.PageRequest.of(0, limit)
        );
        
        return orders.stream().map(order -> {
            String mainProduct = order.getOrderItems().isEmpty() ? "N/A" : 
                order.getOrderItems().get(0).getProduct().getName();
            
            String customerName = order.getUser() != null ? order.getUser().getName() : order.getGuestName();
            String customerEmail = order.getUser() != null ? order.getUser().getEmail() : order.getGuestEmail();
            
            return iuh.fit.server.dto.response.RecentOrderResponse.builder()
                    .orderId(order.getOrderId())
                    .customerName(customerName)
                    .customerEmail(customerEmail)
                    .mainProduct(mainProduct)
                    .totalAmount(order.getTotalAmount())
                    .status(order.getPayment().getStatus())
                    .orderDate(order.getOrderDate())
                    .itemCount(order.getOrderItems().size())
                    .build();
        }).collect(java.util.stream.Collectors.toList());
    }

    public java.util.List<iuh.fit.server.dto.response.LowStockProductResponse> getLowStockProducts() {
        log.info("Fetching low stock products");
        
        java.util.List<iuh.fit.server.model.entity.Inventory> lowStockItems = 
            inventoryRepository.findByQuantityLessThanOrderByQuantityAsc(20);
        
        return lowStockItems.stream().map(inventory -> {
            String status;
            if (inventory.getQuantity() == 0) {
                status = "OUT_OF_STOCK";
            } else if (inventory.getQuantity() < 5) {
                status = "CRITICAL";
            } else {
                status = "LOW_STOCK";
            }
            
            return iuh.fit.server.dto.response.LowStockProductResponse.builder()
                    .productId(inventory.getProduct().getProductId())
                    .productName(inventory.getProduct().getName())
                    .brandName(inventory.getProduct().getBrand().getName())
                    .volumeMl(inventory.getProduct().getColumeMl())
                    .stockQuantity(inventory.getQuantity())
                    .status(status)
                    .build();
        }).collect(java.util.stream.Collectors.toList());
    }

    @Override
    public iuh.fit.server.dto.response.CategoryDistributionResponse getCategoryDistribution() {
        return getCategoryDistribution(null, null);
    }

    public iuh.fit.server.dto.response.CategoryDistributionResponse getCategoryDistribution(String period, Integer year) {
        log.info("Fetching category distribution for period {} and year {}", period, year);
        
        // Calculate date range based on period and year
        java.sql.Timestamp startTimestamp = null;
        java.sql.Timestamp endTimestamp = null;
        
        if (period != null && year != null && !"yearly".equals(period)) {
            java.time.LocalDate startDate = java.time.LocalDate.of(year, 1, 1);
            java.time.LocalDate endDate = java.time.LocalDate.of(year, 12, 31);
            startTimestamp = java.sql.Timestamp.valueOf(startDate.atStartOfDay());
            endTimestamp = java.sql.Timestamp.valueOf(endDate.atTime(23, 59, 59));
        }
        
        java.util.List<Object[]> results = orderRepository.getCategoryDistribution(
            PaymentStatus.PAID, startTimestamp, endTimestamp);
        
        Double totalRevenue = results.stream()
                .mapToDouble(r -> ((Number) r[2]).doubleValue())
                .sum();
        
        java.util.List<iuh.fit.server.dto.response.CategoryDistributionResponse.CategoryStat> stats = 
            results.stream().map(result -> {
                String categoryName = (String) result[0];
                Long orderCount = ((Number) result[1]).longValue();
                Double revenue = ((Number) result[2]).doubleValue();
                Double percentage = totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0.0;
                
                return iuh.fit.server.dto.response.CategoryDistributionResponse.CategoryStat.builder()
                        .categoryName(categoryName)
                        .orderCount(orderCount)
                        .revenue(revenue)
                        .percentage(percentage)
                        .build();
            }).collect(java.util.stream.Collectors.toList());
        
        return iuh.fit.server.dto.response.CategoryDistributionResponse.builder()
                .categories(stats)
                .build();
    }

    @Override
    public java.util.List<iuh.fit.server.dto.response.TopBrandResponse> getTopBrands(int limit) {
        return getTopBrands(limit, null, null);
    }

    public java.util.List<iuh.fit.server.dto.response.TopBrandResponse> getTopBrands(int limit, String period, Integer year) {
        log.info("Fetching top {} brands for period {} and year {}", limit, period, year);
        
        // Calculate date range based on period and year
        java.sql.Timestamp startTimestamp = null;
        java.sql.Timestamp endTimestamp = null;
        
        if (period != null && year != null && !"yearly".equals(period)) {
            java.time.LocalDate startDate = java.time.LocalDate.of(year, 1, 1);
            java.time.LocalDate endDate = java.time.LocalDate.of(year, 12, 31);
            startTimestamp = java.sql.Timestamp.valueOf(startDate.atStartOfDay());
            endTimestamp = java.sql.Timestamp.valueOf(endDate.atTime(23, 59, 59));
        }
        
        // Query to get top selling brands
        java.util.List<Object[]> results = orderRepository.getTopBrands(
            PaymentStatus.PAID,
            startTimestamp,
            endTimestamp,
            org.springframework.data.domain.PageRequest.of(0, limit)
        );
        
        return results.stream().map(result -> {
            String brandName = (String) result[0];
            Long totalSold = ((Number) result[1]).longValue();
            Double revenue = ((Number) result[2]).doubleValue();
            
            return iuh.fit.server.dto.response.TopBrandResponse.builder()
                    .brandName(brandName)
                    .totalSold(totalSold)
                    .revenue(revenue)
                    .build();
        }).collect(java.util.stream.Collectors.toList());
    }
}
