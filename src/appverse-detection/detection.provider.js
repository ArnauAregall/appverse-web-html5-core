(function() {
    'use strict';

    /**
     * @ngdoc module
     * @name appverse.detection.provider
     *
     * @description
     * Defines the Detection provider.
     */
    angular.module('appverse.detection.provider', ['appverse.detection.mobile'])

    /**
     * @ngdoc provider
     * @name Detection
     * @module appverse.detection.provider
     *
     * @description
     * Contains methods for browser and network detection.
     */
    .provider('Detection', DetectionProvider);

    function DetectionProvider(MobileDetectorProvider, IONIC_CONFIG) {

        this.mobileDetector = MobileDetectorProvider;
        this.bandwidth = 0;
        this.isPollingBandwidth = false;
        // Injected when the detection service is created
        this.$http = undefined;

        // Get the service
        this.$get = function($http) {
            this.$http = $http;
            return this;
        };

        /**
         * @ngdoc method
         * @name  Detection#hasAppverseMobile
         * @return {Boolean} Whether the application has Appverse mobile or not
         */
        this.hasAppverseMobile = function() {
            return this.mobileDetector.hasAppverseMobile();
        };

        /**
         * @ngdoc method
         * @name  Detection#hasCordova
         * @return {Boolean} Whether the application has cordova or not
         */
        this.hasCordova = function() {
            return this.mobileDetector.hasCordova();
        };

        /**
         * @ngdoc method
         * @name  Detection#isMobileBrowser
         * @return {Boolean} Whether the application is running on a mobile browser
         */
        this.isMobileBrowser = function() {
            return this.mobileDetector.isMobileBrowser();
        };

        // Do some initialization
        if (this.hasAppverseMobile() || this.isMobileBrowser()) {
            // Do something for mobile...
        }

        var fireEvent = function(name, data) {
            var e = document.createEvent("Event");
            e.initEvent(name, true, true);
            e.data = data;
            window.dispatchEvent(e);
        };

        var fetch = function(url, callback) {
            var xhr = new XMLHttpRequest();

            var noResponseTimer = setTimeout(function() {
                xhr.abort();
                fireEvent("connectiontimeout", {});
            }, 5000);

            xhr.onreadystatechange = function() {
                if (xhr.readyState !== 4) {
                    return;
                }

                if (xhr.status === 200) {
                    fireEvent("goodconnection", {});
                    clearTimeout(noResponseTimer);
                    if (callback) {
                        callback(xhr.responseText);
                    }
                } else {
                    fireEvent("connectionerror", {});
                }
            };
            xhr.open("GET", url);
            xhr.send();
        };

        this.isOnline = window.navigator.onLine;
        this.isPollingOnlineStatus = false;

        /**
         * @ngdoc method
         * @name Detection#testOnlineStatus
         *
         * @param {String} path The item URL
         * @description Tries to fetch a file on the server and fire events for fail and success.
         */
        this.testOnlineStatus = function() {
            fetch("resources/detection/ping.json");
        };

        /**
         * @ngdoc method
         * @name Detection#startPollingOnlineStatus
         *
         * @param {number} interval Time in milliseconds
         * @description Tries to fetch a file on the server at regular intervals and fire events for fail and success.
         */
        this.startPollingOnlineStatus = function(interval) {
            this.isPollingOnlineStatus = setInterval(this.testOnlineStatus, interval);
        };

        /**
         * @ngdoc method
         * @name Detection#stopPollingOnlineStatus
         *
         * @description Stops fetching the file from the server.
         */
        this.stopPollingOnlineStatus = function() {
            clearInterval(this.isPollingOnlineStatus);
            this.isPollingOnlineStatus = false;
        };

        /**
         * @ngdoc method
         * @name Detection#testBandwidth
         */
        this.testBandwidth = function() {
            var jsonUrl = "resources/detection/bandwidth.json?bust=" + (new Date()).getTime();
            fireEvent("onBandwidthStart");
            this.$http.get(jsonUrl).success(function(data, status, headersFn) {
                fireEvent("onBandwidthEnd", {
                    status: status,
                    data: data,
                    getResponseHeader: headersFn
                });
            });
        };

        /**
         * @ngdoc method
         * @name Detection#startPollingBandwidth
         *
         * @param {number} interval Time in milliseconds
         */
        this.startPollingBandwidth = function(interval) {
            this.testBandwidth();
            this.isPollingBandwidth = setInterval(this.testBandwidth.bind(this), interval);
        };

        /**
         * @ngdoc method
         * @name Detection#stopPollingBandwidth
         *
         * @param {number} interval Time in milliseconds
         */
        this.stopPollingBandwidth = function() {
            clearInterval(this.isPollingBandwidth);
            this.isPollingBandwidth = false;
        };

        //getTpl function params([String] url of the tpl, [boolean] has mobile view, [boolean] use mobile view in mobile browser)
      this.getTpl = function (tplUrl, hasMobileView, useMobileViewInBrowser){
          if(!hasMobileView){
              if(this.hasCordova()){
                  return '';
              }
              return tplUrl;
          }
          else{
              if(this.hasCordova() || (useMobileViewInBrowser && this.isMobileBrowser())){
                  return tplUrl.split('.html')[0] + IONIC_CONFIG.suffix + '.html';
              }
              else{
                  return tplUrl;
              }
          }
      };

      //getController function params([String]desktop controller, [String] mobile controller if it exists)
      this.getController = function (desktopController, mobileController){
          if(!mobileController){
              return desktopController;
          }
          else{
              if(this.hasCordova() || this.isMobileBrowser()){
                  return mobileController;
              }
              else{
                  return desktopController;
              }
          }
      };
    }


})();
