var ROSLIB = require('roslib');

module.exports = function(name, ip, port, receiveCallback) {

  // Utils
  function create_server_message(type, content) {
      return {type: type, date: new Date(), content} ;
  }
  function q_get_yaw(q) {
    q.x = 0;
    q.y = 0;
    norm = (q.z*q.z + q.w*q.w)**0.5;
    q.w /= norm;
    q.z /= norm;
    return q.z;
  }
  function add_and_trunc_data(list, data){
    nb_max_pts = 50
    list.push(data)
    return list.slice(list.length - nb_max_pts, list.length - 1);
  }

  // Internal global variables
  var m_lat = 0.0;
  var m_lon = 0.0;
  var m_speed = 0.0;
  var m_yaw = 0.0;
  var m_signal = 0.0;
  var m_b1_voltage = 0.0;
  var m_b2_voltage = 0.0;
  var m_m1_cmd = 0.0;
  var m_m2_cmd = 0.0;
  var m_state = 0;
  var m_stateText = "None";
  var m_speedFactor = 0.0;
  var m_pFactor = 0.0;
  var m_iFactor = 0.0;
  var m_dFactor = 0.0;

  // Connecting to ROS
  // -----------------

  var ros = new ROSLIB.Ros({
    url : 'ws://localhost:9090'
  });

  ros.on('connection', function() {
    console.log('Connected to websocket server.');
  });

  ros.on('error', function(error) {
    console.log('Error connecting to websocket server: ', error);
  });

  ros.on('close', function() {
    console.log('Connection to websocket server closed.');
  });



  // Publishing a Topic
  // ------------------

  var cmdVel = new ROSLIB.Topic({
    ros : ros,
    name : '/cmd_vel',
    messageType : 'geometry_msgs/Twist'
  });

  var twist = new ROSLIB.Message({
    linear : {
      x : 0.1,
      y : 0.2,
      z : 0.3
    },
    angular : {
      x : -0.1,
      y : -0.2,
      z : -0.3
    }
  });
  // cmdVel.publish(twist);

  // Subscribing to a Topic
  // ----------------------
  // pos, bat, mot, data, state

  // Definitions
  var sub_pose = new ROSLIB.Topic({ ros : ros,
    name : '/pose_est',
    messageType : 'geometry_msgs/Pose'
  });
  var sub_twist = new ROSLIB.Topic({ ros : ros,
    name : '/twist_est',
    messageType : 'geometry_msgs/Twist'
  });
  var sub_cmd_pwm = new ROSLIB.Topic({ ros : ros,
    name : '/cmd_pwm',
    messageType : 'ros_maestro/PwmCmd'
  });
  var sub_battery1_voltage = new ROSLIB.Topic({ ros : ros,
    name : '/battery1_voltage',
    messageType : 'std_msgs/Float64'
  });
  // var sub_battery1_current = new ROSLIB.Topic({ ros : ros,
  //   name : '/battery1_current',
  //   messageType : 'std_msgs/Float64'
  // });
  var sub_battery2_voltage = new ROSLIB.Topic({ ros : ros,
    name : '/battery2_voltage',
    messageType : 'std_msgs/Float64'
  });
  // var sub_battery2_current = new ROSLIB.Topic({ ros : ros,
  //   name : '/battery2_current',
  //   messageType : 'std_msgs/Float64'
  // });
  // var sub_battery3_voltage = new ROSLIB.Topic({ ros : ros,
  //   name : '/battery3_voltage',
  //   messageType : 'std_msgs/Float64'
  // });
  // var sub_battery3_current = new ROSLIB.Topic({ ros : ros,
  //   name : '/battery3_current',
  //   messageType : 'std_msgs/Float64'
  // });
  var sub_state = new ROSLIB.Topic({ ros : ros,
    name : '/state',
    messageType : 'std_msgs/String'
  });

  // Callbacks

  // ### Pose
  sub_pose.subscribe(function(message) {
    //console.log(message)
    if(message){
      console.log('Received message on ' + sub_pose.name + ' Position : (' +  message.position.x + ',' + message.position.y + ')');

      m_yaw = q_get_yaw(message.orientation)
      console.log('orientation : ' + yaw)

      m_lat = message.pose.position.y
      m_lon = message.pose.position.x

      data = create_server_message(
        '$POS',
        {
          lat: m_lat,
          lng: m_lon,
          yaw: m_yaw,
          speed: m_speed,
          signal: m_signal
        } //yaw = deg
      );
      global.pos = add_and_trunc_data(global.pos, pos)
    }
  });

  // ### Twist
  sub_pose.subscribe(function(message) {
    //console.log(message)
    if(message){
      console.log('Received message on ' + sub_pose.name + ' Speed : ' +  message.linear.x);

      m_speed = message.linear.x

      data = create_server_message(
        '$POS',
        {
          lat: m_lat,
          lng: m_lon,
          yaw: m_yaw,
          speed: m_speed,
          signal: m_signal
        } //yaw = deg
      );
      global.pos = add_and_trunc_data(global.pos, pos)
    }
  });

  // ### Cmd
  sub_cmd_pwm.subscribe(function(message) {
    if(message){
      console.log('Received message on ' + sub_cmd_pwm.name + ': [' + message.pin + ',' + message.command + ']');

      data = create_server_message(
        '$MOT',
        {
          m1: (m_m1_cmd - 4000) / 40.0,
          m2: (m_m2_cmd - 4000) / 40.0,
          fidelity: 1.0
        }
      );
      global.mot = add_and_trunc_data(global.pos, mot)
    }
  });

  // ### Batterie
  sub_battery1_voltage.subscribe(function(message) {
    if(message){
      console.log('Received message on ' + sub_battery1_voltage.name + ': ' + message.data);

      m_b1_voltage = message.data

      data = create_server_message(
        '$BATT',
        {
          b1: m_b1_voltage,
          b2: m_b2_voltage,
        }
      );
      global.pos = add_and_trunc_data(global.pos, mot)
    }
  });

  // sub_battery1_current.subscribe(function(message) {
  //   console.log('Received message on ' + sub_battery1_current.name + ': ' + message.data);
  // });

  sub_battery2_voltage.subscribe(function(message) {
    if(message){
      console.log('Received message on ' + sub_battery2_voltage.name + ': ' + message.data);

      m_b2_voltage = message.data

      data = create_server_message(
        '$BATT',
        {
          b1: m_b1_voltage,
          b2: m_b2_voltage,
        }
      );
      global.pos = add_and_trunc_data(global.pos, mot)
    }  });

  // sub_battery2_current.subscribe(function(message) {
  //   console.log('Received message on ' + sub_battery2_current.name + ': ' + message.data);
  // });

  // sub_battery3_voltage.subscribe(function(message) {
  //   console.log('Received message on ' + sub_battery3_voltage.name + ': ' + message.data);
  // });

  // sub_battery3_current.subscribe(function(message) {
  //   console.log('Received message on ' + sub_battery3_current.name + ': ' + message.data);
  // });

  // ### State
  sub_state.subscribe(function(message) {
    console.log('Received message on ' + sub_state.name + ': ' + message.data);
    globalData.
  });
