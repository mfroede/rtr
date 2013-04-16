
var Sphere = function (gl, depth) {
    this.gl = gl;
    this.depth = depth;

    this.vertices = [];
    this.colors = [];

    this.vertexPositionBuffer;
    this.colorvertexColorBuffer;
} 

Sphere.prototype.normalisedMiddle = function(a, b) {
    var c = vec3.create([0,0,0]);
    vec3.add(a, b, c);
    vec3.normalize(c);
    return c;
};

Sphere.prototype.configVertices = function(depth, a, b, c) {
    var ab = this.normalisedMiddle(a, b);
    var bc = this.normalisedMiddle(b, c);
    var ca = this.normalisedMiddle(c, a);

    if(depth == 0){
        this.vertices.push(
              a[0], a[1], a[2],
             ab[0],ab[1],ab[2],
             ca[0],ca[1],ca[2],

             ab[0],ab[1],ab[2],
              b[0], b[1], b[2],
             bc[0],bc[1],bc[2],

             bc[0],bc[1],bc[2],
              c[0], c[1], c[2],
             ca[0],ca[1],ca[2],

             ab[0],ab[1],ab[2],
             bc[0],bc[1],bc[2],
             ca[0],ca[1],ca[2]
            );
        this.colors.push(
                1.0, 0.0, 0.0, 1.0,
                1.0, 0.0, 0.0, 1.0,
                1.0, 0.0, 0.0, 1.0,

                // Right face
                1.0, 0.0, 0.0, 1.0,
                1.0, 0.0, 0.0, 1.0,
                1.0, 0.0, 0.0, 1.0,

                // Back face
                1.0, 0.0, 0.0, 1.0,
                1.0, 0.0, 0.0, 1.0,
                1.0, 0.0, 0.0, 1.0,

                // Left face
                1.0, 0.0, 0.0, 1.0,
                1.0, 0.0, 0.0, 1.0,
                1.0, 0.0, 0.0, 1.0
            )
        return;
    }

    this.configVertices(depth -1, a, ab, ca);
    this.configVertices(depth -1, ab, b, bc);
    this.configVertices(depth -1, bc, c, ca);
    this.configVertices(depth -1, ab, bc, ca);
}

Sphere.prototype.initBuffers = function() {
    this.vertexPositionBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexPositionBuffer);

    var positonA = [-1.0,-1.0, 1.0];
    var positonB = [ 1.0,-1.0,-1.0];
    var positonC = [-1.0, 1.0,-1.0];
    var positonD = [ 1.0, 1.0, 1.0];

    vec3.normalize(positonA); 
    vec3.normalize(positonB); 
    vec3.normalize(positonC);
    vec3.normalize(positonD); 

    // this.vertices.push(
    //      positonA[0],positonA[1],positonA[2],
    //      positonB[0],positonB[1],positonB[2],
    //      positonC[0],positonC[1],positonC[2],

    //      positonA[0],positonA[1],positonA[2],
    //      positonB[0],positonB[1],positonB[2],
    //      positonD[0],positonD[1],positonD[2],

    //      positonC[0],positonC[1],positonC[2],
    //      positonB[0],positonB[1],positonB[2],
    //      positonD[0],positonD[1],positonD[2],

    //      positonC[0],positonC[1],positonC[2],
    //      positonA[0],positonA[1],positonA[2],
    //      positonD[0],positonD[1],positonD[2]
    // );
    // this.colors.push(
    //             1.0, 0.0, 0.0, 1.0,
    //             1.0, 0.0, 0.0, 1.0,
    //             1.0, 0.0, 0.0, 1.0,

    //             // Right face
    //             1.0, 0.0, 0.0, 1.0,
    //             1.0, 0.0, 0.0, 1.0,
    //             1.0, 0.0, 0.0, 1.0,

    //             // Back face
    //             1.0, 0.0, 0.0, 1.0,
    //             1.0, 0.0, 0.0, 1.0,
    //             1.0, 0.0, 0.0, 1.0,

    //             // Left face
    //             1.0, 0.0, 0.0, 1.0,
    //             1.0, 0.0, 0.0, 1.0,
    //             1.0, 0.0, 0.0, 1.0
    //         );
    this.configVertices(this.depth, positonA, positonB, positonC);
    this.configVertices(this.depth, positonA, positonB, positonD);
    this.configVertices(this.depth, positonA, positonC, positonD);
    this.configVertices(this.depth, positonB, positonC, positonD);
    
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.vertices), this.gl.STATIC_DRAW);
    this.vertexPositionBuffer.itemSize = 3;
    this.vertexPositionBuffer.numItems = this.vertices.length / this.vertexPositionBuffer.itemSize;

    this.colorvertexColorBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.colorvertexColorBuffer);
    
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.colors), this.gl.STATIC_DRAW);
    this.colorvertexColorBuffer.itemSize = 4;
    this.colorvertexColorBuffer.numItems = this.colors.length / this.colorvertexColorBuffer.itemSize;
}

Sphere.prototype.draw = function(){
    this.gl.viewport(0, 0, this.gl.viewportWidth, this.gl.viewportHeight);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

    mvPushMatrix();

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexPositionBuffer);
    this.gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, this.vertexPositionBuffer.itemSize, this.gl.FLOAT, false, 0, 0);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.colorvertexColorBuffer);
    this.gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, this.colorvertexColorBuffer.itemSize, this.gl.FLOAT, false, 0, 0);

    setMatrixUniforms();
    this.gl.drawArrays(this.gl.TRIANGLES, 0, this.vertexPositionBuffer.numItems);

}