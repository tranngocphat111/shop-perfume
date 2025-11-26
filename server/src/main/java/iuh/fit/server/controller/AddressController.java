package iuh.fit.server.controller;

import iuh.fit.server.dto.request.AddressRequest;
import iuh.fit.server.dto.response.AddressResponse;
import iuh.fit.server.repository.UserRepository;
import iuh.fit.server.services.AddressService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/addresses")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Address", description = "Address Management APIs")
public class AddressController {

    private final AddressService addressService;
    private final UserRepository userRepository;

    /**
     * Get all addresses for the authenticated user
     */
    @GetMapping
    @Operation(summary = "Get user addresses", description = "Get all addresses for the authenticated user")
    public ResponseEntity<List<AddressResponse>> getUserAddresses(Authentication authentication) {
        Integer userId = getUserIdFromAuthentication(authentication);
        log.info("Getting addresses for user: {}", userId);
        List<AddressResponse> addresses = addressService.getUserAddresses(userId);
        return ResponseEntity.ok(addresses);
    }

    /**
     * Create a new address
     */
    @PostMapping
    @Operation(summary = "Create address", description = "Create a new address for the authenticated user")
    public ResponseEntity<AddressResponse> createAddress(
            @Valid @RequestBody AddressRequest request,
            Authentication authentication) {
        Integer userId = getUserIdFromAuthentication(authentication);
        log.info("Creating address for user: {}", userId);
        AddressResponse address = addressService.createAddress(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(address);
    }

    /**
     * Update an existing address
     */
    @PutMapping("/{addressId}")
    @Operation(summary = "Update address", description = "Update an existing address")
    public ResponseEntity<AddressResponse> updateAddress(
            @PathVariable Integer addressId,
            @Valid @RequestBody AddressRequest request,
            Authentication authentication) {
        Integer userId = getUserIdFromAuthentication(authentication);
        log.info("Updating address {} for user: {}", addressId, userId);
        AddressResponse address = addressService.updateAddress(userId, addressId, request);
        return ResponseEntity.ok(address);
    }

    /**
     * Delete an address
     */
    @DeleteMapping("/{addressId}")
    @Operation(summary = "Delete address", description = "Delete an address")
    public ResponseEntity<Void> deleteAddress(
            @PathVariable Integer addressId,
            Authentication authentication) {
        Integer userId = getUserIdFromAuthentication(authentication);
        log.info("Deleting address {} for user: {}", addressId, userId);
        addressService.deleteAddress(userId, addressId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Set an address as default
     */
    @PutMapping("/{addressId}/set-default")
    @Operation(summary = "Set default address", description = "Set an address as the default address")
    public ResponseEntity<AddressResponse> setDefaultAddress(
            @PathVariable Integer addressId,
            Authentication authentication) {
        Integer userId = getUserIdFromAuthentication(authentication);
        log.info("Setting address {} as default for user: {}", addressId, userId);
        AddressResponse address = addressService.setDefaultAddress(userId, addressId);
        return ResponseEntity.ok(address);
    }

    /**
     * Helper method to get userId from Authentication
     */
    private Integer getUserIdFromAuthentication(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("User not authenticated");
        }

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        String email = userDetails.getUsername();

        return userRepository.findByEmail(email)
                .map(user -> user.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));
    }
}

