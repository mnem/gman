fs = require('fs')
buffertools = require('buffertools')
url = require('url')
http = require('http')

class BinaryLoader
    # onComplete(data, error)
    @load: (location, onComplete) ->
        if /^http:\/\/.+$/i.test location
            # Remote
            console.log "BinaryLoader loading remote:"
            try
                options = url.parse location
            catch error
                console.log "BinaryLoader url malformed: #{error}"
                onComplete null, error
                return

            console.dir options
            request = http.get options, (response) ->
                buffer = new Buffer 0

                response.on 'data', (chunk) ->
                    buffer = buffer.concat(chunk)

                response.on 'end', ->
                    onComplete(buffer, null)

            request.on 'error', (e) ->
                onComplete null, e
        else
            # Local
            console.log "BinaryLoader loading local: #{location}"
            fs.readFile __dirname + location, (err, data) =>
                if (err)
                    console.log "Error loading resource #{location}: #{err}"
                else
                    console.log "Loaded resource #{location}"
                onComplete(data, err)

class ImageLoader
    # onComplete(data, error)
    @load: (location, onComplete) ->
        image = ImageFactory.createImage()
        BinaryLoader.load location, (data, err) =>
            image.src = data unless err
            onComplete(image, err)
