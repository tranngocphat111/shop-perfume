package iuh.fit.server.services;

import iuh.fit.server.dto.request.AddressRequest;
import iuh.fit.server.dto.response.AddressResponse;

import java.util.List;

public interface AddressService {
    List<AddressResponse> getUserAddresses(Integer userId);
    
    AddressResponse createAddress(Integer userId, AddressRequest request);
    
    AddressResponse updateAddress(Integer userId, Integer addressId, AddressRequest request);
    
    void deleteAddress(Integer userId, Integer addressId);
    
    AddressResponse setDefaultAddress(Integer userId, Integer addressId);
}

