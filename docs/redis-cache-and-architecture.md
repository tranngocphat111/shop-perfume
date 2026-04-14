# Redis Cache & Layered Architecture

## 1. Redis Cache Dang Duoc Ap Dung

Project nay chua tung co cache layer, nen minh da them Redis qua Spring Cache cho cac du lieu doc nhieu, it thay doi.

### Cache namespaces

| Cache name | Du lieu duoc luu | TTL | Ghi chu |
|---|---|---:|---|
| `products` | `ProductService.findAll()`, `findById()`, `findBestSellers()`, `findByBrandId()`, `findByCategoryId()`, `getTotalSize()`, `getProductSummaries()` | 10 phut | Xoa cache khi tao/cap nhat/xoa product |
| `categories` | `CategoryService.findAll()`, `findById()` | 30 phut | Xoa cache khi tao/cap nhat/xoa category |
| `brands` | `BrandService.findAll()`, `findById()` | 30 phut | Xoa cache khi tao/cap nhat/xoa brand |
| `suppliers` | `SupplierService.findAll()`, `findById()` | 30 phut | Xoa cache khi tao/cap nhat/xoa supplier |

### Cach invalidation

- Khi thay doi product, cache `products` bi xoa het.
- Khi thay doi brand hoac category, cache cua chinh no va cache `products` deu bi xoa vi response product co long brand/category.
- Khi thay doi supplier, cache `suppliers` bi xoa het.

### Khong cache

- Page data co pagination/search phuc tap.
- Auth/JWT/refresh token flows.
- Order, dashboard, inventory luong dong manh.
- Email/SMTP/Google OAuth/Cloudinary/Sepay no rieng.

## 2. Redis Cau Hinh

Moi truong local dung mac dinh `127.0.0.1:6380`.
Moi truong production can set cac bien:

- `REDIS_HOST`
- `REDIS_PORT`
- `REDIS_PASSWORD`
- `REDIS_TIMEOUT`

Neu ban muon chay Redis bang Docker rieng de khong trung port voi project khac, dung:
- [server/docker-compose.redis.yml](../server/docker-compose.redis.yml)

Compose nay map:
- host `6380` -> container `6379`

Khi chay compose nay, dat:
- `REDIS_HOST=127.0.0.1`
- `REDIS_PORT=6380`

Cac cau hinh nam trong:
- [server/src/main/resources/application.properties](../server/src/main/resources/application.properties)
- [server/src/main/resources/application-prod.properties](../server/src/main/resources/application-prod.properties)

## 3. Layered Architecture Cua Project

### Tong quan

```mermaid
flowchart TB
    U[Users] --> FE[Client Frontend<br/>React + Vite]

    subgraph Frontend Layer
        FE --> FE_C1[Pages]
        FE --> FE_C2[Components]
        FE --> FE_C3[Contexts]
        FE --> FE_C4[Hooks]
        FE --> FE_C5[Services/API]
    end

    FE_C5 -->|HTTP REST /api| GW[Spring Boot Controllers]

    subgraph Backend Presentation Layer
        GW --> A1[AuthController]
        GW --> A2[ProductController]
        GW --> A3[CategoryController]
        GW --> A4[BrandController]
        GW --> A5[CartController]
        GW --> A6[OrderController]
        GW --> A7[InventoryController]
        GW --> A8[DashboardController]
        GW --> A9[SupplierController]
        GW --> A10[ContactController]
        GW --> A11[PaymentController]
        GW --> A12[SepayWebhookController]
        GW --> SEC[Security Filter Chain<br/>JWT / CustomUserDetailsService]
    end

    subgraph Application Layer
        S1[AuthService / AuthServiceImpl]
        S2[ProductService / ProductServiceImpl]
        S3[CategoryService / CategoryServiceImpl]
        S4[BrandService / BrandServiceImpl]
        S5[InventoryService / InventoryServiceImpl]
        S6[CartService / CartServiceImpl]
        S7[OrderService / OrderServiceImpl]
        S8[DashboardService / DashboardServiceImpl]
        S9[SupplierService / SupplierServiceImpl]
        S10[EmailService / EmailServiceImpl]
        S11[CloudinaryService]
        S12[CodAutoCompleteService]
    end

    subgraph Cache & Integration Layer
        R[Redis Cache]
        M[JavaMailSender<br/>Gmail SMTP]
        G[Google OAuth2 / Google ID Token]
        C[Cloudinary]
        P[Sepay / QR Payment]
        T[Thymeleaf Email Templates]
    end

    subgraph Persistence Layer
        REPO[Spring Data JPA Repositories]
        ENT[Entities<br/>User, Product, Order, Inventory, Brand, Category, Supplier, ...]
    end

    subgraph Data Layer
        DB[(MariaDB)]
    end

    SEC --> S1
    A1 --> S1
    A2 --> S2
    A3 --> S3
    A4 --> S4
    A5 --> S6
    A6 --> S7
    A7 --> S5
    A8 --> S8
    A9 --> S9
    A10 --> S10
    A11 --> S7
    A12 --> S7

    S1 --> G
    S1 --> T
    S1 --> M
    S2 --> R
    S3 --> R
    S4 --> R
    S9 --> R
    S2 --> REPO
    S3 --> REPO
    S4 --> REPO
    S5 --> REPO
    S6 --> REPO
    S7 --> REPO
    S8 --> REPO
    S9 --> REPO
    S10 --> T
    S10 --> M
    S11 --> C
    S12 --> REPO

    REPO --> ENT
    ENT --> DB

    S2 --> C
    S4 --> C
    S7 --> P
    S7 --> M
    S10 --> M
```

## 4. Giai thich tung layer

### Frontend Layer

- `pages`: cac man hinh chinh.
- `components`: UI reusable.
- `contexts`: auth/cart/search/filter state.
- `hooks`: business logic theo React hook.
- `services`: lop goi API sang backend.

### Backend Presentation Layer

- Controllers nhan request tu frontend.
- JWT filter va security chain kiem tra quyen truy cap.
- Controller chi lam nhiem vu dieu huong, khong chua business logic.

### Application Layer

- Day la noi nam business logic chinh.
- `AuthServiceImpl`: register/login/refresh token/reset password.
- `ProductServiceImpl`: product catalog va best seller.
- `CategoryServiceImpl`, `BrandServiceImpl`, `SupplierServiceImpl`: data danh muc.
- `InventoryServiceImpl`: ton kho.
- `OrderServiceImpl`: checkout, payment, webhook, order lifecycle.
- `EmailServiceImpl`: gui mail reset password, welcome, order confirmation, contact.

### Cache & Integration Layer

- Redis: cache du lieu doc nhieu.
- Gmail SMTP: gui email qua Spring Mail.
- Google OAuth: dang nhap Google.
- Cloudinary: upload/quan ly hinh anh.
- Sepay: thanh toan QR.
- Thymeleaf: render template email HTML.

### Persistence Layer

- Repository truy xuat database.
- Entity map truc tiep sang bang MariaDB.

### Data Layer

- MariaDB la nguon du lieu chinh.

## 5. Mermaid rieng de dan vao draw.io

```mermaid
flowchart TB
    U[Users] --> FE[Client Frontend\nReact + Vite]
    FE --> FE_C1[Pages]
    FE --> FE_C2[Components]
    FE --> FE_C3[Contexts]
    FE --> FE_C4[Hooks]
    FE --> FE_C5[Services/API]
    FE_C5 --> GW[Spring Boot Controllers\n/api]
    GW --> SEC[JWT Security Filter Chain]

    SEC --> S1[AuthServiceImpl]
    GW --> S2[ProductController -> ProductServiceImpl]
    GW --> S3[CategoryController -> CategoryServiceImpl]
    GW --> S4[BrandController -> BrandServiceImpl]
    GW --> S5[CartController -> CartServiceImpl]
    GW --> S6[OrderController -> OrderServiceImpl]
    GW --> S7[InventoryController -> InventoryServiceImpl]
    GW --> S8[DashboardController -> DashboardServiceImpl]
    GW --> S9[SupplierController -> SupplierServiceImpl]
    GW --> S10[ContactController -> EmailServiceImpl]
    GW --> S11[PaymentController / SepayWebhookController -> OrderServiceImpl]

    subgraph App[Application Layer]
        S1
        S2
        S3
        S4
        S5
        S6
        S7
        S8
        S9
        S10
    end

    subgraph Integrations[Cache & External Integrations]
        R[Redis Cache]
        M[JavaMailSender / Gmail SMTP]
        G[Google OAuth2]
        C[Cloudinary]
        P[Sepay QR Payment]
        T[Thymeleaf Email Templates]
    end

    subgraph Persist[Persistence Layer]
        REPO[Spring Data JPA Repositories]
        ENT[Entities]
        DB[(MariaDB)]
    end

    S1 --> G
    S1 --> T
    S1 --> M
    S2 --> R
    S3 --> R
    S4 --> R
    S9 --> R
    S2 --> REPO
    S3 --> REPO
    S4 --> REPO
    S5 --> REPO
    S6 --> REPO
    S7 --> REPO
    S8 --> REPO
    S9 --> REPO
    S10 --> T
    S10 --> M
    S2 --> C
    S4 --> C
    S6 --> P
    S10 --> M

    REPO --> ENT --> DB
```
