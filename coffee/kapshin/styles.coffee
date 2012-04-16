# Default style. Can be used as a template for new styles
DEFAULT = {
    canvas: {
        width: 256,
        height: 256,
        color: 'rgb(0, 0, 0)',
    },
    text: {
        allow_above: true,
        allow_middle: false,
        allow_below: true,
        outline_color: 'rgb(0, 0, 0)',
        fill_color: 'rgb(255,255,255)',
        font: 'DejaVuSans-Bold',
        font_max: 144,
        font_min: 18,
    },
    default: {
        url: 'http://farm3.staticflickr.com/2517/5719666754_556894820b_b.jpg',
        message: 'Wat',
    },
}

# Hash lookup for the styles
STYLES = {
    default: DEFAULT,
}
