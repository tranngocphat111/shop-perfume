package iuh.fit.server.services.impl;

import iuh.fit.server.dto.request.SupplierRequest;
import iuh.fit.server.dto.response.SupplierResponse;
import iuh.fit.server.exception.ResourceNotFoundException;
import iuh.fit.server.mapper.SupplierMapper;
import iuh.fit.server.model.entity.Supplier;
import iuh.fit.server.repository.SupplierRepository;
import iuh.fit.server.services.SupplierService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Implementation của SupplierService
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class SupplierServiceImpl implements SupplierService {

    private final SupplierRepository supplierRepository;
    private final SupplierMapper supplierMapper;

    @Override
    @Transactional(readOnly = true)
    public List<SupplierResponse> findAll() {
        log.info("Finding all suppliers");
        List<Supplier> suppliers = supplierRepository.findAll();
        return suppliers.stream()
                .map(supplierMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<SupplierResponse> findAllPaginated(Pageable pageable) {
        log.info("Finding all suppliers with pagination: {}", pageable);
        Page<Supplier> suppliers = supplierRepository.findAll(pageable);
        return suppliers.map(supplierMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<SupplierResponse> searchSuppliers(String searchTerm, Pageable pageable) {
        log.info("Searching suppliers with term '{}' and pagination: {}", searchTerm, pageable);
        Page<Supplier> suppliers = supplierRepository.searchSuppliers(searchTerm, pageable);
        return suppliers.map(supplierMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public SupplierResponse findById(int supplierId) {
        log.info("Finding supplier by id: {}", supplierId);
        Supplier supplier = supplierRepository.findById(supplierId)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found with id: " + supplierId));
        return supplierMapper.toResponse(supplier);
    }

    @Override
    public SupplierResponse create(SupplierRequest request) {
        log.info("Creating new supplier: {}", request);
        
        // Create supplier entity
        Supplier supplier = supplierMapper.toEntity(request);
        
        // Save
        Supplier savedSupplier = supplierRepository.save(supplier);
        log.info("Supplier created successfully with id: {}", savedSupplier.getSupplierId());
        
        return supplierMapper.toResponse(savedSupplier);
    }

    @Override
    public SupplierResponse update(int supplierId, SupplierRequest request) {
        log.info("Updating supplier {}: {}", supplierId, request);
        
        // Check if supplier exists
        Supplier existingSupplier = supplierRepository.findById(supplierId)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found with id: " + supplierId));
        
        // Update fields
        existingSupplier.setName(request.getName());
        existingSupplier.setEmail(request.getEmail());
        existingSupplier.setPhone(request.getPhone());
        existingSupplier.setAddress(request.getAddress());
        
        // Save
        Supplier updatedSupplier = supplierRepository.save(existingSupplier);
        log.info("Supplier updated successfully: {}", updatedSupplier.getSupplierId());
        
        return supplierMapper.toResponse(updatedSupplier);
    }

    @Override
    public void delete(int supplierId) {
        log.info("Deleting supplier: {}", supplierId);
        
        // Check if supplier exists
        Supplier supplier = supplierRepository.findById(supplierId)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found with id: " + supplierId));
        
        // Delete
        supplierRepository.delete(supplier);
        log.info("Supplier deleted successfully: {}", supplierId);
    }
}
