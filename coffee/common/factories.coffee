Canvas = require('canvas')

class CanvasFactory
	@createCanvas: ->
		return new Canvas()

class ImageFactory
	@createImage: ->
		return new Canvas.Image()
