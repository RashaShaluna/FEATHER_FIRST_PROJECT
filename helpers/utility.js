const { getDateFilter } = require("../controllers/adminController");
const Order = require("../models/orderModel");
const Product = require("../models/productModel");
const User = require("../models/userSchema");
const PDFDocument = require("pdfkit");
const { log } = require("console");
const ExcelJS = require("exceljs");
const Address = require("../models/addressModel");

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

    const colWidths = [70, 100, 80, 90, 40, 60, 60, 60];
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

    // Initialize summary variables
    let totalOrders = 0;
    let totalQuantity = 0;
    let totalPrice = 0;

    doc.font("Helvetica").fontSize(9);
    orders.forEach((order) => {
      let orderTotalPrice = 0;
      let orderTotalQuantity = 0;
      let hasDeliveredItems = false;

      order.orderitems
        .filter((item) => item.status === "Delivered")
        .forEach((item) => {
          hasDeliveredItems = true;
          totalQuantity += item.originalQuantity;
          orderTotalQuantity += item.originalQuantity;
          orderTotalPrice += item.productPrice * item.originalQuantity;
          totalPrice += item.productPrice * item.originalQuantity;

          const row = [
            order.orderDate.toLocaleDateString("en-GB"),
            order._id,
            order.userId ? order.userId.name : "NA",
            item.productId ? item.productId.name : "NA",
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
          doc.moveDown(1.5);
        });

      if (hasDeliveredItems) {
        totalOrders += 1;
      }
    });

    doc.moveDown(2);

    // Add a horizontal line before summary
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();

    doc.moveDown(1);

    // Order Summary Row
    doc.fontSize(10).font("Helvetica-Bold");

    doc.text(`Total Orders : ${totalOrders}`, 50, doc.y);
    doc.moveDown();
    doc.text(`Total Quantity : ${totalQuantity}`, 50, doc.y);
    doc.moveDown();
    doc.text(`Order Price : ₹${totalPrice.toFixed(2)}`, 50, doc.y);

    doc.end();
  } catch (error) {
    console.error("Error in downloadSalesReport:", error);
    res.redirect("/serverError");
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

    let totalOrders = 0;
    let totalQuantity = 0;
    let totalPrice = 0;

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
          userName: order.userId ? order.userId.name : "NA",
          product: item.productId ? item.productId.name : "NA",
          price: item.productPrice || "NA",
          quantity: item.originalQuantity || 0,
          paymentMethod: order.paymentMethod || "NA",
          paymentStatus: item.paymentStatus || "NA",
        });
        totalOrders += 1;
        totalQuantity += item.originalQuantity || 0;
        totalPrice += item.productPrice || 0;
      });
    });

    worksheet.addRow({});

    // Add Summary Rows
    worksheet.addRow(["Order Summary"]);
    worksheet.addRow(["Total Orders", totalOrders]);
    worksheet.addRow(["Total Quantity", totalQuantity]);
    worksheet.addRow(["Total Price", `₹${totalPrice.toFixed(2)}`]);

    // Apply Bold Styling to Summary Headers
    const summaryStartRow = worksheet.rowCount - 3;
    for (let i = summaryStartRow; i <= worksheet.rowCount; i++) {
      worksheet.getRow(i).font = { bold: true };
    }

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
    const { orderCode } = req.query;
    const order = await Order.findOne({ orderCode: orderCode })
      .populate({
        path: "userId",
        model: User,
      })
      .populate({
        path: "orderitems.productId",
        model: Product,
      })
      .populate({
        path: "address",
        model: Address,
      });

    if (!order) {
      return res.status(404).send("Order not found");
    }

    // Filter only delivered items
    const deliveredItems = order.orderitems.filter(
      (item) => item.status === "Delivered"
    );

    if (deliveredItems.length === 0) {
      return res.status(400).send("No delivered items available for invoice.");
    }

    // Set response headers
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=invoice-${order.orderCode}.pdf`
    );
    res.setHeader("Content-Type", "application/pdf");

    // Create a PDF document
    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);

    // ---- HEADER ----
    doc
      .fontSize(22)
      .text("INVOICE", { align: "center", underline: true })
      .moveDown();

    // ---- USER DETAILS ----
    doc.fontSize(14).text(`User Name: ${order.userId.name}`, { align: "left" });
    doc
      .fontSize(14)
      .text(`Customer Name: ${order.address.name}`)
      .text(`Mobile: ${order.address.phone}`)
      .text(`Alternate Mobile: ${order.address.alternatePhone}`)
      .text(`Address: ${order.address.address}`)
      .text(`Locality: ${order.address.locality}`)
      .text(`District: ${order.address.district}`)
      .text(`State: ${order.address.state}`)
      .text(`Pincode: ${order.address.pincode}`)
      .text(`Landmark: ${order.address.landmark || " "}`)
      .moveDown();

    // .moveDown();

    // ---- ORDER DETAILS ----
    doc
      .text(`Order ID: ${order.orderCode}`, { align: "left" })
      .text(
        `Order Date: ${new Date(order.orderDate).toLocaleDateString("en-GB")}`,
        { align: "left" }
      )
      .text("---------------------------------------------")
      .moveDown();

    // ---- PRODUCT DETAILS ----
    doc
      .fontSize(12)
      .text("Ordered Products:", { align: "left", underline: true });

    deliveredItems.forEach((item, index) => {
      doc
        .text(`${index + 1}. Product: ${item.productId.name}`)
        .text(`   - Quantity: ${item.originalQuantity}`)
        .text(`   - Unit Price: ${item.unitPrice}`)
        .text("---------------------------------------------");
    });

    // ---- TOTAL COST ----

    doc
      .fontSize(14)
      .text(
        `Delivery Charge: ${
          order.deliveryCharge ? `${order.deliveryCharge}` : "Free Delivery"
        }`,
        { align: "right" }
      )
      .text(`Final Total: ${order.orderPrice}`, { align: "right" })
      .moveDown();

    // ---- PAYMENT DETAILS ----
    doc
      .text(`Payment Method: ${order.paymentMethod}`, { align: "left" })
      .text(`Payment Status: ${order.paymentStatus}`, { align: "left" })
      .moveDown();

    // ---- FOOTER ----
    doc
      .moveDown()
      .text("Thank you for shopping with us!", { align: "center" })
      .moveDown();

    doc.end(); // Finalize the PDF document
  } catch (error) {
    console.error(error);
    res.redirect("serverError");
  }
};

module.exports = {
  downloadPdf,
  downloadExcel,
  invoicePDF,
};
