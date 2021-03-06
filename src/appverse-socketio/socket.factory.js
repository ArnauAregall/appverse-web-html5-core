(function () {
    'use strict';

    angular.module('appverse.socketio')

    /**
     * @ngdoc service
     * @name SocketFactory
     * @module appverse.serverPush
     * @description
     * Although Socket.IO exposes an io variable on the window, it's better to encapsulate it
     * into the AngularJS's Dependency Injection system.
     * So, we'll start by writing a factory to wrap the socket object returned by Socket.IO.
     * This will make easier to test the application's controllers.
     * Notice that the factory wrap each socket callback in $scope.$apply.
     * This tells AngularJS that it needs to check the state of the application and update
     * the templates if there was a change after running the callback passed to it by using dirty checking.
     * Internally, $http works in the same way. After some XHR returns, it calls $scope.$apply,
     * so that AngularJS can update its views accordingly.
     *
     * @requires https://docs.angularjs.org/api/ng/service/$rootScope $rootScope
     * @requires Socket
     */
    .factory('SocketFactory',
        function ($rootScope, Socket) {
            var factory = {};

            /**
                 @ngdoc method
                 @name SocketFactory#listen
                 @param {string} eventName The name of the event/channel to be listened
                 The communication is bound to rootScope.
                 @param {object} callback The function to be passed as callback.
                 @description Establishes a communication listening an event/channel from server.
                 Use this method for background communication although the current scope is destyroyed.
                 You should cancel communication manually or when the $rootScope object is destroyed.
                 */
            factory.listen = function (eventName, callback) {
                Socket.on(eventName, function () {
                    var args = arguments;
                    $rootScope.$apply(function () {
                        callback.apply(Socket, args);
                    });
                });
            };

            /**
                 @ngdoc method
                 @name SocketFactory#sendMessage
                 @param {string} eventName The name of the event/channel to be sent to server
                 @param {object} scope The scope object to be bound to the listening.
                 The communication will be cancelled when the scope is destroyed.
                 @param {object} callback The function to be passed as callback.
                 @description Establishes a communication listening an event/channel from server.
                 It is bound to a given $scope object.
                 */
            factory.sendMessage = function (eventName, data, callback) {
                Socket.emit(eventName, data, function () {
                    var args = arguments;
                    $rootScope.$apply(function () {
                        if (callback) {
                            callback.apply(Socket, args);
                        }
                    });
                });
            };

            /**
                 @ngdoc method
                 @name SocketFactory#unsubscribeCommunication
                 @param {object} callback The function to be passed as callback.
                 @description Cancels all communications to server.
                 The communication will be cancelled without regarding other consideration.
                 */
            factory.unsubscribeCommunication = function (callback) {
                Socket.off(callback());
            };


            return factory;

        });

})();