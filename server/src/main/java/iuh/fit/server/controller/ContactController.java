package iuh.fit.server.controller;

import iuh.fit.server.dto.ContactRequest;
import iuh.fit.server.dto.ContactResponse;
import iuh.fit.server.services.EmailService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/contact")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Contact", description = "API xử lý liên hệ")
public class ContactController {

    private final EmailService emailService;

    @PostMapping("/send-email")
    @Operation(summary = "Gửi email liên hệ đến chủ website")
    public ResponseEntity<ContactResponse> sendContactEmail(@Valid @RequestBody ContactRequest request) {
        try {
            log.info("Received contact request from: {} - Subject: {}", request.getEmail(), request.getSubject());

            // Send email asynchronously (method annotated with @Async)
            emailService.sendContactEmail(request);

            // Return success immediately without waiting for email to be sent
            return ResponseEntity.ok(ContactResponse
                    .success("Email đã được gửi thành công. Chúng tôi sẽ liên hệ lại với bạn sớm nhất!"));
        } catch (Exception e) {
            log.error("Error processing contact request: {}", e.getMessage(), e);
            return ResponseEntity.status(500)
                    .body(ContactResponse.error("Có lỗi xảy ra khi gửi email. Vui lòng thử lại sau."));
        }
    }
}
