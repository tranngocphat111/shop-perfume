package iuh.fit.server.controller;

import io.swagger.v3.oas.annotations.Operation;
import iuh.fit.server.dto.response.UserDetailResponse;
import iuh.fit.server.services.AdminUserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin/users")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {
    
    private final AdminUserService adminUserService;
    
    /**
     * GET /api/admin/users/page - Get users with pagination and search
     */
    @GetMapping({"/page", "/paginated"})
    @Operation(summary = "Get users with pagination", description = "Retrieve users with pagination and search (Admin only)")
    public ResponseEntity<Page<UserDetailResponse>> getUsersPage(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String sort,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String direction,
            @RequestParam(required = false) String search) {
        log.info("REST request to get users with pagination - page: {}, size: {}, search: {}", page, size, search);
        
        // Parse sort parameter
        String fieldName = "userId";
        Sort.Direction sortDirection = Sort.Direction.DESC;
        
        if (sort != null && !sort.isEmpty()) {
            String[] sortParams = sort.split(",");
            fieldName = sortParams[0];
            if (sortParams.length > 1) {
                sortDirection = sortParams[1].equalsIgnoreCase("desc") 
                        ? Sort.Direction.DESC 
                        : Sort.Direction.ASC;
            }
        } else if (sortBy != null && !sortBy.isEmpty()) {
            fieldName = sortBy;
            if (direction != null && direction.equalsIgnoreCase("DESC")) {
                sortDirection = Sort.Direction.DESC;
            } else if (direction != null && direction.equalsIgnoreCase("ASC")) {
                sortDirection = Sort.Direction.ASC;
            }
        }
        
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, fieldName));
        Page<UserDetailResponse> users = adminUserService.getUsersPage(pageable, search);
        
        return ResponseEntity.ok(users);
    }
    
    /**
     * GET /api/admin/users/{id} - Get user by ID
     */
    @GetMapping("/{id}")
    @Operation(summary = "Get user by ID", description = "Retrieve user details by ID (Admin only)")
    public ResponseEntity<UserDetailResponse> getUserById(@PathVariable Integer id) {
        log.info("REST request to get user by id: {}", id);
        UserDetailResponse user = adminUserService.getUserById(id);
        return ResponseEntity.ok(user);
    }
}
