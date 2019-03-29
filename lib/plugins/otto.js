'use strict';

var levels = require('../levels');
console.log('Otto called');
function init (env) {

    var otto = {
        name: 'otto'
        , label: 'otto'
        , pluginType: 'pill-status'
        , pillFlip: true
    };

    otto.checkNotifications = function checkNotifications (sbx) {

        console.log('I have been called.');
       
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
        
                console.log('I have been called again.');
        
        console.log(checks.length);

        var i = 1;

        checks.forEach(function(row){

            console.log('Running custom otto check ' + i + '.  Current level: ' + curLevel);
            console.log('For this row: Quantifier: ' + row.quantifier + '. Level: ' + row.level + '. Direction: ' + row.direction + '. Name: ' + row.name);
            i++;

            if (row.quantifier == "<") {
                console.log('Call here 1');
                if (curDirection == row.direction && curLevel < row.level) {
                    console.log('ODH 1 Active. ' + row.name + '. Direction: ' + row.direction + '. Level: ' + row.level);
                    sendAlarm(row.level, curLevel + row.name);
                }
            }
            else if (row.quantifier == "<=") {
                console.log('Call here 2.  ' + curDirection + ' == ' + row.direction + ' && ' + curLevel + ' <= ' + row.level);
                if (curDirection == row.direction && curLevel <= row.level) {
                    console.log('ODH 2 Active. ' + row.name + '. Direction: ' + row.direction + '. Level: ' + row.level);
                    sendAlarm(row.level, curLevel + row.name);
                }
            }
            else if (row.quantifier == ">") {
                console.log('Call here 3');
                if (curDirection == row.direction && curLevel > row.level) {
                    console.log('ODH 3 Active. ' + row.name + '. Direction: ' + row.direction + '. Level: ' + row.level);
                    sendAlarm(row.level, curLevel + row.name);
                }
            }
            else if (row.quantifier == ">=") {
                console.log('Call here 4.  ' + curDirection + ' == ' + row.direction + ' && ' + curLevel + ' <= ' + row.level);
                if (curDirection == row.direction && curLevel >= row.level) {
                    console.log('ODH 4 Active. ' + row.name + '. Direction: ' + row.direction + '. Level: ' + row.level);
                    sendAlarm(row.level, curLevel + row.name);
                }
            }
            else if (row.quantifier == "=") {
                console.log('Call here 5');
                if (curDirection == row.direction && curLevel == row.level) {
                    console.log('ODH 5 Active. ' + row.name + '. Direction: ' + row.direction + '. Level: ' + row.level);
                    sendAlarm(row.level, curLevel + row.name);
                }
            }

        });

    };

    return otto;
}

module.exports = init;
