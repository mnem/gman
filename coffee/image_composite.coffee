##
# ImageComposite renders a semi-transparent shading canvas over a solid
# color area. The color may be dynamically modified and the canvas may
# be redrawn by calling the composite() method. If the color is set by
# calling updateColor, the image is automatically re-composited
#
# An ImageComposite instance may be added to the DOM by appending the
# element instance member to the document. element is a canvas node.
##
class ImageComposite
    ##
    # Constructs a new image composite object. An image composite is
    # constructed from a flat colorable area over which the shading
    # canvas is drawn.
    ##
    constructor: () ->
        @element = CanvasFactory.createCanvas()
        @elementContext = @element.getContext("2d")
        @color = null

    ##
    # Updates the color and recomposites the image
    ##
    updateColor: (@color) ->
        @composite()

    ##
    # Updates the color and recomposites the image
    ##
    updateComponents: (@shadingCanvas, @colorableCanvas, color = null) ->
        @color = color unless color == null
        @element.width = @shadingCanvas.width
        @element.height = @shadingCanvas.height
        @composite()

    ##
    # Re-generates the composite. Must be called after changing
    # the colour in order to see the changes
    ##
    composite: ->
        ## Uncomment to display performance data
        # t_before = new Date()
        @elementContext.globalCompositeOperation = 'source-over'
        @elementContext.fillStyle = @color
        @elementContext.fillRect(0, 0, @element.width, @element.height)

        # Generate the colour fill
        if @colorableCanvas
            @elementContext.globalCompositeOperation = 'destination-in'
            @elementContext.drawImage(@colorableCanvas, 0, 0)

        # Add the shadow
        if @shadingCanvas
            @elementContext.globalCompositeOperation = 'source-over'
            @elementContext.drawImage(@shadingCanvas, 0, 0)

        ## Uncomment to display performance data
        # t_after = new Date()
        # console.log "Compositing time: " + (t_after.getTime() - t_before.getTime())

    updateComponentsWithSheet: (sheet, color = null) ->
        [shadingComp, colorComp] = ImageComposite.extractShadingAndColorFrom1byNSpritesheet(sheet)
        @updateComponents(shadingComp, colorComp, color)

    ##
    # Static method to extract the shading and color images from a single
    # specifically formatted source image.
    #
    # Any gray pixels in the source image are used to create the
    # shading mask. The colorable area is simply any visible pixel
    # in the source.
    ##
    @extractShadingAndColorFrom1byNSpritesheet: (sheet) ->
        ## Uncomment to display performance data
        # t_before = new Date()
        # Assuming that the spritesheet is a single column for now
        shadingCanvas = CanvasFactory.createCanvas()
        shadingCanvas.width = sheet.width
        shadingCanvas.height = sheet.width
        shadingContext = shadingCanvas.getContext("2d")
        shadingContext.drawImage(sheet, 0, 0)

        colorableCanvas = CanvasFactory.createCanvas()
        colorableCanvas.width = sheet.width
        colorableCanvas.height = sheet.width
        colorableContext = colorableCanvas.getContext("2d")
        colorableContext.drawImage(sheet, 0, -sheet.width)
        ## Uncomment to display performance data
        # t_after = new Date()
        # console.log "Sheet shading and colour calculation time: " + (t_after.getTime() - t_before.getTime())

        [shadingCanvas, colorableCanvas]
