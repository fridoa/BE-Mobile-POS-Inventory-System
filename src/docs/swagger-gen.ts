import swaggerAutogen from "swagger-autogen";
import dotenv from "dotenv";

dotenv.config();

const doc = {
  info: {
    title: "Mobile POS Inventory API",
    description: "API documentation for Mobile POS Inventory System.",
    version: "1.0.0",
  },
  servers: [
    {
      url: `http://localhost:${process.env.PORT || 8000}/api/v1`,
      description: "Local Development Server",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      Login: {
        username: "johndoe",
        password: "password123",
      },
      UpdateProfile: {
        name: "John Doe",
        email: "john@example.com",
        username: "johndoe",
      },
      ChangePassword: {
        oldPassword: "oldpassword",
        newPassword: "newpassword",
        confirmPassword: "newpassword",
      },
      Category: {
        name: "Beverages",
      },
      Product: {
        name: "Kopi Susu Gula Aren",
        basePrice: 15000,
        price: 18000,
        costPrice: 10000,
        stock: 50,
        minStock: 5,
        expiryDate: "2024-12-31",
        discount: 0,
        category: "64f8a1b2c3d4e5f6g7h8i9j0",
        imageUrl: "https://example.com/image.jpg",
        isActive: true,
        sku: "KHO-001",
      },
      Transaction: {
        payAmount: 50000,
        items: [
          {
            productId: "64f8a1b2c3d4e5f6g7h8i9j0",
            quantity: 2,
          },
        ],
      },
      User: {
        name: "John Doe",
        username: "johndoe",
        password: "password123",
        role: "kasir",
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
};

const outputFile = "./src/docs/swagger-output.json";
const endpointsFiles = ["./src/routes/api.ts"];

swaggerAutogen({ openapi: "3.0.0" })(outputFile, endpointsFiles, doc).then(() => {
    console.log("Swagger documentation generated successfully!");
    process.exit(0);
});
