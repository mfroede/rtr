var Camera = function(position, arcX, arcY) {
	this.position = position;
	this.arcX = arcX;
	this.arcY = arcY;
	this.fw = false;
	this.bw = false;
	this.l = false;
	this.r = false;
}

Camera.prototype.getTransformationMatrix = function() {
	var result = mat4.create();
	if(this.fw) {
		this.position[2] += 0.5;
	}
	if(this.bw) {
		this.position[2] -= 0.5;
	}
	if(this.r) {
		this.position[0] -= 0.5;
	}
	if(this.l) {
		this.position[0] += 0.5;
	}


	mat4.identity(result);
	mat4.translate(result, this.position);
	mat4.rotate(result, this.arcY * Math.PI / 180.0, [0,1,0]);
	mat4.rotate(result, this.arcX * Math.PI / 180.0, [1,0,0]);

	result = mat4.inverse(result);

	return result;
}