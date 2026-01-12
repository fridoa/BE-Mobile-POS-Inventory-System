import { Response } from "express";
import { IAuthRequest } from "../utils/interfaces";
import TransactionModel from "../models/transaction.model";
import { error, success } from "../utils/response";

export default {
  async getSalesSummary(req: IAuthRequest, res: Response) {
    try {
      const { startDate, endDate } = req.query;

      const start = startDate && !isNaN(Date.parse(startDate as string)) ? new Date(startDate as string) : new Date();
      start.setHours(0, 0, 0, 0);

      const end = endDate && !isNaN(Date.parse(endDate as string)) ? new Date(endDate as string) : new Date();
      end.setHours(23, 59, 59, 999);

      const summary = await TransactionModel.aggregate([
        {
          $match: {
            createdAt: { $gte: start, $lte: end },
          },
        },
        {
          $facet: {
            transactionStats: [
              {
                $group: {
                  _id: null,
                  totalRevenue: { $sum: "$totalAmount" },
                  totalTransactions: { $sum: 1 },
                },
              },
            ],
            itemStats: [
              { $unwind: "$items" },
              {
                $group: {
                  _id: null,
                  totalCost: {
                    $sum: { $multiply: ["$items.costPrice", "$items.quantity"] },
                  },
                },
              },
            ],
          },
        },
        {
          $project: {
            totalRevenue: { $arrayElemAt: ["$transactionStats.totalRevenue", 0] },
            totalTransactions: { $arrayElemAt: ["$transactionStats.totalTransactions", 0] },
            totalCost: { $arrayElemAt: ["$itemStats.totalCost", 0] },
          },
        },
        {
          $project: {
            totalRevenue: { $ifNull: ["$totalRevenue", 0] },
            totalTransactions: { $ifNull: ["$totalTransactions", 0] },
            totalCost: { $ifNull: ["$totalCost", 0] },
            netProfit: {
              $subtract: [{ $ifNull: ["$totalRevenue", 0] }, { $ifNull: ["$totalCost", 0] }],
            },
          },
        },
      ]);

      const data = summary[0] || {
        totalRevenue: 0,
        totalTransactions: 0,
        totalCost: 0,
        netProfit: 0,
      };

      success(res, data, "Sales summary fetched successfully");
    } catch (err) {
      error(res, err, "Failed to fetch sales summary");
    }
  },

  async getTopSellingProducts(req: IAuthRequest, res: Response) {
    try {
      const limit = Number(req.query.limit) || 5;
      const { startDate, endDate } = req.query;

      const matchStage: any = {};
      if (startDate || endDate) {
        const start = startDate ? new Date(startDate as string) : new Date();
        start.setHours(0, 0, 0, 0);

        const end = endDate ? new Date(endDate as string) : new Date();
        end.setHours(23, 59, 59, 999);

        matchStage.createdAt = { $gte: start, $lte: end };
      } else {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 30);

        matchStage.createdAt = { $gte: start, $lte: end };
      }

      const topProducts = await TransactionModel.aggregate([
        { $match: matchStage },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.productId",
            name: { $first: "$items.name" },
            totalQty: { $sum: "$items.quantity" },
            totalRevenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
          },
        },
        { $sort: { totalQty: -1 } },
        { $limit: limit },
      ]);

      success(res, topProducts, "Top selling products fetched successfully");
    } catch (err) {
      error(res, err, "Failed to fetch top selling products");
    }
  },
};
