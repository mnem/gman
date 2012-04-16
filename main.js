(function() {
  var ASSETS, BinaryLoader, Canvas, CanvasFactory, DEFAULT, ImageFactory, ImageLoader, MAX_FONT_SIZE, MIN_FONT_SIZE, STYLES, app, big_blank_canvas, buffertools, char_is_uppercase, create_canvas_from_image, create_output_canvas, draw_at, draw_background, draw_image, draw_message, draw_overlay, express, fs, http, kapshin_request, message_split_by_caps, port, random_image, render_file, render_image, set_best_size, specific_image, split_message, url, write_canvas_to_response;

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

  write_canvas_to_response = function(response, canvas) {
    response.contentType('image/png');
    return response.send(canvas.toBuffer());
  };

  create_output_canvas = function(style_config) {
    var output_canvas, output_context;
    output_canvas = CanvasFactory.createCanvas();
    output_context = output_canvas.getContext('2d');
    output_canvas.width = style_config.canvas.width;
    output_canvas.height = style_config.canvas.height;
    return [output_canvas, output_context];
  };

  char_is_uppercase = function(char) {
    var upper;
    if ('., ;:|\'"{}[]-_=+)(*&^%$£@!~`<>\\/'.indexOf(char) !== -1) {
      return false;
    } else {
      upper = char.toUpperCase();
      return upper === char;
    }
  };

  message_split_by_caps = function(message) {
    var caps_run, index, result, _ref;
    result = [message];
    caps_run = 0;
    for (index = 0, _ref = message.length; 0 <= _ref ? index <= _ref : index >= _ref; 0 <= _ref ? index++ : index--) {
      if (char_is_uppercase(message.charAt(index))) {
        caps_run++;
      } else {
        if (caps_run > 1) {
          caps_run++;
          result = [message.substring(0, caps_run).trim(), message.substring(caps_run).trim()];
        }
      }
    }
    return result;
  };

  split_message = function(style_config, message) {
    return message_split_by_caps(message.trim());
  };

  draw_background = function(style_config, output_context) {
    output_context.fillStyle = style_config.canvas.color;
    return output_context.fillRect(0, 0, style_config.canvas.width, style_config.canvas.height);
  };

  draw_image = function(style_config, output_context, url, next_step) {
    return next_step();
  };

  draw_message = function(style_config, output_context, messages) {
    var font_size, message, x, y, _i, _len, _results;
    font_size = style_config.text.font_min;
    output_context.font = "" + font_size + "px " + style_config.text.font;
    x = 18;
    y = 18;
    _results = [];
    for (_i = 0, _len = messages.length; _i < _len; _i++) {
      message = messages[_i];
      if (style_config.text.outline_color !== null) {
        output_context.strokeStyle = style_config.text.outline_color;
        output_context.lineWidth = 1 + (font_size / style_config.text.font_max * 4);
        output_context.strokeText(message, x, y);
      }
      if (style_config.text.fill_color !== null) {
        output_context.fillStyle = style_config.text.fill_color;
        output_context.fillText(message, x, y);
      }
      _results.push(y += font_size);
    }
    return _results;
  };

  draw_overlay = function(style_config, output_context) {};

  kapshin_request = function(response, style, url, message) {
    var message_groups, output_canvas, output_context, style_config, _ref;
    style_config = STYLES[style.toLowerCase()] || STYLES["default"];
    message_groups = split_message(style_config, message || style_config.default_message);
    _ref = create_output_canvas(style_config), output_canvas = _ref[0], output_context = _ref[1];
    draw_background(style_config, output_context);
    return draw_image(style_config, output_context, url || style_config.default_url, function() {
      draw_message(style_config, output_context, message_groups);
      draw_overlay(style_config, output_context);
      return write_canvas_to_response(response, output_canvas);
    });
  };

  DEFAULT = {
    canvas: {
      width: 256,
      height: 256,
      color: 'rgb(0, 0, 0)'
    },
    text: {
      allow_above: true,
      allow_middle: false,
      allow_below: true,
      outline_color: 'rgb(0, 0, 0)',
      fill_color: 'rgb(255,255,255)',
      font: 'DejaVuSans-Bold',
      font_max: 144,
      font_min: 18
    },
    "default": {
      url: 'http://farm3.staticflickr.com/2517/5719666754_556894820b_b.jpg',
      message: 'Wat'
    }
  };

  STYLES = {
    "default": DEFAULT
  };

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

  big_blank_canvas = function() {
    var canvas;
    canvas = CanvasFactory.createCanvas();
    canvas.width = 640;
    canvas.height = 960;
    return canvas;
  };

  create_canvas_from_image = function(image) {
    var canvas, ctx;
    if (!image) return big_blank_canvas();
    canvas = CanvasFactory.createCanvas();
    canvas.width = image.width;
    canvas.height = image.height;
    try {
      ctx = canvas.getContext('2d');
      ctx.drawImage(image, 0, 0);
    } catch (error) {
      console.log("Error drawing image: " + error);
      canvas = big_blank_canvas();
    }
    return canvas;
  };

  render_image = function(response, message, image) {
    var bottom, bottom_y, canvas, ctx, max_width, parts, top, top_count, top_y, x;
    message = message || "";
    canvas = create_canvas_from_image(image);
    ctx = canvas.getContext('2d');
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

  app.get('/kap/:style/:url/:message.png', function(request, response) {
    return kapshin_request(response, request.params.style, request.params.url, request.params.message);
  });

  app.get('/kap/:style/:url/:message', function(request, response) {
    return kapshin_request(response, request.params.style, request.params.url, request.params.message);
  });

  app.get('/*', function(request, response) {
    return response.redirect("http://kapshin.com/");
  });

  port = process.env.PORT || 3000;

  app.listen(port, function() {
    return console.log("Listening on " + port);
  });

}).call(this);
