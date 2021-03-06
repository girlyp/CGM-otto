'use strict';

var _ = require('lodash');
var times = require('../times');
var simplealarms = require('./simplealarms')();

var MANUAL_TREATMENTS = ['BG Check', 'Meal Bolus', 'Carb Correction', 'Correction Bolus'];

function init() {

  var treatmentnotify = {
    name: 'treatmentnotify'
    , label: 'Treatment Notifications'
    , pluginType: 'notification'
  };

  //automated treatments from OpenAPS or Loop shouldn't trigger notifications or snooze alarms
  function filterTreatments (sbx) {
    var treatments = sbx.data.treatments;

    treatments = _.filter(treatments, function notOpenAPS (treatment) {
      var ok = true;
      var enteredBy = treatment.enteredBy;
      if (enteredBy && (enteredBy.indexOf('openaps://') === 0 || enteredBy.indexOf('loop://') === 0)) {
        ok = _.indexOf(MANUAL_TREATMENTS, treatment.eventType) >= 0;
      }
      return ok;
    });

    return treatments;
  }

  treatmentnotify.checkNotifications = function checkNotifications (sbx) {

    var treatments = filterTreatments(sbx);
    var lastMBG = sbx.lastEntry(sbx.data.mbgs);
    var lastTreatment = sbx.lastEntry(treatments);

    var mbgCurrent = isCurrent(lastMBG);
    var treatmentCurrent = isCurrent(lastTreatment);
    
    var translate = sbx.language.translate;

    if (mbgCurrent || treatmentCurrent) {
      var mbgMessage = mbgCurrent ? translate('Meter BG') +' ' + sbx.scaleEntry(lastMBG) + ' ' + sbx.unitsLabel : '';
      var treatmentMessage = treatmentCurrent ? translate('Treatment') + ': ' + lastTreatment.eventType : '';

      autoSnoozeAlarms(mbgMessage, treatmentMessage, lastTreatment, sbx);

      //and add some info notifications
      //the notification providers (push, websockets, etc) are responsible to not sending the same notifications repeatedly
      if (mbgCurrent) { requestMBGNotify(lastMBG, sbx); }
      if (treatmentCurrent) {
        requestTreatmentNotify(lastTreatment, sbx);
      }
    }
  };

  function autoSnoozeAlarms(mbgMessage, treatmentMessage, lastTreatment, sbx) {
    //announcements don't snooze alarms
    /* ODH MOD
    if (lastTreatment && !lastTreatment.isAnnouncement) {
      var snoozeLength = sbx.extendedSettings.snoozeMins && times.mins(sbx.extendedSettings.snoozeMins).msecs || times.mins(10).msecs;
      sbx.notifications.requestSnooze({
        level: sbx.levels.URGENT
        , title: 'Snoozing alarms since there was a recent treatment'
        , message: _.trim([mbgMessage, treatmentMessage].join('\n'))
        , lengthMills: snoozeLength
      });
    }
    */
    console.log('autoSnoozeAlarms - Should called now but ODH disabled.')
  }

  function requestMBGNotify (lastMBG, sbx) {
    console.info('requestMBGNotify for', lastMBG);
	var translate = sbx.language.translate;

    sbx.notifications.requestNotify({
      level: sbx.levels.INFO
      , title: 'Calibration' //assume all MGBs are calibrations for now
      , message: translate('Meter BG') + ': ' + sbx.scaleEntry(lastMBG) + ' ' + sbx.unitsLabel
      , plugin: treatmentnotify
      , pushoverSound: 'magic'
    });
  }

  function requestAnnouncementNotify (lastTreatment, sbx) {
    var result = simplealarms.compareBGToTresholds(sbx.scaleMgdl(lastTreatment.mgdl), sbx);

    sbx.notifications.requestNotify({
      level: result.level
      , title: (result.level === sbx.levels.URGENT ? sbx.levels.toDisplay(sbx.levels.URGENT) + ' ' : '') + lastTreatment.eventType
      , message: lastTreatment.notes || '.' //some message is required
      , plugin: treatmentnotify
      , group: 'Announcement'
      , pushoverSound: sbx.levels.isAlarm(result.level) ? result.pushoverSound : undefined
      , isAnnouncement: true
    });
  }

  function requestTreatmentNotify (lastTreatment, sbx) {
    var translate = sbx.language.translate;

    if (lastTreatment.isAnnouncement) {
      requestAnnouncementNotify(lastTreatment, sbx);
    } else {
      var message = buildTreatmentMessage(lastTreatment, sbx);

      var eventType = lastTreatment.eventType;
      if (lastTreatment.duration === 0 && eventType === 'Temporary Target') {
        eventType += ' Cancel';
        message = translate('Canceled');
      }
      
      var timestamp = lastTreatment.timestamp;

      if (!message) {
        message = '...';
      }
      
      sbx.notifications.requestNotify({
        level: sbx.levels.INFO
        , title: translate(eventType)
        , message: message
        , timestamp: timestamp
        , plugin: treatmentnotify
      });
    }
  }

  function buildTreatmentMessage(lastTreatment, sbx) {
    var translate = sbx.language.translate;

    return (lastTreatment.glucose ? translate('BG') + ': ' + lastTreatment.glucose + ' (' + lastTreatment.glucoseType + ')' : '') +
      (lastTreatment.reason ? '\n' + translate('Reason') + ': ' + lastTreatment.reason : '') +
      (lastTreatment.targetTop ? '\n' + translate('Target Top') + ': ' + lastTreatment.targetTop : '') +
      (lastTreatment.targetBottom ? '\n' + translate('Target Bottom') + ': ' + lastTreatment.targetBottom : '') +
      (lastTreatment.carbs ? '\n' + translate('Carbs') + ': ' + lastTreatment.carbs + 'g' : '') +

      (lastTreatment.insulin ? '\n' + translate('Insulin') + ': ' + sbx.roundInsulinForDisplayFormat(lastTreatment.insulin) + 'U' : '')+
      (lastTreatment.duration ? '\n' + translate('Duration') + ': ' + lastTreatment.duration + ' min' : '')+
      (lastTreatment.percent ? '\n' + translate('Percent') + ': ' + (lastTreatment.percent > 0 ? '+' : '') + lastTreatment.percent + '%' : '')+
      (!isNaN(lastTreatment.absolute) ? '\n' + translate('Value') + ': ' + lastTreatment.absolute + 'U' : '')+
      (lastTreatment.enteredBy ? '\n' + translate('Entered By') + ': ' + lastTreatment.enteredBy : '') +

      (lastTreatment.notes ? '\n' + translate('Notes') + ': ' + lastTreatment.notes : '');
  }

  return treatmentnotify;
}

function isCurrent(last) {
  if (!last) {
    return false;
  }

  var now = Date.now();
  var lastTime = last.mills;
  var ago = (last.mills <= now) ? now - lastTime : -1;
  return ago !== -1 && ago < times.mins(10).msecs;
}

module.exports = init;
