package iuh.fit.server.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;


@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@lombok.ToString(exclude = {"product", "purchaseInvoice"})
public class PurchaseInvoiceDetail {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int purchaseInvoiceDetailId;

    private int quantity;
    private Double importPrice;
    private Double subTotal;

    @ManyToOne
    @JoinColumn(name = "product_id")
    private Product product;

    @ManyToOne
    @JoinColumn(name = "purchase_invoice_id")
    private PurchaseInvoice purchaseInvoice;


}
