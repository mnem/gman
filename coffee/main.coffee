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

big_blank_canvas = ->
    canvas = CanvasFactory.createCanvas()
    canvas.width = 640
    canvas.height = 960
    return canvas

create_canvas_from_image = (image) ->
    if not image
        return big_blank_canvas()

    canvas = CanvasFactory.createCanvas()
    canvas.width = image.width
    canvas.height = image.height

    try
        ctx = canvas.getContext('2d')
        ctx.drawImage(image, 0, 0)
    catch error
        console.log "Error drawing image: #{error}"
        canvas = big_blank_canvas()

    return canvas

## Render the image and text and return a png to the response
render_image = (response, message, image) ->
    message = message || ""

    canvas = create_canvas_from_image image
    ctx = canvas.getContext('2d')

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

app.get '/kap/:style/:url/:message.png', (request, response) ->
    kapshin_request  response, request.params.style, request.params.url, request.params.message

app.get '/kap/:style/:url/:message', (request, response) ->
    kapshin_request  response, request.params.style, request.params.url, request.params.message

app.get '/*', (request, response) ->
    response.redirect "http://kapshin.com/"

## Start listening
port = process.env.PORT || 3000
app.listen port, ->
    console.log "Listening on #{port}"

