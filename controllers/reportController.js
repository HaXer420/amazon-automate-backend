const moment = require('moment');
const Report = require('../models/reportModel');
const mongoose = require('mongoose');
const Product = require('../models/productsModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const Client = require('../models/clientModel');
const Purchase = require('../models/purchaseModel');

exports.createReport = catchAsync(async (req, res, next) => {
  // console.log(req.body);
  const { body } = req;

  // console.log(body);

  const client = await Client.findById(req.params.id);

  if (!client) return next(new AppError('Client not Found!', 404));

  let tempdate;

  const endofreport = body.length - 1;

  let startdatereport = body[0]['date/time'];
  const enddatereport = body[endofreport]['date/time'];

  // console.log(startdatereport, enddatereport);

  //   const checkreport = await Report.find({
  //     $and: [
  //       { client: req.params.id },
  //       { date_time: { $gte: startdatereport } },
  //       { date_time: { $lt: enddatereport } },
  //     ],
  //   });

  for (let i = 0; i < body.length; i++) {
    startdatereport = body[i]['date/time'];

    if (body[i].type === 'Order') {
      const product = await Product.findOne({
        $and: [{ client: req.params.id }, { sku: { $eq: body[i].sku } }],
      });

      if (!product) {
        return next(
          new AppError(
            `Product: ${body[i].sku}  not found in the system or may be not assigned to the Client. Please verify the SKU and upload the file again`,
            400
          )
        );
      }
    }

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

    if (!checkreport === undefined || !checkreport.length == 0) {
      return next(
        new AppError(`Report Date: ${startdatereport}  Already Exist!`, 400)
      );
    }

    // if (array[i].name === 'Jane') {
    //   console.log('Required thing found:', array[i]);
    //   break;
    // }
  }

  // body.map(async (report) => {
  //   startdatereport = report['date/time'];

  //   const checkreport = await Report.aggregate([
  //     {
  //       $match: {
  //         $expr: {
  //           $and: [
  //             { $gte: ['$date_time', new Date(startdatereport)] },
  //             // { $lte: ['$date_time', new Date(enddatereport)] },
  //             {
  //               $eq: ['$client', mongoose.Types.ObjectId(req.params.id)],
  //             },
  //           ],
  //         },
  //       },
  //     },
  //   ]);
  //   //   console.log(checkreport.length);

  //   if (!checkreport === undefined || !checkreport.length == 0)
  //     return next(
  //       new AppError(`Report Date: ${startdatereport}  Already Exist!`, 400)
  //     );
  // });

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
        const purchase = await Purchase.findOne({
          $and: [
            { client: req.params.id },
            { sku: report.sku },
            { remainingqty: { $gte: report.quantity * 1 } },
          ],
        });

        if (!purchase) {
          return next(
            new AppError(
              'Inventory either not found or lower then the quantity you updating!',
              400
            )
          );
        }

        if (purchase) {
          const qty = report.quantity === '' ? 0 : report.quantity * 1;

          purchase.soldqty = purchase.soldqty + qty;
          purchase.remainingqty = purchase.remainingqty - qty;
          purchase.updateAt = Date.now();
          purchase.soldqty >= purchase.quantity
            ? (purchase.status = 'Sold')
            : '',
            purchase.save();
        }

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

exports.totalsales = catchAsync(async (req, res, next) => {
  if (!req.query.dateRange && !(req.query.startDate && req.query.endDate)) {
    req.query.dateRange = 'all';
  }

  // console.log(req.query);

  /////////// for total sales

  const matchStage =
    req.query.dateRange === 'thisMonth'
      ? {
          $and: [
            { date_time: { $gte: new Date(new Date().setDate(1)) } },
            { date_time: { $lt: new Date() } },
            { type: 'Order' },
          ],
        }
      : req.query.dateRange === 'lastYear'
      ? {
          $and: [
            {
              date_time: { $gte: new Date(new Date().getFullYear() - 1, 0, 1) },
            },
            { date_time: { $lt: new Date(new Date().getFullYear(), 0, 1) } },
            { type: 'Order' },
          ],
        }
      : req.query.dateRange === 'lastMonth'
      ? {
          $and: [
            {
              date_time: {
                $gte: new Date(new Date().setMonth(new Date().getMonth() - 1)),
              },
            },
            { date_time: { $lt: new Date(new Date().setDate(1)) } },
            { type: 'Order' },
          ],
        }
      : req.query.dateRange === 'thisWeek'
      ? {
          $and: [
            {
              date_time: {
                $gte: new Date(
                  new Date().setDate(new Date().getDate() - new Date().getDay())
                ),
              },
            },
            { date_time: { $lt: new Date() } },
            { type: 'Order' },
          ],
        }
      : req.query.dateRange === 'thisYear'
      ? {
          $and: [
            {
              date_time: {
                $gte: new Date(new Date().getFullYear(), 0, 1),
              },
            },
            { date_time: { $lt: new Date() } },
            { type: 'Order' },
          ],
        }
      : req.query.dateRange === 'all'
      ? {
          $and: [{ type: 'Order' }],
        }
      : req.query.startDate && req.query.endDate
      ? {
          $and: [
            {
              date_time: {
                $gte: new Date(req.query.startDate),
              },
            },
            { date_time: { $lt: new Date(req.query.endDate) } },
            { type: 'Order' },
          ],
        }
      : {};

  const report = await Report.find(matchStage);

  let sales = 0;
  report.map((order) => {
    sales = sales + order.total * 1;
  });

  ////////////////////////////// For graph data

  const matchStagegraph =
    req.query.dateRange === 'thisMonth'
      ? {
          $match: {
            $expr: {
              $and: [
                { $gte: ['$date_time', new Date(new Date().setDate(1))] },
                { $lt: ['$date_time', new Date()] },
                { $eq: ['$type', 'Order'] },
              ],
            },
          },
        }
      : req.query.dateRange === 'lastYear'
      ? {
          $match: {
            $expr: {
              $and: [
                {
                  $gte: [
                    '$date_time',
                    new Date(new Date().getFullYear() - 1, 0, 1),
                  ],
                },
                {
                  $lt: ['$date_time', new Date(new Date().getFullYear(), 0, 1)],
                },
                { $eq: ['$type', 'Order'] },
              ],
            },
          },
        }
      : req.query.dateRange === 'lastMonth'
      ? {
          $match: {
            $expr: {
              $and: [
                {
                  $gte: [
                    '$date_time',
                    new Date(new Date().setMonth(new Date().getMonth() - 1)),
                  ],
                },
                { $lt: ['$date_time', new Date(new Date().setDate(1))] },
                { $eq: ['$type', 'Order'] },
              ],
            },
          },
        }
      : req.query.dateRange === 'thisWeek'
      ? {
          $match: {
            $expr: {
              $and: [
                {
                  $gte: [
                    '$date_time',
                    new Date(
                      new Date().setDate(
                        new Date().getDate() - new Date().getDay()
                      )
                    ),
                  ],
                },
                { $lt: ['$date_time', new Date()] },
                { $eq: ['$type', 'Order'] },
              ],
            },
          },
        }
      : req.query.dateRange === 'thisYear'
      ? {
          $match: {
            $expr: {
              $and: [
                {
                  $gte: [
                    '$date_time',
                    new Date(new Date().getFullYear(), 0, 1),
                  ],
                },
                { $lt: ['$date_time', new Date()] },
                { $eq: ['$type', 'Order'] },
              ],
            },
          },
        }
      : req.query.dateRange === 'all'
      ? {
          $match: {
            $expr: {
              $and: [{ $eq: ['$type', 'Order'] }],
            },
          },
        }
      : req.query.startDate && req.query.endDate
      ? {
          $match: {
            $expr: {
              $and: [
                { $gte: ['$date_time', new Date(req.query.startDate)] },
                { $lt: ['$date_time', new Date(req.query.endDate)] },
                { $eq: ['$type', 'Order'] },
              ],
            },
          },
        }
      : {};

  // const reportgraph = await Report.aggregate([
  //   matchStagegraph,
  //   {
  //     $sort: {
  //       date_time: 1,
  //     },
  //   },
  //   {
  //     $group: {
  //       _id: '$date_time',
  //       total: { $sum: '$total' },
  //     },
  //   },
  //   {
  //     $project: {
  //       date_time: '$_id',
  //       total: 1,
  //       _id: 0,
  //     },
  //   },
  // ]);

  const reportgraph = await Report.aggregate([
    matchStagegraph,
    {
      $sort: {
        date_time: 1,
      },
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: '%Y-%m-%d',
            date: '$date_time',
          },
        },
        total: { $sum: '$total' },
      },
    },
    {
      $project: {
        date_time: '$_id',
        total: 1,
        _id: 0,
      },
    },
  ]);

  const sortedReport = reportgraph.sort((a, b) => {
    return new Date(a.date_time) - new Date(b.date_time);
  });

  // console.log(sortedReport);

  // console.log(sales);

  res.status(200).json({
    status: 'Success',
    total: sales,
    graph: sortedReport,
  });
});

exports.totalprofit = catchAsync(async (req, res, next) => {
  if (!req.query.dateRange && !(req.query.startDate && req.query.endDate)) {
    req.query.dateRange = 'all';
  }

  // console.log(req.query);

  /////////// for total sales

  const matchStage =
    req.query.dateRange === 'thisMonth'
      ? {
          $and: [
            { date_time: { $gte: new Date(new Date().setDate(1)) } },
            { date_time: { $lt: new Date() } },
            { type: 'Order' },
          ],
        }
      : req.query.dateRange === 'lastYear'
      ? {
          $and: [
            {
              date_time: { $gte: new Date(new Date().getFullYear() - 1, 0, 1) },
            },
            { date_time: { $lt: new Date(new Date().getFullYear(), 0, 1) } },
            { type: 'Order' },
          ],
        }
      : req.query.dateRange === 'lastMonth'
      ? {
          $and: [
            {
              date_time: {
                $gte: new Date(new Date().setMonth(new Date().getMonth() - 1)),
              },
            },
            { date_time: { $lt: new Date(new Date().setDate(1)) } },
            { type: 'Order' },
          ],
        }
      : req.query.dateRange === 'thisWeek'
      ? {
          $and: [
            {
              date_time: {
                $gte: new Date(
                  new Date().setDate(new Date().getDate() - new Date().getDay())
                ),
              },
            },
            { date_time: { $lt: new Date() } },
            { type: 'Order' },
          ],
        }
      : req.query.dateRange === 'thisYear'
      ? {
          $and: [
            {
              date_time: {
                $gte: new Date(new Date().getFullYear(), 0, 1),
              },
            },
            { date_time: { $lt: new Date() } },
            { type: 'Order' },
          ],
        }
      : req.query.dateRange === 'all'
      ? {
          $and: [{ type: 'Order' }],
        }
      : req.query.startDate && req.query.endDate
      ? {
          $and: [
            {
              date_time: {
                $gte: new Date(req.query.startDate),
              },
            },
            { date_time: { $lt: new Date(req.query.endDate) } },
            { type: 'Order' },
          ],
        }
      : {};

  const report = await Report.find(matchStage);

  let totalcost = 0;
  let profit1 = 0;

  const filter1 = await Promise.all(
    report.map(async (object) => {
      const avgUnitCost = await Purchase.aggregate([
        {
          $match: { sku: object.sku },
        },
        {
          $group: {
            _id: null,
            avgUnitCost: { $avg: '$unitCost' },
          },
        },
      ]);
      totalcost = avgUnitCost[0].avgUnitCost * 1 * object.quantity * 1;
      let objprofit = object.total * 1 - totalcost * 1;
      profit1 = profit1 + objprofit;
      // console.log(profit);
    })
  );

  const filter1Graph = await Promise.all(
    report.map(async (object) => {
      const avgUnitCost = await Purchase.aggregate([
        {
          $match: { sku: object.sku },
        },
        {
          $group: {
            _id: '$date_time',
            avgUnitCost: { $avg: '$unitCost' },
          },
        },
      ]);
      return {
        date_time: moment(object.date_time).format('YYYY-MM-DD'),
        quantity: object.quantity * 1,
        // totalcost: avgUnitCost[0].avgUnitCost * 1 * object.quantity * 1,
        profit:
          object.total * 1 -
          avgUnitCost[0].avgUnitCost * 1 * object.quantity * 1,
      };
    })
  );

  const reducedGraph = filter1Graph.reduce((acc, cur) => {
    const dateIndex = acc.findIndex((el) => el.date_time === cur.date_time);
    if (dateIndex !== -1) {
      acc[dateIndex].quantity += cur.quantity;
      // acc[dateIndex].totalcost += cur.totalcost;
      acc[dateIndex].profit += cur.profit;
    } else {
      acc.push(cur);
    }
    return acc;
  }, []);

  const sortedFilter1Graph = reducedGraph.sort((a, b) => {
    return new Date(a.date_time) - new Date(b.date_time);
  });

  ////////// for deduction o refund, fee etc

  const matchStagededuction =
    req.query.dateRange === 'thisMonth'
      ? {
          $match: {
            $expr: {
              $and: [
                { $gte: ['$date_time', new Date(new Date().setDate(1))] },
                { $lt: ['$date_time', new Date()] },
                { $ne: ['$type', 'Order'] },
              ],
            },
          },
        }
      : req.query.dateRange === 'lastYear'
      ? {
          $match: {
            $expr: {
              $and: [
                {
                  $gte: [
                    '$date_time',
                    new Date(new Date().getFullYear() - 1, 0, 1),
                  ],
                },
                {
                  $lt: ['$date_time', new Date(new Date().getFullYear(), 0, 1)],
                },
                { $ne: ['$type', 'Order'] },
              ],
            },
          },
        }
      : req.query.dateRange === 'lastMonth'
      ? {
          $match: {
            $expr: {
              $and: [
                {
                  $gte: [
                    '$date_time',
                    new Date(new Date().setMonth(new Date().getMonth() - 1)),
                  ],
                },
                { $lt: ['$date_time', new Date(new Date().setDate(1))] },
                { $ne: ['$type', 'Order'] },
              ],
            },
          },
        }
      : req.query.dateRange === 'thisWeek'
      ? {
          $match: {
            $expr: {
              $and: [
                {
                  $gte: [
                    '$date_time',
                    new Date(
                      new Date().setDate(
                        new Date().getDate() - new Date().getDay()
                      )
                    ),
                  ],
                },
                { $lt: ['$date_time', new Date()] },
                { $ne: ['$type', 'Order'] },
              ],
            },
          },
        }
      : req.query.dateRange === 'thisYear'
      ? {
          $match: {
            $expr: {
              $and: [
                {
                  $gte: [
                    '$date_time',
                    new Date(new Date().getFullYear(), 0, 1),
                  ],
                },
                { $lt: ['$date_time', new Date()] },
                { $ne: ['$type', 'Order'] },
              ],
            },
          },
        }
      : req.query.dateRange === 'all'
      ? {
          $match: {
            $expr: {
              $and: [{ $ne: ['$type', 'Order'] }],
            },
          },
        }
      : req.query.startDate && req.query.endDate
      ? {
          $match: {
            $expr: {
              $and: [
                { $gte: ['$date_time', new Date(req.query.startDate)] },
                { $lt: ['$date_time', new Date(req.query.endDate)] },
                { $ne: ['$type', 'Order'] },
              ],
            },
          },
        }
      : {};

  const pipeline = [
    matchStagededuction,
    {
      $group: {
        _id: null,
        sumTotal: { $sum: '$total' },
      },
    },
  ];

  const result = await Report.aggregate(pipeline);
  // console.log(result[0].sumTotal);
  // console.log(result);
  result.length != 0 ? (profit1 = profit1 + result[0].sumTotal) : '';

  res.status(200).json({
    status: 'Success',
    total: profit1,
    graph: sortedFilter1Graph,
  });
});
