var ROSLIB = require('roslib');
//var JSON = require('json')

  // Utils
  function create_server_message(type, content) {
      return {type: type, date: new Date(), content} ;
  }

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
  cmdVel.publish(twist);

  console.log('Creating Topic')
  var sub_pose = new ROSLIB.Topic({ ros : ros,
    name : '/pose_est',
    messageType : 'geometry_msgs/Pose'
  });
  console.log('Subscribing')
  sub_pose.subscribe(function(message) {
    //console.log(message)
    if(message){
      console.log('Received message on ' + sub_pose.name + ' Position : (' +  message.position.x + ',' + message.position.y + ')');
      q = message.orientation;
      q.x = 0;
      q.y = 0;
      console.log(q)
      q.normalize()
      console.log('orientation : ' + q)

      pos = create_server_message(
        '$STATE',
        {
          lat: message.pose.position.y,
          lng: message.pose.position.x,
          yaw: 0,
          speed: 0,
          signal: 0
        } //yaw = deg
      );
    }
    //globalData.pos.push(message);
  });
