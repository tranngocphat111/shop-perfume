package iuh.fit.server.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ContactResponse {
    private String message;
    private boolean success;

    public static ContactResponse success(String message) {
        return new ContactResponse(message, true);
    }

    public static ContactResponse error(String message) {
        return new ContactResponse(message, false);
    }
}
