(function() {
  var ASSETS, BinaryLoader, Canvas, CanvasFactory, ImageFactory, ImageLoader, MAX_FONT_SIZE, MIN_FONT_SIZE, app, buffertools, draw_at, express, fs, http, port, random_image, render_file, render_image, set_best_size, specific_image, url;

  ASSETS = [
    {
      id: "g",
      path: "/assets/gman.jpg"
    }, {
      id: "a",
      path: "/assets/allo.jpg"
    }, {
      id: "b",
      path: "/assets/goggles.jpg"
    }, {
      id: "c",
      path: "/assets/leader.jpg"
    }, {
      id: "d",
      path: "/assets/publicfigure.jpg"
    }
  ];

  Canvas = require('canvas');

  CanvasFactory = (function() {

    function CanvasFactory() {}

    CanvasFactory.createCanvas = function() {
      return new Canvas();
    };

    return CanvasFactory;

  })();

  ImageFactory = (function() {

    function ImageFactory() {}

    ImageFactory.createImage = function() {
      return new Canvas.Image();
    };

    return ImageFactory;

  })();

  express = require('express');

  app = express.createServer(express.logger());

  MAX_FONT_SIZE = 144;

  MIN_FONT_SIZE = 8;

  set_best_size = function(ctx, message, max) {
    var size;
    size = 100;
    ctx.font = "" + size + "px sans-serif";
    if (ctx.measureText(message).width < max) {
      while (ctx.measureText(message).width < max && size < MAX_FONT_SIZE) {
        size = size + 1;
        ctx.font = "" + size + "px sans-serif";
      }
      size = size - 1;
    } else {
      while (ctx.measureText(message).width > max && size > MIN_FONT_SIZE) {
        size = size - 1;
        ctx.font = "" + size + "px sans-serif";
      }
    }
    ctx.font = "" + size + "px DejaVuSans-Bold";
    return size;
  };

  draw_at = function(x, y, ctx, message, width) {
    var size;
    size = set_best_size(ctx, message, width);
    ctx.strokeStyle = "rgb(0, 0, 0)";
    ctx.fillStyle = "rgb(255,255,255)";
    ctx.lineWidth = 1 + (size / MAX_FONT_SIZE * 4);
    ctx.strokeText(message, x, y);
    return ctx.fillText(message, x, y);
  };

  render_image = function(response, message, image) {
    var bottom, bottom_y, canvas, ctx, max_width, parts, top, top_count, top_y, x;
    message = message || "";
    canvas = CanvasFactory.createCanvas();
    ctx = canvas.getContext('2d');
    if (!image) {
      canvas.width = 640;
      canvas.height = 960;
    } else {
      canvas.width = image.width;
      canvas.height = image.height;
      ctx.drawImage(image, 0, 0);
    }
    ctx.textAlign = "center";
    max_width = canvas.width - 10;
    parts = message.split(" ");
    top_y = 120;
    bottom_y = canvas.height - 30;
    x = canvas.width / 2;
    if (parts.length > 1) {
      top_count = Math.floor(parts.length / 2);
      top = parts.slice(0, top_count);
      bottom = parts.slice(top_count);
      draw_at(x, top_y, ctx, top.join(" "), max_width);
      draw_at(x, bottom_y, ctx, bottom.join(" "), max_width);
    } else {
      draw_at(x, bottom_y, ctx, message, max_width);
    }
    response.contentType('image/png');
    return response.send(canvas.toBuffer());
  };

  render_file = function(response, message, image_path) {
    return ImageLoader.load(image_path, function(image, error) {
      if (error) image = null;
      return render_image(response, message, image);
    });
  };

  random_image = function() {
    return ASSETS[Math.floor(Math.random() * ASSETS.length)].path;
  };

  specific_image = function(requested_image) {
    var asset, image_path, _i, _len;
    image_path = ASSETS[0].path;
    for (_i = 0, _len = ASSETS.length; _i < _len; _i++) {
      asset = ASSETS[_i];
      if (asset.id === requested_image) {
        image_path = asset.path;
        break;
      }
    }
    return image_path;
  };

  app.get(/\/grab\/(.+)/, function(request, response) {
    var last, message, url;
    last = request.params[0].lastIndexOf('/');
    url = request.params[0].substring(0, last);
    message = request.params[0].substring(last + 1);
    message = message.replace(/\.png$/i, '');
    if (!/^http:\/\/.+$/i.test(url)) url = "http://" + url;
    return render_file(response, message, url);
  });

  app.get('/:image/:message.png', function(request, response) {
    return render_file(response, request.params.message, specific_image(request.params.image));
  });

  app.get('/:image/:message', function(request, response) {
    return render_file(response, request.params.message, specific_image(request.params.image));
  });

  app.get('/:message.png', function(request, response) {
    return render_file(response, request.params.message, random_image());
  });

  app.get('/:message', function(request, response) {
    return render_file(response, request.params.message, random_image());
  });

  app.get('/*', function(request, response) {
    return render_file(response, "Pampas grass!", ASSETS[0].path);
  });

  port = process.env.PORT || 3000;

  app.listen(port, function() {
    return console.log("Listening on " + port);
  });

  fs = require('fs');

  buffertools = require('buffertools');

  url = require('url');

  http = require('http');

  BinaryLoader = (function() {

    function BinaryLoader() {}

    BinaryLoader.load = function(location, onComplete) {
      var options, request,
        _this = this;
      if (/^http:\/\/.+$/i.test(location)) {
        console.log("BinaryLoader loading remote:");
        try {
          options = url.parse(location);
        } catch (error) {
          console.log("BinaryLoader url malformed: " + error);
          onComplete(null, error);
          return;
        }
        console.dir(options);
        request = http.get(options, function(response) {
          var buffer;
          buffer = new Buffer(0);
          response.on('data', function(chunk) {
            return buffer = buffer.concat(chunk);
          });
          return response.on('end', function() {
            return onComplete(buffer, null);
          });
        });
        return request.on('error', function(e) {
          return onComplete(null, e);
        });
      } else {
        console.log("BinaryLoader loading local: " + location);
        return fs.readFile(__dirname + location, function(err, data) {
          if (err) {
            console.log("Error loading resource " + location + ": " + err);
          } else {
            console.log("Loaded resource " + location);
          }
          return onComplete(data, err);
        });
      }
    };

    return BinaryLoader;

  })();

  ImageLoader = (function() {

    function ImageLoader() {}

    ImageLoader.load = function(location, onComplete) {
      var image,
        _this = this;
      image = ImageFactory.createImage();
      return BinaryLoader.load(location, function(data, err) {
        if (!err) image.src = data;
        return onComplete(image, err);
      });
    };

    return ImageLoader;

  })();

}).call(this);
