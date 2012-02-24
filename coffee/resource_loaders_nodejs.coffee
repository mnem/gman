fs = require('fs')

class BinaryLoader
    # onComplete(data, error)
    @load: (location, onComplete) ->
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
