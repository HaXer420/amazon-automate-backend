const moment = require('moment');
///////////// For simple MOngoose : Find

exports.matchDateRangeSimple = (opt, varname, endopt) => {
  if (opt === 'thisMonth') {
    return [
      { [varname]: { $gte: new Date(new Date().setDate(1)) } },
      { [varname]: { $lt: new Date() } },
    ];
  }
  if (opt === 'lastYear') {
    return [
      {
        [varname]: { $gte: new Date(new Date().getFullYear() - 1, 0, 1) },
      },
      { [varname]: { $lt: new Date(new Date().getFullYear(), 0, 1) } },
    ];
  }
  if (opt === 'lastMonth') {
    return [
      {
        [varname]: {
          $gte: new Date(new Date().setMonth(new Date().getMonth() - 1)),
        },
      },
      { [varname]: { $lt: new Date(new Date().setDate(1)) } },
    ];
  }
  if (opt === 'thisWeek') {
    return [
      {
        [varname]: {
          $gte: new Date(
            new Date().setDate(new Date().getDate() - new Date().getDay())
          ),
        },
      },
      { [varname]: { $lt: new Date() } },
    ];
  }
  if (opt === 'thisYear') {
    return [
      {
        [varname]: {
          $gte: new Date(new Date().getFullYear(), 0, 1),
        },
      },
      { [varname]: { $lt: new Date() } },
    ];
  }
  if (opt === 'all') {
    return [];
  }
  if (opt === 'lastThirtyDays') {
    return [
      {
        [varname]: {
          $gte: new Date(new Date().setDate(new Date().getDate() - 30)),
        },
      },
      { [varname]: { $lt: new Date() } },
    ];
  }
  if (opt && (endopt != undefined || endopt != '' || endopt != null)) {
    const startDate = moment(`${opt}`, 'DD-MM-YYYY').toDate();
    const endDate = moment(`${endopt}`, 'DD-MM-YYYY').toDate();

    return [
      {
        [varname]: {
          $gte: new Date(startDate),
        },
      },
      { [varname]: { $lt: new Date(endDate) } },
    ];
  }
};

// exports.matchstartenddate(startopt, endopt, varname) {
//   return [
//     {
//       [varname]: {
//         $gte: new Date(startopt),
//       },
//     },
//     { [varname]: { $lt: new Date(endopt) } },
//   ];
// }

///////////////// For Aggregation

exports.matchDateRangeAggregation = (opt, varname, endopt) => {
  if (opt === 'thisMonth') {
    return {
      [varname]: {
        $gte: new Date(new Date().setDate(1)),
        $lt: new Date(),
      },
    };
  }
  if (opt === 'lastYear') {
    return {
      [varname]: {
        $gte: new Date(new Date().getFullYear() - 1, 0, 1),
        $lt: new Date(new Date().getFullYear(), 0, 1),
      },
    };
  }
  if (opt === 'lastMonth') {
    return {
      [varname]: {
        $gte: new Date(new Date().setMonth(new Date().getMonth() - 1)),
        $lt: new Date(new Date().setDate(1)),
      },
    };
  }
  if (opt === 'thisWeek') {
    return {
      [varname]: {
        $gte: new Date(
          new Date().setDate(new Date().getDate() - new Date().getDay())
        ),
        $lt: new Date(),
      },
    };
  }
  if (opt === 'thisYear') {
    return {
      [varname]: {
        $gte: new Date(new Date().getFullYear(), 0, 1),
        $lt: new Date(),
      },
    };
  }
  if (opt === 'all') {
    return {};
  }
  if (opt === 'lastThirtyDays') {
    return {
      [varname]: {
        $gte: new Date(new Date().setDate(new Date().getDate() - 30)),
        $lt: new Date(),
      },
    };
  }
  if (opt && (endopt != undefined || endopt != '' || endopt != null)) {
    const startDate = moment(`${opt}`, 'DD-MM-YYYY').toDate();
    const endDate = moment(`${endopt}`, 'DD-MM-YYYY').toDate();

    return {
      [varname]: {
        $gte: new Date(startDate),
        $lt: new Date(endDate),
      },
    };
  }
};

// exports.matchstartenddateAggregation = (startopt, endopt, varname) => {
//   return {
//     varname: {
//       $gte: new Date(startopt),
//       $lt: new Date(endopt),
//     },
//   };
// };
