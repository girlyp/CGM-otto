'use strict';

var levels = require('../levels');

function init () {

    var otto = {
        name: 'otto'
        , label: 'otto'
        , pluginType: 'pill-status'
        , pillFlip: true
    };
    
    otto.checkNotifications = function checkNotifications (sbx) {

        var lastSGVEntry = sbx.lastSGVEntry();
        var curLevel = lastSGVEntry.scaled;
        var curDirection = sbx.properties.direction.value;

        function sendAlarm() {
            sbx.notifications.requestNotify({
                level: 2
                , title: "LIPPIET CUSTOM ALARM TRIGGERED."
                , message: "LIPPIET CUSTOM ALARM TRIGGERED."
                , eventName: otto.name
                , plugin: otto
                , group: 'Otto'
                , pushoverSound: 'echo'
                , debug: "Ottos personal alarm"
            });
        }

        if (curLevel > 9) {}
        else if (curLevel < 5) {}
        else if (curDirection == "DoubleDown" && curLevel <= 14) { sendAlarm(); }
        else if (curDirection == "SingleDown" && curLevel <= 12) { sendAlarm(); }
        else if (curDirection == "FortyFiveDown" && curLevel <= 10) { sendAlarm(); }
        else if (curDirection == "FortyFiveUp" && curLevel >= 8) { sendAlarm(); }
        else if (curDirection == "SingleUp" && curLevel >= 7) { sendAlarm(); }
        else if (curDirection == "DoubleUp" && curLevel >= 6) { sendAlarm(); }

    };

    return otto;
}

module.exports = init;