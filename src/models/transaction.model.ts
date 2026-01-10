import mongoose from "mongoose";

export interface ITransactionItem {
  product_id: mongoose.Types.ObjectId;
  name: string;
  current_price: number;
  quantity: number;
  subtotal: number;
}

export interface ITransaction {
  _id?: mongoose.Types.ObjectId;
  transactionNumber?: string;
  totalAmount: number;
  payAmount: number;
  changeAmount: number;
  cashierId: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
  items: ITransactionItem[];
}

const TransactionSchema = new mongoose.Schema<ITransaction>({
  transactionNumber: { type: String, required: true, unique: true },
  totalAmount: { type: Number, required: true },
  payAmount: { type: Number, required: true },
  changeAmount: { type: Number, required: true },
  cashierId: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
  items: [
    {
      product_id: { type: mongoose.Types.ObjectId, required: true, ref: "Product" },
      name: { type: String, required: true },
      current_price: { type: Number, required: true },
      quantity: { type: Number, required: true },
      subtotal: { type: Number, required: true },
    },
  ],
});

const TransactionModel = mongoose.model<ITransaction>("Transaction", TransactionSchema);

export default TransactionModel;
