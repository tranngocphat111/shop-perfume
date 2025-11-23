package iuh.fit.server.mapper;

import iuh.fit.server.dto.response.PaymentResponse;
import iuh.fit.server.model.entity.Payment;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface PaymentMapper {
    
    @Mapping(source = "method", target = "method", qualifiedByName = "methodToString")
    @Mapping(source = "status", target = "status", qualifiedByName = "statusToString")
    PaymentResponse toResponse(Payment payment);
    
    @Named("methodToString")
    default String methodToString(iuh.fit.server.model.enums.Method method) {
        return method != null ? method.name() : null;
    }
    
    @Named("statusToString")
    default String statusToString(iuh.fit.server.model.enums.PaymentStatus status) {
        return status != null ? status.name() : null;
    }
}

