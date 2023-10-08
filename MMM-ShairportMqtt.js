Module.register("MMM-ShairportMqtt",{
  defaults: {
    mqttServer: 'mqtt://sonos.local',
    topic: 'shairport-sync/f1',
    interval: 150000,
    debug: true,
    loadingText: '',
  },

	start: function() {
    Log.info('Starting module: ' + this.name);
    this.loaded = false;
		this.progress = [];
		this.playing = null;
		this.lastUpdate = new Date().getTime() / 1000;
    const self = this;
    self.sendSocketNotification('MQTT_SERVER', {
      mqttServer: self.config.mqttServer,
      topic: self.config.topic,
    });
		setInterval(() => {
			this.updateDom(0);
		}, 1000);
	},
  socketNotificationReceived: function(notification, payload){
    if (notification === 'MQTT_DATA') {
      this.lastUpdate = new Date().getTime() / 1000;

      if (payload.topic === `${this.config.topic}/active_start`) {
        this.playing == true;
        this.sendNotification('HIDE_CLOCK', {
          message: 'active_start',
        });
        this.show(1000);
      }
      if (payload.topic === `${this.config.topic}/active_end`) {
        this.playing == false;
        this.sendNotification('SHOW_CLOCK', {
          message: 'active_end',
        });
        this.hide(1000);
      }
      
      if (payload.topic === `${this.config.topic}/title`) {
        this.title = payload.data ? payload.data : '';
        console.log('title: ', this.title);
      }
      if (payload.topic === `${this.config.topic}/artist`) {
        this.artist = payload.data ? payload.data : '';
        console.log('artist: ', this.artist);
      }
      if (payload.topic === `${this.config.topic}/album`) {
        this.album = payload.data ? payload.data : '';
        console.log('album: ', this.album);
      }
      if (payload.topic === `${this.config.topic}/volume`) {
        this.volume = payload.data ? payload.data.split(',')[0] / 30 + 1 : '';
        console.log('volume: ', this.volume);
      }
      if (payload.topic === `${this.config.topic}/client_name`) {
        this.client_name = payload.data ? payload.data : '';
        console.log('client_name: ', this.client_name);
      }
      if (payload.topic === `${this.config.topic}/ssnc/prgr`) {
        this.progress = payload.data ? payload.data.split('/') : '';
        console.log('progress: ', this.progress);
      }
      if (payload.topic === `${this.config.topic}/cover`) {
        const arrayBufferView = new Uint8Array( payload.data );
        var blob = new Blob([ arrayBufferView ]);
        var urlCreator = window.URL || window.webkitURL;
        this.imageUrl = urlCreator.createObjectURL( blob );
      }
      this.loaded = true;
      this.updateDom(1000);
    }

    if (notification === 'ERROR' && this.config.showAlerts){
      this.sendNotification('SHOW_ALERT', payload);
    }
  },
  getDom: function() {
		var self = this;
		var wrapper = document.createElement("div");
		wrapper.className = this.config.classes ? this.config.classes : "small";
		alignment = (this.config.alignment == "left") ? "left" : ((this.config.alignment == "right") ? "right" : "center");
		wrapper.setAttribute("style", "text-align:" + alignment + ";")

		if ((!this.metadata || (Object.keys(this.metadata).length == 0)) && (!this.progress && this.playing == false)){
			wrapper.setAttribute("style", "display:none;");
			return wrapper;
		}

    if (this.client_name) {
      self.data.header = `${this.client_name} is now playing`;
    } else {
      self.data.header = `Somebody is now playing`;
    }

		metadata = document.createElement("div");
		imgtag = document.createElement("img");
		if (this.imageUrl){
			imgtag.setAttribute('src', this.imageUrl);
			imgtag.setAttribute('style', "width:550px;height:550px;");
		}
		imgtag.className = 'albumart';
		metadata.appendChild(imgtag);

		//create a break below the image
		metadata.appendChild(document.createElement('br'));
		//create the progressbar
		var progressEl = document.createElement('progress');
		progressEl.id = "musicProgress";
		metadata.appendChild(progressEl);

		metadata.appendChild(document.createElement('br'));
		//create the label for the progress
		var prgrLabel = document.createElement("label");
		prgrLabel.setAttribute("for", "musicProgress");
		prgrLabel.id = "progressLabel";
		prgrLabel.innerHTML = "0:00 - 0:00";
		metadata.appendChild(prgrLabel);

    if (this.progress && this.progress.length > 0 && this.playing) {
      //get the progress
			let prData = this.progress;
			//get the start, current play frame and the end of the song in seconds
			let start   = this.getSec(prData[0]);
			let current = this.getSec(prData[1]);
			let end     = this.getSec(prData[2]);
			let prgrInSec = current - start;

      let songLength = end - start;
      prData[1] = (parseInt(prData[1]) + 44100).toString(); //adds 1 sec of progress
      console.log('current: ', prData[1]);
			//Make sure that, when there's a bug or something else
			//That the 'progress' won't go past the 'end' of the song.
			if (prgrInSec >= songLength) {
				if (this.shouldHide()) {
					//song is already over and it has been 2 minutes without update
					wrapper.setAttribute("style", "display:none;");
					return wrapper;
				}
				prgrInSec = songLength;
			}
			//update the progressbar
      prgrLabel.innerHTML = this.secToTime(prgrInSec) + " - " + this.secToTime(songLength);
    } else if (!this.playing && this.progress) { //song was paused
			let prData = this.progress;
			let start   = this.getSec(prData[0]);
			let current = this.getSec(prData[1]);
			let end     = this.getSec(prData[2]);
			let prgrInSec = current - start;

			let songLength = end - start;
			this.progress = prData;

			var progEl = progressEl;
			if (prgrInSec >= songLength) {
				if (this.shouldHide()) {
					//song is already over and it has been 2 minutes without update
					wrapper.setAttribute("style", "display:none;");
					return wrapper;
				}
				prgrInSec = songLength;
			}
			progEl.setAttribute("value", prgrInSec);
			progEl.setAttribute("max", songLength);

			prgrLabel.innerHTML = this.secToTime(prgrInSec) + " - " + this.secToTime(songLength);
    } else { //nothing is playing
			wrapper.setAttribute("style", "display:none;");
			return wrapper;
    }

		if (this.title && this.title.length > 30){
			//Because the dom regenerates every second. The marque won't scroll
			//I wasn't able to fix that
			titletag = document.createElement('div');
			titletag.style.fontSize = "10px";
		}else{
			titletag = document.createElement("div");
		}

		titletag.innerHTML = (this.title) ? this.title : "";
		titletag.className = "bright";
		metadata.appendChild(titletag)

		var txt = "";
		if (this.artist || this.album){
			txt = this.artist + " - " + this.album
		}
		if (txt.length > 50){
			//Because the dom regenerates every second. The marque won't scroll
			//I wasn't able to fix that
			artisttag = document.createElement('div');
			artisttag.style.fontSize = "10px";
		}else{
			artisttag = document.createElement('div');
		}
		artisttag.innerHTML = txt;
		artisttag.className = "xsmall";
		metadata.appendChild(artisttag)

		wrapper.appendChild(metadata);

    return wrapper;
  },
  getStyles: function() {
		return [
			"MMM-ShairportMqtt.css",
		];
  },

	//convert RTP timestamps to seconds (assuming music is 44100hz or 44khz)
	//As stated in this section https://github.com/mikebrady/shairport-sync#more-information
	//"The default is 44,100 samples per second / 16 bits"
	getSec: function(timestamp) {
		return parseInt(timestamp) / 44100;
	},
	//convert seconds to normal minute:seconds format like: 201 --> 3:21
	secToTime: function(sec) {
		let min = Math.floor(sec / 60);
		var remain = Math.floor((sec % 60));
		remain = (remain.toString().length > 1) ? remain : "0" + (remain);
		return (min + ":" + remain);
	},
	//determines whether the player should hide if there wasn't any update in last 2 minutes
	//probably a bug then.
	shouldHide: function() {
		let now = new Date().getTime() / 1000;
		return (now > (this.lastUpdate + 2 * 60)) ? true : false;
	},
});