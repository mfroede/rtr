precision highp float;

varying vec2 texCoordI;
uniform sampler2D colorBuffer;

void main() {
	gl_FragColor.rgb = texture2D(colorBuffer, texCoordI).rgb;
	gl_FragColor.a = 1.0;
}