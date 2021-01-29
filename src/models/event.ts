import moment from 'moment';
import Mongoose from 'mongoose';
import _ from 'lodash';
import Conversation from './conversation';

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

const addBatch = async (data: IEvent[]): Promise<boolean> => {
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

const _fillPeriod = (data: any, from: any, to: any, period: any, defaultValue: any) => {
  if (!period) {
    return null;
  }
  const momentPeriodFormat = _getPeriodFormat(period, 'moment');
  let fromPeriod = moment(from, DEFAULT_TIMEZONE);
  const toPeriod = moment(to, DEFAULT_TIMEZONE);

  let maxLoop = 2000;
  while (fromPeriod.isBefore(toPeriod)) {
    const key = fromPeriod.format(momentPeriodFormat);
    if (!data[key]) {
      data[key] = _.cloneDeep(defaultValue);
    }
    fromPeriod = fromPeriod.add(1, period).startOf(period);

    maxLoop -= 1;
    if (maxLoop < 0) {
      break;
    }
  }
  return data;
}

const _getEventAggregation = (from: any, to: any, slaId: any, periodFormat: any) => Event.aggregate([
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
]);

const _getByConversationAggregation = (from: any, to: any, slaId: any) => Event.aggregate([
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
            { 'init.data.eventAt': { $lt: to } },
          ],
        },
        {
          $and: [
            { 'init.data.eventAt': { $lt: from } },
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
]);

const getReport = async (
  from: Date,
  to: Date,
  period: string,
  slaId: number
) => {
  const periodFormat = _getPeriodFormat(period);
  const pastFrom = new Date(from.getTime() + from.getTime() - to.getTime());

  const [[{ byDayOfWeek, byCompliance }], byConversation, byConversationPast] = await Promise.all([
    _getEventAggregation(from, to, slaId, periodFormat),
    _getByConversationAggregation(from, to, slaId),
    _getByConversationAggregation(pastFrom, from, slaId),
  ]);

  const general = _calculateGeneralReport(byConversation);
  const generalPast = _calculateGeneralReport(byConversationPast);
  const groupedByCompliance = _groupByCompliance(byCompliance);
  const byAgent = _calculateByAgentReport(byConversation);
  const byPerformance = _calculateByPerformanceReport(byConversation);
  const byPerformancePast = _calculateByPerformanceReport(byConversationPast);

  return {
    general,
    generalPast,
    // byTime,
    byCompliance: groupedByCompliance,
    byDayOfWeek,
    byAgent,
    byPerformance,
    byPerformancePast,
  };
};

const _calculateByPerformanceReport = (byConversation: any) => {
  const total = _.size(byConversation);

  const firstBreached = _(byConversation)
    .filter(item => _.get(item, 'first.name') === 'SLA_BREACHED')
    .size();

  const nextBreached = _(byConversation)
    .filter(item => _.find(item.nexts, i => _.get(i, 'name') === 'SLA_BREACHED'))
    .size();

  const resolvedBreached = _(byConversation)
    .filter(item => _.get(item, 'resolved.name') === 'SLA_BREACHED')
    .size();

  return {
    first: {
      rate: total ? (total - firstBreached) / total : 0,
      breached: firstBreached,
      averageWaitingTime: firstBreached
        ? _.reduce(byConversation, (result, item) => result + _.get(item, 'first.data.minuteBreached', 0), 0) / firstBreached
        : 0,
    },
    next: {
      rate: total ? (total - nextBreached) / total : 0,
      breached: nextBreached,
      averageWaitingTime: nextBreached
        ? _.reduce(byConversation, (result, item) => result + _.reduce(item.nexts, (r, i) => r + _.get(i, 'data.minuteBreached', 0), 0), 0) / nextBreached
        : 0,
    },
    resolved: {
      rate: total ? (total - resolvedBreached) / total : 0,
      breached: resolvedBreached,
      averageWaitingTime: resolvedBreached
        ? _.reduce(byConversation, (result, item) => result + _.get(item, 'resolved.data.minuteBreached', 0), 0) / resolvedBreached
        : 0,
    },
  };
}

const _calculateGeneralReport = (byConversation: any) => {
  const total = _.size(byConversation);
  const breached = _(byConversation).filter(item => !item.hit).size();
  return {
    rate: total ? (total - breached) / total : null,
    total,
    breached,
  };
}

const _calculateByAgentReport = (byConversation: any) => {
  const conversationIds = _(byConversation)
    .map(item => item._id.conversationId)
    .uniq()
    .value();

  const conversations = Conversation.getByIds(conversationIds);

  const agents = [{ _id: 0 }, { _id: 1 }, { _id: 2 }, { _id: 3 }];

  const byAgent = _(byConversation)
    .groupBy(item => {
      return _.get(_.find(conversations, conversation => conversation._id === item._id.conversationId), 'assignedTo');
    })
    .mapValues(grouped => {
      const total = _.size(grouped);
      const breached = _(grouped).filter(item => !item.hit).size();
      return {
        rate: total ? (total - breached) / total : null,
        total,
        breached,
      };
    })
    .value();

  // map missing agents
  return _(agents)
    .keyBy('_id')
    .mapValues(item => {
      return byAgent[item._id] || {
        rate: 0,
        total: 0,
        breached: 0,
      };
    })
    .value();
}

const _groupByCompliance = (byCompliance: any) => {
  return byCompliance;
}

export default {
  addBatch,
  getReport,
};
