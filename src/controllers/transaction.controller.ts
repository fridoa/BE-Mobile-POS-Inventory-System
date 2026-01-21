import { Response } from "express";
import { IAuthRequest, IPaginationQuery } from "../utils/interfaces";
import mongoose, { Types } from "mongoose";
import ProductModel from "../models/product.model";
import TransactionModel from "../models/transaction.model";
import { error, pagination, success } from "../utils/response";
import { ROLES } from "../utils/constants";
import { TCreateTransactionInput } from "../validators/transaction.validate";
import { notificationService } from "../services/notification.service";

export default {
  async create(req: IAuthRequest, res: Response) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { items, payAmount }: TCreateTransactionInput = req.body;
      const cashierId = req.user?._id;
      const lowStockProducts: string[] = [];
      let totalAmount = 0;
      let totalCostAmount = 0;
      const transactionItems = [];

      for (const item of items) {
        const product = await ProductModel.findOneAndUpdate({ _id: item.productId, isActive: true, stock: { $gte: item.quantity } }, { $inc: { stock: -item.quantity } }, { new: true, session });

        if (!product) {
          throw new Error(`Produk ${item.productId} tidak ditemukan atau stok tidak mencukupi`);
        }

        const discountAmount = (product.price * (product.discount || 0)) / 100;
        const finalPrice = product.price - discountAmount;
        const subTotal = finalPrice * item.quantity;

        totalAmount += subTotal;
        totalCostAmount += (product.costPrice || 0) * item.quantity;

        transactionItems.push({
          productId: product._id,
          name: product.name,
          price: finalPrice,
          costPrice: product.costPrice,
          quantity: item.quantity,
          subtotal: subTotal,
        });

        if (product.stock <= product.minStock) {
          lowStockProducts.push(product.name);
        }
      }

      if (payAmount < totalAmount) {
        throw new Error("Uang pembayaran tidak mencukupi");
      }

      const changeAmount = payAmount - totalAmount;

      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const randomSuffix = Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, "0");
      const transactionNumber = `TRX-${dateStr}-${Date.now().toString().slice(-4)}${randomSuffix}`;

      const result = await TransactionModel.create(
        [
          {
            transactionNumber,
            cashierId,
            items: transactionItems,
            totalAmount,
            totalProfit: totalAmount - totalCostAmount,
            payAmount,
            changeAmount,
          },
        ],
        { session },
      );

      await session.commitTransaction();
      session.endSession();

      if (lowStockProducts.length > 0) {
        notificationService.send({
          title: "Stok Menipis! ⚠️",
          message: `${lowStockProducts.length} produk hampir habis: ${lowStockProducts.slice(0, 2).join(", ")}${lowStockProducts.length > 2 ? "..." : ""}`,
          type: "WARNING",
          targetRole: ROLES.ADMIN,
          data: { type: "RESTOCK_SCREEN" },
        });
      }

      success(res, result[0], "Transaksi berhasil disimpan");
    } catch (err) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
      session.endSession();
      error(res, err, "Transaksi gagal diproses");
    }
  },

  async findAll(req: IAuthRequest, res: Response) {
    const { page = 1, limit = 10, startDate, endDate, search = "" } = req.query as unknown as IPaginationQuery;
    try {
      const query: any = {};

      if (req.user?.role === ROLES.KASIR) {
        query.cashierId = req.user._id;
      }

      if (search) {
        query.transactionNumber = { $regex: search, $options: "i" };
      }

      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);

        start.setHours(0, 0, 0, 0);

        end.setHours(23, 59, 59, 999);

        query.createdAt = {
          $gte: start,
          $lte: end,
        };
      }

      const [count, result] = await Promise.all([
        TransactionModel.countDocuments(query),
        TransactionModel.find(query)
          .populate("cashierId", "name username role")
          .skip((page - 1) * limit)
          .limit(limit)
          .sort({ createdAt: -1 })
          .exec(),
      ]);

      pagination(res, "Success fetching transactions", { total: count, totalPages: Math.ceil(count / limit), currentPage: Number(page) }, result);
    } catch (err) {
      error(res, err, "Failed to fetch transactions");
    }
  },

  async findOne(req: IAuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const result = await TransactionModel.findById(id).populate("cashierId", "name username role").exec();

      if (!result) {
        return error(res, null, "Transaction not found");
      }

      if (req.user?.role === ROLES.KASIR) {
        let transactionOwnerId: string;

        if (result.cashierId instanceof Types.ObjectId) {
          transactionOwnerId = result.cashierId.toString();
        } else {
          transactionOwnerId = (result.cashierId as { _id: Types.ObjectId })._id.toString();
        }

        if (transactionOwnerId !== req.user._id) {
          return error(res, null, "Anda tidak memiliki akses ke transaksi ini", 403);
        }
      }

      success(res, result, "Transaction fetched by id successfully");
    } catch (err) {
      error(res, err, "Failed to fetch transaction by id");
    }
  },
};
