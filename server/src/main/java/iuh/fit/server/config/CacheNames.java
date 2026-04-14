package iuh.fit.server.config;

/**
 * Centralized cache names used by Spring Cache + Redis.
 */
public final class CacheNames {

    private CacheNames() {
    }

    public static final String PRODUCTS = "products";
    public static final String CATEGORIES = "categories";
    public static final String BRANDS = "brands";
    public static final String SUPPLIERS = "suppliers";
}