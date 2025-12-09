package iuh.fit.server.repository;

import iuh.fit.server.model.entity.WebhookLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.List;

@Repository
public interface WebhookLogRepository extends JpaRepository<WebhookLog, Long> {
    
    /**
     * Find webhook logs by order ID
     */
    List<WebhookLog> findByExtractedOrderIdOrderByCreatedAtDesc(Integer orderId);
    
    /**
     * Find recent webhook logs
     */
    Page<WebhookLog> findAllByOrderByCreatedAtDesc(Pageable pageable);
    
    /**
     * Find webhook logs by date range
     */
    @Query("SELECT w FROM WebhookLog w WHERE w.createdAt BETWEEN :startDate AND :endDate ORDER BY w.createdAt DESC")
    List<WebhookLog> findByDateRange(@Param("startDate") Date startDate, @Param("endDate") Date endDate);
    
    /**
     * Find failed webhook logs
     */
    @Query("SELECT w FROM WebhookLog w WHERE w.processed = false OR w.errorMessage IS NOT NULL ORDER BY w.createdAt DESC")
    List<WebhookLog> findFailedWebhooks(Pageable pageable);
    
    /**
     * Find webhook logs by content (for searching)
     */
    List<WebhookLog> findByContentContainingIgnoreCaseOrderByCreatedAtDesc(String content);
}

