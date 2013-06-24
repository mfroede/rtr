var Camera = function(position, arcX, arcY) {
	this.position = position;
	this.arcX = arcX;
	this.arcY = arcY;
	this.fw = false;
	this.bw = false;
	this.l = false;
	this.r = false;

        	this.lookLeft = false;
        	this.lookRight = false;
        	this.lookDown = false;
        	this.lookUp = false;
}

Camera.prototype.getTransformationMatrix = function(view) {
	var result = mat4.create();
	mat4.identity(result);
	
	mat4.translate(result, this.position);

	mat4.rotate(result, this.arcY * Math.PI / 180.0, [0,1,0]);
	mat4.rotate(result, this.arcX * Math.PI / 180.0, [1,0,0]);

	result = mat4.inverse(result);

	return result;
}