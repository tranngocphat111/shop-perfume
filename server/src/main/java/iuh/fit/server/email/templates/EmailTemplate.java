package iuh.fit.server.email.templates;

/**
 * Interface cho email templates
 * Mỗi template sẽ implement interface này để cung cấp HTML và text content
 */
public interface EmailTemplate {
    
    /**
     * Build HTML content cho email
     * @param data Dữ liệu để render template (có thể là Map, Object, hoặc các parameters)
     * @return HTML content
     */
    String buildHtml(Object... data);
    
    /**
     * Build plain text content cho email
     * @param data Dữ liệu để render template
     * @return Plain text content
     */
    String buildText(Object... data);
    
    /**
     * Get subject của email
     * @param data Dữ liệu để render subject
     * @return Email subject
     */
    String getSubject(Object... data);
}

