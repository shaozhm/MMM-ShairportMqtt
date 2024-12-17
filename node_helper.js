const NodeHelper = require('node_helper');
const mqtt = require('mqtt');

module.exports = NodeHelper.create({
  start: function() {
    console.log('MMM-ShairportMqtt started ...');
    this.clients = [];
  },
  connectMqtt: function(config) {
    var self = this;
    let client;

    if(typeof self.clients[config.mqttServer] === "undefined") {
      console.log("Creating new MQTT client for url: ", config.mqttServer);
      client = mqtt.connect(config.mqttServer);
      self.clients[config.mqttServer] = client;

      client.on('error', function(error) {
        console.log('*** MQTT JS ERROR ***: ' + error);
        self.sendSocketNotification('ERROR', {
          type: 'notification',
          title: 'MQTT Error',
          message: 'The MQTT Client has suffered an error: ' + error
        });
      });

      client.on('offline', function() {
        console.log('*** MQTT Client Offline ***');
        self.sendSocketNotification('ERROR', {
          type: 'notification',
          title: 'MQTT Offline',
          message: 'MQTT Server is offline.'
        });
        client.end();
      });
    } else {
      client = self.clients[config.mqttServer];
    }

    if(config.mode !== 'send') {
      client.subscribe(`${config.topic}/active_start`);
      client.subscribe(`${config.topic}/active_end`);
      client.subscribe(`${config.topic}/title`);
      client.subscribe(`${config.topic}/artist`);
      client.subscribe(`${config.topic}/album`);
      client.subscribe(`${config.topic}/cover`);
      client.subscribe(`${config.topic}/volume`);
      client.subscribe(`${config.topic}/client_name`);
      client.subscribe(`${config.topic}/ssnc/prgr`);
      
      client.on('message', function(topic, message) {
        console.log('topic: ', topic);
        const data = topic.endsWith('cover') ? message : message.toString();
        self.sendSocketNotification('MQTT_DATA', {
          topic,
          data,
        });
      });
    }
  },

  socketNotificationReceived: function(notification, payload) {
    if (notification === 'MQTT_SERVER') {
      this.connectMqtt(payload);
    }
  }
});