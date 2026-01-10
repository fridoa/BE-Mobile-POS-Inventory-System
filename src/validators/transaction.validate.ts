import * as Yup from "yup";

export const transactionSchema = Yup.object().shape({
  payAmount: Yup.number().required("Jumlah pembayaran wajib diisi").min(0, "Pembayaran tidak boleh minus"),

  items: Yup.array()
    .of(
      Yup.object().shape({
        productId: Yup.string().required("ID Produk wajib ada"),
        quantity: Yup.number().required("Jumlah barang wajib diisi").min(1, "Minimal beli 1 barang"),
      })
    )
    .required("Daftar item wajib ada")
    .min(1, "Minimal harus ada 1 barang untuk checkout"),
});

export type TCreateTransactionInput = Yup.InferType<typeof transactionSchema>;
