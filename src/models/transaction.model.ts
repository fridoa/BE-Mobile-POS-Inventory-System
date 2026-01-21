import mongoose from "mongoose";

export interface ITransactionItem {
  productId: mongoose.Types.ObjectId;
  name: string;
  price: number;
  costPrice: number;
  quantity: number;
  subtotal: number;
  discount?: number;
}

export interface ITransaction {
  _id?: mongoose.Types.ObjectId;
  transactionNumber: string;
  totalAmount: number;
  totalProfit: number;
  payAmount: number;
  changeAmount: number;
  cashierId: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
  items: ITransactionItem[];
}

const TransactionSchema = new mongoose.Schema<ITransaction>(
  {
    transactionNumber: { type: String, required: true, unique: true },
    totalAmount: { type: Number, required: true },
    totalProfit: { type: Number, required: true, default: 0 },
    payAmount: { type: Number, required: true },
    changeAmount: { type: Number, required: true },
    cashierId: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
    items: [
      {
        productId: { type: mongoose.Types.ObjectId, required: true, ref: "Product" },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        costPrice: { type: Number, required: true },
        quantity: { type: Number, required: true },
        subtotal: { type: Number, required: true },
        discount: { type: Number, default: 0 },
      },
    ],
  },
  { timestamps: true },
);

TransactionSchema.index({ createdAt: 1 });

const TransactionModel = mongoose.model<ITransaction>("Transaction", TransactionSchema);

export default TransactionModel;
