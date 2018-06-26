var tcpClient = require('./tcp_client');


module.exports = function() {
    commandROS = new tcpClient('Command', config.web.webServer.rosIP, config.common.tcp.commandPort, onDataReceived);
};

function onDataReceived(msg) {

}
