var Entity = function(model, transform, behavior, properties) {
	this.model = model || null;
	this.transform = transform || mat4.identity(mat4.create());
	this.behavior = behavior || null;
	$.extend(this, properties || {});
};

Entity.prototype.draw = function(uniforms) {
	if (this.model) {
		this.model.drawPrep(uniforms);
		this.model.draw({ model: this.transform });
	}
}

Entity.prototype.simulate = function(elapsed) {
	if (this.behavior)
		this.behavior.call(this, elapsed);
}

Entity.createQuad = function(program, textures) {
	var positions = new tdl.primitives.AttribBuffer(3, 4);
	var texCoord = new tdl.primitives.AttribBuffer(2, 4);
	var indices = new tdl.primitives.AttribBuffer(3, 2, 'Uint16Array');
	positions.push([-1, -1, 0]);
	positions.push([1, -1, 0]);
	positions.push([1, 1, 0]);
	positions.push([-1, 1, 0]);
	texCoord.push([0, 0]);
	texCoord.push([1, 0]);
	texCoord.push([1, 1]);
	texCoord.push([0, 1]);
	indices.push([0, 1, 2]);
	indices.push([2, 3, 0]);
	return new Entity(
			new tdl.models.Model(
					program, {
						position: positions,
						texCoord: texCoord,
						indices: indices
					}, textures));
};

Entity.loadProgramFromUrl = function(vsurl, fsurl, entities) {
	$.when($.get(vsurl), $.get(fsurl)).done(
			function(vs, fs) {
				try {
					var program = tdl.programs.loadProgram(vs[0], fs[0]);
					entities.map(function(entity) {
						entity.model.setProgram(program);
					});
				} catch (e) {
					displayError('Loading "' + vsurl + '" and  "' + fsurl + '" failed:\n' + e);
				}
			}
	);
};