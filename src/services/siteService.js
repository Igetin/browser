﻿function SiteService(cryptoService, userService, apiService) {
    this.cryptoService = cryptoService;
    this.userService = userService;
    this.apiService = apiService;

    initSiteService();
};

function initSiteService() {
    this.userService.getUserId(function (userId) {
        var sitesKey = 'sites_' + userId;

        SiteService.prototype.get = function (id, callback) {
            if (!callback || typeof callback !== 'function') {
                throw 'callback function required';
            }

            chrome.storage.local.get(sitesKey, function (obj) {
                var sites = obj[sitesKey];
                if (id in sites) {
                    callback(new Site(sites[id]));
                    return;
                }

                callback(null);
            });
        };

        SiteService.prototype.getAll = function (callback) {
            if (!callback || typeof callback !== 'function') {
                throw 'callback function required';
            }

            chrome.storage.local.get(sitesKey, function (obj) {
                var sites = obj[sitesKey];
                var response = [];
                for (var id in sites) {
                    response.push(new Site(sites[id]));
                }

                callback(response);
            });
        };

        SiteService.prototype.save = function (site, callback) {
            if (!callback || typeof callback !== 'function') {
                throw 'callback function required';
            }

            var newRecord = site.id === null,
                self = this;

            var request = new SiteRequest(site);
            if (newRecord) {
                self.apiService.postSite(request, apiSuccess, handleError);
            }
            else {
                self.apiService.putSite(site.id, request, apiSuccess, handleError);
            }

            function apiSuccess(response) {
                userService.getUserId(function (userId) {
                    var data = new SiteData(response, userId);

                    chrome.storage.local.get(sitesKey, function (obj) {
                        var sites = obj[sitesKey];
                        if (!newRecord && site.id in sites) {
                            sites[site.id] = data;
                        }
                        else {
                            sites.push(data);
                            site.id = data.id;
                        }

                        obj[sitesKey] = sites;
                        chrome.storage.local.set(obj, function () {
                            callback(site);
                        });
                    });
                });
            }
        };

        SiteService.prototype.delete = function (id, callback) {
            if (!callback || typeof callback !== 'function') {
                throw 'callback function required';
            }

            self.apiService.deleteCipher(id, apiSuccess, handleError);

            function apiSuccess(response) {
                userService.getUserId(function (userId) {
                    chrome.storage.local.get(sitesKey, function (obj) {
                        var sites = obj[sitesKey];
                        if (id in sites) {
                            var index = sites.indexOf(sites[id]);
                            sites.splice(index, 1);

                            obj[sitesKey] = sites;
                            chrome.storage.local.set(obj, function () {
                                callback();
                            });
                        }
                        else {
                            callback();
                        }
                    });
                });
            }
        };

        function handleError() {
            // TODO: check for unauth or forbidden and logout
        }
    });
};