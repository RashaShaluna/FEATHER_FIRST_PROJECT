const { getDateFilter } = require("../controllers/adminController");
const { setOfferPrice } = require("../controllers/offerController");
const Order = require("../models/orderModel");
const Product = require("../models/productModel");
const User = require("../models/userSchema");
const PDFDocument = require("pdfkit");
const { log } = require("console");
const ExcelJS = require("exceljs");
const cron = require("node-cron");
const Category = require("../models/category");

//pdf download
const downloadPdf = async (req, res) => {
  try {
    const { startDate, endDate, filterBy = "all" } = req.query;
    const dateFilter = getDateFilter(filterBy, startDate, endDate);

    const orders = await Order.find({
      ...dateFilter,
      orderitems: { $elemMatch: { status: "Delivered" } },
    })
      .sort({ orderDate: -1 })
      .populate({
        path: "orderitems.productId",
        model: Product,
      })
      .populate({
        path: "userId",
        model: User,
      });

    const doc = new PDFDocument();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="sales-report.pdf"'
    );

    doc.pipe(res);

    // Add Title
    doc.fontSize(10).text("Sales Report", { align: "center" });
    doc.moveDown();

    // Table Header
    const tableHeader = [
      "Order Date",
      "Order ID",
      "User",
      "Product",
      "Quantity",
      "Price",
      "Payment Method",
      "Payment Status",
    ];

    const colWidths = [70, 100, 80, 90, 40, 60, 40, 60, 60];
    let y = doc.y;

    // Draw Table Header
    doc.fontSize(7).font("Helvetica-Bold");
    tableHeader.forEach((header, i) => {
      doc.text(
        header,
        50 + colWidths.slice(0, i).reduce((a, b) => a + b, 0),
        y,
        {
          width: colWidths[i],
          align: "center",
        }
      );
    });
    doc.moveDown(2);

    doc.font("Helvetica").fontSize(9);
    orders.forEach((order) => {
      order.orderitems
        .filter((item) => item.status === "Delivered")
        .forEach((item) => {
          const row = [
            order.orderDate.toLocaleDateString("en-GB"),
            order._id,
            order.userId.name || "NA",
            item.productId.name || "NA",
            item.originalQuantity,
            ` ${item.productPrice || "NA"}`,
            order.paymentMethod === "Cash on Delivery"
              ? "COD"
              : order.paymentMethod || "NA",
            order.paymentStatus || "NA",
          ];

          y = doc.y;
          row.forEach((cell, i) => {
            doc.text(
              cell,
              50 + colWidths.slice(0, i).reduce((a, b) => a + b, 0),
              y,
              {
                width: colWidths[i],
                align: "center",
              }
            );
          });
          doc.moveDown();
        });
    });

    doc.end();
  } catch (error) {
    console.error("Error in downloadSalesReport:", error);
    res.status(500).send("Error generating PDF");
  }
};

//excel download
const downloadExcel = async (req, res) => {
  try {
    const { startDate, endDate, filterBy = "all" } = req.query;
    const dateFilter = getDateFilter(filterBy, startDate, endDate);

    const orders = await Order.find({
      ...dateFilter,
      orderitems: { $elemMatch: { status: "Delivered" } },
    })
      .sort({ orderDate: -1 })
      .populate({
        path: "orderitems.productId",
        model: Product,
      })
      .populate({
        path: "userId",
        model: User,
      });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sales Report");

    worksheet.columns = [
      { header: "Date", key: "orderDate", width: 20 },
      { header: "Order ID", key: "orderId", width: 20 },
      { header: "Total", key: "totalAmount", width: 15 },
      { header: "User Name", key: "userName", width: 25 },
      { header: "Product", key: "product", width: 25 },
      { header: "Price", key: "price", width: 15 },
      { header: "Quantity", key: "quantity", width: 15 },
      { header: "Payment Method", key: "paymentMethod", width: 25 },
      { header: "Payment Status", key: "paymentStatus", width: 25 },
    ];

    orders.forEach((order) => {
      const deliveredItems = order.orderitems.filter(
        (item) => item.status === "Delivered"
      );

      deliveredItems.forEach((item) => {
        worksheet.addRow({
          orderDate: order.orderDate.toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          }),
          orderId: order._id.toString(),
          totalAmount: order.orderPrice || "NA",
          userName: order.userId.name || "NA",
          product: item.productId.name || "NA",
          price: item.productPrice || "NA",
          quantity: item.originalQuantity || 0,
          paymentMethod: order.paymentMethod || "NA",
          paymentStatus: item.paymentStatus || "NA",
        });
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="sales-report.xlsx"'
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error generating Excel file:", error);
    res.status(500).send("Error generating Excel file");
  }
};

//invoice
const invoicePDF = async (req, res) => {
  try {
    const { orderId } = req.query;
    const order = await Order.findById(orderId).populate({
      path: "orderitems.productId",
      model: Product,
    });
    log(order);

    if (!order) {
      return res.status(404).send("Order not found");
    }
    log("1");
    // Filter only delivered items with matching tracking number
    const deliveredItems = order.orderitems.filter(
      (item) => item.status === "Delivered"
    );
    log("1");

    if (deliveredItems.length === 0) {
      return res
        .status(400)
        .send(
          "No delivered items for this order with the given tracking number"
        );
    }

    console.log("deliveredItems", deliveredItems);
    log("1");

    // Create a PDF document
    const doc = new PDFDocument();
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=invoice-${order.orderId}.pdf`
    );
    res.setHeader("Content-Type", "application/pdf");
    doc.pipe(res);
    log("1");

    // Header of the invoice
    doc.fontSize(20).text("Invoice", { align: "center" });
    doc.text("---------------------------------------------");
    doc.fontSize(12).text(`Order ID: ${order.orderId}`);
    doc.text(
      `Order Date: ${new Date(order.orderDate).toLocaleDateString("en-GB")}`
    );
    // doc.text(`Delivery Date: ${new Date(order.deliveryDate).toLocaleDateString('en-GB')}`);
    doc.text("---------------------------------------------");

    // Adding product details
    deliveredItems.forEach((item) => {
      doc.text(`Product: ${item.productId.name}`, { continued: true });
      doc.text(` | Quantity: ${item.originalQuantity}`, { continued: true });
      doc.text(` | Unit Price: ₹${item.unitPrice}`);
      doc.text("---------------------------------------------");
    });

    // Add totals
    const totalAmount = deliveredItems.reduce(
      (sum, item) => sum + item.originalQuantity * item.unitPrice,
      0
    );
    doc.text(
      `Delivery Charge: ${
        order.deliveryCharge ? `₹${order.deliveryCharge}` : "Free Delivery"
      }`,
      { align: "right" }
    );
    doc.text(`Final Total: ₹${order.orderPrice}`, { align: "right" });

    // Payment Details
    doc.text("---------------------------------------------");
    doc.text(`Payment Method: ${order.paymentMethod}`, { align: "left" });
    doc.text(`Payment Status: ${order.paymentStatus}`, { align: "left" });

    // Footer
    doc.text("---------------------------------------------");
    doc.text("Thank you for shopping with us!", { align: "center" });

    doc.end(); // End the PDF document
  } catch (error) {
    console.log(error);
    res.status(500).send("Error generating invoice PDF");
  }
};

//------------[node -scheduler] for scheduling the date ---------
const dateScheduler = () => {
  // Run every minute - using '* * * * *'
  cron.schedule(
    "* * * * *",
    async () => {
      try {
        const currentDate = new Date();
        log("scheduled job started at:", currentDate);

        // Add index check to ensure all documents are found
        const [productsToActive, productsToDeactive] = await Promise.all([
          Product.find(
            {
              offerStartDate: { $lte: currentDate },
              offerEndDate: { $gte: currentDate },
              isOfferActive: false,
            },
            "_id isOfferActive"
          ).exec(), // Using exec() for better promise handling

          Product.find(
            {
              offerEndDate: { $lte: currentDate },
              isOfferActive: true,
            },
            "_id isOfferActive"
          ).exec(),
        ]);

        // Activate products
        for (const product of productsToActive) {
          try {
            await Promise.all([
              Product.updateOne(
                { _id: product._id },
                { $set: { isOfferActive: true } }
              ),
              setOfferPrice(product._id),
            ]);
            log(`Activated offer for product with ID ${product._id}`);
          } catch (err) {
            log(`Error activating product ${product._id}:`, err);
          }
        }

        // Deactivate products
        for (const product of productsToDeactive) {
          try {
            await Promise.all([
              Product.updateOne(
                { _id: product._id },
                { $set: { isOfferActive: false } }
              ),
              setOfferPrice(product._id),
            ]);
            log(`Deactivated offer for product with ID ${product._id}`);
          } catch (err) {
            log(`Error deactivating product ${product._id}:`, err);
          }
        }

        //======================= category ==================
        const [categoriesToActive, categoriesToDeactive] = await Promise.all([
          Category.find(
            {
              offerStartDate: { $lte: currentDate },
              offerEndDate: { $gte: currentDate },
              isOfferActive: false,
            },
            "_id isOfferActive"
          ).exec(),

          Category.find(
            {
              offerEndDate: { $lte: currentDate },
              isOfferActive: true,
            },
            "_id isOfferActive"
          ).exec(),
        ]);

        // Activate categories
        for (const category of categoriesToActive) {
          try {
            await Category.updateOne(
              { _id: category._id },
              { $set: { isOfferActive: true } }
            );
            log(`Activated offer for category with ID ${category._id}`);

            const products = await Product.find(
              { category: category._id },
              "_id"
            );
            await Promise.all(
              products.map((product) => setOfferPrice(product._id))
            );
          } catch (err) {
            log(`Error activating category ${category._id}:`, err);
          }
        }

        // Deactivate categories
        for (const category of categoriesToDeactive) {
          try {
            await Category.updateOne(
              { _id: category._id },
              { $set: { isOfferActive: false } }
            );
            log(`Deactivated offer for category with ID ${category._id}`);

            const products = await Product.find(
              { category: category._id },
              "_id"
            );
            await Promise.all(
              products.map((product) => setOfferPrice(product._id))
            );
          } catch (err) {
            log(`Error deactivating category ${category._id}:`, err);
          }
        }

        log("scheduled job done at:", new Date());
      } catch (error) {
        log("Main scheduler error:", error);
      }
    },
    {
      scheduled: true,
      timezone: "Asia/Kolkata", // Add your timezone here
    }
  );
};

// dateScheduler();
// dateScheduler(); //invoking that func

module.exports = {
  downloadPdf,
  downloadExcel,
  dateScheduler,
  invoicePDF,
};
