var Monitor = function(programs, textures) {
	var n = textures.length;
	this.textures = []; 
	for (var i = 0; i != n; i++) {
		var transform = mat4.identity(mat4.create());
		mat4.translate(transform, [i*(2/n) - (n-1)/n, 0, 0]);
		mat4.scale(transform, [0.9/n, 0.9/n, 1]);
		this.textures.push({
			texture: textures[i],
			transform: transform
		});
	}
	this.quad = Entity.createQuad(programs[2], { colorBuffer: null});
//    Entity.loadProgramFromUrl('monitor.vs', 'monitor.fs', [this.quad]);
};

Monitor.prototype.draw = function() {
	var n = this.textures.length;
	for (var i = 0; i != n; i++) {
		this.quad.transform = this.textures[i].transform;
		this.quad.model.textures = this.textures[i].texture;
		this.quad.draw();
	}	
};