const Report = require('../models/reportModel');
const mongoose = require('mongoose');
const Product = require('../models/productsModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const Client = require('../models/clientModel');

exports.createReport = catchAsync(async (req, res, next) => {
  const { body } = req;
  //   console.log(body);

  const client = await Client.findById(req.params.id);

  if (!client) return next(new AppError('Client not Found!', 404));

  let tempdate;

  const endofreport = body.length - 1;

  const startdatereport = body[0]['date/time'];
  const enddatereport = body[endofreport]['date/time'];

  console.log(startdatereport, enddatereport);

  //   const checkreport = await Report.find({
  //     $and: [
  //       { client: req.params.id },
  //       { date_time: { $gte: startdatereport } },
  //       { date_time: { $lt: enddatereport } },
  //     ],
  //   });

  const checkreport = await Report.aggregate([
    {
      $match: {
        $expr: {
          $and: [
            { $gte: ['$date_time', new Date(startdatereport)] },
            // { $lte: ['$date_time', new Date(enddatereport)] },
            {
              $eq: ['$client', mongoose.Types.ObjectId(req.params.id)],
            },
          ],
        },
      },
    },
  ]);
  //   console.log(checkreport.length);

  if (!checkreport === undefined || !checkreport.length == 0)
    return next(
      new AppError(`Report Date: ${startdatereport}  Already Exist!`, 400)
    );

  const newReports = await Promise.all(
    body.map(async (report) => {
      //   tempdate = report['date/time'];
      //   //   console.log(tempdate);
      //   const checkreport = await Report.find({
      //     $and: [{ client: req.params.id }, { date_time: { $eq: tempdate } }],
      //   });
      //   console.log(checkreport);
      //   if (checkreport) return;

      if (report.type === 'Order') {
        const product = await Product.findOne({
          $and: [{ client: req.params.id }, { sku: { $eq: report.sku } }],
        });
        if (!product) return;
        // console.log(product, report.sku);
        return {
          date_time: new Date(report['date/time']),
          settlement_id:
            report['settlement id'] === '' ? 0 : report['settlement id'] * 1,
          type: report.type,
          order_id: report['order id'],
          sku: report.sku,
          description: report.description,
          quantity: report.quantity === '' ? 0 : report.quantity * 1,
          marketplace: report.marketplace,
          account_type: report['account type'],
          fulfillment: report.fulfillment,
          order_city: report['order city'],
          order_state: report['order state'],
          order_postal: report['order postal'],
          tax_collection_model: report['tax collection model'],
          product_sales:
            report['product sales'] === '' ? 0 : report['product sales'] * 1,
          product_sales_tax:
            report['product sales tax'] === ''
              ? 0
              : report['product sales tax'] * 1,
          shipping_credits:
            report['shipping credits'] === ''
              ? 0
              : report['shipping credits'] * 1,
          shipping_credits_tax:
            report['shipping credits tax'] === ''
              ? 0
              : report['shipping credits tax'] * 1,
          gift_wrap_credits:
            report['gift wrap credits'] === ''
              ? 0
              : report['gift wrap credits'] * 1,
          giftwrap_credits_tax:
            report['giftwrap credits tax'] === ''
              ? 0
              : report['giftwrap credits tax'] * 1,
          Regulatory_Fee:
            report['Regulatory Fee'] === '' ? 0 : report['Regulatory Fee'] * 1,
          Tax_On_Regulatory_Fee:
            report['Tax On Regulatory Fee'] === ''
              ? 0
              : report['Tax On Regulatory Fee'] * 1,
          promotional_rebates:
            report['promotional rebates'] === ''
              ? 0
              : report['promotional rebates'] * 1,
          promotional_rebates_tax:
            report['promotional rebates tax'] === ''
              ? 0
              : report['promotional rebates tax'] * 1,
          marketplace_withheld_tax:
            report['marketplace withheld tax'] === ''
              ? 0
              : report['marketplace withheld tax'] * 1,
          selling_fees:
            report['selling fees'] === '' ? 0 : report['selling fees'] * 1,
          fba_fees: report['fba fees'] === '' ? 0 : report['fba fees'] * 1,
          other_transaction_fees:
            report['other transaction fees'] === ''
              ? 0
              : report['other transaction fees'] * 1,
          other:
            typeof report.other === 'string'
              ? Number(report.other.replace(/,/g, ''))
              : report.other * 1,
          total:
            typeof report.total === 'string'
              ? Number(report.total.replace(/,/g, ''))
              : report.total * 1,
          client: client.id || undefined,
          accountmanager: req.user.id,
          product: product ? product.id : undefined,
          specialist: product ? product.specialist.id : undefined,
          sourcemanager: product ? product.sourcemanager.id : undefined,
        };
      }
      return {
        date_time: new Date(report['date/time']),
        settlement_id:
          report['settlement id'] === '' ? 0 : report['settlement id'] * 1,
        type: report.type,
        order_id: report['order id'],
        sku: report.sku,
        description: report.description,
        quantity: report.quantity === '' ? 0 : report.quantity * 1,
        marketplace: report.marketplace,
        account_type: report['account type'],
        fulfillment: report.fulfillment,
        order_city: report['order city'],
        order_state: report['order state'],
        order_postal: report['order postal'],
        tax_collection_model: report['tax collection model'],
        product_sales:
          report['product sales'] === '' ? 0 : report['product sales'] * 1,
        product_sales_tax:
          report['product sales tax'] === ''
            ? 0
            : report['product sales tax'] * 1,
        shipping_credits:
          report['shipping credits'] === ''
            ? 0
            : report['shipping credits'] * 1,
        shipping_credits_tax:
          report['shipping credits tax'] === ''
            ? 0
            : report['shipping credits tax'] * 1,
        gift_wrap_credits:
          report['gift wrap credits'] === ''
            ? 0
            : report['gift wrap credits'] * 1,
        giftwrap_credits_tax:
          report['giftwrap credits tax'] === ''
            ? 0
            : report['giftwrap credits tax'] * 1,
        Regulatory_Fee:
          report['Regulatory Fee'] === '' ? 0 : report['Regulatory Fee'] * 1,
        Tax_On_Regulatory_Fee:
          report['Tax On Regulatory Fee'] === ''
            ? 0
            : report['Tax On Regulatory Fee'] * 1,
        promotional_rebates:
          report['promotional rebates'] === ''
            ? 0
            : report['promotional rebates'] * 1,
        promotional_rebates_tax:
          report['promotional rebates tax'] === ''
            ? 0
            : report['promotional rebates tax'] * 1,
        marketplace_withheld_tax:
          report['marketplace withheld tax'] === ''
            ? 0
            : report['marketplace withheld tax'] * 1,
        selling_fees:
          report['selling fees'] === '' ? 0 : report['selling fees'] * 1,
        fba_fees: report['fba fees'] === '' ? 0 : report['fba fees'] * 1,
        other_transaction_fees:
          report['other transaction fees'] === ''
            ? 0
            : report['other transaction fees'] * 1,
        other:
          typeof report.other === 'string'
            ? Number(report.other.replace(/,/g, ''))
            : report.other * 1,
        total:
          typeof report.total === 'string'
            ? Number(report.total.replace(/,/g, ''))
            : report.total * 1,
        client: client.id || undefined,
        accountmanager: req.user.id,
      };
    })
  );

  const filteredReports = newReports.filter(Boolean);

  //   console.log(filteredReports.length);

  const reports = await Report.create(filteredReports);

  res.status(201).json({
    size: filteredReports.length,
    filteredReports,
  });
});
