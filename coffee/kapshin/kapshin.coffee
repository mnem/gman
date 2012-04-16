write_canvas_to_response = (response, canvas) ->
    response.contentType 'image/png'
    response.send canvas.toBuffer()

create_output_canvas = (style_config) ->
    # Create the output canvas
    output_canvas = CanvasFactory.createCanvas()
    output_context = output_canvas.getContext '2d'

    # Setup the basic canvas
    output_canvas.width = style_config.canvas.width
    output_canvas.height = style_config.canvas.height

    [output_canvas, output_context]

char_is_uppercase = (char) ->
    if '., ;:|\'"{}[]-_=+)(*&^%$£@!~`<>\\/'.indexOf(char) != -1
        return false
    else
        upper = char.toUpperCase()
        return upper == char

message_split_by_caps = (message) ->
    # The general algorithm is for the first
    # run of capital letters to be in the
    # first group, everthing else goes in the
    # second. For a run to be valid, it must
    # have more than 1 capital letter.
    result = [message]
    caps_run = 0
    for index in [0..message.length]
        if char_is_uppercase(message.charAt(index))
            caps_run++
        else
            # End of run, decide what to do
            if caps_run > 1
                caps_run++
                result = [message.substring(0, caps_run).trim(), message.substring(caps_run).trim()]
    result

split_message = (style_config, message) ->
    message_split_by_caps message.trim()

draw_background = (style_config, output_context) ->
    output_context.fillStyle = style_config.canvas.color
    output_context.fillRect 0, 0, style_config.canvas.width, style_config.canvas.height

draw_image = (style_config, output_context, url, next_step) ->
    next_step()

draw_message = (style_config, output_context, messages) ->
    font_size = style_config.text.font_min
    output_context.font = "#{font_size}px #{style_config.text.font}"

    x = 18
    y = 18

    for message in messages
        if style_config.text.outline_color != null
            output_context.strokeStyle = style_config.text.outline_color
            output_context.lineWidth = 1 + (font_size / style_config.text.font_max * 4)
            output_context.strokeText message, x, y

        if style_config.text.fill_color != null
            output_context.fillStyle = style_config.text.fill_color
            output_context.fillText message, x, y

        y += font_size

draw_overlay = (style_config, output_context) ->
    # No overlays just now

kapshin_request = (response, style, url, message) ->
    # Choose what style to return the image in
    style_config = STYLES[style.toLowerCase()] || STYLES.default

    # Group the message
    message_groups = split_message style_config, message || style_config.default_message

    # Create the output canvas
    [output_canvas, output_context] = create_output_canvas style_config

    # Draw stuff
    draw_background style_config, output_context

    # Draw image calls the next steps because it's asynchronous
    draw_image style_config, output_context, url || style_config.default_url, ->
        draw_message style_config, output_context, message_groups
        draw_overlay style_config, output_context

        # Chuck the result back
        write_canvas_to_response response, output_canvas
