var express = require('express');
var fs = require('fs');

var router = express.Router();

router.post('/command/rtl', function(req, res) {
    ros_handle.pub_state.publish('RTL');
    //commandTCP.write('RTL\0');
    res.status(200);
    res.send(true);
});

router.post('/command/emergency', function(req, res) {
    ros_handle.pub_state.publish('EMERGENCY\0');
    //commandTCP.write('EMERGENCY\0');
    res.status(200);
    res.send(true);
});

router.post('/command/resume', function(req, res) {
    ros_handle.pub_state.publish('RESUME\0');
    //commandTCP.write('RESUME\0');
    res.status(200);
    res.send(true);
});

router.post('/command/pause', function(req, res) {
    ros_handle.pub_state.publish('PAUSE\0');
    //commandTCP.write('PAUSE\0');
    res.status(200);
    res.send(true);
});

router.post('/command/stop', function(req, res) {
    ros_handle.pub_state.publish('STOP\0');
    //commandTCP.write('STOP\0');
    res.status(200);
    res.send(true);
});

router.post('/command/mission', function(req, res) {
    currentMission = req.body.mission;
    var missionName = getMissionName();

    fs.writeFile(config.common.missions.path + missionName, currentMission, function (error) {
        if (error) {
            res.status(500);
            res.send('Unable to save mission file');
            throw error;
        }
        ros_handle.write('MISSION|' + missionName +'\0');
        //commandTCP.write('MISSION|' + missionName + '\0');
        res.status(200);
        res.send(true);
    });
});

router.post('/command/speed', function(req, res) {
    var speed = parseFloat(req.body.speed);
    ros_handle.write('SPEED|' + speed + '\0');
    //commandTCP.write('SPEED|' + speed + '\0');
    res.status(200);
    res.send(true);
});

router.post('/command/factors', function(req, res) {
    var p = parseFloat(req.body.p);
    var i = parseFloat(req.body.i);
    ros_handle.write('FACTOR|' + p + '|' + i + '\0');
    //commandTCP.write('FACTOR|' + p + '|' + i + '\0');
    res.status(200);
    res.send(true);
});

function getMissionName() {
    var now = new Date();
    return config.common.missions.name.replace('{DATE}', now.toLocaleDateString()).replace('{TIME}', now.toLocaleTimeString());
}

module.exports = router;
