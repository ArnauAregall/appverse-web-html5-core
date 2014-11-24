(function() {'use strict';

//////////////////////// COMMON API - MAIN //////////////////////////
// The Main module includes other API modules:
// - Bootstrap-based styling and gadgets
// - Routing
// - External Configuration
// - REST Integration
// - Cache Service
// - ServerPush
// - Security
// - Internationalization
// - Logging
/////////////////////////////////////////////////////////////////////

var requires = [
    'AppConfiguration',
];

var optional = [
    'AppDetection',
    'AppREST',
    'AppTranslate',
    'AppModal',
    'AppLogging',
    'AppServerPush',
    'AppSecurity',
    'AppCache',
    'AppPerformance',
    'AppRouter'
];


/**
 * Main module.
 * Bootstraps the application by integrating services that have any relation.
 */
angular.module('COMMONAPI', generateDependencies())
    .config(config)
    .run(run);

/**
 * Preliminary configuration.
 *
 * Configures the integration between modules that need to be integrated
 * at the config phase.
 */
function config($compileProvider, $injector) {
    $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|itms-services):/);

    if (moduleExists('AppDetection')) {
        var detectionProvider = $injector.get('DetectionProvider');
        var configLoaderProvider = $injector.get('ConfigLoaderProvider');
        configLoaderProvider.setDetection(detectionProvider);
    }

    if (moduleExists('AppLogging') && moduleExists('AppDetection')) {
        var detectionProvider = $injector.get('DetectionProvider');
        var formattedLoggerProvider = $injector.get('formattedLoggerProvider');
        formattedLoggerProvider.setDetection(detectionProvider);
    }
}

/**
 * Main
 *
 * Runs integration tasks between modules that can be integrated
 * at run phase
 */
function run($injector, $log, SECURITY_GENERAL) {
    if (moduleExists('AppREST')) {
        initializeRestAndSecurity($injector, $log, SECURITY_GENERAL);
        initializeRestAndCache($injector);
    }
}


function initializeRestAndSecurity($injector, $log,  SECURITY_GENERAL) {
    var restService = $injector.get('RESTFactory');

    if (moduleExists('AppSecurity')) {
        var oauthRequestWrapperService = $injector.get('Oauth_RequestWrapper');
        if (SECURITY_GENERAL.securityEnabled){
            restService.wrapRequestsWith(oauthRequestWrapperService);
            $log.debug( "REST communication is secure. Security is enabled." +
                " REST requests will be wrapped with authorization headers.");
            return;
        }
    }

    restService.enableDefaultContentType();
    $log.debug("REST communication is not secure. Security is not enabled.");
}


function initializeRestAndCache($injector) {
    var restService = $injector.get('RESTFactory');

    if (moduleExists('AppCache')) {
        var CacheFactory = $injector.get('CacheFactory');
        var cache = CacheFactory.getHttpCache();
        restService.setCache(cache);
    }
}

/**
 * Only pushes required and loaded optional modules
 * to the dependencies list
 *
 * @return {array} List of module dependencies
 */
function generateDependencies() {
    var dependencies = requires;
    angular.forEach(optional, function (module) {
        if (moduleExists(module)) {
            dependencies.push(module);
        }
    });
    return dependencies;
}


function moduleExists(name) {
    try {
        angular.module(name);
        return true;
    } catch (e) {
        return false;
    }
}


})();
