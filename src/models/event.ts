import Mongoose from 'mongoose';
import _ from 'lodash';

const DEFAULT_TIMEZONE = 'Asia/Ho_Chi_Minh';
const periodFormats = {
  hour: {
    db: '%d/%m/%Y %H',
    moment: 'DD/MM/YYYY HH',
  },
  week: {
    db: '%V %Y', // TODO: Check dbDatePeriodFormat - special case, don't change
    moment: 'W YYYY',
  },
  day: {
    db: '%d/%m/%Y',
    moment: 'DD/MM/YYYY',
  },
  month: {
    db: '%m/%Y',
    moment: 'MM/YYYY',
  },
  year: {
    db: '%Y',
    moment: 'YYYY',
  },
};

export interface IEvent {
  name: string;
  data: object;
}

const eventSchema = new Mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    data: {
      conversationId: Number,
      slaId: Number,
      slaUUID: Number,
      type: {
        type: String,
      },
      eventAt: Date,
      minuteBreached: Number,
    },
  },
  {
    timestamps: true,
  }
);

interface IEventDoc extends IEvent, Mongoose.Document {}

const Event = Mongoose.model<IEventDoc>('event', eventSchema);

const addBatch = async (data: Array<IEvent>): Promise<boolean> => {
  try {
    const res = await Promise.all(data.map((item) => Event.create(item)));
    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
};

const _getPeriodFormat = (period: string, type = 'db') => {
  return (
    _.get(periodFormats, [period, type]) || _.get(periodFormats, ['day', type])
  );
};

const _dbDatePeriodFormat = (inputField: string, periodFormat: string) => {
  if (periodFormat === '%V %Y') {
    return {
      $concat: [
        { $toString: { $isoWeek: inputField } },
        ' ',
        { $toString: { $isoWeekYear: inputField } },
      ],
    };
  }
  return {
    $dateToString: {
      date: inputField,
      format: periodFormat,
      timezone: DEFAULT_TIMEZONE,
    },
  };
};

const getReport = async (
  from: Date,
  to: Date,
  period: string,
  slaId: number
) => {
  const periodFormat = _getPeriodFormat(period);

  const eventAggregation = [
    {
      $match: {
        name: { $in: ['SLA_COMPLIED', 'SLA_BREACHED'] },
        'data.eventAt': { $gt: from, $lt: to },
        'data.slaId': slaId || { $ne: null },
      },
    },
    {
      $facet: {
        byDayOfWeek: [
          {
            $match: {
              // get violated events
              name: 'SLA_BREACHED',
            },
          },
          {
            $group: {
              _id: {
                dow: {
                  $dayOfWeek: {
                    date: '$data.eventAt',
                    timezone: DEFAULT_TIMEZONE,
                  },
                },
                h: {
                  $hour: { date: '$data.eventAt', timezone: DEFAULT_TIMEZONE },
                },
              },
              count: { $sum: 1 },
            },
          },
          {
            $project: {
              _id: 0,
              count: 1,
              dow: '$_id.dow',
              h: '$_id.h',
            },
          },
        ],
        byCompliance: [
          {
            $addFields: {
              period: _dbDatePeriodFormat('$data.eventAt', periodFormat),
            },
          },
          {
            $group: {
              _id: {
                period: '$period',
                type: '$data.type',
              },
              compliance: {
                $sum: {
                  $cond: [{ $eq: ['$name', 'SLA_COMPLIED'] }, 1, 0],
                },
              },
              total: { $sum: 1 },
            },
          },
          {
            $project: {
              _id: 0,
              period: '$_id.period',
              type: '$_id.type',
              rate: {
                $cond: [
                  { $eq: ['$total', 0] },
                  null,
                  { $divide: ['$compliance', '$total'] },
                ],
              },
            },
          },
        ],
      },
    },
  ];

  const byConversationAggreation = [
    {
      $match: {
        name: { $in: ['SLA_COMPLIED', 'SLA_BREACHED'] },
        'data.slaId': slaId || { $ne: null },
      },
    },
    {
      $group: {
        _id: {
          conversationId: '$data.conversationId',
          slaUUID: '$data.slaUUID',
        },
        init: {
          $push: {
            $cond: [
              { $eq: ['$data.type', 'SLA_INIT'] },
              { id: '$_id', name: '$name', data: '$data' },
              '$$REMOVE',
            ],
          },
        },
        resolved: {
          $push: {
            $cond: [
              { $eq: ['$data.type', 'SLA_RESOVLED'] },
              { id: '$_id', name: '$name', data: '$data' },
              '$$REMOVE',
            ],
          },
        },
        first: {
          $push: {
            $cond: [
              { $eq: ['$data.type', 'SLA_FIRST'] },
              { id: '$_id', name: '$name', data: '$data' },
              '$$REMOVE',
            ],
          },
        },
        nexts: {
          $push: {
            $cond: [
              { $eq: ['$data.type', 'SLA_NEXT'] },
              { id: '$_id', name: '$name', data: '$data' },
              '$$REMOVE',
            ],
          },
        },
      },
    },
    {
      $addFields: {
        init: { $arrayElemAt: ['$init', 0] },
        first: { $arrayElemAt: ['$first', 0] },
        resolved: { $arrayElemAt: ['$resolved', 0] },
      },
    },
    {
      $match: {
        $or: [
          {
            $and: [
              { 'init.data.eventAt': { $gte: from } },
              { 'init.data.eventAt': { $gt: to } },
            ],
          },
          {
            $and: [
              { 'init.data.eventAt': { $lt: to } },
              {
                $or: [
                  { 'resolved.data.eventAt': { $eq: null } },
                  { 'resolved.data.eventAt': { $gt: from } },
                ],
              },
            ],
          },
        ],
      },
    },
    {
      $addFields: {
        hit: {
          $and: [
            { $eq: ['$first.name', 'SLA_COMPLIED'] },
            { $eq: ['$resolved.name', 'SLA_COMPLIED'] },
            // next
            {
              $reduce: {
                input: '$nexts',
                initialValue: true,
                in: {
                  $and: ['$$value', { $eq: ['$$this.name', 'SLA_COMPLIED'] }],
                },
              },
            },
          ],
        },
      },
    },
  ];

  const [[{ byDayOfWeek, byCompliance }], byConversation] = await Promise.all([
    Event.aggregate(eventAggregation),
    Event.aggregate(byConversationAggreation),
  ]);

  const byPerformance = {
    first: {
      rate: !_.isEmpty(byConversation) ? _(byConversation)
        .filter(item => _.get(item, 'first.name') === 'SLA_COMPLIED')
        .size() / _.size(byConversation) : 0,
      breached:  _(byConversation)
        .filter(item => _.get(item, 'first.name') === 'SLA_BREACHED')
        .size(),
      averageWaitingTime: _.reduce(byConversation, (result, item) => result + _.get(item, 'first.data.minuteBreached', 0), 0),
    },
    next: {
      rate: !_.isEmpty(byConversation) ? _(byConversation)
        .filter(item => !_.find(item.nexts, i => _.get(i, 'name') === 'SLA_BREACHED'))
        .size() / _.size(byConversation) : 0,
      breached:  _(byConversation)
        .filter(item => _.find(item.nexts, i => _.get(i, 'name') === 'SLA_BREACHED'))
        .size(),
      averageWaitingTime: _.reduce(byConversation, (result, item) => result + _.reduce(item.nexts, (r, i) => r + _.get(i, 'data.minuteBreached', 0), 0), 0),
    },
    resolved: {
      rate: !_.isEmpty(byConversation) ? _(byConversation)
        .filter(item => _.get(item, 'resolved.name') === 'SLA_COMPLIED')
        .size() / _.size(byConversation) : 0,
      breached:  _(byConversation)
        .filter(item => _.get(item, 'resolved.name') === 'SLA_BREACHED')
        .size(),
      averageWaitingTime: _.reduce(byConversation, (result, item) => result + _.get(item, 'resolved.data.minuteBreached', 0), 0),
    },
  }

  const general = {
    rate: _(byConversation).filter(item => item.hit).size() / _.size(byConversation),
    conversationCount: _.size(byConversation),
    breached: _(byConversation).filter(item => !item.hit).size(),
  };

  return {
    general,
    // byTime,
    byCompliance,
    byDayOfWeek,
    // byAgent,
    byPerformance,
  };
};

export default {
  addBatch,
  getReport,
};
