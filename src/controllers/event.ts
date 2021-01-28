import { Request, Response } from 'express';
import Event, { IEvent } from '../models/event';

const getReport = (request: Request, response: Response) => {
  const { from, to, period, sla } = request.body;
  const fromDate = new Date(from);
  const toDate = new Date(to);
  Event.getReport(fromDate, toDate, period, sla)
    .then(result => response.json(result))
    .catch(err => response.json(err));
}

const insertTestData = (request: Request, response: Response) => {
  const testData: Array<IEvent> = [
    {
      "name" : "SLA_COMPLIED",
      "data" : {
        "conversationId" : 1,
        "slaId" : 1,
        "slaUUID" : 111,
        "type" : "SLA_INIT",
        "eventAt": new Date("2020-01-28 12:00:00"),
      },
    },
    {
      "name" : "SLA_COMPLIED",
      "data" : {
        "conversationId" : 1,
        "slaId" : 1,
        "slaUUID" : 111,
        "type" : "SLA_FIRST",
        "eventAt": new Date("2020-01-28 12:01:00"),
      },
    },
    {
      "name" : "SLA_COMPLIED",
      "data" : {
        "conversationId" : 1,
        "slaId" : 1,
        "slaUUID" : 111,
        "type" : "SLA_NEXT",
        "eventAt": new Date("2020-01-28 12:02:00"),
      },
    },
    {
      "name" : "SLA_COMPLIED",
      "data" : {
        "conversationId" : 1,
        "slaId" : 1,
        "slaUUID" : 111,
        "type" : "SLA_RESOVLED",
        "eventAt": new Date("2020-01-28 12:03:00"),
      },
    },
    {
      "name" : "SLA_COMPLIED",
      "data" : {
        "conversationId" : 2,
        "slaId" : 1,
        "slaUUID" : 112,
        "type" : "SLA_INIT",
        "eventAt": new Date("2020-01-26 12:00:00"),
      },
    },
    {
      "name" : "SLA_BREACHED",
      "data" : {
        "conversationId" : 2,
        "slaId" : 1,
        "slaUUID" : 112,
        "type" : "SLA_FIRST",
        "eventAt": new Date("2020-01-26 12:05:00"),
        "minuteBreached": 3,
      },
    },
    {
      "name" : "SLA_COMPLIED",
      "data" : {
        "conversationId" : 2,
        "slaId" : 1,
        "slaUUID" : 112,
        "type" : "SLA_NEXT",
        "eventAt": new Date("2020-01-26 12:07:00"),
      },
    },
    {
      "name" : "SLA_COMPLIED",
      "data" : {
        "conversationId" : 2,
        "slaId" : 1,
        "slaUUID" : 112,
        "type" : "SLA_RESOVLED",
        "eventAt": new Date("2020-01-26 12:10:00"),
      },
    },
    {
      "name" : "SLA_COMPLIED",
      "data" : {
        "conversationId" : 3,
        "slaId" : 1,
        "slaUUID" : 113,
        "type" : "SLA_INIT",
        "eventAt": new Date("2020-01-25 14:00:00"),
      },
    },
    {
      "name" : "SLA_COMPLIED",
      "data" : {
        "conversationId" : 3,
        "slaId" : 1,
        "slaUUID" : 113,
        "type" : "SLA_FIRST",
        "eventAt": new Date("2020-01-25 14:01:00"),
      },
    },
    {
      "name" : "SLA_COMPLIED",
      "data" : {
        "conversationId" : 3,
        "slaId" : 1,
        "slaUUID" : 113,
        "type" : "SLA_NEXT",
        "eventAt": new Date("2020-01-25 14:02:00"),
      },
    },
    {
      "name" : "SLA_BREACHED",
      "data" : {
        "conversationId" : 3,
        "slaId" : 1,
        "slaUUID" : 113,
        "type" : "SLA_NEXT",
        "eventAt": new Date("2020-01-25 14:05:00"),
        "minuteBreached": 5,
      },
    },
    {
      "name" : "SLA_COMPLIED",
      "data" : {
        "conversationId" : 3,
        "slaId" : 1,
        "slaUUID" : 113,
        "type" : "SLA_RESOVLED",
        "eventAt": new Date("2020-01-25 14:01:00"),
      },
    },
  ];
  
  Event.addBatch(testData).then(result => response.json({ result }));
}

export default {
  getReport,
  insertTestData,
};