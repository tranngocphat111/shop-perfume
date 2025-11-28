package iuh.fit.server.repository;

import iuh.fit.server.model.entity.Payment;
import iuh.fit.server.model.enums.Method;
import iuh.fit.server.model.enums.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.List;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Integer> {
    
    /**
     * Tìm các payment COD đang PENDING và order đã tạo trước thời điểm chỉ định
     */
    @Query("SELECT p FROM Payment p JOIN p.order o WHERE p.method = :method " +
           "AND p.status = :status AND o.orderDate < :beforeDate")
    List<Payment> findPendingCodPaymentsBeforeDate(
            @Param("method") Method method,
            @Param("status") PaymentStatus status,
            @Param("beforeDate") Date beforeDate
    );
}

