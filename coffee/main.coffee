express = require('express')
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
    ctx.font = "#{size}px DejaVuSans-Bold"
    return size

## Draws a message at a specifc point while trying to fit it in the width
draw_at = (x, y, ctx, message, width) ->
    size = set_best_size ctx, message, width
    ctx.strokeStyle = "rgb(0, 0, 0)"
    ctx.fillStyle = "rgb(255,255,255)"
    ctx.lineWidth = 1 + (size / MAX_FONT_SIZE * 4)
    ctx.strokeText message, x, y
    ctx.fillText message, x, y

## Render the image and text and return a png to the response
render_image = (response, message, image) ->
    message = message || ""
    canvas = CanvasFactory.createCanvas()
    ctx = canvas.getContext('2d')
    if not image
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
        top_count = Math.floor(parts.length / 2)
        top = parts.slice(0, top_count)
        bottom = parts.slice(top_count)

        draw_at x, top_y, ctx, top.join(" "), max_width
        draw_at x, bottom_y, ctx, bottom.join(" "), max_width
    else
        draw_at x, bottom_y, ctx, message, max_width

    response.contentType('image/png')
    response.send canvas.toBuffer()

render_file = (response, message, image_path) ->
    ImageLoader.load image_path, (image, error) ->
        if error
            image = null

        render_image(response, message, image)

## Pick a random image
random_image = ->
    return ASSETS[Math.floor(Math.random() * ASSETS.length)].path

specific_image = (requested_image) ->
    image_path = ASSETS[0].path

    for asset in ASSETS
        if asset.id == requested_image
            image_path = asset.path
            break

    return image_path

########################################
## Routing
########################################

## Remote image
app.get /\/grab\/(.+)/, (request, response) ->
    last = request.params[0].lastIndexOf '/'
    url = request.params[0].substring(0, last)
    message = request.params[0].substring(last + 1)

    message = message.replace(/\.png$/i, '')
    url = "http://#{url}" unless /^http:\/\/.+$/i.test(url)

    render_file response, message, url

## Specific image with a message
app.get '/:image/:message.png', (request, response) ->
    render_file response, request.params.message, specific_image(request.params.image)

app.get '/:image/:message', (request, response) ->
    render_file response, request.params.message, specific_image(request.params.image)

## Just supplying a message will use a random image
app.get '/:message.png', (request, response) ->
    render_file response, request.params.message, random_image()

app.get '/:message', (request, response) ->
    render_file response, request.params.message, random_image()

## Catch anything else
app.get '/*', (request, response) ->
    render_file response, "Pampas grass!", ASSETS[0].path

## Start listening
port = process.env.PORT || 3000
app.listen port, ->
    console.log "Listening on #{port}"

