package iuh.fit.server.services.impl;

import iuh.fit.server.dto.request.AddressRequest;
import iuh.fit.server.dto.response.AddressResponse;
import iuh.fit.server.model.entity.Address;
import iuh.fit.server.model.entity.User;
import iuh.fit.server.repository.AddressRepository;
import iuh.fit.server.repository.UserRepository;
import iuh.fit.server.services.AddressService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AddressServiceImpl implements AddressService {

    private final AddressRepository addressRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public List<AddressResponse> getUserAddresses(Integer userId) {
        log.info("Getting addresses for user: {}", userId);
        if (userId == null) {
            throw new IllegalArgumentException("User ID cannot be null");
        }
        List<Address> addresses = addressRepository.findByUser_UserIdOrderByIsDefaultDescCreatedAtDesc(userId);
        return addresses.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public AddressResponse createAddress(Integer userId, AddressRequest request) {
        log.info("Creating address for user: {}", userId);
        
        if (userId == null) {
            throw new IllegalArgumentException("User ID cannot be null");
        }
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        // If this is set as default, unset other default addresses
        if (Boolean.TRUE.equals(request.getIsDefault())) {
            addressRepository.findByUser_UserIdAndIsDefaultTrue(userId)
                    .ifPresent(existingDefault -> {
                        existingDefault.setIsDefault(false);
                        addressRepository.save(existingDefault);
                    });
        } else {
            // If this is the first address, set it as default
            long addressCount = addressRepository.countByUser_UserId(userId);
            if (addressCount == 0) {
                request.setIsDefault(true);
            }
        }

        Address address = new Address();
        address.setUser(user);
        address.setRecipientName(request.getRecipientName());
        address.setPhone(request.getPhone());
        address.setAddressLine(request.getAddressLine());
        address.setWard(request.getWard());
        address.setDistrict(request.getDistrict());
        address.setCity(request.getCity());
        address.setIsDefault(request.getIsDefault() != null ? request.getIsDefault() : false);

        Address savedAddress = addressRepository.save(address);
        log.info("Created address with id: {} for user: {}", savedAddress.getAddressId(), userId);
        
        return mapToResponse(savedAddress);
    }

    @Override
    @Transactional
    public AddressResponse updateAddress(Integer userId, Integer addressId, AddressRequest request) {
        log.info("Updating address {} for user: {}", addressId, userId);
        
        Address address = addressRepository.findByAddressIdAndUser_UserId(addressId, userId)
                .orElseThrow(() -> new RuntimeException("Address not found or does not belong to user"));

        // If setting as default, unset other default addresses
        if (Boolean.TRUE.equals(request.getIsDefault()) && !address.getIsDefault()) {
            addressRepository.findByUser_UserIdAndIsDefaultTrue(userId)
                    .ifPresent(existingDefault -> {
                        if (!existingDefault.getAddressId().equals(addressId)) {
                            existingDefault.setIsDefault(false);
                            addressRepository.save(existingDefault);
                        }
                    });
        }

        address.setRecipientName(request.getRecipientName());
        address.setPhone(request.getPhone());
        address.setAddressLine(request.getAddressLine());
        address.setWard(request.getWard());
        address.setDistrict(request.getDistrict());
        address.setCity(request.getCity());
        address.setIsDefault(request.getIsDefault() != null ? request.getIsDefault() : address.getIsDefault());

        Address updatedAddress = addressRepository.save(address);
        log.info("Updated address {} for user: {}", addressId, userId);
        
        return mapToResponse(updatedAddress);
    }

    @Override
    @Transactional
    public void deleteAddress(Integer userId, Integer addressId) {
        log.info("Deleting address {} for user: {}", addressId, userId);
        
        Address address = addressRepository.findByAddressIdAndUser_UserId(addressId, userId)
                .orElseThrow(() -> new RuntimeException("Address not found or does not belong to user"));

        if (address != null) {
            addressRepository.delete(address);
        }
        log.info("Deleted address {} for user: {}", addressId, userId);
    }

    @Override
    @Transactional
    public AddressResponse setDefaultAddress(Integer userId, Integer addressId) {
        log.info("Setting address {} as default for user: {}", addressId, userId);
        
        Address address = addressRepository.findByAddressIdAndUser_UserId(addressId, userId)
                .orElseThrow(() -> new RuntimeException("Address not found or does not belong to user"));

        // Unset other default addresses
        addressRepository.findByUser_UserIdAndIsDefaultTrue(userId)
                .ifPresent(existingDefault -> {
                    if (!existingDefault.getAddressId().equals(addressId)) {
                        existingDefault.setIsDefault(false);
                        addressRepository.save(existingDefault);
                    }
                });

        address.setIsDefault(true);
        Address updatedAddress = addressRepository.save(address);
        log.info("Set address {} as default for user: {}", addressId, userId);
        
        return mapToResponse(updatedAddress);
    }

    private AddressResponse mapToResponse(Address address) {
        AddressResponse response = new AddressResponse();
        response.setAddressId(address.getAddressId());
        response.setRecipientName(address.getRecipientName());
        response.setPhone(address.getPhone());
        response.setAddressLine(address.getAddressLine());
        response.setWard(address.getWard());
        response.setDistrict(address.getDistrict());
        response.setCity(address.getCity());
        response.setIsDefault(address.getIsDefault());
        response.setCreatedAt(address.getCreatedAt());
        response.setUpdatedAt(address.getUpdatedAt());
        return response;
    }
}

