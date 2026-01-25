import { Response } from "express";
import { IAuthRequest } from "../utils/interfaces";
import TransactionModel from "../models/transaction.model";
import { error, pagination, success } from "../utils/response";
import mongoose from "mongoose";
import { diff } from "util";

export default {
  async getSalesSummary(req: IAuthRequest, res: Response) {
    try {
      const { startDate, endDate, cashierId } = req.query;
      const now = new Date();

      let start: Date;
      let end: Date;

      if (startDate && !isNaN(Date.parse(startDate as string))) {
        start = new Date(startDate as string);
      } else {
        const firstTransaction = await TransactionModel.findOne().sort({ createdAt: 1 }).select("createdAt");
        start = firstTransaction ? new Date(firstTransaction.createdAt ?? now) : now;
      }
      start.setHours(0, 0, 0, 0);

      if (endDate && !isNaN(Date.parse(endDate as string))) {
        end = new Date(endDate as string);
      } else {
        end = now;
      }
      end.setHours(23, 59, 59, 999);

      const diff = end.getTime() - start.getTime();
      const diffInDays = Math.ceil(diff / (1000 * 60 * 60 * 24));

      let prevStart: Date;
      let prevEnd: Date;

      if (diffInDays >= 27 && diffInDays <= 31) {
        prevStart = new Date(start.getFullYear(), start.getMonth() - 1, 1);
        prevEnd = new Date(start.getFullYear(), start.getMonth(), 0, 23, 59, 59, 999);
      } else {
        prevStart = new Date(start.getTime() - diff - 1);
        prevEnd = new Date(start.getTime() - 1);
      }

      const groupFormat = diffInDays > 31 ? "%Y-%m" : "%Y-%m-%d";

      const matchStage: any = { createdAt: { $gte: start, $lte: end } };
      if (cashierId && mongoose.Types.ObjectId.isValid(cashierId as string)) {
        matchStage.cashierId = new mongoose.Types.ObjectId(cashierId as string);
      }

      const [currentData, previousData] = await Promise.all([
        TransactionModel.aggregate([
          { $match: matchStage },
          {
            $facet: {
              transactionStats: [{ $group: { _id: null, totalRevenue: { $sum: "$totalAmount" }, totalTransactions: { $sum: 1 } } }],
              dailyStats: [
                {
                  $group: {
                    _id: { $dateToString: { format: groupFormat, date: "$createdAt", timezone: "Asia/Jakarta" } },
                    revenue: { $sum: "$totalAmount" },
                    count: { $sum: 1 },
                  },
                },
                { $sort: { _id: 1 } },
              ],
              itemStats: [{ $unwind: "$items" }, { $group: { _id: null, totalCost: { $sum: { $multiply: ["$items.costPrice", "$items.quantity"] } } } }],
            },
          },
          {
            $project: {
              totalRevenue: { $ifNull: [{ $arrayElemAt: ["$transactionStats.totalRevenue", 0] }, 0] },
              totalTransactions: { $ifNull: [{ $arrayElemAt: ["$transactionStats.totalTransactions", 0] }, 0] },
              totalCost: { $ifNull: [{ $arrayElemAt: ["$itemStats.totalCost", 0] }, 0] },
              dailyStats: 1,
            },
          },
        ]),

        TransactionModel.aggregate([{ $match: { ...matchStage, createdAt: { $gte: prevStart, $lte: prevEnd } } }, { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" } } }]),
      ]);

      const current = currentData[0] || { totalRevenue: 0, totalCost: 0, totalTransactions: 0, dailyStats: [] };
      const revenue = current.totalRevenue;
      const cost = current.totalCost;
      const prevRev = previousData[0]?.totalRevenue || 0;

      const revenueTrend = prevRev > 0 ? ((revenue - prevRev) / prevRev) * 100 : revenue > 0 ? 100 : 0;
      const netProfit = revenue - cost;
      const margin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

      const finalData = {
        totalRevenue: revenue,
        totalCost: cost,
        netProfit: netProfit,
        margin: Number((((revenue - (current.totalCost || 0)) / (revenue || 1)) * 100).toFixed(2)),
        revenueTrend: Number(revenueTrend.toFixed(2)),
        totalTransactions: current.totalTransactions,
        dailyStats: current.dailyStats || [],
      };

      return success(res, finalData, "Laporan penjualan berhasil dihitung");
    } catch (err) {
      return error(res, err, "Gagal menghitung laporan penjualan");
    }
  },

  async getTopSellingProducts(req: IAuthRequest, res: Response) {
    try {
      const limit = Number(req.query.limit) || 20;
      const page = Number(req.query.page) || 1;
      const skip = (page - 1) * limit;

      const { startDate, endDate, sortBy, order, search } = req.query;

      const matchStage: any = {};
      if (startDate || endDate) {
        const start = startDate ? new Date(startDate as string) : new Date();
        start.setHours(0, 0, 0, 0);
        const end = endDate ? new Date(endDate as string) : new Date();
        end.setHours(23, 59, 59, 999);
        matchStage.createdAt = { $gte: start, $lte: end };
      }
      if (search) {
        matchStage["items.name"] = { $regex: search, $options: "i" };
      }

      const sortField = (sortBy as string) || "totalQty";
      const sortOrder = order === "asc" ? 1 : -1;

      const performanceResult = await TransactionModel.aggregate([
        { $match: matchStage },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.productId",
            name: { $first: "$items.name" },
            totalQty: { $sum: "$items.quantity" },
            totalRevenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
            totalCost: { $sum: { $multiply: ["$items.costPrice", "$items.quantity"] } },
          },
        },
        {
          $addFields: {
            margin: {
              $cond: [{ $gt: ["$totalRevenue", 0] }, { $multiply: [{ $divide: [{ $subtract: ["$totalRevenue", "$totalCost"] }, "$totalRevenue"] }, 100] }, 0],
            },
          },
        },
        {
          $facet: {
            metadata: [{ $count: "total" }],

            data: [{ $sort: { [sortField]: sortOrder } }, { $skip: skip }, { $limit: limit }],
          },
        },
      ]);

      const result = performanceResult[0].data;
      const totalCount = performanceResult[0].metadata[0]?.total || 0;

      pagination(
        res,
        "Performa produk berhasil dianalisis",
        {
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
          currentPage: Number(page),
        },
        result,
      );
    } catch (err) {
      error(res, err, "Gagal menganalisis performa produk");
    }
  },
};
