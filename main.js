(function() {
  var BinaryLoader, Canvas, CanvasFactory, ImageFactory, ImageLoader, MAX_FONT_SIZE, MIN_FONT_SIZE, app, draw_at, express, fs, port, random_image, render_image, set_best_size;

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
    ctx.font = "" + size + "px sans-serif";
    return size;
  };

  draw_at = function(x, y, ctx, message, width) {
    var size;
    size = set_best_size(ctx, message, width);
    ctx.strokeStyle = "rgb(255,255,255)";
    ctx.lineWidth = 1 + (size / MAX_FONT_SIZE * 4);
    ctx.strokeText(message, x, y);
    return ctx.fillText(message, x, y);
  };

  render_image = function(response, message, image_path) {
    response.contentType('image/png');
    return ImageLoader.load(image_path, function(image, error) {
      var bottom, bottom_y, canvas, ctx, max_width, parts, top, top_count, top_y, x;
      canvas = CanvasFactory.createCanvas();
      canvas.width = image.width;
      canvas.height = image.height;
      ctx = canvas.getContext('2d');
      ctx.drawImage(image, 0, 0);
      ctx.textAlign = "center";
      max_width = image.width - 10;
      parts = message.split(" ");
      top_y = 120;
      bottom_y = image.height - 30;
      x = image.width / 2;
      if (parts.length > 1) {
        top_count = Math.ceil(parts.length / 2);
        top = parts.slice(0, top_count);
        bottom = parts.slice(top_count);
        draw_at(x, top_y, ctx, top.join(" "), max_width);
        draw_at(x, bottom_y, ctx, bottom.join(" "), max_width);
      } else {
        draw_at(x, bottom_y, ctx, message, max_width);
      }
      return response.send(canvas.toBuffer());
    });
  };

  random_image = function() {
    var images;
    images = ["/assets/allo.jpg", "/assets/gman.jpg", "/assets/goggles.jpg", "/assets/leader.jpg", "/assets/publicfigure.jpg"];
    return images[Math.floor(Math.random() * images.length)];
  };

  app.get('/:image/:message', function(request, response) {
    var image_path;
    switch (request.params.image) {
      case "a":
        image_path = "/assets/allo.jpg";
        break;
      case "b":
        image_path = "/assets/goggles.jpg";
        break;
      case "c":
        image_path = "/assets/leader.jpg";
        break;
      case "d":
        image_path = "/assets/publicfigure.jpg";
        break;
      default:
        image_path = "/assets/gman.jpg";
    }
    return render_image(response, request.params.message, image_path);
  });

  app.get('/:message', function(request, response) {
    return render_image(response, request.params.message, random_image());
  });

  app.get('/*', function(request, response) {
    return render_image(response, "Pampas grass!", "/assets/gman.jpg");
  });

  port = process.env.PORT || 3000;

  app.listen(port, function() {
    return console.log("Listening on " + port);
  });

  fs = require('fs');

  BinaryLoader = (function() {

    function BinaryLoader() {}

    BinaryLoader.load = function(location, onComplete) {
      var _this = this;
      return fs.readFile(__dirname + location, function(err, data) {
        if (err) {
          console.log("Error loading resource " + location + ": " + err);
        } else {
          console.log("Loaded resource " + location);
        }
        return onComplete(data, err);
      });
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
