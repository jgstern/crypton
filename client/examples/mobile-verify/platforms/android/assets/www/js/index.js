/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

var app = {
  // Application Constructor
  initialize: function() {
    app.enableLoginButtons();
    $('#account-login').show();
    $('#username-login').focus();
    crypton.host = 'nulltxt.se';
    this.utils =  crypton.fingerprintUtils();
    this.bindEvents();
  },

  APPNAME: 'User Verifier',

  URL: 'https://crypton.io',

  get username() { return app.session.account.username },

  get fingerprint() { return app.session.account.fingerprint },
  // Bind Event Listeners
  //
  // Bind any events that are required on startup. Common events are:
  // 'load', 'deviceready', 'offline', and 'online'.
  bindEvents: function() {
    document.addEventListener('deviceready', this.onDeviceReady, false);

    var mainBtnIds = ['my-messages', 'my-fingerprint',
                      'verify-id-card', 'my-contacts',
                      'find-users', 'logout'];

    function hideMainButtons(exceptBtn) {
      if (!exceptBtn) {
        console.error('exceptBtn is required');
        return;
      }
      for (var i = 0; i < mainBtnIds.length; i++) {
        if (mainBtnIds[i] != exceptBtn) {
          var node = $('#' + mainBtnIds[i])[0];
          console.log(node);
          if (node) {
            $(node).hide();
          }
        }
      }
    }

    $('#scan').click(function () {
      app.scanQRCode();
    });

    $('#get-image').click(function () {
      app.getImage();
    });

    $('#logout').click(function () {
      app.logout();
    });

    $("#register-btn").click(function () {
      app.createAccount();
    });

    $("#login-btn").click(function () {
      app.login();
    });

    $('#my-contacts').click(function () {
      hideMainButtons('my-contacts');
      $('.view').hide();
      app.displayContacts();
    });

    $('#verify-id-card').click(function () {
      hideMainButtons('verify-id-card');
      $('.view').hide();
      $('#scan-select').show();
    });

    $('#my-fingerprint').click(function () {
      hideMainButtons('my-fingerprint');
      $('.view').hide();
      $('#my-fingerprint-id').show();
      app.displayMyFingerprint(true);
    });

    $('#find-users').click(function () {
      hideMainButtons('find-users');
      $('.view').hide();
      $('#find-users-view').show();
    });

    $('#find-someone-btn').click(function () {
      app.findSomeone();
      $('#find-someone').focus();
    });

    $('#tasks-btn').click(function (){
      $('.main-btn').show();
      $('.view').hide();
    });

    $('#contacts-detail-dismiss-btn').click(function () {
      $('.contact-id').remove();
      $('#contact-details').hide();
      $('#contacts').show();
    });

    $('#find-someone').keyup(
      function (event) {
        var keycode = (event.keyCode ? event.keyCode : event.which);
        if (event.target == $('#find-someone')[0]) {
          if(keycode == '13'){
            $('#find-someone-btn').focus();
            app.findSomeone();
          }
        }
    });
  },
  // deviceready Event Handler
  //
  // The scope of 'this' is the event. In order to call the 'receivedEvent'
  // function, we must explicity call 'app.receivedEvent(...);'
  onDeviceReady: function() {
    app.enableLoginButtons();
    app.receivedEvent('deviceready');
  },
  // Update DOM on a Received Event
  receivedEvent: function(id) {
    if (!id) {
      console.error("No id provided to receivedEvent");
      return;
    }
    var parentElement = document.getElementById(id);
    if (!parentElement) {
      console.error('Element with id: ' + id + ' does not exist.');
      return;
    }
    var listeningElement = parentElement.querySelector('.listening');
    var receivedElement = parentElement.querySelector('.received');

    listeningElement.setAttribute('style', 'display:none;');
    receivedElement.setAttribute('style', 'display:block;');

    console.log('Received Event: ' + id);
  },

  alert: function (message, level) {
    // success, info, warning, danger
    if (!level) {
      level = 'warning';
    }
    var html = '<div class="alert alert-' + level + '" role="alert">'
                                                  + message
                                                  + '</div>';
    var node = $(html);
    $('#app').append(node);
    window.setTimeout(function () {
      node.fadeOut('slow');
      node.remove();
    }, 3000);
  },

  logout: function () {
    app.session = null;
    $('.view').hide();
    $('.main-btn').hide();
    $('#tasks-btn').hide();
    $('#account-name-label').hide();
    $('#account-name').html("");
    $('#account-login').show();
    $('#login-buttons').show();
    $('#password-login').val("");
    app.alert("You are logged out", 'info');
  },

  scanQRCode: function () {
    cordova.plugins.barcodeScanner.scan(
      function (result) {
        var userObj = JSON.parse(result.text);
        app.verifyUser(userObj.username, userObj.fingerprint);
      },
      function (error) {
        app.alert("Scanning failed: " + error, 'danger');
      }
    );
  },

  getPhoto: function (callback) {
    // via the CAMERA
    function onSuccess (imageURI) {
      console.log(imageURI);
      // XXXddahl: should not have to add to the DOM here!
      // var largeImage = document.getElementById('picture');
      // largeImage.style.display = 'block';
      // largeImage.src = "data:image/jpeg;base64," + imageURI;
      // We need to return an image object
      var img = $('<img />')[0];
      img.src = "data:image/jpeg;base64," + imageURI;
      // img.height = "64";
      // img.width = "48";
      // return this photo to the callback
      callback(null, img);
    }

    function onFail (message) {
      callback(message);
      app.alert('An error occured: ' + message, 'danger');
    }

    //Specify the source to get the photos.
    navigator.camera.getPicture(onSuccess, onFail,
                                { quality: 50,
                                  destinationType:
                                  Camera.DestinationType.DATA_URL,
                                  sourceType:
                                  navigator.camera.PictureSourceType.CAMERA
                                });

  },

  getImage: function () {
    function onSuccess (imageURI) {
      console.log(imageURI);
      var largeImage = document.getElementById('picture');
      largeImage.style.display = 'block';
      largeImage.src = imageURI;

      qrcode.callback = function (data) {
        // alert(data);
        var userObj = JSON.parse(data);
        app.verifyUser(userObj.username, userObj.fingerprint);
      };
      try {
        qrcode.decode(imageURI);
      } catch (e) {
        app.alert('Cannot decode QR code', 'danger');
        console.error(e);
      }
    }

    function onFail (message) {
      app.alert('An error occured: ' + message, 'danger');
    }

    //Specify the source to get the photos.
    navigator.camera.getPicture(onSuccess, onFail,
                                { quality: 100,
                                  destinationType:
                                  Camera.DestinationType.FILE_URI,
                                  sourceType:
                                  navigator.camera.PictureSourceType.SAVEDPHOTOALBUM
                                });
  },

  createAccount: function () {
    $('#login-progress').show();
    var user = $('#username-login').val();
    var pass = $('#password-login').val();
    function callback (err) {
      if (err) {
        $('#login-progress').hide();
        app.setLoginStatus(err);
        return;
      }
      $('.view').hide();
      $('#scan-select').show();
      $('#account-name-label').show();
      $('#account-name').text(user);
      $('#login-progress').hide();
    }

    app.register(user, pass, callback);
  },

  register: function (user, pass, callback) {
    app.setLoginStatus('Generating account...');

    $('#login-progress').show();
    $('#login-buttons').hide();
    crypton.generateAccount(user, pass, function (err) {
      if (err) {
        $('#login-progress').hide();
        $('#login-buttons').show();
        callback(err);
      }
      app.setLoginStatus('Logging in...');
      app.login();
    });
  },

  login: function () {
    $('#login-progress').show();
    $('#login-buttons').hide();
    var user = $('#username-login').val();
    var pass = $('#password-login').val();

    function callback (err, session) {
      if (err) {
        app.alert(err, 'danger');
        $('#login-progress').hide();
        $('#login-buttons').show();
        return;
      }
      $('.view').hide();
      $('#tasks-btn').show();
      $('#account-name').text(user);
      $('#account-name-label').show();
      app.username = user;
      $("#top-menu").show();
      $(".main-btn").show();
      app.session = session;
      $('#login-progress').hide();
      $('#login-buttons').show();
    }

    crypton.authorize(user, pass, function (err, session) {
      if (err) {
        return callback(err);
      }
      return callback(null, session);
    });
  },

  disableLoginButtons: function () {
    $('#login-buttons').hide();
  },

  enableLoginButtons: function () {
    $('#login-buttons').show();
  },

  setLoginStatus: function (m) {
    $('#account-login .status').text(m);
  },

  formatFingerprint: function (fingerprint) {
    return this.utils.createFingerprintArr(fingerprint).join(" ");
  },

  verifyUser: function (username, fingerprint) {
    app.session.getPeer(username, function(err, peer) {
      if (err) {
        app.alert(err, 'danger');
        return;
      }

      var peerFingerprint = app.formatFingerprint(peer.fingerprint);

      if (peerFingerprint == fingerprint) {
        var conf = 'The server supplied fingerprint for '
                 + username
                 + ' is: \n'
                 + peerFingerprint
                 + '\nThe fingerprint from the ID card is :\n'
                 + fingerprint
                 + '\nIt is a MATCH, click OK to verify '
                 + username
                 + ' as a trusted contact.'

        if (window.confirm(conf)) {
          peer.trust(function (err) {
            if (err) {
              console.log('peer trust failed: ' + err);
            } else {
              app.alert('Peer ' + username + ' is now a trusted contact!',
                        'success');
            }
          });
        }
      } else {
        app.alert('The server supplied fingerprint for '
             + username
             + ' is: <br />'
             + peerFingerprint
             + '<br />The fingerprint from the ID card is :<br />'
             + fingerprint
             + '<br />It is NOT A MATCH<br />'
             + username
             + ' *Cannot* be a trusted contact.');
      }
    });
  },

  findSomeone: function () {
    var username = $('#find-someone').val();
    if (!username) {
      var errtxt = "Please enter a username";
      console.error(errtxt);
      app.alert(errtxt, 'danger');
      $('#find-someone-btn').focus();
      return;
    }

    app.getPeer(username, function (err, peer) {
      if (err) {
        return app.alert(err, 'danger');
      }
      var fingerprint = peer.fingerprint;
      app.displayPeerFingerprint(peer.username, fingerprint);
    });
  },

  peers: {},

  getPeer: function (username, callback) {
    if (app.peers[username]) {
      return callback(null, app.peers[username]);
    }

    app.session.getPeer(username, function (err, peer) {
      if (err) {
        return callback(err);
      }

      app.peers[username] = peer;
      callback(null, peer);
    });
  },

  displayPeerFingerprint: function (username, fingerprint) {
    $('#peer-fingerprint-id').children().remove();
    $('.view').hide();
    $('#peer-fingerprint-id').show();

    var canvas =
      app.utils.createIdCard(fingerprint, username,
                             app.APPNAME, app.URL);
    $(canvas).css({ width: '300px'});
    $('#peer-fingerprint-id').append(canvas);
  },

  displayMyFingerprint: function (withPhoto) {
    function displayIdCard(idCard) {
      $(idCard).css({ width: '300px', 'margin-top': '1em'});
      $('#my-fingerprint-id').append(idCard);

      var idCardTitle = app.username + ' ' + app.APPNAME + ' ID Card';
      var base64Img = canvas.toDataURL("image/png");
      var html = '<button id="share-my-id-card" '
               + 'class="btn btn-default">Share My ID Card</button>';

      $('#my-fingerprint-id').append(html);

      $('#share-my-id-card').click(function () {
        window.plugins.socialsharing.share(null, idCardTitle, base64Img, null);
      });
    }

    $('#my-fingerprint-id').children().remove();
    var canvas =
      app.utils.createIdCard(app.fingerprint, app.username,
                             app.APPNAME, app.URL);
    if (withPhoto) {
      app.addPhotoToIdCard(canvas, function (err, idCard) {
        console.log('addPhotoToIdCard callback');
        console.log(idCard);
        if (err) {
          return app.alert(err, 'danger');
        }
        displayIdCard(idCard);
      });
    }
  },

  PHOTO_CONTAINER: '_id_photo',

  addPhotoToIdCard: function (idCard, callback) {
    // check for existing photo:
    app.loadOrCreateContainer(app.PHOTO_CONTAINER,
      function (err, rawContainer) {
        if (err) {
          return callback(err);
        }
        // paste photo into ID:
        function pastePhoto(imageData, idCard) {
          var thumb = app.thumbnail(imageData, 100, 100);
          var ctx = idCard.getContext('2d');
          ctx.drawImage(thumb, 280, 10);
          return idCard;
        }
        var photo = rawContainer;
        if (photo.keys['imgData']) {
          // XXXddahl: try ??
          var photoIdCard = pastePhoto(photo.keys['imgData'], idCard);
          return callback(null, idCard);
        } else {
          app.getPhoto(function (err, image) {
            console.log('getPhoto Callback');
            console.log(image);
            photo.keys['imgData'] = image.src;
            photo.save(function (err){
              if (err) {
                var _err = 'Cannot save photo data to server';
                console.error(_err + ' ' + err);
                return app.alert(_err);
              }
              // photo is saved to the server
              var photoIdCard =
                pastePhoto(photo.keys['imgData'], idCard);
              // console.log(photoIdCard);
              return callback(null, photoIdCard);
            });
          });
        }
    });
  },

  thumbnail: function thumbnail(base64, maxWidth, maxHeight) {

    // Max size for thumbnail
    if(typeof(maxWidth) === 'undefined') var maxWidth = 120;
    if(typeof(maxHeight) === 'undefined') var maxHeight = 120;

    // Create and initialize two canvas
    var canvas = document.createElement("canvas");
    var ctx = canvas.getContext("2d");
    var canvasCopy = document.createElement("canvas");
    var copyContext = canvasCopy.getContext("2d");

    // Create original image
    var img = new Image();
    img.src = base64;

    // Determine new ratio based on max size
    var ratio = 1;
    if(img.width > maxWidth)
      ratio = maxWidth / img.width;
    else if(img.height > maxHeight)
      ratio = maxHeight / img.height;

    // Draw original image in second canvas
    canvasCopy.width = img.width;
    canvasCopy.height = img.height;
    copyContext.drawImage(img, 0, 0);

    // Copy and resize second canvas to first canvas
    canvas.width = img.width * ratio;
    canvas.height = img.height * ratio;
    ctx.drawImage(canvasCopy, 0, 0,
                  canvasCopy.width, canvasCopy.height,
                  0, 0, canvas.width, canvas.height);

    return canvas;
  },

  debugger: {
    deletePhoto: function () {
      app.session.deleteContainer(app.PHOTO_CONTAINER,
        function (err) {
          if (err){
            app.alert(err, 'danger');
          } else {
            app.alert('deleted', 'info'); }
        });
    }
  },

  loadOrCreateContainer: function (containerName, callback) {
    app.session.load(containerName, function (err, container) {
      if (err) {
        return app.session.create(containerName, function (err) {
          if (err) {
            return callback(err);
          }
          app.loadOrCreateContainer(containerName, callback);
        });
      }
      callback(err, container);
    });
  },

  displayContacts: function () {
    console.log("displayContacts()");
    app.getContactsFromServer(function (err, contacts) {
      if (err) {
        app.alert(err, 'danger');
        return;
      }
      $('#contacts').show();
      app._contacts = contacts;
      $('#contacts-list').children().remove();
      for (var name in contacts) {
        var html = '<li id="contact-'
                   + name
                   + '">'
                   + name
                   + '</li>';
        $('#contacts-list').append($(html));
        var id = '#contact-' + name;
        $(id).click(function () {
          app.contactDetails(name);
        });
      }
    });
  },

  contactDetails: function (name) {
    $('#contact-id').remove();
    var contact = app._contacts[name];
    // display the contact's fingerprint ID card:
    var canvas = app.utils.createIdCard(contact.fingerprint,
                                        name,
                                        app.APPNAME, app.URL);
    $(canvas).css({ width: '300px', 'margin-top': '1em'});
    $(canvas).attr({'class': 'contact-id'});
    $('#contact-details').prepend(canvas);
    $('#contacts').hide();
    $('#contact-details').show();
  },

  getContactsFromServer: function (callback) {
    app.session.load(crypton.trustStateContainer,
    function (err, rawContainer) {
      if (err) {
        console.error(err);
        return callback(err);
      }
      app.contactsContainer = rawContainer;
      return callback(null, app.contactsContainer.keys);
    });
  },

  createOrOpenMessage: function (username) {
    // see if we already have a message container for this user:
    // XXXddahl: start indeterminate progressbar??
    var containerName = '_message_' + username;
    app.session.load(containerName,
    function (err, rawContainer) {
      if (err) {
        console.error(err);
        // check if we need to create the container
        if (err == 'Key does not exist') {
          // create new container
          app.session.create(containerName, function (err, rawContainer) {
            if (err) {
              var _err = 'Cannot create container: ' + err;
              console.error(_err);
              return app.alert(_err, 'danger');
            }
            // We have a new container
            return rawContainer;
          });
        }
      } else {
        // XXXddahl: stop indeterminate progressbar??
        return rawContainer;
      }
    });
  },

  displayMessage: function (container) {
    // we have a raw container

  }
};
