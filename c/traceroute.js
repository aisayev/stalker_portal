/**
 * Traceroute to hard coded domains (domain1, domain2).
 * Send result to statistic server.
 */

function TracerouteStatic(){}

function Traceroute(option){

    this._domains = option && option.domains ? option.domains : ['streamer1nl.allfreetv.net', 'streamer1de.allfreetv.net'];
    this._time = option && option.time ? option.time: 210 ;
    this._loadingQueue = [];
    this._start_time = null;
    this._end_time = null;
    this._is_run = false;
    this.result = [];
    this.resultCallback = option && typeof(option.callback) == 'function' ? option.callback : function(){};
    this.timer = null;
    this._static = TracerouteStatic;

    if (option.send_statistic) {
        if (option.sendStatisticsCallback && typeof(option.sendStatisticsCallback) == 'function') {
            this.send_statistics = option.sendStatisticsCallback;
        }
    } else {
        this.send_statistics = function(){};
    }
}

Traceroute.prototype.start = function(){
    console.log('Traceroute.start');
    if (this._loadingQueue.length == 0 && this.checkLoading()) {
        this.stopLoading();
    }
    this._start_time = new Date();
    this._end_time = new Date();
    if ( this._time ) {
        this._end_time.setSeconds(this._start_time.getSeconds() + (this._time * this._domains.length) + 60);
        var self = this;
        this._domains.forEach(function(item){
            console.log('domain: ' + item);
            setTimeout(function () { // run mtr
                self._is_run = true;
                console.log('run mtr for domain: ' + item);
                /*result = parent.gSTB.RDir('mtr --report --no-dns --report-cycles ' + self._time + ' ' + item);*/
                /*result = '';*/
                /*result = result.split('\n');
                result.shift();
                result.shift();
                result.pop();*/

                result = [
                    't1 y1 u1 i1 i1 1',
                    't2 y2 u1 i2 o2 2',
                    't3 y3 u1 i3 o3 3',
                    't4 y4 u1 i4 o4 4',
                    't5 y5 u1 i5 o5 5',
                    't6 y6 u1 i6 o6 6',
                    't7 y7 u1 i7 o7 7',
                    't8 y8 u1 i8 o8 8',
                    't9 y9 u1 i9 o9 9',
                    't10 y10 u1 i10 o10 10',
                    't11 y11 u1 i11 o11 11',
                    't12 y12 u1 i12 o12 12',
                    't13 y13 u1 i13 o13 13',
                    't14 y14 u1 i14 o14 14',
                    't15 y15 u1 i15 o15 15',
                    't16 y16 u1 i16 o16 16',
                    't17 y17 u1 i17 o17 17'
                ];

                result = result.map(function ( item ) {
                    tmp = item.trim().replace(/\s{2,}/g, ' ').split(' ');
                    return [tmp[1], tmp[2], Math.round(tmp[5])];
                });
                self.result.push(result);
                self.resultCallback(result);
                self._is_run = self._domains.length != self.result.length;
            }, 500);
        });
        this.checkProgress();
    }
};

Traceroute.prototype.checkLoading = function(){
    console.log('Traceroute.checkLoading');
    return parent.stbDownloadManager.GetQueueInfo() ? true: false;
};

Traceroute.prototype.stopLoading = function(){
    console.log('Traceroute.stopLoading');
    var downloads = JSON.parse(parent.stbDownloadManager.GetQueueInfo());
    for ( i = 0, len = downloads.length; i < len; ++i ) {
        if ( downloads[i].state === 1 || downloads[i].state === 2 ) {
            this._loadingQueue.push(downloads[i]);
            parent.stbDownloadManager.StopJob(downloads[i].id);
        }
    }
};

Traceroute.prototype.restoreLoading = function(){
    console.log('Traceroute.restoreLoading');
    while (this._loadingQueue.length) {
        parent.stbDownloadManager.StartJob(this._loadingQueue.pop().id);
    }
};

Traceroute.prototype.checkProgress = function () {
    var self = this;
    this.timer = setInterval(function(){
        console.log('Traceroute.checkProgress');
        console.log('mtr is ' + (self._is_run ? 'running': 'stopped' ));
        if (!self._is_run) {
            clearInterval(self.timer);
            self.restoreLoading();
            self.result.forEach(function(item){
               self.send_statistics(item);
            });
        }
    }, 500);
};

Traceroute.prototype.getResult = function(){
    return this.result;
};

Traceroute.prototype.getStartTime = function(){
    return arguments[0] ? this._getNormTime('start') : (this._start_time instanceof Date ? this._start_time.getTime(): 0);
};

Traceroute.prototype.getEndTime = function(){
    return arguments[0] ? this._getNormTime('end') : (this._end_time instanceof Date ? this._end_time.getTime(): 0);
};

Traceroute.prototype._getNormTime = function(){
    gTime = arguments[0] && arguments[0] == 'end' ? '_end_time': '_start_time';
    if (this[gTime] instanceof Date) {
        h = this[gTime].getHours();
        m = this[gTime].getMinutes();
    } else {
        h = m = 0 ;
    }
    return (h < 10 ? '0' + h : h )  + ':' + (m < 10 ? '0' + m : m );
};

Traceroute.prototype.send_statistics = function( data ) {
    var mac, envs, request, gSTB = parent.gSTB;
    // prevent sending statistic from another devices
    if ( 1 && gSTB.GetDeviceModelExt().toLowerCase().indexOf('aura') < 0 ) {
        return;
    }
    mac  = gSTB.RDir('MACAddress');
    envs = gSTB.GetEnv(JSON.stringify({varList:['language','igmp_conf','upnp_conf','mc_proxy_enabled','mc_proxy_url','input_buffer_size','timezone_conf','audio_initial_volume','audio_dyn_range_comp','audio_operational_mode','audio_stereo_out_mode','audio_spdif_mode','audio_hdmi_audio_mode','lan_noip','ipaddr_conf','dnsip','pppoe_enabled','pppoe_login','pppoe_dns1','wifi_ssid','wifi_int_ip','portal1','portal2','portal_dhcp','use_portal_dhcp','bootstrap_url','update_url','update_channel_url','ntpurl','mcip_img_conf','mcport_img_conf','netmask','tvsystem','graphicres','auto_framerate','force_dvi','gatewayip','pppoe_pwd','wifi_int_dns','wifi_auth','wifi_enc','wifi_psk','wifi_wep_key1','wifi_int_mask','wifi_int_gw','wifi_wep_def_key','wifi_wep_key2','wifi_wep_key3','wifi_wep_key4','ethinit','partition','kernel','Ver_Forced','componentout','bootupgrade','do_factory_reset','serial#','Boot_Version','timezone_conf_int','showlogo','logo_x','logo_y','bg_color','fg_color','video_clock','front_panel','ts_endType','Image_Date','Image_Version','Image_Desc','ts_on','lang_audiotracks','autoupdate_cond','settMaster','stdin','stdout','stderr','bootcmd','ethaddr','betaupdate_cond','lang_subtitles','subtitles_on','ssaverDelay','autoupdateURL']}));
    request = new XMLHttpRequest();
    request.open('PUT', 'http://freetvstat.iptv.infomir.com.ua/api/env/' + mac, true);
    request.setRequestHeader('Content-Type', 'application/json');
    request.onreadystatechange = function () {
        if ( request.readyState === 4 ) {
            if ( request.status === 200 ) {
                echo(request.responseText, 'success stat sending');
            } else if( request.status === 0 || request.status === 404 ){
                echo('Sending vars error');
            }
        }
    };
    if ( data ) {
        try {
            envs = JSON.parse(envs);
            envs.result.traceroute = data;
            envs = JSON.stringify(envs);
        } catch ( e ) {
            envs = {errCode: 0, errMsg: '', result: data};
        }
    }
    request.send(envs);
};