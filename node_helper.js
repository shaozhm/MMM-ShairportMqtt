const NodeHelper = require('node_helper');
const mqtt = require('mqtt');
const Blynk = require('blynk-library');
const Lodash = require('lodash');
const piToken = 'BO9Ej28AzpoEsaCs0WXiS3mqSO2KE8mZ';
const globalSwitchButtonPin = 1;
const blynkServer = 'sonos.local';
const blynkServerPort = 8442;

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
      client.subscribe(`${config.buttonTopic}`);
      
      client.on('message', function(topic, message) {
        console.log('topic: ', topic);
        const data = topic.endsWith('cover') ? message : message.toString();
        self.sendSocketNotification('MQTT_DATA', {
          topic,
          data,
        });

        if (topic.startsWith('zigbee2mqtt')) {
          console.log('button message', message.toString());
          const btn = JSON.parse(message.toString());
          const action = btn && btn.action === 'single' ? 1 : btn.action === 'double' || btn.action === 'triple' || btn.action === 'quadruple' ? 0 : null;
          if (Lodash.isNumber(action)) {
            const blynk = new Blynk.Blynk(piToken, options = {
              connector : new Blynk.TcpClient( options = { addr: blynkServer, port: blynkServerPort })
            });
            blynk.on('connect', () => {
              const bridge = new blynk.WidgetBridge(99);
              bridge.setAuthToken(piToken);
              bridge.virtualWrite(globalSwitchButtonPin, action);
              blynk.disconnect(false);
            });
          }
        }
      });
    }
  },

  socketNotificationReceived: function(notification, payload) {
    if (notification === 'MQTT_SERVER') {
      this.connectMqtt(payload);
    }
  }
});