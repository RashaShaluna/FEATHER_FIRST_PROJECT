const {getDateFilter} = require('../controllers/adminController');
const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const User = require('../models/userSchema');
const PDFDocument = require('pdfkit');
const {log} = require('console');
const ExcelJS = require('exceljs');

//pdf download
const downloadPdf = async (req, res) => {
  try {
    const { startDate, endDate, filterBy = 'all' } = req.query;
    const dateFilter = getDateFilter(filterBy, startDate, endDate);

    const orders = await Order.find({
      ...dateFilter,
      orderitems: { $elemMatch: { status: 'Delivered' } },
    })
      .sort({ orderDate: -1 })
      .populate({
        path: 'orderitems.productId', 
        model: Product,
      })
      .populate({
        path: 'userId',
        model: User,
      });

    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="sales-report.pdf"');

    doc.pipe(res);

    // Add Title
    doc.fontSize(10).text('Sales Report', { align: 'center' });
    doc.moveDown();

    // Table Header
    const tableHeader = [
      'Order Date',
      'Order ID',
      'User',
      'Product',
      'Quantity',
      'Price',
      'Payment Method',
      'Payment Status',
    ];

    const colWidths = [70,100, 80, 90,40, 60, 40, 60, 60];
    let y = doc.y;

    // Draw Table Header
    doc.fontSize(7).font('Helvetica-Bold');
    tableHeader.forEach((header, i) => {
      doc.text(header, 50 + colWidths.slice(0, i).reduce((a, b) => a + b, 0), y, {
        width: colWidths[i],
        align: 'center',
      });
    });
    doc.moveDown(2);

    doc.font('Helvetica').fontSize(9);
    orders.forEach((order) => {
      order.orderitems
        .filter((item) => item.status === 'Delivered')
        .forEach((item) => {
          const row = [
            order.orderDate.toLocaleDateString('en-GB'),
            order._id,
            order.userId.name || 'NA',
            item.productId.name || 'NA',
            item.originalQuantity,
            ` ${item.productPrice || 'NA'}`,
            order.paymentMethod === 'Cash on Delivery' ? 'COD' : order.paymentMethod || 'NA',
            order. paymentStatus || 'NA',
          ];

          y = doc.y;
          row.forEach((cell, i) => {
            doc.text(cell, 50 + colWidths.slice(0, i).reduce((a, b) => a + b, 0), y, {
              width: colWidths[i],
              align: 'center',
            });
          });
          doc.moveDown();
        });
    });

    doc.end();
  } catch (error) {
    console.error('Error in downloadSalesReport:', error);
    res.status(500).send('Error generating PDF');
  }
};

  

//excel download
const downloadExcel = async (req, res) => {
  try {
    const { startDate, endDate, filterBy = 'all' } = req.query;
    const dateFilter = getDateFilter(filterBy, startDate, endDate);

    // Find orders with at least one delivered item
    const orders = await Order.find({
      ...dateFilter,
      orderitems: { $elemMatch: { status: 'Delivered' } },
    })
      .sort({ orderDate: -1 })
      .populate({
        path: 'orderitems.productId', // Populate product details
        model: Product,
      })
      .populate({
        path: 'userId', // Populate user details
        model: User,
      });

    // Create workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sales Report');

    // Define columns
    worksheet.columns = [
      { header: 'Date', key: 'orderDate', width: 20 },
      { header: 'Order ID', key: 'orderId', width: 20 },
      { header: 'Total', key: 'totalAmount', width: 15 },
      { header: 'User Name', key: 'userName', width: 25 },
      { header: 'Product', key: 'product', width: 25 },
      { header: 'Price', key: 'price', width: 15 },
      { header: 'Quantity', key: 'quantity', width: 15 },
      { header: 'Payment Method', key: 'paymentMethod', width: 25 },
      { header: 'Payment Status', key: 'paymentStatus', width: 25 },
    ];

    // Add rows for delivered items only
    orders.forEach((order) => {
      const deliveredItems = order.orderitems.filter((item) => item.status === 'Delivered');

      // Add rows for delivered items
      deliveredItems.forEach((item) => {
        worksheet.addRow({
          orderDate: order.orderDate.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          }),
          orderId: order._id.toString(),
          totalAmount: order.orderPrice || 'NA',
          userName: order.userId.name || 'NA',
          product: item.productId.name || 'NA',
          price: item.productPrice || 'NA',
          quantity: item.originalQuantity || 0,
          paymentMethod: order.paymentMethod || 'NA',
          paymentStatus: item. paymentStatus || 'NA',
        });
      });
    });

    // Set response headers for Excel file download
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="sales-report.xlsx"'
    );

    // Write workbook to response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error generating Excel file:', error);
    res.status(500).send('Error generating Excel file');
  }
};

  
module.exports = {
    downloadPdf,
    downloadExcel
}