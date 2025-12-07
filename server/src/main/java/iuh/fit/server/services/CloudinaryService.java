package iuh.fit.server.services;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

/**
 * Service for handling image uploads to Cloudinary with async support
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CloudinaryService {

    private final Cloudinary cloudinary;

    /**
     * Upload ảnh lên Cloudinary
     * 
     * @param file File ảnh cần upload
     * @return URL của ảnh đã upload (chỉ trả về public_id, không có base URL)
     */
    public String uploadImage(MultipartFile file) {
        try {
            log.info("Uploading image to Cloudinary: {}", file.getOriginalFilename());

            Map<?, ?> uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.emptyMap());
            String publicId = uploadResult.get("public_id").toString();

            log.info("Image uploaded successfully with public_id: {}", publicId);
            return publicId;

        } catch (IOException e) {
            log.error("Error uploading image to Cloudinary", e);
            throw new RuntimeException("Failed to upload image: " + e.getMessage());
        }
    }

    /**
     * Upload ảnh lên Cloudinary với folder chỉ định
     * 
     * @param file   File ảnh cần upload
     * @param folder Tên folder trên Cloudinary (vd: "brand", "product")
     * @return Chỉ trả về filename (không bao gồm folder path)
     */
    public String uploadImageToFolder(MultipartFile file, String folder) {
        try {
            log.info("Uploading image to Cloudinary folder '{}': {}", folder, file.getOriginalFilename());

            @SuppressWarnings("unchecked")
            Map<String, Object> options = ObjectUtils.asMap("folder", folder);
            Map<?, ?> uploadResult = cloudinary.uploader().upload(file.getBytes(), options);
            String publicId = uploadResult.get("public_id").toString();

            // Extract only filename from public_id (remove folder prefix)
            // Example: "brand/logo_abc123.png" -> "logo_abc123.png"
            String filename = publicId;
            if (publicId.contains("/")) {
                filename = publicId.substring(publicId.lastIndexOf("/") + 1);
            }

            log.info("Image uploaded successfully. Public ID: {}, Returning filename: {}", publicId, filename);
            return filename;

        } catch (IOException e) {
            log.error("Error uploading image to Cloudinary folder '{}'", folder, e);
            throw new RuntimeException("Failed to upload image: " + e.getMessage());
        }
    }

    /**
     * Xóa ảnh từ Cloudinary
     * 
     * @param publicId Public ID của ảnh cần xóa
     */
    public void deleteImage(String publicId) {
        try {
            log.info("Deleting image from Cloudinary: {}", publicId);
            cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
            log.info("Image deleted successfully: {}", publicId);
        } catch (IOException e) {
            log.error("Error deleting image from Cloudinary", e);
            throw new RuntimeException("Failed to delete image: " + e.getMessage());
        }
    }

    /**
     * Upload ảnh bất đồng bộ
     * 
     * @param file File ảnh cần upload
     * @return CompletableFuture chứa URL của ảnh đã upload
     */
    @Async("imageTaskExecutor")
    public CompletableFuture<String> uploadImageAsync(MultipartFile file) {
        try {
            log.info("Async uploading image: {}", file.getOriginalFilename());
            String publicId = uploadImage(file);
            return CompletableFuture.completedFuture(publicId);
        } catch (Exception e) {
            log.error("Error in async upload", e);
            return CompletableFuture.failedFuture(e);
        }
    }

    /**
     * Xóa ảnh bất đồng bộ
     * 
     * @param publicId Public ID của ảnh cần xóa
     * @return CompletableFuture<Void>
     */
    @Async("imageTaskExecutor")
    public CompletableFuture<Void> deleteImageAsync(String publicId) {
        try {
            log.info("Async deleting image: {}", publicId);
            deleteImage(publicId);
            return CompletableFuture.completedFuture(null);
        } catch (Exception e) {
            log.error("Error in async delete", e);
            return CompletableFuture.failedFuture(e);
        }
    }

    /**
     * Upload nhiều ảnh song song
     * 
     * @param files Danh sách file ảnh
     * @return CompletableFuture chứa danh sách URL đã upload
     */
    public CompletableFuture<List<String>> uploadImagesParallel(List<MultipartFile> files) {
        log.info("Starting parallel upload for {} images", files.size());

        List<CompletableFuture<String>> uploadFutures = new ArrayList<>();

        for (MultipartFile file : files) {
            CompletableFuture<String> future = uploadImageAsync(file);
            uploadFutures.add(future);
        }

        // Combine all futures
        return CompletableFuture.allOf(uploadFutures.toArray(new CompletableFuture[0]))
                .thenApply(v -> {
                    List<String> results = new ArrayList<>();
                    for (CompletableFuture<String> future : uploadFutures) {
                        try {
                            results.add(future.join());
                        } catch (Exception e) {
                            log.error("Failed to get upload result", e);
                            throw new RuntimeException("Failed to upload images", e);
                        }
                    }
                    log.info("Completed parallel upload for {} images", results.size());
                    return results;
                });
    }

    /**
     * Xóa nhiều ảnh song song
     * 
     * @param publicIds Danh sách public ID cần xóa
     * @return CompletableFuture<Void>
     */
    public CompletableFuture<Void> deleteImagesParallel(List<String> publicIds) {
        log.info("Starting parallel delete for {} images", publicIds.size());

        List<CompletableFuture<Void>> deleteFutures = new ArrayList<>();

        for (String publicId : publicIds) {
            CompletableFuture<Void> future = deleteImageAsync(publicId);
            deleteFutures.add(future);
        }

        // Combine all futures
        return CompletableFuture.allOf(deleteFutures.toArray(new CompletableFuture[0]))
                .thenRun(() -> log.info("Completed parallel delete for {} images", publicIds.size()));
    }
}
