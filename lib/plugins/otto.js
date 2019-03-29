'use strict';

var levels = require('../levels');

function init (env) {

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

        function sendAlarm(alevel,name) {
            sbx.notifications.requestNotify({
                level: 2
                , title: name
                , message: name
                , eventName: otto.name
                , plugin: otto
                , group: 'Otto'
                , pushoverSound: 'echo'
                , debug: "Ottos personal alarm"
            });
        }


        var checks = JSON.parse(env.settings.CUSTOMER_ALARMS);

        checks.forEach(function(row){

            if (row.quantifier == "<") {
                if (curDirection == row.direction && curLevel < row.level) {
                    sendAlarm(row.level, curLevel + row.name);
                }
            }
            else if (row.quantifier == "<=") {
                if (curDirection == row.direction && curLevel <= row.level) {
                    sendAlarm(row.level, curLevel + row.name);
                }
            }
            else if (row.quantifier == ">") {
                if (curDirection == row.direction && curLevel > row.level) {
                    sendAlarm(row.level, curLevel + row.name);
                }
            }
            else if (row.quantifier == ">=") {
                if (curDirection == row.direction && curLevel >= row.level) {
                    sendAlarm(row.level, curLevel + row.name);
                }
            }
            else if (row.quantifier == "=") {
                if (curDirection == row.direction && curLevel == row.level) {
                    sendAlarm(row.level, curLevel + row.name);
                }
            }

        });

    };

    return otto;
}

module.exports = init;
