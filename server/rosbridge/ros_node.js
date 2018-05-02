var ROSLIB = require('roslib');

// Utils
function create_server_message(type, content) {
    return {type: type, date: new Date(), content};
}

function q_get_yaw(q) {
    q.x = 0;
    q.y = 0;
    const norm = (q.z * q.z + q.w * q.w) ** 0.5;
    q.w /= norm;
    q.z /= norm;
    return q.z;
}

function add_and_trunc_data(list, data) {
    const nb_max_pts = 50;
    list.push(data);
    return list.slice(list.length - nb_max_pts, list.length - 1);
}

function get_batt_pourventage(voltage) {
    const max_volt = 25.2;
    const min_volt = 18.1;
    return (voltage-min_volt)/(max_volt-min_volt)*100.0;
}

function Node(name, ip, port){
    // member variables
    this.name = name;
    this.ip = ip;
    this.port = port;
    this.init();
}
Node.prototype.init = function () {
    // Connecting to ROS
    // -----------------
    // Cette fonction est créé pour se relancer en cas d'échec de la connexion
    let n = this;
    let connection_handler = function () {
        console.log("Launching Ros management");

        n.nh = new ROSLIB.Ros({
            url: 'ws://' + n.ip + ':' + n.port
        });
        n.nh.on('connection', function () {
            console.log('Connected to websocket server.');
            n.run();
        });
        n.nh.on('error', function (error) {
            console.log('Error connecting to websocket server: ', error);
        });
        n.nh.on('close', function () {
            console.log('Connection to websocket server closed.');
            console.log('[' + new Date().toLocaleString() + '] trying to reconnect...');
            setTimeout(connection_handler, 3000);
        });
    };
    connection_handler();
};
Node.prototype.topic_init = function () {
    // Publishing a Topic
    // ------------------
    this.pub_state = new ROSLIB.Topic({
        ros: this.nh,
        name: '/state',
        messageType: 'std_msgs/String'
    });
    // Definitions
    this.sub_pose = new ROSLIB.Topic({
        ros: this.nh,
        name: '/pose_est',
        messageType: 'geometry_msgs/Pose'
    });
    this.sub_twist = new ROSLIB.Topic({
        ros: this.nh,
        name: '/twist_est',
        messageType: 'geometry_msgs/Twist'
    });
    this.sub_cmd_pwm = new ROSLIB.Topic({
        ros: this.nh,
        name: '/cmd_pwm',
        messageType: 'ros_maestro/PwmCmd'
    });
    this.sub_battery1_voltage = new ROSLIB.Topic({
        ros: this.nh,
        name: '/battery1_voltage',
        messageType: 'std_msgs/Float64'
    });
    this.sub_battery2_voltage = new ROSLIB.Topic({
        ros: this.nh,
        name: '/battery2_voltage',
        messageType: 'std_msgs/Float64'
    });
    this.sub_state = new ROSLIB.Topic({
        ros: this.nh,
        name: '/state',
        messageType: 'std_msgs/String'
    });
};
Node.prototype.run = function () {
    this.topic_init();
    let n = this;
    // Callbacks

    // ### Pose
    n.pos = {};
    n.pos.lat = 0.0;
    n.pos.lon = 0.0;
    n.pos.yaw = 0.0;
    n.pos.speed = 0.0;
    n.pos.signal = 0.0;
    n.sub_pose.subscribe(function (message) {
        //console.log(message)
        if (message) {
            console.log('Received message on ' + n.sub_pose.name + ' Position : (' + message.position.x + ',' + message.position.y + ')');

            n.pos.yaw = q_get_yaw(message.orientation);
            console.log('orientation : ' + yaw);

            n.pos.lat = message.pose.position.y;
            n.pos.lon = message.pose.position.x;

            data = create_server_message(
                '$POS',
                {
                    lat: n.pos.lat,
                    lng: n.pos.lon,
                    yaw: n.pos.yaw,
                    speed: n.pos.speed,
                    signal: n.pos.signal
                } //yaw = deg
            );
            globalData.pos = add_and_trunc_data(globalData.pos, data)
        }
    });

    // ### Twist
    this.sub_twist.subscribe(function (message) {
        //console.log(message)
        if (message) {
            console.log('Received message on ' + n.sub_pose.name + ' Speed : ' + message.linear.x);

            n.pos.speed = message.linear.x;

            data = create_server_message(
                '$POS',
                {
                    lat: n.pos.lat,
                    lng: n.pos.lon,
                    yaw: n.pos.yaw,
                    speed: n.pos.speed,
                    signal: n.pos.signal
                } //yaw = deg
            );
            globalData.pos = add_and_trunc_data(globalData.pos, data)
        }
    });

    // ### Cmd
    n.mot = {};
    n.mot.m1 = 0.0;
    n.mot.m2 = 0.0;
    this.sub_cmd_pwm.subscribe(function (message) {
        if (message) {
            console.log('Received message on ' + n.sub_cmd_pwm.name + ': [' + message.pin + ',' + message.command + ']');

            if(message.pin === 1){
                n.mot.m1 = message.command;
            }
            if(message.pin === 2){
                n.mot.m2 = message.command;
            }

            data = create_server_message(
                '$MOT',
                {
                    m1: (n.mot.m1 - 4000) / 40.0,
                    m2: (n.mot.m2 - 4000) / 40.0,
                    fidelity: 1.0
                }
            );
            globalData.mot = add_and_trunc_data(globalData.pos, data)
        }
    });

    // ### Batterie
    n.batt = {};
    n.batt.b1 = 0.0;
    this.sub_battery1_voltage.subscribe(function (message) {
        if (message) {
            console.log('Received message on ' + n.sub_battery1_voltage.name + ': ' + message.data);

            n.batt.b1 = get_batt_pourventage(message.data);

            data = create_server_message(
                '$BATT',
                {
                    b1: n.batt.b1,
                    b2: n.batt.b2
                }
            );
            globalData.batt = add_and_trunc_data(globalData.batt, data)
        }
    });

    n.batt.b2 = 0.0;
    this.sub_battery2_voltage.subscribe(function (message) {
        if (message) {
            console.log('Received message on ' + n.sub_battery2_voltage.name + ': ' + message.data);

            n.batt.b2 = get_batt_pourventage(message.data);

            data = create_server_message(
                '$BATT',
                {
                    b1: m_b1_voltage,
                    b2: m_b2_voltage
                }
            );
            globalData.batt = add_and_trunc_data(global.batt, data)
        }
    });

    // ### State
    n.state = {};
    n.state.state = 0;
    n.state.stateText = "IDLE";
    n.state.speedFactor = 0;
    n.state.pFactor = 0;
    n.state.iFactor = 0;
    n.state.dFactor = 0;
    this.sub_state.subscribe(function (message) {
        if (message) {
            console.log('Received message on ' + n.sub_state.name + ': ' + message.data);

            n.state.stateText = message.data;

            data = create_server_message(
                '$STATE',
                {
                    state: n.state.state,
                    stateText: n.state.stateText,
                    speedFactor: n.state.speedFactor,
                    pFactor: n.state.pFactor,
                    iFactor: n.state.iFactor,
                    dFactor: n.state.dFactor
                }
            );
            globalData.state = add_and_trunc_data(globalData.state, mot)
        }
    });
};
Node.prototype.write = function (msg) {console.log("FAKE writing msg : "+msg)};


module.exports = {Node};