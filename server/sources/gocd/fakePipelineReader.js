var _ = require('lodash');
var moment = require('moment');

var old = moment().subtract('days', 3);
var yesterday = moment().subtract('days', 1);
var today = moment();

var fakeHistory = [];

function newHistoryEntry(data) {
  return _.extend(data, {
    wasSuccessful: function() {
      return data.result === 'success';
    }
  });
}

exports.init = function(pipelineName) {

  fakeHistory.push(newHistoryEntry({ pipeline: pipelineName, time: today, result: 'success'}));
  fakeHistory.push(newHistoryEntry({ pipeline: pipelineName, time: today, result: 'failed', stageFailed: 'build'}));
  fakeHistory.push(newHistoryEntry({ pipeline: pipelineName, time: yesterday, result: 'failed', stageFailed: 'build'}));
  fakeHistory.push(newHistoryEntry({ pipeline: pipelineName, time: yesterday, result: 'failed', stageFailed: 'build'}));
  fakeHistory.push(newHistoryEntry({ pipeline: pipelineName, time: old, result: 'success'}));
  fakeHistory.push(newHistoryEntry({ pipeline: pipelineName, time: old, result: 'success'}));
};

exports.readHistory = function(pipelineName, callback, callbackParameter) {

  callback(fakeHistory, callbackParameter);

};