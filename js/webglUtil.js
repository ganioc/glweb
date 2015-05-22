/**
 * @fileOverview
 * @name webglUtil.js
 * @author  spike yang
 * @license 
 */

(function(){
    var gl  = null,
        canvasGL;
    var imgList = [], numImageLoaded = 0;

    
    function init_gl(){
        canvasGL = document.createElement( 'canvas');
        canvasGL.setAttribute('screencanvas', '1');
        canvasGL.width = window.innerWidth ;
        canvasGL.height = window.innerHeight;
        canvasGL.id = 'canvas_3d';

        document.body.appendChild(canvasGL);

        try{
            gl = canvasGL.getContext("experimental-webgl");
            gl.viewportWidth = canvasGL.width;
            gl.viewportHeight = canvasGL.height;
        }
        catch(e){
            console.log("webgl init fail.");
        }
        
        if(!gl){
            console.log('no gl.');
        }
        else{
            console.log('exist gl');
            gl.clearColor(0, 0.9, 0.0, 1);
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.enable( gl.DEPTH_TEST);
        }
        
        
    }

    //init_gl();
    function degToRad(degrees){
        return degrees * Math.PI / 180;
    }
    

    function get_image(name){
        var result = _.find(imgList, function(c){
            return c.name === name;
        });
        if(!result) { throw 'image:' + name + ' not found.'; }
        return result;
    }

    function start(imgPath, callback){
        for(var i=0;i < imgPath.length; i++){
            imgList[i] = new Image();
            imgList[i].src = imgPath[i].path;
            imgList[i].name = imgPath[i].name;
            imgList[i].onload = function(){
                numImageLoaded += 1;
                if(numImageLoaded === imgPath.length){
                    console.log('img loaded.');
                    callback();
                }
            };
        }
    }


    // to generate a game loop
    var bGameRunning = false;
    var currentGameLoop = null;

    function start_loop(){
        bGameRunning = true;
        window.requestAnimationFrame(currentGameLoop);
    }
    
    function end_loop(){
        bGameRunning = false;
    }
    
    function createGameLoop(handler, callback){
        var start;

        return function(timestamp){
            if(!start){
                start = timestamp;
            }
            
            var td = (timestamp - start)/1000; // in micro second
            start = timestamp;

            if(!bGameRunning){
                console.log('out of game loop');
                callback();
            }
            else{
                handler(td);
                window.requestAnimationFrame(currentGameLoop);
            }
        };
    }

    // to show the splash screen
    function splashLoop(td){


    }

    function mainLoop(td){

                var shaderProgram = null,
            fragmentShader = null,
            vertexShader = null,
            vertexPositionAttribute = null,
            vertexColorAttribute = null,
            octahedronVertexPositionBuffer,
            octahedronVertexColorBuffer,
            octahedronVertexIndexBuffer,
            mvMatrix = mat4.create(),
            pMatrix = mat4.create(),
            canvas = null,
            paused = false,
            height = 1.41,
            rotationRadians = 0.0,
            rotationVector = [1.0, 1.0, 1.0], 
            rotationIncrement = 0,
            translationAngle = 0,
            x = 0,
            y = 0,
            z = 0;

        // init shaders
        function makeShader(src, type){
            var shader = gl.createShader(type);
            gl.shaderSource(shader, src);            
            gl.compileShader(shader);  

            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {  
                alert("Error compiling shader: " + gl.getShaderInfoLog(shader));  
            }  
            return shader;
        }
	
        function attachShaders(){
            gl.attachShader(shaderProgram, vertexShader);  
            gl.attachShader(shaderProgram, fragmentShader);  
            gl.linkProgram(shaderProgram);  
            
            if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {  
                alert("Unable to initialize the shader program.");  
            }  
        }	

        function createShaderProgram(){        
            shaderProgram = gl.createProgram();  
            attachShaders();
            
            gl.useProgram(shaderProgram);  
        }

        function setupShaders(fragmentShaderSRC, vertexShaderSRC){                     
            fragmentShader = makeShader(fragmentShaderSRC, gl.FRAGMENT_SHADER);
            vertexShader = makeShader(vertexShaderSRC, gl.VERTEX_SHADER);
            
            createShaderProgram();
        }			
	
        function initShaders() {
            //var fragmentShaderSRC = theData.get_shader('fs');
            // var fragmentShaderSRC = $('#' + 'shader-fs').html();
            // var vertexShaderSRC =  $('#' + 'shader-vs').html();
            var fragmentShaderSRC = theData.get_shader('fs');
            var vertexShaderSRC =   theData.get_shader('vs');
            
            console.log(fragmentShaderSRC);
            console.log(typeof fragmentShaderSRC);
            console.log(vertexShaderSRC);
            
            setupShaders(fragmentShaderSRC, vertexShaderSRC);
        }

        initShaders();
        

        // executeProgram
        function getMatrixUniforms(){
            shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
            shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");          
        }
        
        function setMatrixUniforms() {
            gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
            gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
        }

        function getVertexAttributes(){
            vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");                          
            gl.enableVertexAttribArray(vertexPositionAttribute);  
            
            vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
            gl.enableVertexAttribArray(vertexColorAttribute);
        }
        function initBuffers() {  
            octahedronVertexPositionBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, octahedronVertexPositionBuffer);
            var vertices = [
                // top faces
                0.0, height, 0.0,
                    -1.0, 0.0, -1.0,
                    -1.0, 0.0, 1.0,
                1.0, 0.0, 1.0,
                1.0, 0.0, -1.0,
                0.0, -height, 0.0,
            ];
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
            octahedronVertexPositionBuffer.itemSize = 3;
            octahedronVertexPositionBuffer.numItems = 6;

            var colors = [
                [1.0, 0.0, 0.0, 1.0], // red
                [0.0, 1.0, 0.0, 1.0], // green
                [0.0, 0.0, 1.0, 1.0], // blue
                [1.0, 1.0, 0.0, 1.0], // yellow
                
                [1.0, 1.0, 1.0, 1.0], // white
                [0.0, 0.0, 0.0, 1.0],  // black
                [1.0, 0.0, 1.0, 1.0], // magenta
                [0.0, 1.0, 1.0, 1.0]  // cyan
            ];
            var unpackedColors = [];
            for(var i=0; i < 8; ++i){
                var color = colors[i];
                unpackedColors = unpackedColors.concat(color);
            }

            octahedronVertexColorBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, octahedronVertexColorBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(unpackedColors), gl.STATIC_DRAW);
            
            octahedronVertexColorBuffer.itemSize = 4;
            octahedronVertexColorBuffer.numItems = 6;

            //A,B,C,D = 1,2,3,4  E = 0, F = 5
            var octahedronVertexIndices = [
                //top
                0, 1, 2,      0, 1, 4,    
                0, 2, 3,      0, 3, 4,    
                //bottom
                5, 1, 2,      5, 1, 4,    
                5, 2, 3,      5, 3, 4,    
            ];
            
            octahedronVertexIndexBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, octahedronVertexIndexBuffer);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(octahedronVertexIndices), gl.STATIC_DRAW);
            octahedronVertexIndexBuffer.itemSize = 1;
            octahedronVertexIndexBuffer.numItems = 24;
        }  

        function executeProgram(){
            getMatrixUniforms();
            getVertexAttributes();

            initBuffers();            

        }
        executeProgram();

        function drawScene() {  
            gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);  
            
            mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);
            mat4.identity(mvMatrix);
            
            mat4.translate(mvMatrix, [3*x, y, -12.0 + 5*z]);
            if(!paused){    
                x = Math.cos(translationAngle);
                y = x;
                z = Math.sin(translationAngle);
                rotationRadians = rotationIncrement/(180/Math.PI);
                
                rotationIncrement++; 
                translationAngle += .01;
            }
            mat4.rotate(mvMatrix, rotationRadians, rotationVector);
            
            setMatrixUniforms();  

            gl.bindBuffer(gl.ARRAY_BUFFER, octahedronVertexPositionBuffer);  
            gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);  
            
            gl.bindBuffer(gl.ARRAY_BUFFER, octahedronVertexColorBuffer);
            gl.vertexAttribPointer(vertexColorAttribute, 4, gl.FLOAT, false, 0, 0);
            
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, octahedronVertexIndexBuffer);
            gl.drawElements(gl.TRIANGLES, octahedronVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
        }  


        return{
            loop:function(td){
                drawScene();
            },
            housekeeping:function(){

            }
        };
    }

    /// webgl
    function webglCubeDemo2(){
        var _shaderProgram;
        var _cubeVertexPositionBuffer;
        var _cubeVertexTextureCoordBuffer;
        var _cubeVertexIndexBuffer;
        var _vertices, _textureCoords, _cubeVertexIndices ;
        var _neheTexture, _xRot = 0, _yRot = 0, _zRot = 0;
        var _mvMatrix = mat4.create();
        var _mvMatrixStack = [];
        var _pMatrix = mat4.create();

        
        // init shaders
        function makeShader(src,type){
            var shader = gl.createShader(type);
            gl.shaderSource(shader,src);
            gl.compileShader(shader);

            if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){
                console.log('error compiling shader:' + gl.getShaderInfoLog(shader));
            }
            return shader;
        }
        
        function initShaders(){
            var _fragmentShaderSRC = theData.get_shader('fs_cube');
            var _vertexShaderSRC = theData.get_shader('vs_cube');

            var _fragmentShader = makeShader(_fragmentShaderSRC, gl.FRAGMENT_SHADER);
            var _vertexShader = makeShader(_vertexShaderSRC, gl.VERTEX_SHADER);
            
            _shaderProgram = gl.createProgram();
            gl.attachShader(_shaderProgram, _vertexShader);
            gl.attachShader(_shaderProgram, _fragmentShader);
            gl.linkProgram(_shaderProgram);

            if( !gl.getProgramParameter(_shaderProgram, gl.LINK_STATUS)){
                console.log('Unable to initialize the shader program.');
            }
            gl.useProgram(_shaderProgram);
            
            _shaderProgram.vertexPositionAttribute = gl.getAttribLocation(_shaderProgram, 'aVertexPosition');
            gl.enableVertexAttribArray(_shaderProgram.vertexPositionAttribute);
            _shaderProgram.textureCoordAttribute = gl.getAttribLocation(_shaderProgram, 'aTextureCoord');
            gl.enableVertexAttribArray(_shaderProgram.textureCoordAttribute);

            _shaderProgram.pMatrixUniform = gl.getUniformLocation( _shaderProgram, 'uPMatrix');
            _shaderProgram.mvMatrixUniform = gl.getUniformLocation( _shaderProgram, 'uMVMatrix');
            _shaderProgram.sampleUniform = gl.getUniformLocation( _shaderProgram, 'uSampler');
        }

        function initBuffers(){
            _cubeVertexPositionBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, _cubeVertexPositionBuffer);
            
            _vertices = [
                // Front face
            -1.0, -1.0,  1.0,
             1.0, -1.0,  1.0,
             1.0,  1.0,  1.0,
            -1.0,  1.0,  1.0,

            // Back face
            -1.0, -1.0, -1.0,
            -1.0,  1.0, -1.0,
             1.0,  1.0, -1.0,
             1.0, -1.0, -1.0,

            // Top face
            -1.0,  1.0, -1.0,
            -1.0,  1.0,  1.0,
             1.0,  1.0,  1.0,
             1.0,  1.0, -1.0,

            // Bottom face
            -1.0, -1.0, -1.0,
             1.0, -1.0, -1.0,
             1.0, -1.0,  1.0,
            -1.0, -1.0,  1.0,

            // Right face
             1.0, -1.0, -1.0,
             1.0,  1.0, -1.0,
             1.0,  1.0,  1.0,
             1.0, -1.0,  1.0,

            // Left face
            -1.0, -1.0, -1.0,
            -1.0, -1.0,  1.0,
            -1.0,  1.0,  1.0,
            -1.0,  1.0, -1.0,

            ];
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(_vertices), gl.STATIC_DRAW);
            _cubeVertexPositionBuffer.itemSize = 3;
            _cubeVertexPositionBuffer.numItems  = 24;

            _cubeVertexTextureCoordBuffer = gl.createBuffer();
            gl.bindBuffer( gl.ARRAY_BUFFER, _cubeVertexTextureCoordBuffer );
            _textureCoords = [
                // Front face
                0.0, 0.0,
                1.0, 0.0,
                1.0, 1.0,
                0.0, 1.0,

                // Back face
                1.0, 0.0,
                1.0, 1.0,
                0.0, 1.0,
                0.0, 0.0,

                // Top face
                0.0, 1.0,
                0.0, 0.0,
                1.0, 0.0,
                1.0, 1.0,

                // Bottom face
                1.0, 1.0,
                0.0, 1.0,
                0.0, 0.0,
                1.0, 0.0,

                // Right face
                1.0, 0.0,
                1.0, 1.0,
                0.0, 1.0,
                0.0, 0.0,

                // Left face
                0.0, 0.0,
                1.0, 0.0,
                1.0, 1.0,
                0.0, 1.0,
            ];
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(_textureCoords), gl.STATIC_DRAW);
            _cubeVertexTextureCoordBuffer.itemSize = 2;
            _cubeVertexTextureCoordBuffer.numItems = 24;

            _cubeVertexIndexBuffer = gl.createBuffer();
            gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, _cubeVertexIndexBuffer);

            _cubeVertexIndices = [
                0, 1, 2,      0, 2, 3,    // Front face
                4, 5, 6,      4, 6, 7,    // Back face
                8, 9, 10,     8, 10, 11,  // Top face
                12, 13, 14,   12, 14, 15, // Bottom face
                16, 17, 18,   16, 18, 19, // Right face
                20, 21, 22,   20, 22, 23  // Left face
            ];
            gl.bufferData( gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(_cubeVertexIndices), gl.STATIC_DRAW);
            _cubeVertexIndexBuffer.itemSize = 1;
            _cubeVertexIndexBuffer.numItems = 36;
            
        }


        /// init textures
        function initTexture(){
            _neheTexture = gl.createTexture();
            //console.log(imgList);
            _neheTexture.image = get_image('waterripple');

            gl.bindTexture(gl.TEXTURE_2D, _neheTexture);
            gl.pixelStorei( gl.UNPACK_FLIP_Y_WEBGL, true);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, _neheTexture.image);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.bindTexture(gl.TEXTURE_2D, null);

        }
        
        // drawScene
        function drawScene(){
            gl.viewport( 0,0, gl.viewportWidth, gl.viewportHeight);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            mat4.perspective(45, gl.viewportWidth/ gl.viewportHeight, 0.1, 100, _pMatrix);
            mat4.identity(_mvMatrix);
            mat4.translate( _mvMatrix, [0,0,-5.0]);
            mat4.rotate(_mvMatrix, degToRad(_xRot), [1,0,0]);
            mat4.rotate(_mvMatrix, degToRad(_yRot), [0,1,0]);
            mat4.rotate(_mvMatrix, degToRad(_zRot), [0,0,1]);

            gl.bindBuffer(gl.ARRAY_BUFFER, _cubeVertexPositionBuffer);
            gl.vertexAttribPointer(_shaderProgram.vertexPositionAttribute, _cubeVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ARRAY_BUFFER, _cubeVertexTextureCoordBuffer);
            gl.vertexAttribPointer( _shaderProgram.textureCoordAttribute, _cubeVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, _neheTexture);
            gl.uniform1i(_shaderProgram.sampleUniform, 0);

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, _cubeVertexIndexBuffer);

            //  setMatrixUniforms();
            gl.uniformMatrix4fv(_shaderProgram.pMatrixUniform, false, _pMatrix);
            gl.uniformMatrix4fv(_shaderProgram.mvMatrixUniform, false, _mvMatrix);
            
            gl.drawElements(gl.TRIANGLES, _cubeVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
            
        }

        //animate
        function animate(td){
            _xRot += 90 * td;
            _yRot += 90 * td;
            _zRot += 90 * td;
        }
        
        initShaders();
        initBuffers();
        initTexture();

        gl.enable(gl.CULL_FACE);
        
        return {
            loop:function(td){
                // draw scene
                drawScene();
                animate(td);
            },
            housekeeping: function(){
                gl.disable(gl.CULL_FACE);
                delete gl;
            }
        };
    }
    function funcWrapperLoop(func){
        return function(){
            var obj = func();
            currentGameLoop = createGameLoop(obj.loop,
                                             obj.housekeeping );
            start_loop();
        };
    }

    
    function init(){
        init_gl();
        
        funcWrapperLoop(webglCubeDemo2)();
    }

    
    var w = {
        gl:gl,
        canvas:canvasGL,
        initgl: init_gl,
        start:start,
        init:init
    };

    window.w = w;

})();
