express = require('express');
app = express.createServer express.logger()

## When working out the best fit, keep the font between these sizes
MAX_FONT_SIZE = 144
MIN_FONT_SIZE = 8

## Work out the best fit
set_best_size = (ctx, message, max) ->
    size = 100
    ctx.font = "#{size}px sans-serif"
    if ctx.measureText(message).width < max
        # Expand to fit
        while ctx.measureText(message).width < max and size < MAX_FONT_SIZE
            size = size + 1
            ctx.font = "#{size}px sans-serif"
        size = size - 1
    else
        # Shrink to fit
        while ctx.measureText(message).width > max and size > MIN_FONT_SIZE
            size = size - 1
            ctx.font = "#{size}px sans-serif"
    ctx.font = "#{size}px sans-serif"
    return size

## Draws a message at a specifc point while trying to fit it in the width
draw_at = (x, y, ctx, message, width) ->
    size = set_best_size ctx, message, width
    ctx.strokeStyle = "rgb(255,255,255)"
    ctx.lineWidth = 1 + (size / MAX_FONT_SIZE * 4)
    ctx.strokeText message, x, y
    ctx.fillText message, x, y

## Render the image and text and return a png to the response
render_image = (response, message, image_path) ->
    response.contentType('image/png')
    ImageLoader.load image_path, (image, error) ->
        canvas = CanvasFactory.createCanvas()
        ctx = canvas.getContext('2d')
        if error
            canvas.width = 640
            canvas.height = 960
        else
            canvas.width = image.width
            canvas.height = image.height
            ctx.drawImage(image, 0, 0)

        ctx.textAlign = "center"

        max_width = canvas.width - 10
        parts = message.split " "
        top_y = 120
        bottom_y = canvas.height - 30
        x = canvas.width / 2

        if parts.length > 1
            top_count = Math.ceil(parts.length / 2)
            top = parts.slice(0, top_count)
            bottom = parts.slice(top_count)

            draw_at x, top_y, ctx, top.join(" "), max_width
            draw_at x, bottom_y, ctx, bottom.join(" "), max_width
        else
            draw_at x, bottom_y, ctx, message, max_width

        response.send canvas.toBuffer()

## Pick a random image
random_image = ->
    return ASSETS[Math.floor(Math.random() * ASSETS.length)].path

########################################
## Routing
########################################

## Specific image with a message
app.get '/:image/:message', (request, response) ->
    image_path = ASSETS[0].path

    for asset in ASSETS
        if asset.id == request.params.image
            image_path = asset.path
            break

    render_image response, request.params.message, image_path

## Just supplying a message will use a random image
app.get '/:message', (request, response) ->
    render_image response, request.params.message, random_image()

## Catch anything else
app.get '/*', (request, response) ->
    render_image response, "Pampas grass!", ASSETS[0].path

## Start listening
port = process.env.PORT || 3000
app.listen port, ->
    console.log "Listening on #{port}"

